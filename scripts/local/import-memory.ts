import { readFileSync, writeFileSync, existsSync, openSync, closeSync } from 'node:fs';
import { resolve } from 'node:path';
import { PilotDatabase } from '../../server/src/local/sqlite';
import { importSourceMemory, validateEnrichment } from '../../server/src/local/sourceMemory';
process.umask(0o077);
const args=process.argv.slice(2),get=(key:string)=>args.includes(key)?args[args.indexOf(key)+1]:undefined;
if(!args.includes('--local')||!get('--db')||!get('--out'))throw new Error('Required --local --db EXISTING_DB --out NEW_REPORT [--facts PRIVATE_JSON] [--expected-revision N]');
const dbPath=resolve(get('--db')!),out=resolve(get('--out')!),factPath=get('--facts');
if(!existsSync(dbPath)||existsSync(out)||[out,factPath?resolve(factPath):''].includes(dbPath))throw new Error('Use an existing database and a new distinct output path');
const expected=Number(get('--expected-revision')??0);if(!Number.isInteger(expected)||expected<0)throw new Error('Invalid expected revision');
const facts=factPath?validateEnrichment(JSON.parse(readFileSync(resolve(factPath),'utf8'))):undefined;
const reportFd=openSync(out,'wx',0o600);
const db=new PilotDatabase(dbPath);
try {
  const result=await importSourceMemory(db,resolve(process.env.SHINE_LOCAL_ROOT??'.'),facts,expected);
  const report={...result,storage:'sqlite',cloudCalls:0,modelCalls:0,plannerEligibilityChanged:false,assignmentsCreated:0,sourceInputsPreserved:true};
  writeFileSync(reportFd,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
} catch {
  writeFileSync(reportFd,JSON.stringify({status:'failed_or_partial',note:'Inspect the database import receipt before retrying. No successful account or source import is claimed.'})+'\n');
  process.exitCode=1;
} finally {closeSync(reportFd);await db.close();}
