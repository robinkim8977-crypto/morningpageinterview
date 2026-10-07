import { UNKNOWN_ANSWER, type InterviewQuestion } from "@/data/questions";
export function decodeChoice(answer: string, question: InterviewQuestion) {
    if (answer === UNKNOWN_ANSWER)
        return { selected: [] as string[], custom: "", unknown: true };
    const marker = "직접 입력: ";
    const markerIndex = answer.indexOf(marker);
    const base = markerIndex >= 0 ? answer.slice(0, markerIndex).replace(/ · $/, "") : answer;
    const parts = base.split(" · ").filter(Boolean);
    const selected = parts.filter(p => question.options?.includes(p));
    const custom = markerIndex >= 0 ? answer.slice(markerIndex + marker.length) : parts.filter(p => !question.options?.includes(p)).join(" · ");
    return { selected, custom, unknown: false };
}
export function encodeChoice(selected: string[], custom: string) {
    return [...selected, ...(custom.trim() ? [`직접 입력: ${custom}`] : [])].join(" · ");
}
