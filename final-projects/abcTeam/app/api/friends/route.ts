import {getStudyUser,json,sameOrigin} from '../../study-auth';
import {friendDb,pairId,isBlocked,allowAction} from '../../friend-store';
export const dynamic='force-dynamic';
export async function GET(request:Request){const user=await getStudyUser(request);if(!user)return json({error:'Sign in required'},401);const db=friendDb();
const rows=await db.prepare(`SELECT a.id,a.username,a.name,CASE WHEN a.avatar_key IS NOT NULL THEN 1 ELSE 0 END AS hasAvatar,f.status,f.requested_by,CASE WHEN f.status='accepted' AND a.share_phone=1 THEN a.phone ELSE NULL END AS phone FROM study_friendships f JOIN study_accounts a ON a.id=CASE WHEN f.user_a=? THEN f.user_b ELSE f.user_a END WHERE (f.user_a=? OR f.user_b=?) AND NOT EXISTS (SELECT 1 FROM study_blocks WHERE id IN (?||'|'||a.id,a.id||'|'||?)) ORDER BY a.username LIMIT 200`).bind(user.id,user.id,user.id,user.id,user.id).all();
const blocked=await db.prepare('SELECT a.id,a.username,a.name FROM study_blocks b JOIN study_accounts a ON a.id=b.peer_id WHERE b.owner_id=? ORDER BY a.username LIMIT 200').bind(user.id).all();
return json({me:{id:user.id,username:user.username},connections:rows.results,blocked:blocked.results});}
export async function POST(request:Request){const raw=await request.text();if(!sameOrigin(request))return json({error:'Invalid origin'},403);const user=await getStudyUser(request);if(!user)return json({error:'Sign in required'},401);let body;try{if(raw.length>2000||!request.headers.get('content-type')?.startsWith('application/json'))throw Error();body=JSON.parse(raw);if(!body||typeof body!=='object')throw Error()}catch{return json({error:'Invalid request'},400)}
const db=friendDb(),action=body.action;if(!['request','accept','remove','block','unblock'].includes(action))return json({error:'Unknown action'},400);
if(!await allowAction(user.id,'friends',30,900000))return json({error:'Too many friend actions. Try again in 15 minutes.'},429);
let peer:string;
if(action==='request'){const username=typeof body.username==='string'?body.username.trim().toLowerCase():'';if(!/^[a-z0-9_]{3,24}$/.test(username))return json({error:'Enter their exact Study Grove username.'},400);const found=await db.prepare('SELECT id FROM study_accounts WHERE username=?').bind(username).first<{id:string}>();if(!found)return json({error:'Could not send a request to that username.'},404);peer=found.id}
else{if(typeof body.peer!=='string'||body.peer.length>100)return json({error:'Choose a friend.'},400);peer=body.peer}
if(peer===user.id)return json({error:'That’s your username. Try a friend’s username.'},400);
const pair=pairId(user.id,peer);
if(action==='unblock'){await db.prepare('DELETE FROM study_blocks WHERE id=?').bind(user.id+'|'+peer).run();return json({ok:true})}
if(action==='block'){const exists=await db.prepare('SELECT id FROM study_accounts WHERE id=?').bind(peer).first();if(!exists)return json({error:'Account not found'},404);await db.batch([db.prepare('INSERT INTO study_blocks (id,owner_id,peer_id) VALUES (?,?,?) ON CONFLICT(id) DO NOTHING').bind(user.id+'|'+peer,user.id,peer),db.prepare('DELETE FROM study_friendships WHERE id=?').bind(pair)]);return json({ok:true})}
if(await isBlocked(user.id,peer))return json({error:'This connection is unavailable.'},403);
if(action==='request'){const [a,b]=[user.id,peer].sort();await db.prepare("INSERT INTO study_friendships (id,user_a,user_b,requested_by,status,created_at) VALUES (?,?,?,?,'pending',?) ON CONFLICT(id) DO NOTHING").bind(pair,a,b,user.id,Date.now()).run();return json({ok:true})}
if(action==='accept'){const result=await db.prepare("UPDATE study_friendships SET status='accepted' WHERE id=? AND requested_by=? AND status='pending' RETURNING id").bind(pair,peer).first();return result?json({ok:true}):json({error:'This request is no longer available.'},409)}
await db.prepare('DELETE FROM study_friendships WHERE id=?').bind(pair).run();return json({ok:true});}
