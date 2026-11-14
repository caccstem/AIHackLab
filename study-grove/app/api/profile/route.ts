import { getStudyUser,parseBody,json } from '../../study-auth';
import { accounts } from '../../../db/schema';
import { getDb } from '../../../db';
import { eq } from 'drizzle-orm';
export const dynamic='force-dynamic';
export async function GET(request:Request){const user=await getStudyUser(request);return user?json({id:user.id,name:user.name,username:user.username,grade:user.grade,profile:user.profile,avatarUrl:user.avatarKey?'/api/images?kind=avatar&user='+encodeURIComponent(user.id):null,backgroundUrl:user.backgroundKey?'/api/images?kind=background':null}):json({error:'Sign in required'},401)}
export async function PUT(request:Request){const user=await getStudyUser(request);if(!user)return json({error:'Sign in required'},401);let body;try{body=await parseBody(request)}catch{return json({error:'Invalid request'},400)}
const grade=body.grade===undefined?user.grade:String(body.grade);if(!['5','6','7','8','9','10','11','12','college','other'].includes(grade))return json({error:'Choose your current grade.'},400);
const goals=['Improve my grades','Understand tricky topics','Stay focused','Keep up with assignments','Prepare for tests','Build a daily habit'];const subjects=['Math','Precalculus','Science','Biology','Chinese','English','History','Languages','Other'];
if(!Array.isArray(body.goals)||body.goals.length<1||!body.goals.every((g:unknown)=>goals.includes(String(g)))||!Array.isArray(body.subjects)||body.subjects.length<1||!body.subjects.every((s:unknown)=>subjects.includes(String(s)))||![5,15,25,50].includes(body.minutes)||!['grove','lavender','ocean','red','orange'].includes(body.theme))return json({error:'Choose at least one goal and subject, a daily goal, and a theme.'},400);
const profile={goals:[...new Set(body.goals)],subjects:[...new Set(body.subjects)],minutes:body.minutes,theme:body.theme,complete:true};await getDb().update(accounts).set({grade,profile:JSON.stringify(profile)}).where(eq(accounts.id,user.id));return json({ok:true});}
