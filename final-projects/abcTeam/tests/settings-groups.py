"""Live local Worker tests; uses only synthetic accounts and never sends phone texts."""
import urllib.request as u,urllib.error as e,http.cookiejar,json,secrets
BASE='http://127.0.0.1:8787'
class Browser:
 def __init__(self):self.client=u.build_opener(u.HTTPCookieProcessor(http.cookiejar.CookieJar()))
 def request(self,path,body=None,method=None,origin=BASE):
  headers={'Origin':origin}
  if body is not None:headers['Content-Type']='application/json'
  req=u.Request(BASE+path,data=json.dumps(body).encode() if body is not None else None,headers=headers,method=method or ('POST' if body is not None else 'GET'))
  try:r=self.client.open(req,timeout=20)
  except e.HTTPError as error:r=error
  raw=r.read().decode();return r.code,json.loads(raw) if r.headers.get('Content-Type','').startswith('application/json') else raw
suffix=secrets.token_hex(4);a,b,c,d,guest,otherDevice=[Browser() for _ in range(6)];password='Study123';ids={}
for browser,name in [(a,'alpha'),(b,'beta'),(c,'gamma'),(d,'delta')]:
 code,result=browser.request('/api/auth/signup',{'username':name+suffix,'name':name,'grade':'8','password':password});assert code==201,(code,result)
 ids[name]=browser.request('/api/friends')[1]['me']['id']
for peer,browser in [('beta',b),('gamma',c)]:
 assert a.request('/api/friends',{'action':'request','username':peer+suffix})[0]==200
 assert browser.request('/api/friends',{'action':'accept','peer':ids['alpha']})[0]==200
assert guest.request('/api/settings')[0]==401
assert guest.request('/api/groups')[0]==401
assert a.request('/api/settings',{'action':'phone','phone':'bad','sharePhone':True,'currentPassword':password},'PUT')[0]==400
phone={'action':'phone','phone':'+1 (555) 555-0123','sharePhone':False,'currentPassword':password}
assert a.request('/api/settings',phone,'PUT')[0]==200
assert a.request('/api/settings')[1]['phone']=='+15555550123'
assert b.request('/api/friends')[1]['connections'][0]['phone'] is None
assert a.request('/api/settings',{**phone,'sharePhone':True},'PUT')[0]==200
assert b.request('/api/friends')[1]['connections'][0]['phone']=='+15555550123'
assert d.request('/api/friends',{'action':'request','username':'alpha'+suffix})[0]==200
assert d.request('/api/friends')[1]['connections'][0]['phone'] is None
assert a.request('/api/settings',{**phone,'currentPassword':'wrongpass'},'PUT')[0]==401
assert a.request('/api/settings',{'action':'username','username':'beta'+suffix,'currentPassword':password},'PUT')[0]==409
newUsername='renamed'+suffix
assert a.request('/api/settings',{'action':'username','username':newUsername,'currentPassword':password},'PUT')[0]==200
assert a.request('/api/friends')[1]['me']['id']==ids['alpha']
assert b.request('/api/friends')[1]['connections'][0]['username']==newUsername
assert guest.request('/api/auth/login',{'username':'alpha'+suffix,'password':password})[0]==401
assert otherDevice.request('/api/auth/login',{'username':newUsername,'password':password})[0]==200
assert a.request('/api/settings',{'action':'password','password':'newpass8','currentPassword':'wrongpass'},'PUT')[0]==401
assert a.request('/api/settings',{'action':'password','password':'1234567','currentPassword':password},'PUT')[0]==400
assert a.request('/api/settings',{'action':'password','password':'newpass8','currentPassword':password},'PUT')[0]==200
assert a.request('/api/settings')[0]==200
assert otherDevice.request('/api/settings')[0]==401
assert guest.request('/api/auth/login',{'username':newUsername,'password':password})[0]==401
assert guest.request('/api/auth/login',{'username':newUsername,'password':'newpass8'})[0]==200
assert a.request('/api/groups',{'action':'create','name':'Nope','friends':[ids['delta']]})[0]==403
code,result=a.request('/api/groups',{'action':'create','name':'Study crew','friends':[ids['beta'],ids['gamma']]});assert code==200,(code,result);group=result['id']
assert b.request('/api/groups')[1]['groups'][0]['status']=='invited'
assert b.request('/api/group-messages?group='+group)[0]==403
assert d.request('/api/groups?id='+group)[0]==403
assert d.request('/api/groups',{'action':'accept','group':group})[0]==403
assert b.request('/api/groups',{'action':'accept','group':group})[0]==200
assert c.request('/api/groups',{'action':'leave','group':group})[0]==200
assert a.request('/api/groups',{'action':'invite','group':group,'peer':ids['gamma']})[0]==200
assert c.request('/api/groups',{'action':'accept','group':group})[0]==200
members=a.request('/api/groups?id='+group)[1]['members'];assert len(members)==3 and all('phone' not in m for m in members)
message={'group':group,'message':'Ready to study?','nonce':secrets.token_hex(16)}
assert a.request('/api/group-messages',message)[0]==200
assert a.request('/api/group-messages',message)[0]==200
assert len(b.request('/api/group-messages?group='+group)[1]['messages'])==1
assert b.request('/api/group-messages',{'group':group,'message':'Yes!','nonce':secrets.token_hex(16)})[0]==200
assert len(c.request('/api/group-messages?group='+group)[1]['messages'])==2
assert d.request('/api/group-messages?group='+group)[0]==403
assert d.request('/api/group-messages',{**message,'nonce':secrets.token_hex(16)})[0]==403
assert b.request('/api/friends',{'action':'block','peer':ids['alpha']})[0]==200
assert a.request('/api/group-messages',{'group':group,'message':'New group message','nonce':secrets.token_hex(16)})[0]==200
assert all(m['senderId']!=ids['alpha'] for m in b.request('/api/group-messages?group='+group)[1]['messages'])
assert len(c.request('/api/group-messages?group='+group)[1]['messages'])==3
assert b.request('/api/groups',{'action':'leave','group':group})[0]==200
assert b.request('/api/group-messages?group='+group)[0]==403
assert a.request('/api/settings',phone,'PUT',origin='https://other.test')[0]==403
print('Passed: protected username/password updates, session revocation, private phone sharing, stable friendships, group invites, acceptance, group isolation, duplicate sends, blocking, and leaving groups.')
