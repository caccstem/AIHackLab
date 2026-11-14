"""Tests private messaging using three synthetic accounts on the local Worker."""
import urllib.request as u,urllib.error as e,http.cookiejar,json,secrets
BASE='http://127.0.0.1:8787'
class NoRedirect(u.HTTPRedirectHandler):
 def redirect_request(self,*args):return None
class Browser:
 def __init__(self):self.client=u.build_opener(u.HTTPCookieProcessor(http.cookiejar.CookieJar()),NoRedirect())
 def request(self,path,body=None,method=None,origin=BASE):
  headers={'Origin':origin}
  if body is not None:headers['Content-Type']='application/json'
  req=u.Request(BASE+path,data=json.dumps(body).encode() if body is not None else None,headers=headers,method=method or ('POST' if body is not None else 'GET'))
  try:r=self.client.open(req,timeout=20)
  except e.HTTPError as error:r=error
  raw=r.read().decode();data=json.loads(raw) if r.headers.get('Content-Type','').startswith('application/json') else raw
  return r.code,data,r.headers
suffix=secrets.token_hex(4);a,b,c,guest=[Browser() for _ in range(4)];password='Study123'
for browser,prefix,grade in [(a,'five','5'),(b,'college','college'),(c,'third','12')]:
 code,data,_=browser.request('/api/auth/signup',{'username':prefix+suffix,'name':prefix,'grade':grade,'password':password});assert code==201,(code,data)
 assert browser.request('/api/profile')[1]['grade']==grade
profile={'grade':'college','goals':['Stay focused'],'subjects':['Math'],'minutes':15,'theme':'red'}
assert a.request('/api/profile',profile,'PUT')[0]==200
assert a.request('/api/profile')[1]['grade']=='college'
assert 'friends-panel' in a.request('/workspace')[1]
assert guest.request('/api/friends')[0]==401
assert guest.request('/api/messages?friend=someone')[0]==401
assert a.request('/api/friends',{'action':'request','username':'five'+suffix})[0]==400
assert a.request('/api/friends',{'action':'request','username':('college'+suffix).upper()})[0]==200
ar=a.request('/api/friends')[1];br=b.request('/api/friends')[1];aid=ar['me']['id'];bid=br['me']['id']
assert len(ar['connections'])==len(br['connections'])==1
assert ar['connections'][0]['status']=='pending'
assert c.request('/api/friends')[1]['connections']==[]
assert 'grade' not in ar['connections'][0] and 'passwordHash' not in ar['connections'][0]
assert a.request('/api/friends',{'action':'accept','peer':bid})[0]==409
nonce=secrets.token_hex(16)
message={'friend':bid,'message':'Study session at 4? <script>not executable</script>','nonce':nonce}
assert a.request('/api/messages',message)[0]==403
assert a.request('/api/messages?friend='+bid)[0]==403
assert b.request('/api/friends',{'action':'accept','peer':aid})[0]==200
assert a.request('/api/messages',message)[0]==200
assert a.request('/api/messages',message)[0]==200
messages=b.request('/api/messages?friend='+aid)[1]['messages'];assert len(messages)==1 and messages[0]['body']==message['message'] and messages[0]['senderId']==aid
assert c.request('/api/messages?friend='+aid)[0]==403
assert c.request('/api/messages',{**message,'senderId':aid})[0]==403
assert a.request('/api/messages',message,origin='https://other.test')[0]==403
assert a.request('/api/messages',{**message,'message':'x'*1001})[0]==400
for i in range(52):assert a.request('/api/messages',{'friend':bid,'message':'Page test '+str(i),'nonce':secrets.token_hex(16)})[0]==200
latest=b.request('/api/messages?friend='+aid)[1];assert len(latest['messages'])==50 and latest['hasOlder']
older=b.request('/api/messages?friend='+aid+'&before='+str(latest['messages'][0]['id']))[1];assert len(older['messages'])==3 and not older['hasOlder']
assert b.request('/api/auth/logout',{})[0]==200
assert b.request('/api/auth/login',{'username':'college'+suffix,'password':password})[0]==200
assert len(b.request('/api/messages?friend='+aid)[1]['messages'])==50
assert b.request('/api/friends',{'action':'block','peer':aid})[0]==200
assert a.request('/api/messages?friend='+bid)[0]==403
assert a.request('/api/messages',{**message,'nonce':secrets.token_hex(16)})[0]==403
assert a.request('/api/friends',{'action':'request','username':'college'+suffix})[0]==403
assert b.request('/api/friends')[1]['blocked'][0]['id']==aid
assert b.request('/api/friends',{'action':'unblock','peer':aid})[0]==200
assert a.request('/api/messages?friend='+bid)[0]==403
assert a.request('/api/friends',{'action':'request','username':'college'+suffix})[0]==200
assert b.request('/api/friends',{'action':'accept','peer':aid})[0]==200
assert a.request('/api/friends',{'action':'remove','peer':bid})[0]==200
assert b.request('/api/messages?friend='+aid)[0]==403
print('Passed: grade 5 and college signup/editing, friend requests, acceptance, private messages, third-account isolation, idempotency, pagination, persistence, blocking, removal, and cross-origin checks.')
