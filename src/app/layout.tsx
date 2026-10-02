import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Disruption Desk · Know where you stand',description:'Flight disruption rights, grounded in structured legal sources. Computed awards, visible conditions, honest uncertainty.'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>;}
