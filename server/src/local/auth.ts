import { randomBytes, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import type { Response } from 'express';
import { PilotDatabase } from './sqlite';
import { BuddyError } from '../../../shared/buddyChat';

export const viewVersion=(hash:string)=>createHash('sha256').update('local-view:'+hash).digest('hex').slice(0,32);
export const COOKIE = 'shine_local_session';
const IDLE_MS = 30 * 60_000, ABSOLUTE_MS = 8 * 60 * 60_000;
export const digest = (s: string) => createHash('sha256').update(s).digest('hex');
export interface LocalUser { uid:string; email:string; displayName:string; minor:boolean; needsReview:boolean; source:Record<string,unknown>; disabled:boolean }
export interface LocalSession { user:LocalUser; csrf:string; hash:string; expiresAt:number }
function user(row: Record<string, unknown>): LocalUser {
  return { uid:String(row.uid),email:String(row.email),displayName:String(row.display_name),minor:row.minor===1,needsReview:row.needs_review===1,source:JSON.parse(String(row.source_json)),disabled:row.disabled===1 };
}
export async function hashPassword(password: string): Promise<string> {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) throw new Error('Password must contain 8-128 characters');
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt);
  return `scrypt$131072$8$1$${salt}$${key.toString('hex')}`;
}
function derive(password:string,salt:string):Promise<Buffer> {
  return new Promise((resolve,reject)=>scrypt(password,salt,64,{N:131072,r:8,p:1,maxmem:256*1024*1024},(e,key)=>e?reject(e):resolve(key)));
}
export async function verifyPassword(password:string,encoded:string):Promise<boolean> {
  if(typeof password!=='string'||password.length>128)return false;
  const p=encoded.split('$');
  if(p.length!==6||p.slice(0,4).join('$')!=='scrypt$131072$8$1'||!/^[0-9a-f]{32}$/.test(p[4])||!/^[0-9a-f]{128}$/.test(p[5]))return false;
  return timingSafeEqual(await derive(password,p[4]),Buffer.from(p[5],'hex'));
}
export function cookieValue(header: string | undefined): string | null {
  const matches=(header??'').split(';').map(v=>v.trim()).filter(v=>v.startsWith(COOKIE+'='));
  if(matches.length>1)throw new BuddyError('invalid_session','Phi\u00ean \u0111\u0103ng nh\u1eadp kh\u00f4ng h\u1ee3p l\u1ec7.',401);
  if(!matches.length)return null;
  const value=matches[0].slice(COOKIE.length+1);
  if(!/^[A-Za-z0-9_-]{43}$/.test(value))throw new BuddyError('invalid_session','Phi\u00ean \u0111\u0103ng nh\u1eadp kh\u00f4ng h\u1ee3p l\u1ec7.',401);
  return value;
}
export class LocalAuth {
  private activeHashes=0;
  private dummy:Promise<string>|null=null;
  private readonly connections=new Map<string,Set<Response>>();
  constructor(readonly db:PilotDatabase,readonly now=Date.now) {}
  async login(email:string,password:string,oldToken:string|null) {
    if(this.activeHashes>=2)throw new BuddyError('login_busy','Vui l\u00f2ng ch\u1edd r\u1ed3i \u0111\u0103ng nh\u1eadp l\u1ea1i.',429);
    this.activeHashes++;
    try {
      const row=await this.db.access(db=>db.prepare('SELECT * FROM local_users WHERE email=?').get(email.toLowerCase().trim()));
      this.dummy??=hashPassword(randomBytes(32).toString('base64url'));
      const valid=await verifyPassword(password,row?String(row.password_hash):await this.dummy);
      if(!row||!valid||row.disabled===1)throw new BuddyError('invalid_credentials','Email ho\u1eb7c m\u1eadt kh\u1ea9u kh\u00f4ng \u0111\u00fang.',401);
      const token=randomBytes(32).toString('base64url'),csrf=randomBytes(32).toString('base64url'),stamp=this.now();
      const retired=await this.db.transaction(db=>{
        const stale=db.prepare('SELECT token_hash FROM local_sessions WHERE expires_at<=? OR touched_at<=?').all(stamp,stamp-IDLE_MS).map(r=>String(r.token_hash));
        const current=db.prepare('SELECT disabled,password_hash FROM local_users WHERE uid=?').get(String(row.uid));
        if(!current||current.disabled===1||current.password_hash!==row.password_hash)throw new BuddyError('invalid_credentials','T\u00e0i kho\u1ea3n \u0111\u00e3 thay \u0111\u1ed5i.',401);
        db.prepare('DELETE FROM local_sessions WHERE expires_at<=? OR touched_at<=?').run(stamp,stamp-IDLE_MS);
        if(oldToken)db.prepare('DELETE FROM local_sessions WHERE token_hash=?').run(digest(oldToken));
        // Bound active sessions per QA identity.
        const rows=db.prepare('SELECT token_hash FROM local_sessions WHERE uid=? ORDER BY created_at DESC').all(String(row.uid));
        for(const r of rows.slice(4))db.prepare('DELETE FROM local_sessions WHERE token_hash=?').run(String(r.token_hash));
        db.prepare('INSERT INTO local_sessions VALUES(?,?,?,?,?,?)').run(digest(token),String(row.uid),csrf,stamp,stamp+ABSOLUTE_MS,stamp);
        return [...stale,...rows.slice(4).map(r=>String(r.token_hash))];
      });
      for(const h of retired)this.abort(h);
      if(oldToken)this.abort(digest(oldToken));
      return {token,csrf,user:user(row),expiresAt:stamp+ABSOLUTE_MS};
    } finally {this.activeHashes--;}
  }
  async resolve(token:string|null):Promise<LocalSession|null> {
    if(!token)return null;
    return this.db.access(db=>{
      const row=db.prepare('SELECT u.*,s.csrf,s.expires_at,s.touched_at FROM local_sessions s JOIN local_users u ON s.uid=u.uid WHERE s.token_hash=?').get(digest(token));
      if(!row||row.disabled===1||Number(row.expires_at)<=this.now()||Number(row.touched_at)<=this.now()-IDLE_MS){
        db.prepare('DELETE FROM local_sessions WHERE token_hash=?').run(digest(token));
        this.abort(digest(token));
        throw new BuddyError('session_expired','Phi\u00ean \u0111\u0103ng nh\u1eadp h\u1ebft h\u1ea1n. H\u00e3y \u0111\u0103ng nh\u1eadp l\u1ea1i.',401);
      }
      db.prepare('UPDATE local_sessions SET touched_at=? WHERE token_hash=?').run(this.now(),digest(token));
      return {user:user(row),csrf:String(row.csrf),hash:digest(token),expiresAt:Number(row.expires_at)};
    });
  }
  async logout(token:string) {
    await this.db.access(db=>db.prepare('DELETE FROM local_sessions WHERE token_hash=?').run(digest(token)));
    this.abort(digest(token));
  }
  watch(session:LocalSession,res:Response) {
    const entries=this.connections.get(session.hash)??new Set<Response>(); entries.add(res); this.connections.set(session.hash,entries);
    const timer=setTimeout(()=>res.destroy(),Math.max(1,session.expiresAt-this.now()));timer.unref();
    res.once('close',()=>{clearTimeout(timer);entries.delete(res);if(!entries.size)this.connections.delete(session.hash);});
  }
  abort(hash:string){for(const response of this.connections.get(hash)??[])response.destroy();this.connections.delete(hash);}
  async disable(uid:string) {
    const hashes=await this.db.transaction(db=>{
      db.prepare('UPDATE local_users SET disabled=1 WHERE uid=? AND qa_only=1').run(uid);
      const rows=db.prepare('SELECT token_hash FROM local_sessions WHERE uid=?').all(uid);
      db.prepare('DELETE FROM local_sessions WHERE uid=?').run(uid);return rows.map(r=>String(r.token_hash));
    });for(const h of hashes)this.abort(h);
  }
  static publicUser(u:LocalUser){return {uid:u.uid,email:u.email,displayName:u.displayName,minorAtSource:u.minor,reviewRequired:u.needsReview,authProvider:'local' as const,qaOnly:true as const};}
}
