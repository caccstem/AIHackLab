"""Live integration test against the local built Worker; creates only test accounts."""
import urllib.request as u, urllib.error as e, http.cookiejar, json, secrets
BASE='http://127.0.0.1:8787'
class NoRedirect(u.HTTPRedirectHandler):
 def redirect_request(self,*args):return None
class Browser:
 def __init__(self):self.jar=http.cookiejar.CookieJar();self.client=u.build_opener(u.HTTPCookieProcessor(self.jar),NoRedirect())
 def request(self,path,body=None,method=None,origin=BASE):
  headers={'Origin':origin}
  if body is not None:headers['Content-Type']='application/json'
  req=u.Request(BASE+path,data=json.dumps(body).encode() if body is not None else None,headers=headers,method=method or ('POST' if body is not None else 'GET'))
  try:r=self.client.open(req,timeout=60)
  except e.HTTPError as error:r=error
  raw=r.read().decode();data=json.loads(raw) if r.headers.get('Content-Type','').startswith('application/json') else raw
  return r.code,data,r.headers
suffix=secrets.token_hex(4);a,b,guest=Browser(),Browser(),Browser();password='A long test passphrase 2026!'
assert guest.request('/api/workspace')[0]==401
assert guest.request('/workspace')[2]['Location'].endswith('/account/login')
assert 'Create my Study Grove account' in guest.request('/')[1]
assert 'Your current grade' in guest.request('/account/signup')[1]
assert a.request('/api/auth/signup',{'username':'bad name','password':password})[0]==400
signup={'username':'test_'+suffix,'name':'Fern','grade':'9','password':password}
code,result,headers=a.request('/api/auth/signup',signup);assert code==201,(code,result)
recovery=result['recoveryCode'];assert len(recovery)==64 and 'HttpOnly' in headers['Set-Cookie']
assert a.request('/workspace')[2]['Location'].endswith('/personalize')
profile={'goals':['Stay focused','Understand tricky topics'],'subjects':['Precalculus','Biology'],'minutes':25,'theme':'lavender'}
assert a.request('/api/profile',profile,'PUT')[0]==200
assert a.request('/api/profile')[1]['profile']['subjects']==profile['subjects']
assert 'student-greeting' in a.request('/workspace')[1]
assert guest.request('/api/auth/signup',signup)[0]==409
state={'tasks':[],'cards':[],'notes':'Only account A should see this','sessions':0}
assert a.request('/api/workspace',{'state':state,'revision':0},'PUT')[0]==200
assert b.request('/api/auth/signup',{**signup,'username':'other_'+suffix,'name':'Moss'})[0]==201
assert b.request('/api/workspace')[1]['state'] is None
assert b.request('/api/profile')[1]['name']=='Moss'
assert a.request('/api/workspace')[1]['state']==state
assert guest.request('/api/auth/login',{'username':signup['username'],'password':'wrong password'})[0]==401
assert guest.request('/api/auth/login',{'username':signup['username'].upper(),'password':password})[0]==200
assert guest.request('/api/workspace')[1]['state']==state
assert a.request('/api/auth/logout',{})[0]==200
assert a.request('/api/workspace')[0]==401
assert a.request('/api/auth/recover',{'username':signup['username'],'recoveryCode':'0'*64,'password':password})[0]==401
newpass=password+'new'
code,result,_=a.request('/api/auth/recover',{'username':signup['username'],'recoveryCode':recovery,'password':newpass});assert code==200,(code,result)
assert result['recoveryCode']!=recovery
assert guest.request('/api/workspace')[0]==401
assert guest.request('/api/auth/login',{'username':signup['username'],'password':password})[0]==401
assert guest.request('/api/auth/login',{'username':signup['username'],'password':newpass})[0]==200
assert guest.request('/api/auth/logout',{},origin='https://other.test')[0]==403
assert guest.request('/api/workspace')[1]['state']==state
print('Passed live Worker checks: signup fields, username uniqueness, onboarding, profile save, separate accounts, persistent work, login, logout, recovery, session revocation, and cross-origin protection.')
