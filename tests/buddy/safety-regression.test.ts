import test from 'node:test';
import assert from 'node:assert/strict';
import { routeBuddy } from '../../shared/buddyPolicy';
const urgent=[
 'Tôi đang run tay và vã mồ hôi lạnh',
 'Tôi đang sưng môi và khó thở',
 'Tôi đau lưng và mất kiểm soát tiểu tiện',
 'Tôi đang tê vùng yên ngựa',
 'Tôi yếu cả hai chân ngày càng nặng hơn'
];
for(const message of urgent)test(`acute regression: ${message}`,()=>assert.equal(routeBuddy(message).task,'URGENT_SAFETY'));
test('acute and pain signals remain relevant for next personal request',()=>{
 for(const message of ['Tôi đang đau ngực','Tôi đau vai khi tập']){
  let memory=routeBuddy(message).memory;
  memory=routeBuddy('Protein là gì?',memory).memory;
  assert.equal(routeBuddy('Hôm nay tôi nên tập gì?',memory).task,'PROFESSIONAL_REVIEW');
 }
});
test('hypothetical acute symptoms are not treated as the speaker having an emergency',()=>assert.notEqual(routeBuddy('Giả sử một người đau ngực, từ này là gì?').task,'URGENT_SAFETY'));
test('negated acute and personal condition statements do not mark illness',()=>{
 assert.equal(routeBuddy('Tôi không bị tiểu đường').memory.healthConcern,false);
 assert.notEqual(routeBuddy('Tôi không bị đau ngực, protein là gì?').task,'URGENT_SAFETY');
});
test('private follow-up retains task but must still recheck identity in router',()=>{
 const prior=routeBuddy('Tôi đã tập những gì tuần này?').memory;
 assert.equal(routeBuddy('Vậy còn tuần trước?',prior).task,'MEMBER_CONTEXT_QA');
});
