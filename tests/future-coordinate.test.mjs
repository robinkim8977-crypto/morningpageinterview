import assert from 'node:assert/strict';
import test from 'node:test';
import {createPreviewAnalysis,isFutureCoordinateAnalysis} from '../lib/future-coordinate.ts';
const session={name:'테스트',futureYear:3,answers:[{questionId:1,answer:'나의 리듬을 지키는 사람입니다.'}]};
test('새 리포트는 소개, 하루 스케줄, 습관 5개와 30/60/365 미션을 제공한다',()=>{
 const report=createPreviewAnalysis(session);
 assert.equal(isFutureCoordinateAnalysis(report),true);
 assert.ok(report.introduction.description);
 assert.deepEqual(report.roadmap.map(p=>p.days),[30,60,365]);
 assert.equal(report.habits.length,5);
 assert.deepEqual(report.dailySchedule.map(s=>s.time),report.dailySchedule.map(s=>s.time).sort());
 for(const field of ['introduction','dailySchedule','habits']){const invalid=structuredClone(report);delete invalid[field];assert.equal(isFutureCoordinateAnalysis(invalid),false);}
 const invalid=structuredClone(report);invalid.habits.pop();assert.equal(isFutureCoordinateAnalysis(invalid),false);
});
test('이전 구매 리포트는 캐시 열람에만 호환되고 새 AI 응답으로는 허용되지 않는다',()=>{
 const report=createPreviewAnalysis(session);
 delete report.introduction;delete report.dailySchedule;delete report.habits;report.roadmap[1].days=90;
 assert.equal(isFutureCoordinateAnalysis(report),false);
 assert.equal(isFutureCoordinateAnalysis(report,true),true);
});
