'use strict';
(()=>{
function merge(tasks,todos){const result=Array.isArray(tasks)?tasks.slice():[],ids=new Set(result.map(task=>String(task.id)));let migrated=false;for(const todo of Array.isArray(todos)?todos:[]){if(!todo||typeof todo.id!=='string'||typeof todo.text!=='string')continue;const id='todo:'+todo.id;if(ids.has(id))continue;result.push({id,title:todo.text,subject:'',due:'',done:!!todo.done});ids.add(id);migrated=true}return{tasks:result,migrated}}
function compare(a,b){return Number(a.done)-Number(b.done)||(a.due||'9999-99-99').localeCompare(b.due||'9999-99-99')}
window.StudyTasks={merge,compare};
})();
