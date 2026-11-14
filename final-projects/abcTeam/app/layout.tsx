import './accounts.css';
import LanguageMenu from './LanguageMenu';
import type { Metadata } from 'next';
export const metadata:Metadata={title:'Study Grove · Your own study space',description:'Plan assignments, understand topics, and build better study habits. A personal study space from 5th grade through college students.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body style={{margin:0}}><LanguageMenu/>{children}</body></html>}
