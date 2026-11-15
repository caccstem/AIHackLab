'use strict';
// Merged from caccstem/AIHackLab e85a450, keeping the current page editor intact.
(()=>{
const el=id=>document.getElementById(id),pages=el('note-pages'),pageShell=document.createElement('div'),pageViewport=document.createElement('div'),zoomTools=document.createElement('div');
pageShell.className='notebook-page-shell';pageViewport.className='notebook-page-viewport';zoomTools.className='notebook-zoom-tools';
zoomTools.setAttribute('role','toolbar');zoomTools.setAttribute('aria-label','Notebook page zoom');
zoomTools.innerHTML='<span class="notebook-view-label">View</span><button type="button" data-zoom="out" aria-label="Zoom out" title="Zoom out">−</button><input id="notebook-zoom" type="range" min="25" max="200" step="5" value="100" aria-label="Notebook zoom"><button type="button" data-zoom="in" aria-label="Zoom in" title="Zoom in">+</button><button type="button" data-zoom="reset" aria-label="Reset zoom to 100%"><output id="notebook-zoom-level" aria-live="polite">100%</output></button><button type="button" data-fit="width">Fit to width</button><button type="button" data-fit="height">Fit to height</button>';
pages.before(zoomTools);pages.before(pageViewport);pageViewport.append(pageShell);pageShell.append(pages);
let pageZoom=1,fitMode=null,frame=null;
function setPageZoom(value,mode=null){if(!Number.isFinite(value))return;pageZoom=Math.round(Math.min(2,Math.max(.25,value))*1000)/1000;fitMode=mode;pages.style.transform='scale('+pageZoom+')';pageShell.style.width=pages.scrollWidth*pageZoom+'px';pageShell.style.height=pages.scrollHeight*pageZoom+'px';const percent=Math.round(pageZoom*100);el('notebook-zoom').value=String(percent);el('notebook-zoom-level').value=percent+'%';el('notebook-zoom-level').textContent=percent+'%';zoomTools.querySelector('[data-zoom="out"]').disabled=pageZoom<=.25;zoomTools.querySelector('[data-zoom="in"]').disabled=pageZoom>=2;for(const button of zoomTools.querySelectorAll('[data-fit]')){const active=button.dataset.fit===mode;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))}}
function fitPage(mode,scroll=true){if(pages.hidden)return;const width=Math.max(1,pageViewport.clientWidth-32),height=Math.max(1,pageViewport.clientHeight-32),naturalWidth=Math.max(pages.scrollWidth,928),naturalHeight=Math.max(pages.scrollHeight,1056);setPageZoom(mode==='width'?width/naturalWidth:height/naturalHeight,mode);if(scroll)pageViewport.scrollTo({top:0,left:0,behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}
function layout(){if(pages.hidden)return;if(fitMode)fitPage(fitMode,false);else setPageZoom(pageZoom)}
zoomTools.onclick=event=>{const button=event.target.closest('button');if(!button)return;if(button.dataset.zoom==='in'||button.dataset.zoom==='out')setPageZoom(pageZoom+(button.dataset.zoom==='in'?.1:-.1));if(button.dataset.zoom==='reset')setPageZoom(1);if(button.dataset.fit)fitPage(button.dataset.fit)};
el('notebook-zoom').oninput=()=>setPageZoom(Number(el('notebook-zoom').value)/100);
pageViewport.addEventListener('wheel',event=>{if(!event.ctrlKey&&!event.metaKey)return;event.preventDefault();setPageZoom(pageZoom+(event.deltaY<0?.1:-.1))},{passive:false});
el('note-cover-toggle').addEventListener('click',()=>{pageViewport.hidden=pages.hidden;zoomTools.hidden=pages.hidden;if(!pages.hidden)requestAnimationFrame(()=>fitPage('width'))});
window.addEventListener('resize',layout);if(window.ResizeObserver){const observer=new window.ResizeObserver(()=>{if(frame!==null)cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{frame=null;layout()})});observer.observe(pages);observer.observe(pageViewport)}
pageViewport.hidden=pages.hidden;zoomTools.hidden=pages.hidden;
})();
