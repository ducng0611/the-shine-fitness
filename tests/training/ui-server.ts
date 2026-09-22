/** Runs only locally in explicit test mode. No real Firebase or provider keys are used. */
import express from 'express';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { createTrainingRouter } from '../../server/src/companion/training/router';
import { MemoryStore } from './helpers';
if(process.env.NODE_ENV!=='test')throw new Error('UI test harness requires NODE_ENV=test. It is not a production server.');
const app=express(),store=new MemoryStore();app.use(express.json());
app.post('/__test/reset',(_req,res)=>{store.records.clear();res.json({reset:true});});
app.use('/api/companion/training',createTrainingRouter({store,enabled:()=>true,pilotUids:()=>['ui-test-member'],adminEmails:()=>[],rateLimit:1000,verifyToken:async token=>{if(token!=='ui-test-member')throw new Error('invalid test token');return {uid:token,email:'synthetic@example.invalid',email_verified:true};}}));
const vite=await createServer({configFile:false,plugins:[react()],server:{middlewareMode:true},appType:'mpa'});app.use(vite.middlewares);
const server=app.listen(4173,'127.0.0.1',()=>console.log('Synthetic UI tests only: http://127.0.0.1:4173/tests/training/ui.html'));
const stop=()=>{server.close();void vite.close();};process.on('SIGINT',stop);process.on('SIGTERM',stop);
