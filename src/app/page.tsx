import Desk from './desk';
import {getCapabilities} from '@/lib/capabilities';
import {queryContent} from '@/lib/content';
import type {Source} from '@/lib/types';
export const dynamic='force-dynamic';
export default async function Page(){
 let sources:Source[]=[];let contentError:string|null=null;
 try{sources=await queryContent<Source[]>('*[_type=="source"]');}catch{contentError='The configured Sanity dataset could not be read. Check its public-read settings and project ID.';}
 return <Desk capabilities={getCapabilities()} sourceList={sources} contentError={contentError}/>;
}
