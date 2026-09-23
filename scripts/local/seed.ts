import { readFileSync, mkdirSync, writeFileSync, openSync, closeSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { PilotDatabase } from '../../server/src/local/sqlite';
import { parseManifest, seedQA } from '../../server/src/local/seed';
if(!process.argv.includes('--local'))throw new Error('Explicit --local required');
process.umask(0o077);
const args=process.argv.slice(2),get=(key:string)=>{const i=args.indexOf(key);return i<0?null:args[i+1];};
const manifestPath=get('--manifest'),databasePath=get('--db'),out=get('--out');
if(!manifestPath||!databasePath||!out)throw new Error('Required: --manifest FILE --db FILE --out FILE --local');
if(new Set([resolve(manifestPath),resolve(databasePath),resolve(out)]).size!==3)throw new Error('Manifest, database and report paths must be distinct');
const password=process.env.SHINE_LOCAL_QA_PASSWORD;
if(!password)throw new Error('Set SHINE_LOCAL_QA_PASSWORD privately, not in source or command arguments');
const root=resolve(process.env.SHINE_LOCAL_ROOT??'.'),manifest=parseManifest(JSON.parse(readFileSync(resolve(manifestPath),'utf8')));
mkdirSync(dirname(resolve(out)),{recursive:true,mode:0o700});
// Reserve report before database writes; never overwrite a previous delivery.
const reportFd=openSync(resolve(out),'wx',0o600);
let succeeded=false;
const db=new PilotDatabase(resolve(databasePath));
try{
  const result=await seedQA(db,manifest,password,root);
  writeFileSync(reportFd,JSON.stringify(result,null,2)+'\n');succeeded=true;
  console.log(JSON.stringify({created:result.accounts.filter(a=>a.status==='created').length,existing:result.accounts.filter(a=>a.status!=='created').length,storage:'sqlite',cloudWrites:0,reportWritten:true}));
}finally{closeSync(reportFd);if(!succeeded)unlinkSync(resolve(out));await db.close();delete process.env.SHINE_LOCAL_QA_PASSWORD;}
