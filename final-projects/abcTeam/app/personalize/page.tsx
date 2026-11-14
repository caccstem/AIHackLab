import { redirect } from 'next/navigation';
import { getStudyUser } from '../study-auth';
import ProfileForm from './ProfileForm';
export const dynamic='force-dynamic';
export default async function Personalize(){const user=await getStudyUser();if(!user)redirect('/account/login');return <main className="auth-page"><a className="auth-brand" href="/">✳ study grove</a><ProfileForm name={user.name} grade={user.grade} profile={user.profile}/></main>}
