import { env } from 'cloudflare:workers';
export function friendDb(){if(!env.DB)throw Error('Database unavailable');return env.DB}
export const pairId=(a:string,b:string)=>[a,b].sort().join('|');
export async function isBlocked(a:string,b:string){return !!await friendDb().prepare('SELECT id FROM study_blocks WHERE id IN (?, ?) LIMIT 1').bind(a+'|'+b,b+'|'+a).first()}
export async function canMessage(a:string,b:string){return !!await friendDb().prepare(`SELECT id FROM study_friendships WHERE id=? AND status='accepted' AND NOT EXISTS (SELECT 1 FROM study_blocks WHERE id IN (?,?))`).bind(pairId(a,b),a+'|'+b,b+'|'+a).first()}
export async function allowAction(userId:string,action:string,limit:number,windowMs:number){const bucket=Math.floor(Date.now()/windowMs);const row=await friendDb().prepare('INSERT INTO study_auth_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind('social:'+action+':'+userId+':'+bucket,(bucket+1)*windowMs).first<{count:number}>();return !!row&&row.count<=limit}
