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

test('legacy answers and reports survive the new questionnaire and retain their original question version',()=>{
 const previous=global.window;const local=memoryStorage();global.window={localStorage:local,sessionStorage:memoryStorage()};
 try{const legacy={schemaVersion:2,questionnaireVersion:2,name:'기존 이용자',futureYear:5,answers:[{questionId:5,answer:'매일 산책했어요.'}],completedAt:'2026-10-01T00:00:00.000Z'};local.setItem('morning-page-interview-session',JSON.stringify(legacy));local.setItem('morning-page-future-coordinate-analysis','existing report');assert.deepEqual(readInterviewSession(),legacy);assert.equal(local.getItem('morning-page-future-coordinate-analysis'),'existing report');}finally{global.window=previous;}
});

test('new interviews use the new questionnaire version and a saved legacy edit does not become a new question',async()=>{
 const {saveInterviewSession}=await import('../lib/storage.ts');const previous=global.window;global.window={localStorage:memoryStorage(),sessionStorage:memoryStorage()};
 try{startNewInterviewSession({name:'새 이용자',futureYear:3,answers:[]});assert.equal(readInterviewSession().questionnaireVersion,3);saveInterviewSession({schemaVersion:2,questionnaireVersion:2,name:'기존',futureYear:3,answers:[{questionId:1,answer:'예전 자기소개'}]});assert.equal(readInterviewSession().questionnaireVersion,2);}finally{global.window=previous;}
});

test('custom choice text keeps spaces and delimiters across save and restore',async()=>{
 const {encodeChoice,decodeChoice}=await import('../lib/interview-choices.ts');const {questions}=await import('../data/questions.ts');const custom='내 시간을 · 지키는 사람 ';const answer=encodeChoice(['차분한'],custom);assert.deepEqual(decodeChoice(answer,questions[0]),{selected:['차분한'],custom,unknown:false});
});

test('unknown-only completed interviews do not qualify for paid generation',async()=>{
 const {isInterviewReadyForAnalysis}=await import('../lib/payment.ts');assert.equal(isInterviewReadyForAnalysis({name:'나',futureYear:5,completedAt:'now',answers:[{questionId:1,answer:'아직 모르겠어요'}]}),false);
});

test('starting again clears a completed interview payment but keeps a payment made before an unfinished interview',async()=>{
 const {saveInterviewSession}=await import('../lib/storage.ts');const {FUTURE_COORDINATE_PAYMENT_KEY}=await import('../lib/payment.ts');const previous=global.window;global.window={localStorage:memoryStorage(),sessionStorage:memoryStorage()};
 try{saveInterviewSession({name:'이전',futureYear:5,questionnaireVersion:2,answers:[{questionId:1,answer:'이전 답변'}],completedAt:'2026-10-01'});global.window.localStorage.setItem(FUTURE_COORDINATE_PAYMENT_KEY,'old payment');startNewInterviewSession({name:'새 미래',futureYear:5,answers:[]});assert.equal(global.window.localStorage.getItem(FUTURE_COORDINATE_PAYMENT_KEY),null);global.window.localStorage.setItem(FUTURE_COORDINATE_PAYMENT_KEY,'prepaid');startNewInterviewSession({name:'새 미래',futureYear:5,answers:[]});assert.equal(global.window.localStorage.getItem(FUTURE_COORDINATE_PAYMENT_KEY),'prepaid');}finally{global.window=previous;}
});
