import { getStudyUser } from '../../study-auth';
import { getDb } from '../../../db';
import { workspaces } from '../../../db/schema';
import { eq, sql } from 'drizzle-orm';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control':'private, no-store', 'Vary':'Cookie' };
const json=(body:unknown,status=200)=>Response.json(body,{status,headers});
export async function GET(request:Request){
 const user=await getStudyUser(request); if(!user)return json({error:'Sign in required'},401);
 const [row]=await getDb().select().from(workspaces).where(eq(workspaces.userId,user.userId)).limit(1);
 return json({state:row?JSON.parse(row.data):null,revision:row?.revision||0});
}
function validState(s:any){
 if(!s||typeof s!=='object'||Array.isArray(s))return false;
 if(!Array.isArray(s.tasks)||s.tasks.length>2000||!s.tasks.every((t:any)=>t&&typeof t.title==='string'&&typeof t.subject==='string'&&typeof t.due==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(t.due)&&typeof t.done==='boolean'&&(typeof t.id==='number'||typeof t.id==='string')))return false;
 if(!Array.isArray(s.cards)||s.cards.length>5000||!s.cards.every((c:any)=>c&&typeof c.question==='string'&&typeof c.answer==='string'))return false;
 return typeof s.notes==='string'&&Number.isSafeInteger(s.sessions)&&s.sessions>=0;
}
export async function PUT(request:Request){
 const user=await getStudyUser(request); if(!user)return json({error:'Sign in required'},401);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Invalid origin'},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'JSON required'},415);
 const raw=await request.text();if(raw.length>1000000)return json({error:'Workspace is too large. Export a backup and remove older items.'},413);
 let body;try{body=JSON.parse(raw)}catch{return json({error:'Invalid JSON'},400)}
 if(!Number.isSafeInteger(body.revision)||body.revision<0||!validState(body.state))return json({error:'Invalid workspace'},400);
 const data=JSON.stringify(body.state),db=getDb();
 if(body.revision===0){const rows=await db.insert(workspaces).values({userId:user.userId,data,revision:1}).onConflictDoNothing().returning({revision:workspaces.revision});return rows.length?json(rows[0]):json({error:'Your workspace changed in another tab. Export your edits, then reload.'},409)}
 const rows=await db.update(workspaces).set({data,revision:sql`${workspaces.revision} + 1`}).where(sql`${workspaces.userId} = ${user.userId} AND ${workspaces.revision} = ${body.revision}`).returning({revision:workspaces.revision});
 return rows.length?json(rows[0]):json({error:'Your workspace changed in another tab. Export your edits, then reload.'},409);
}
