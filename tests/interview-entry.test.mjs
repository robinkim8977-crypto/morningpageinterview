import test from 'node:test';
import assert from 'node:assert/strict';
import { readInterviewSession, startNewInterviewSession } from '../lib/storage.ts';
function memoryStorage(){const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};}
test('landing first answer survives session creation and can continue into the real questionnaire',()=>{
 const previous=global.window;global.window={localStorage:memoryStorage(),sessionStorage:memoryStorage()};
 try {
  global.window.localStorage.setItem('generatedReport','old');
  assert.equal(startNewInterviewSession({name:'Robin',futureYear:5,answers:[{questionId:1,answer:'I run a small salon.'},{questionId:99,answer:'invalid'}]}),true);
  assert.deepEqual(readInterviewSession().answers,[{questionId:1,answer:'I run a small salon.'}]);
  assert.equal(readInterviewSession().futureYear,5);
  assert.equal(global.window.localStorage.getItem('generatedReport'),null);
 } finally {global.window=previous;}
});
test('a failed new-session save keeps the previous report intact',()=>{
 const previous=global.window;const local=memoryStorage();local.setItem('generatedReport','keep me');local.setItem=()=>{throw new Error('quota')};global.window={localStorage:local,sessionStorage:memoryStorage()};
 try{assert.equal(startNewInterviewSession({name:'Robin',futureYear:5,answers:[]}),false);assert.equal(local.getItem('generatedReport'),'keep me');}finally{global.window=previous;}
});


test('payment waits for interview completion instead of treating the first answer as a finished interview', async () => {
 const { isInterviewReadyForAnalysis } = await import('../lib/payment.ts');
 const partial = { name: 'Robin', futureYear: 5, answers: [{ questionId: 1, answer: 'My future.' }] };
 assert.equal(isInterviewReadyForAnalysis(partial), false);
 assert.equal(isInterviewReadyForAnalysis({ ...partial, completedAt: new Date().toISOString() }), true);
 assert.equal(isInterviewReadyForAnalysis({ ...partial, answers: [], completedAt: new Date().toISOString() }), false);
});
