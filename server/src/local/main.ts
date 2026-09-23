import { createServer } from 'node:http';
import { resolve, join } from 'node:path';
import { existsSync } from 'node:fs';
import express from 'express';
import dotenv from 'dotenv';
import { createLocalApp } from './app';
import { PilotDatabase } from './sqlite';
import { createGeminiBuddyProvider } from '../buddy/provider';

if(!process.argv.includes('--local'))throw new Error('Explicit --local flag required. This is not an authentication fallback.');
process.umask(0o077);
dotenv.config({path:resolve('.env.local-pilot'),quiet:true});
const port=Number(process.env.SHINE_LOCAL_PORT??4176);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid local port');
if(process.env.NODE_ENV==='production')throw new Error('Local Pilot is loopback QA only, not a production deployment');
const root=resolve(process.env.SHINE_LOCAL_ROOT??process.cwd());
const filename=resolve(process.env.SHINE_LOCAL_DB??join(root,'.local-data/shine-pilot.sqlite'));
if(!existsSync(filename))throw new Error('No local database. Run the local seed command first.');
const staticDir=join(root,'dist-local/client');
if(!existsSync(join(staticDir,'local.html')))throw new Error('Build the local client first: npm run local:build');
const provider=process.env.SHINE_LOCAL_ALLOW_MODEL==='true'?createGeminiBuddyProvider():null;
if(process.env.SHINE_LOCAL_ALLOW_MODEL==='true'&&!provider)throw new Error('Model explicitly enabled but GEMINI_API_KEY missing');
const db=new PilotDatabase(filename),{app}=createLocalApp({database:db,root,allowedOrigins:()=>[`http://127.0.0.1:${port}`,`http://localhost:${port}`],provider});
app.use(express.static(staticDir,{dotfiles:'deny',index:false}));
app.get('/',(_req,res)=>res.sendFile(join(staticDir,'local.html')));
const server=createServer(app);
server.listen(port,'127.0.0.1',()=>console.log(`The Shine Local Pilot: http://127.0.0.1:${port} | SQLite | Firebase OFF | Model ${provider?'ON':'OFF'}`));
async function stop(){server.closeAllConnections();server.close();await db.close();process.exit(0);}
process.once('SIGINT',()=>void stop());process.once('SIGTERM',()=>void stop());
