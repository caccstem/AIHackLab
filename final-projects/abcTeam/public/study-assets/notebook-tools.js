'use strict';
(()=>{
const el=id=>document.getElementById(id),corner=el('notebook-tool-corner'),toggle=el('notebook-tool-toggle');let suppress=false;
function open(){corner.dataset.open='true';toggle.setAttribute('aria-expanded','true')}
function close(){corner.dataset.open='false';toggle.setAttribute('aria-expanded','false');suppress=true;toggle.focus({preventScroll:true});suppress=false}
corner.addEventListener('mouseenter',open);corner.addEventListener('mouseleave',()=>{if(!corner.contains(document.activeElement)){corner.dataset.open='false';toggle.setAttribute('aria-expanded','false')}});corner.addEventListener('focusin',()=>{if(!suppress)open()});corner.addEventListener('focusout',()=>setTimeout(()=>{if(!corner.contains(document.activeElement)&&!corner.matches(':hover')){corner.dataset.open='false';toggle.setAttribute('aria-expanded','false')}},0));toggle.onclick=open;el('notebook-tool-close').onclick=close;corner.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close()}});
const editor=()=>window.studyNotebookRich;
for(const button of corner.querySelectorAll('[data-note-format]')){button.addEventListener('mousedown',event=>event.preventDefault());button.onclick=()=>editor()?.format(button.dataset.noteFormat,button.dataset.noteValue)}
for(const button of corner.querySelectorAll('[data-note-insert]')){button.addEventListener('mousedown',event=>event.preventDefault());button.onclick=()=>editor()?.insert(button.dataset.noteInsert)}
el('notebook-ink').oninput=()=>editor()?.format('color',el('notebook-ink').value);el('notebook-highlight-apply').onmousedown=event=>event.preventDefault();el('notebook-highlight-apply').onclick=()=>editor()?.format('background',el('notebook-highlight').value);el('notebook-undo').onclick=()=>editor()?.undo();el('notebook-redo').onclick=()=>editor()?.redo();
})();
