import test from 'node:test';
import assert from 'node:assert/strict';
import {routeBuddy,newBuddyMemory} from '../../shared/buddyPolicy';
const memory={...newBuddyMemory(),healthConcern:true};
for(const text of ['T\u00f4i mu\u1ed1n xem h\u1ed3 s\u01a1 c\u1ee7a t\u00f4i','T\u00f4i \u0111\u00e3 t\u1eadp g\u00ec tu\u1ea7n n\u00e0y?','Show my profile','Xem l\u1ecbch s\u1eed c\u1ee7a t\u00f4i'])test('Read-only own record is not a prescription: '+text,()=>{
  const d=routeBuddy(text,memory);assert.equal(d.task,'MEMBER_CONTEXT_QA');assert.equal(d.privateRequest,true);assert.equal(d.memory.healthConcern,true);
});
for(const text of ['T\u00f4i mu\u1ed1n xem h\u1ed3 s\u01a1 r\u1ed3i k\u00ea th\u1ef1c \u0111\u01a1n','Xem h\u1ed3 s\u01a1, t\u00f4i \u0111ang \u0111au ng\u1ef1c','D\u1ef1a v\u00e0o h\u1ed3 s\u01a1 c\u1ee7a t\u00f4i h\u00e3y ch\u1ec9nh li\u1ec1u insulin','Xem h\u1ed3 s\u01a1, h\u00f4m nay t\u00f4i t\u1eadp g\u00ec?'])test('Read words do not bypass safety for a mixed request: '+text,()=>{
  assert(['PROFESSIONAL_REVIEW','URGENT_SAFETY'].includes(routeBuddy(text,memory).task));
});
