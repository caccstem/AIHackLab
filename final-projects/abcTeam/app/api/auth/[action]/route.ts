import { eq, and } from 'drizzle-orm';
import { getDb } from '../../../../db';
import { accounts, sessions } from '../../../../db/schema';
import { requestSessionToken,hashToken,secretToken,hashPassword,verifyPassword,validPassword,getStudyUser,startSession,sessionCookie,limitAuth,parseBody,json,sameOrigin } from '../../../study-auth';
export const dynamic='force-dynamic';
export async function POST(request:Request,{params}:{params:Promise<{action:string}>}){
 const {action}=await params;const raw=await request.text();const db=getDb();
 if(!sameOrigin(request))return json({error:'Invalid request origin.'},403);
 if(action==='logout'){const token=requestSessionToken(request);if(token)await db.delete(sessions).where(eq(sessions.tokenHash,hashToken(token)));return json({ok:true},200,{'Set-Cookie':sessionCookie('',request,true)})}
 if(!['signup','login','recover'].includes(action))return json({error:'Not found'},404);
 let body;try{if(raw.length>12000||!request.headers.get('content-type')?.startsWith('application/json'))throw Error();body=JSON.parse(raw);if(!body||typeof body!=='object')throw Error()}catch{return json({error:'Invalid request.'},400)}
 const username=typeof body.username==='string'?body.username.trim().toLowerCase():'';
 if(!/^[a-z0-9_]{3,24}$/.test(username))return json({error:'Use a username with 3–24 letters, numbers, or underscores.'},400);
 if(!await limitAuth(request,username,action))return json({error:'Too many attempts. Try again in 15 minutes.'},429,{'Retry-After':'900'});
 if(action==='signup'){
 if(!validPassword(body.password))return json({error:'Use a password with 8–128 characters.'},400);
 const name=typeof body.name==='string'?body.name.trim():'';const grade=String(body.grade||'');
 if(!name||name.length>40||!['5','6','7','8','9','10','11','12','college','other'].includes(grade))return json({error:'Enter a nickname (up to 40 characters) and your current grade.'},400);
 const id='student_'+crypto.randomUUID(),recoveryCode=secretToken();const passwordHash=await hashPassword(body.password);
 const created=await db.insert(accounts).values({id,username,name,grade,passwordHash,recoveryHash:hashToken(recoveryCode),createdAt:Date.now()}).onConflictDoNothing({target:accounts.username}).returning({id:accounts.id});
 if(!created.length)return json({error:'That username is taken. Choose another one.'},409);
 return json({ok:true,recoveryCode,next:'/personalize'},201,{'Set-Cookie':await startSession(id,request)});
 }
 const [account]=await db.select().from(accounts).where(eq(accounts.username,username)).limit(1);
 if(action==='recover'){
 if(!validPassword(body.password)||typeof body.recoveryCode!=='string'||body.recoveryCode.length!==64)return json({error:'Enter your recovery code and a new password of 8–128 characters.'},400);
 if(!account||account.recoveryHash!==hashToken(body.recoveryCode.trim()))return json({error:'Username or recovery code is incorrect.'},401);
 const recoveryCode=secretToken(),passwordHash=await hashPassword(body.password);
 const changed=await db.update(accounts).set({passwordHash,recoveryHash:hashToken(recoveryCode)}).where(and(eq(accounts.id,account.id),eq(accounts.recoveryHash,account.recoveryHash))).returning({id:accounts.id});if(!changed.length)return json({error:'Recovery code was already used.'},409);
 await db.delete(sessions).where(eq(sessions.userId,account.id));
 return json({ok:true,recoveryCode,next:account.profile==='{}'?'/personalize':'/workspace'},200,{'Set-Cookie':await startSession(account.id,request)});
 }
 if(typeof body.password!=='string'||body.password.length>128)return json({error:'Username or password is incorrect.'},401);
 const dummy='scrypt:16384:8:5:00000000000000000000000000000000:'+ '0'.repeat(64);
 if(!await verifyPassword(body.password,account?.passwordHash||dummy)||!account)return json({error:'Username or password is incorrect.'},401);
 return json({ok:true,next:JSON.parse(account.profile).complete?'/workspace':'/personalize'},200,{'Set-Cookie':await startSession(account.id,request)});
}
