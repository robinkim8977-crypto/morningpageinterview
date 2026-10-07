import type { InterviewSession } from "@/lib/types";
import s from "./FutureSelf.module.css";
export function FutureSelfCard({ session, sample = false }: {
    session?: InterviewSession;
    sample?: boolean;
}) {
    const answer = (id: number) => session?.answers.find(a => a.questionId === id)?.answer || "아직 고르지 않았어요";
    return <aside className={s.profile}>
    <p className={s.eyebrow}>MY NEXT CHAPTER</p>
    <div className={s.portrait} aria-hidden="true">
    <div className={s.halo}/>
    <div className={s.body}/>
    <div className={s.head}>
    <span className={s.eye}/>
    <span className={s.smile}/>
    </div>
    <div className={s.hair}/>
    <span className={s.spark}>✦</span>
    </div>
    <h3>{sample ? "5년 후의 소윤" : `${session?.futureYear || 5}년 후의 ${session?.name || "나"}`}</h3>
    <p className={s.sub}>{sample ? "나만의 리듬으로 살아가는 사람" : "조금씩 선명해지는 미래의 나"}</p>
    <div className={s.traits}>
    <span className={s.pill}>{sample ? "차분한 · 호기심 많은" : answer(1)}</span>
    </div>{[["좋아하는 일", 2, "만들고 표현하기"], ["지키고 싶은 것", 3, "내 시간의 자유"], ["하루를 시작하는 곳", 4, "빛이 드는 조용한 집"]].map(([title, id, value]) => <div className={s.info} key={title}>
        <b>{title}</b>{sample ? value : answer(Number(id))}</div>)}<p className={s.fine}>이 미래는 언제든 다시 그릴 수 있어요.</p>
    </aside>;
}
