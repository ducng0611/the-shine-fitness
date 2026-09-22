import express from 'express';import{createServer}from'vite';import react from'@vitejs/plugin-react';
import{createPathwayRouter}from'../../server/src/companion/pathways/router';import{MemoryStore}from'../training/helpers';
if(process.env.NODE_ENV!=='test')throw new Error('Explicit test mode only.');
const app=express(),store=new MemoryStore();
app.get('/__test/state',(_req,res)=>res.json({count:store.records.size}));
app.use('/api/admin/pathway-intake',createPathwayRouter({store,enabled:()=>true,adminEmails:()=>['admin-a@example.invalid'],verifyToken:async token=>{if(token!=='admin-a')throw new Error('invalid');return{uid:token,email:'admin-a@example.invalid',email_verified:true};}}));
const vite=await createServer({configFile:false,plugins:[react()],server:{middlewareMode:true},appType:'mpa'});app.use(vite.middlewares);const server=app.listen(4174,'127.0.0.1');const stop=()=>{server.close();void vite.close();};process.on('SIGINT',stop);process.on('SIGTERM',stop);
