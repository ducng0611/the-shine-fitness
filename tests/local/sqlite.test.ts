import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PilotDatabase, SQLiteTrainingStore } from '../../server/src/local/sqlite';
import { hashPassword, verifyPassword, cookieValue } from '../../server/src/local/auth';

test('SQLite actually persists across close/reopen, and scopes immediate collections',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'shine-sqlite-')),file=join(dir,'db.sqlite');
  try{
    let db=new PilotDatabase(file),store=new SQLiteTrainingStore(db);
    await store.atomic(async tx=>{tx.set('training_members/a',{profile:{uid:'a'},revision:1});tx.set('training_members/a/sessions/one',{date:'2026-09-21',count:10});tx.set('training_members/b/sessions/one',{date:'2026-09-21',count:99});});
    await db.close();db=new PilotDatabase(file);store=new SQLiteTrainingStore(db);
    assert.equal((await store.get('training_members/a'))!.revision,1);
    const rows=await store.list('training_members/a/sessions',{limit:10});assert.equal(rows.length,1);assert.equal(rows[0].count,10);
    if(process.platform!=='win32'){assert.equal(statSync(file).mode&0o777,0o600);assert.equal(statSync(dir).mode&0o777,0o700);}
    await db.close();
  }finally{rmSync(dir,{recursive:true,force:true});}
});
test('SQLite query filters/order are bounded, type-preserving and parameterized',async()=>{
  const db=new PilotDatabase(':memory:'),s=new SQLiteTrainingStore(db);
  try{
    await s.atomic(async tx=>{tx.set('rows/a',{n:2});tx.set('rows/b',{n:10});tx.set('rows/c',{n:'12'});tx.set('rows/d',{other:100});});
    assert.deepEqual((await s.list('rows',{limit:10,filters:[{field:'n',op:'>=',value:2}],order:{field:'n',direction:'desc'}})).map(r=>r.id),['b','a']);
    assert.equal((await s.list('rows',{limit:10,filters:[{field:'n',op:'==',value:"' OR 1=1 --"}]})).length,0);
    await assert.rejects(async()=>s.get('../private'));await assert.rejects(async()=>s.list('rows',{limit:10001}));
  }finally{await db.close();}
});
test('SQLite rollback is atomic and rejects read-after-write to preserve adapter contract',async()=>{
  const db=new PilotDatabase(':memory:'),s=new SQLiteTrainingStore(db);
  try{
    await assert.rejects(s.atomic(async tx=>{tx.set('rows/a',{n:1});throw new Error('rollback');}));assert.equal(await s.get('rows/a'),null);
    await assert.rejects(s.atomic(async tx=>{tx.set('rows/a',{n:1});await tx.get('rows/a');}));assert.equal(await s.get('rows/a'),null);
    await assert.rejects(s.atomic(async()=>s.get('rows/a')),/transaction methods/);
  }finally{await db.close();}
});
test('Concurrent increments and unrelated reads serialize without dirty reads',async()=>{
  const db=new PilotDatabase(':memory:'),s=new SQLiteTrainingStore(db);
  try{
    await s.atomic(async tx=>{tx.set('rows/a',{n:0});});
    await Promise.all(Array.from({length:20},()=>s.atomic(async tx=>{const old=await tx.get('rows/a');await new Promise(r=>setTimeout(r,1));tx.set('rows/a',{n:Number(old!.n)+1});})));
    assert.equal((await s.get('rows/a'))!.n,20);
    const job=db.transaction(async sql=>{sql.prepare('UPDATE local_documents SET body=? WHERE path=?').run('{"n":500}','rows/a');await new Promise(r=>setTimeout(r,10));throw new Error('rollback');});
    const read=s.get('rows/a');await assert.rejects(job);assert.equal((await read)!.n,20);
  }finally{await db.close();}
});
test('Scrypt salts are unique, correct/incorrect password checked, malformed hash rejected',async()=>{
  const password='SYNTHETIC-test-only-9!';
  const a=await hashPassword(password),b=await hashPassword(password);assert.notEqual(a,b);assert(!a.includes(password));
  assert(await verifyPassword(password,a));assert.equal(await verifyPassword('wrong',a),false);assert.equal(await verifyPassword(password,'plain'),false);
  await assert.rejects(hashPassword('short'));assert.throws(()=>cookieValue('shine_local_session=a; shine_local_session=b'));assert.equal(cookieValue(undefined),null);
});
