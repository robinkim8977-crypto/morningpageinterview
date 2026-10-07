# The Morning Page Interview

성격·관심·가치·공간을 고르고, 미래의 하루와 변화를 상상하는 5개 챕터·11개 질문의 Next.js 웹앱입니다. 선택과 답변을 정리한 `미래 기억 매거진`은 무료이며, AI 해석·로드맵·첫 행동을 제안하는 `미래좌표`는 2,900원 선택 구매입니다.

## 실행

```bash
pnpm install
pnpm dev
```

## 배포

Vercel에 GitHub 저장소를 연결해 배포하는 방식을 권장합니다.

무료 인터뷰와 미래 기억 매거진은 OpenAI API를 호출하지 않습니다. 유료 미래좌표는 결제 확인·인터뷰 완료 후 AI를 호출하며 서버의 결제·원장·AI 설정이 필요합니다.

## 자동 테스트

```bash
pnpm test
```

결제·AI 통합 테스트는 PortOne, Upstash Redis, OpenAI를 모두 로컬 가짜 응답으로 대체하므로 실제 결제나 API 비용이 발생하지 않습니다. 통합 테스트만 실행하려면 `pnpm test:integration`을 사용합니다. 자세한 범위는 [`docs/payment-flow-testing.md`](./docs/payment-flow-testing.md)를 참고하세요.

카카오페이·네이버페이는 채널 키가 설정된 수단만 구매 화면에 표시됩니다. KCP 심사 완료 후 PortOne과 Vercel에 등록하는 순서는 [`docs/easy-payment-setup.md`](./docs/easy-payment-setup.md)를 참고하세요.

GA4는 검색어와 결제번호를 제외한 페이지 경로, 인터뷰 시작·완료, 상품 조회·결제 시작·구매, 리포트 생성·PDF 저장 이벤트를 기록합니다. GA4 관리자 설정 순서는 [`docs/ga4-funnel-setup.md`](./docs/ga4-funnel-setup.md)를 참고하세요.

AI 리포트 품질 평가는 `pnpm eval:ai`로 비용 없이 준비 상태를 확인하고, 실제 API 평가는 명시적으로 `pnpm eval:ai:live -- --case=creative-rhythm`처럼 사례를 지정해 실행합니다. 평가 기준과 수동 검토표는 [`docs/ai-quality-evaluation.md`](./docs/ai-quality-evaluation.md)에 있습니다.

## 개인정보와 비밀키

- `.env.local`은 GitHub에 올리지 않습니다.
- 사용자 답변은 현재 브라우저의 localStorage에 저장됩니다.
- 무료 결과는 서버/API 호출 없이 저장된 인터뷰 답변만으로 구성됩니다. 유료 분석 시에는 답변이 서버와 AI 서비스로 전송됩니다.
- 새 질문지는 버전 3이며 기존 버전 2의 기록은 이전 질문과 결과 형식으로 이어 쓰고 열람할 수 있습니다.
