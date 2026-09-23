import test from 'node:test';
import assert from 'node:assert/strict';
import { routeBuddy } from '../../shared/buddyPolicy';

// Regression: adding a question word must not turn a report of a current
// warning sign into a harmless request for a dictionary definition.
for (const message of [
  'Tôi đau ngực, vì sao vậy?',
  'Vì sao tôi khó thở dữ dội?',
  'Con tôi đau ngực, tại sao vậy?',
  'Tôi đau lưng và mất kiểm soát tiểu tiện, vì sao?',
]) {
  test(`current symptom question remains urgent: ${message}`, () => {
    const decision = routeBuddy(message);
    assert.equal(decision.task, 'URGENT_SAFETY');
    assert.equal(decision.generationAllowed, false);
    assert.equal(decision.memory.healthConcern, true);
    assert.equal(routeBuddy('Hôm nay tôi nên tập gì?', decision.memory).task, 'PROFESSIONAL_REVIEW');
  });
}

for (const message of [
  'Đau ngực là gì?',
  'Tôi muốn hiểu đau ngực là gì?',
  'Giả sử một người đau ngực, vì sao có triệu chứng đó?',
  'Tôi không bị đau ngực, tại sao cần khởi động?',
  'Trước đây tôi đau ngực, vì sao vậy?',
  'Từ "tôi đau ngực" nghĩa là gì?',
]) {
  test(`no invented present emergency: ${message}`, () => {
    assert.notEqual(routeBuddy(message).task, 'URGENT_SAFETY');
  });
}
