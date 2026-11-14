import { getStudyUser } from '../study-auth';
import { workspaceHtml } from './html';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const user=await getStudyUser(request);
 if(!user)return Response.redirect(new URL('/account/login',request.url),302);
 if(!user.profile.complete)return Response.redirect(new URL('/personalize',request.url),302);
 return new Response(workspaceHtml,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','Vary':'Cookie'}});
}
