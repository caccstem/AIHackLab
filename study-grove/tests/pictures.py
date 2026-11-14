"""Local image upload/access checks; no external photos or phone messages are used."""
import urllib.request as u,urllib.error as e,http.cookiejar,json,secrets,base64
BASE='http://127.0.0.1:8787'
PNG=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5x8AAAAASUVORK5CYII=')
class Browser:
 def __init__(self):self.client=u.build_opener(u.HTTPCookieProcessor(http.cookiejar.CookieJar()))
 def call(self,path,body=None,method=None,headers=None):
  headers={'Origin':BASE,**(headers or {})}
  if isinstance(body,dict):body=json.dumps(body).encode();headers['Content-Type']='application/json'
  req=u.Request(BASE+path,data=body,headers=headers,method=method or ('POST' if body is not None else 'GET'))
  try:r=self.client.open(req,timeout=20)
  except e.HTTPError as error:r=error
  raw=r.read();return r.code,json.loads(raw) if r.headers.get('Content-Type','').startswith('application/json') else raw,r.headers
 def upload(self,kind,data=PNG):
  boundary='grove'+secrets.token_hex(6);body=('--'+boundary+'\r\nContent-Disposition: form-data; name="kind"\r\n\r\n'+kind+'\r\n--'+boundary+'\r\nContent-Disposition: form-data; name="file"; filename="picture.png"\r\nContent-Type: image/png\r\n\r\n').encode()+data+('\r\n--'+boundary+'--\r\n').encode();return self.call('/api/images',body,headers={'Content-Type':'multipart/form-data; boundary='+boundary})
a,b,c,guest=[Browser() for _ in range(4)];suffix=secrets.token_hex(4);ids={}
for browser,name in [(a,'photoa'),(b,'photob'),(c,'photoc')]:
 assert browser.call('/api/auth/signup',{'username':name+suffix,'name':name,'grade':'college','password':'Study123'})[0]==201
 ids[name]=browser.call('/api/friends')[1]['me']['id']
assert guest.call('/api/images?kind=avatar')[0]==401
code,data,_=a.upload('avatar');assert code==200,(code,data)
assert a.call('/api/settings')[1]['hasAvatar']==1
code,data,headers=a.call('/api/images?kind=avatar');assert code==200 and data==PNG and headers['Content-Type']=='image/png'
assert b.call('/api/images?kind=avatar&user='+ids['photoa'])[0]==404
assert a.call('/api/friends',{'action':'request','username':'photob'+suffix})[0]==200
assert b.call('/api/friends',{'action':'accept','peer':ids['photoa']})[0]==200
assert b.call('/api/images?kind=avatar&user='+ids['photoa'])[0]==200
assert a.upload('background')[0]==200
assert a.call('/api/images?kind=background')[0]==200
assert b.call('/api/images?kind=background&user='+ids['photoa'])[0]==404
assert a.upload('avatar',b'<svg><script>alert(1)</script></svg>')[0]==400
assert a.upload('avatar',b'x'*2097153)[0] in [400,413]
assert b.call('/api/friends',{'action':'request','username':'photoc'+suffix})[0]==200
assert c.call('/api/friends',{'action':'accept','peer':ids['photob']})[0]==200
code,data,_=b.call('/api/groups',{'action':'create','name':'Photo study crew','friends':[ids['photoa'],ids['photoc']]});assert code==200;group=data['id']
assert c.call('/api/groups',{'action':'accept','group':group})[0]==200
assert c.call('/api/images?kind=avatar&user='+ids['photoa'])[0]==404
assert a.call('/api/groups',{'action':'accept','group':group})[0]==200
assert c.call('/api/images?kind=avatar&user='+ids['photoa'])[0]==200
assert c.call('/api/images?kind=background&user='+ids['photoa'])[0]==404
assert c.call('/api/friends',{'action':'block','peer':ids['photoa']})[0]==200
assert c.call('/api/images?kind=avatar&user='+ids['photoa'])[0]==404
assert a.call('/api/images?kind=avatar',method='DELETE')[0]==200
assert a.call('/api/images?kind=avatar')[0]==404
assert b.call('/api/images?kind=avatar&user='+ids['photoa'])[0]==404
assert a.call('/api/images?kind=background')[0]==200
print('Passed: avatar/background upload, actual R2 read/delete, friend/group avatar access, private backgrounds, blocked access, and file size/type validation.')
