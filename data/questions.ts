import { legacyQuestions } from "./legacy-questions";
export const QUESTIONNAIRE_VERSION = 3;
export type InterviewQuestion = {
    id: number;
    phase: string;
    theme: string;
    question: string;
    kind?: "choice" | "short" | "write";
    max?: number;
    options?: string[];
    hints?: string[];
    placeholder?: string;
};
export const questions: InterviewQuestion[] = [
    { id: 1, phase: "Chapter 1", theme: "기본 설정", kind: "choice", max: 3, options: ["차분한", "호기심 많은", "유쾌한", "다정한", "대담한", "꾸준한", "나만의 리듬이 있는", "유연한"], question: "미래의 나는 어떤 분위기의 사람인가요?\n\n지금의 성격과 달라도 괜찮아요. 닮고 싶은 모습부터 골라보세요." },
    { id: 2, phase: "Chapter 1", theme: "기본 설정", kind: "choice", max: 3, options: ["만들고 표현하기", "배우고 탐구하기", "사람과 연결되기", "몸을 움직이기", "자연과 지내기", "일상을 가꾸기", "새로운 곳 발견하기", "문제를 풀어보기"], question: "어떤 일을 하면 시간 가는 줄 모를까요?\n\n직업을 정할 필요는 없어요. 이 사람이 즐겁게 빠져드는 일을 골라보세요." },
    { id: 3, phase: "Chapter 1", theme: "기본 설정", kind: "choice", max: 2, options: ["내 시간의 자유", "안정감", "가까운 관계", "건강", "새로운 경험", "내 방식으로 일하기", "꾸준한 성장", "누군가에게 보탬이 되기"], question: "이 삶에서 꼭 지키고 싶은 것은?\n\n모두 좋아 보여도, 특히 놓치고 싶지 않은 것부터 골라보세요." },
    { id: 4, phase: "Chapter 2", theme: "생활 무대", kind: "choice", max: 1, options: ["빛이 드는 조용한 집", "내 취향이 담긴 작업실", "도시 속 아늑한 공간", "자연 가까이 있는 곳", "좋아하는 사람과 사는 집", "낯선 여행지의 숙소"], question: "이 사람의 하루는 어디에서 시작하나요?\n\n마음이 편해지는 곳을 하나 골라보세요. 꼭 집일 필요는 없어요." },
    { id: 5, phase: "Chapter 2", theme: "생활 무대", kind: "short", question: "그곳에서 눈을 떴어요. 가장 먼저 무엇을 하나요?\n\n커튼 열기, 커피 내리기, 산책하기. 작은 행동 하나면 충분해요.", placeholder: "예: 창문을 열고 커피를 내려요.", hints: ["주변에 무엇이 보이나요?", "일어나자마자 하고 싶은 일은 무엇인가요?"] },
    { id: 6, phase: "Chapter 3", theme: "하루 플레이", kind: "write", question: "평범한 하루인데, ‘이런 하루면 좋다’ 싶은 순간은?\n\n대단한 일이 없어도 좋아요. 아침, 낮, 저녁 중 한 장면만 골라주세요.", placeholder: "예: 오후에 내가 만든 것을 천천히 다듬어요. 서두르지 않아도 되는 게 좋아요.", hints: ["그때 무엇을 하고 있나요?", "그 순간의 어떤 점이 마음에 드나요?"] },
    { id: 7, phase: "Chapter 3", theme: "하루 플레이", kind: "write", question: "그 순간, 누군가 함께 있나요?\n\n혼자여도 좋아요. 누구와 어떻게 시간을 보내고 싶은지 들려주세요.", placeholder: "예: 혼자 집중한 뒤, 저녁에는 친구와 느긋하게 밥을 먹어요.", hints: ["혼자라면 어떤 기분이 드나요?", "함께라면 어떤 대화를 나누나요?"] },
    { id: 8, phase: "Chapter 4", theme: "변화의 이야기", kind: "write", question: "‘나, 꽤 달라졌네.’ 언제 처음 느꼈나요?\n\n미래의 내가 지나온 길을 돌아봅니다. 대단한 성취보다 작은 변화여도 좋아요.", placeholder: "예: 내 시간을 지키려고 처음으로 부탁을 거절했어요. 조금 떨렸지만 후련했어요.", hints: ["어디에서 어떤 일이 있었나요?", "예전의 나와 무엇이 달랐나요?", "그때 어떤 기분이 들었나요?"] },
    { id: 9, phase: "Chapter 4", theme: "변화의 이야기", kind: "write", question: "여기까지 오는 데 의외로 도움이 된 작은 행동은?\n\n미래의 내가 자주 해온 일을 떠올려보세요. 아주 사소한 습관도 좋아요.", placeholder: "예: 부탁받으면 바로 답하지 않고, 내가 정말 하고 싶은지 잠깐 생각했어요.", hints: ["무엇을 자주 반복했나요?", "그 행동이 일상에 어떤 차이를 만들었나요?"] },
    { id: 10, phase: "Chapter 4", theme: "변화의 이야기", kind: "write", question: "뜻대로 안 되는 날엔, 어떻게 내 페이스를 되찾나요?\n\n이 사람도 늘 잘 지내지는 않아요. 다시 편안해지는 방법을 들려주세요.", placeholder: "예: 잠깐 밖을 걸어요. 내일 다시 해볼 한 가지를 생각해요.", hints: ["혼자 쉬나요, 누군가와 이야기하나요?", "잠시 내려놓으면 편해지는 생각은 무엇인가요?", "원한다면 어려웠던 시기를 어떻게 지나왔는지 써도 좋아요."] },
    { id: 11, phase: "Chapter 5", theme: "현재로 보내기", kind: "write", question: "지금의 나에게, 먼저 해보라고 권하고 싶은 것은?\n\n미래의 내가 현재의 나에게 말해줍니다. 한 문장이든 짧은 편지든 좋아요.", placeholder: "예: 네 시간을 먼저 지켜도 괜찮아. 이번 주엔 하고 싶은 일 하나를 위한 시간을 남겨둬.", hints: ["미래의 내가 가장 고마워하는 작은 선택은?", "오늘의 나에게 어떤 말을 건네고 싶나요?"] }
];
export function questionsForVersion(version?: number): readonly InterviewQuestion[] {
    return version === 3 ? questions : legacyQuestions;
}
export const UNKNOWN_ANSWER = "아직 모르겠어요";
export function hasMeaningfulAnswer(value: string) { return Boolean(value.trim()) && value.trim() !== UNKNOWN_ANSWER; }
