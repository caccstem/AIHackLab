import { redirect, notFound } from 'next/navigation';
import { getStudyUser } from '../../study-auth';
import AccountForm from '../AccountForm';
export const dynamic='force-dynamic';
export default async function Account({params}:{params:Promise<{mode:string}>}){const {mode}=await params;if(!['signup','login','recover'].includes(mode))notFound();if(await getStudyUser())redirect('/workspace');return <main className="auth-page"><a className="auth-brand" href="/">✳ study grove</a><AccountForm mode={mode as 'signup'|'login'|'recover'}/><p className="auth-footer">A little focus. A lot of growth. · No ads.</p></main>}
