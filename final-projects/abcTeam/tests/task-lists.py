"""Shared list authorization and collaboration tests against a local Worker."""
import urllib.request as u,urllib.error as e,http.cookiejar,json,secrets,uuid
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
s=secrets.token_hex(4);a,b,c,guest=[Browser() for _ in range(4)]
for browser,prefix in [(a,'owner'),(b,'member'),(c,'other')]:
 code,data=browser.request('/api/auth/signup',{'username':prefix+s,'name':prefix,'grade':'8','password':'Study123!'});assert code==201,(code,data)
pa=a.request('/api/profile')[1];pb=b.request('/api/profile')[1]
assert guest.request('/api/task-lists')[0]==401
assert a.request('/api/friends',{'action':'request','username':pb['username']})[0]==200
assert b.request('/api/friends',{'action':'accept','peer':pa['id']})[0]==200
id=str(uuid.uuid4());task={'id':'first','title':'Biology project','subject':'Biology','description':'Describe cell structures','due':'2026-12-20','dueTime':'16:30','dueZone':'America/Los_Angeles','assignee':pa['id'],'done':False}
code,data=a.request('/api/task-lists',{'action':'create','id':id,'name':'Science team','username':pb['username'],'tasks':[task]});assert code==201,(code,data)
assert a.request('/api/task-lists',{'action':'create','id':id,'name':'Retry','username':pb['username'],'tasks':[]})[0]==409
assert c.request('/api/task-lists?id='+id)[0]==403
assert b.request('/api/task-lists?id='+id)[0]==403
assert b.request('/api/task-lists',{'action':'editTask','list':id,'revision':1,'task':task})[0]==403
assert b.request('/api/task-lists')[1]['lists'][0]['status']=='invited'
assert b.request('/api/task-lists',{'action':'accept','list':id})[0]==200
assert b.request('/api/task-lists?id='+id)[1]['list']['tasks'][0]['dueTime']=='16:30'
edit={**task,'description':'Add a labeled diagram','assignee':pb['id'],'dueTime':'17:00'}
code,data=b.request('/api/task-lists',{'action':'editTask','list':id,'revision':1,'task':edit});assert code==200,(code,data)
assert data['list']['revision']==2
assert a.request('/api/task-lists?id='+id)[1]['list']['tasks'][0]['description']=='Add a labeled diagram'
assert a.request('/api/task-lists',{'action':'toggleTask','list':id,'revision':1,'task':'first','done':True})[0]==409
assert b.request('/api/task-lists',{'action':'rename','list':id,'revision':2,'name':'Changed'})[0]==403
assert b.request('/api/task-lists',{'action':'remove','list':id,'peer':pa['id']})[0]==403
for bad in [{**edit,'dueTime':'25:01'},{**edit,'assignee':'other'+s},{**edit,'due':'9999-99-99'},{**edit,'description':'x'*4001}]:
 code,data=a.request('/api/task-lists',{'action':'editTask','list':id,'revision':2,'task':bad});assert code==400,(code,data)
assert a.request('/api/task-lists',{'action':'rename','list':id,'revision':2,'name':'Science project'},origin='https://elsewhere.test')[0]==403
code,data=a.request('/api/task-lists',{'action':'toggleTask','list':id,'revision':2,'task':'first','done':True});assert code==200,(code,data)
assert data['list']['tasks'][0]['done'] is True
assert a.request('/api/task-lists',{'action':'remove','list':id,'peer':pb['id']})[0]==200
assert b.request('/api/task-lists?id='+id)[0]==403
assert b.request('/api/task-lists',{'action':'toggleTask','list':id,'revision':3,'task':'first','done':False})[0]==403
code,data=a.request('/api/task-lists',{'action':'addTask','list':id,'revision':3,'task':{**task,'id':'second','title':'New task','due':'','dueTime':'','assignee':''}});assert code==200,(code,data)
assert a.request('/api/task-lists',{'action':'invite','list':id,'username':pb['username']})[0]==200
assert b.request('/api/task-lists',{'action':'accept','list':id})[0]==200
assert a.request('/api/friends',{'action':'block','peer':pb['id']})[0]==200
assert b.request('/api/task-lists?id='+id)[0]==403
assert b.request('/api/task-lists')[1]['lists']==[]
print('PASS: shared list invitations, independent accounts, edits/assignees/deadlines, conflict checks, owner controls, revocation and blocking.')
