const fs=require('node:fs'),crypto=require('node:crypto');
const source=fs.readFileSync('app/workspace/html.ts','utf8');
const html=JSON.parse(source.slice('export const workspaceHtml='.length).trim().replace(/;$/,''));
fs.writeFileSync('public/offline.html',html.replace('<body>','<body><script>window.studyOfflinePage=true;</script>'));
const assets=['/offline',...fs.readdirSync('public/study-assets').filter(name=>/\.(js|css)$/.test(name)).map(name=>'/study-assets/'+name)].sort();
const hash=crypto.createHash('sha256');for(const path of assets)hash.update(fs.readFileSync(path==='/offline'?'public/offline.html':'public'+path));const version='grove-offline-'+hash.digest('hex').slice(0,16);
fs.writeFileSync('public/study-sw.js',`const VERSION=${JSON.stringify(version)},ASSETS=${JSON.stringify(assets)},FONTS='grove-fonts-v1';
self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('grove-offline-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url);if(request.method!=='GET')return;
if(url.origin===self.location.origin&&ASSETS.includes(url.pathname)){event.respondWith(caches.open(VERSION).then(async cache=>(await cache.match(url.pathname))||fetch(request)));return}
if(url.origin===self.location.origin&&request.mode==='navigate'&&['/','/workspace'].includes(url.pathname)){event.respondWith(fetch(request).catch(()=>caches.match('/offline')));return}
if(['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname)){event.respondWith(caches.open(FONTS).then(async cache=>{try{const response=await fetch(request);if(response.ok)await cache.put(request,response.clone());return response}catch{return(await cache.match(request))||Response.error()}}))}
});\n`);
console.log('Prepared offline study shell and '+assets.length+' public assets.');
