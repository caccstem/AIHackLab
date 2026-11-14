import { headers } from 'next/headers';
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { eq, and, gt, sql } from 'drizzle-orm';
import { getDb } from '../db';
import { accounts, sessions, authLimits } from '../db/schema';
export const COOKIE='__Host-grove_session';
function cookieName(host:string){return ['127.0.0.1','localhost','[::1]'].includes(host.split(':')[0])?'grove_session_dev':COOKIE}
export function requestSessionToken(request:Request){const name=cookieName(new URL(request.url).hostname);return request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1)}
export const hashToken=(value:string)=>createHash('sha256').update(value).digest('hex');
export const secretToken=()=>randomBytes(32).toString('hex');
export const responseHeaders={'Cache-Control':'private, no-store','Vary':'Cookie'};
export const json=(value:unknown,status=200,extra:Record<string,string>={})=>Response.json(value,{status,headers:{...responseHeaders,...extra}});
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin}
export async function parseBody(request:Request){
 if(!sameOrigin(request))throw new Error('Invalid request origin.');
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new Error('Send JSON.');
 const raw=await request.text();if(raw.length>12000)throw new Error('Request is too large.');return JSON.parse(raw);
}
const derive=(password:string,salt:string)=>new Promise<Buffer>((resolve,reject)=>scrypt(password,salt,32,{N:16384,r:8,p:5,maxmem:64*1024*1024},(error,key)=>error?reject(error):resolve(key)));
export async function hashPassword(password:string){const salt=randomBytes(16).toString('hex');const key=await derive(password,salt);return `scrypt:16384:8:5:${salt}:${key.toString('hex')}`}
export async function verifyPassword(password:string,encoded:string){const parts=encoded.split(':');if(parts.length!==6||parts.slice(0,4).join(':')!=='scrypt:16384:8:5')return false;const expected=Buffer.from(parts[5],'hex'),actual=await derive(password,parts[4]);return expected.length===actual.length&&timingSafeEqual(expected,actual)}
export function validPassword(value:unknown):value is string{return typeof value==='string'&&value.length>=8&&value.length<=128}
export function sessionCookie(token:string,request:Request,clear=false){const url=new URL(request.url);const local=url.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(url.hostname);return `${cookieName(url.hostname)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear?0:2592000}${local?'':'; Secure'}`}
export async function startSession(userId:string,request:Request){const token=secretToken();await getDb().insert(sessions).values({tokenHash:hashToken(token),userId,expiresAt:Date.now()+2592000000});return sessionCookie(token,request)}
export async function getStudyUser(request?:Request){const h=request?.headers||await headers();const name=cookieName(request?new URL(request.url).hostname:(h.get('host')||''));const token=h.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1);if(!token||!/^[a-f0-9]{64}$/.test(token))return null;const rows=await getDb().select({id:accounts.id,username:accounts.username,name:accounts.name,grade:accounts.grade,profile:accounts.profile,avatarKey:accounts.avatarKey,backgroundKey:accounts.backgroundKey}).from(sessions).innerJoin(accounts,eq(sessions.userId,accounts.id)).where(and(eq(sessions.tokenHash,hashToken(token)),gt(sessions.expiresAt,Date.now()))).limit(1);if(!rows[0])return null;return {...rows[0],userId:rows[0].id,profile:JSON.parse(rows[0].profile)};}
export async function limitAuth(request:Request,username:string,action:string){
 const ip=request.headers.get('cf-connecting-ip')||'local';const now=Date.now(),bucket=Math.floor(now/900000);const db=getDb();
 // Bound attempts by both source IP and username, using atomic database counters.
 for(const [label,value,max]of [['ip',ip,40],['username',username,12]] as const){const key=hashToken(action+':'+label+':'+value+':'+bucket);const rows=await db.insert(authLimits).values({key,count:1,expiresAt:(bucket+1)*900000}).onConflictDoUpdate({target:authLimits.key,set:{count:sql`${authLimits.count}+1`}}).returning({count:authLimits.count});if(rows[0].count>max)return false}
 // Periodic bounded cleanup does not affect live counters or sessions.
 if(Math.random()<0.02){await db.delete(authLimits).where(sql`${authLimits.expiresAt}<${now}`);await db.delete(sessions).where(sql`${sessions.expiresAt}<${now}`)}
 return true;
}
