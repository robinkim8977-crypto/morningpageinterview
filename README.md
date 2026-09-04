# The Morning Page Interview

미래의 자신이 되어 11개의 질문에 답하고, 답변을 바탕으로 `미래 기억 매거진`을 확인하는 Next.js 웹앱입니다.

## 실행

```bash
pnpm install
pnpm dev
```

## 배포

Vercel에 GitHub 저장소를 연결해 배포하는 방식을 권장합니다.

현재 출시 버전은 OpenAI API를 호출하지 않으며, 별도의 API 키 없이 랜딩, 인터뷰, 결과 페이지를 확인할 수 있습니다.

## 자동 테스트

```bash
pnpm test
```

결제·AI 통합 테스트는 PortOne, Upstash Redis, OpenAI를 모두 로컬 가짜 응답으로 대체하므로 실제 결제나 API 비용이 발생하지 않습니다. 통합 테스트만 실행하려면 `pnpm test:integration`을 사용합니다. 자세한 범위는 [`docs/payment-flow-testing.md`](./docs/payment-flow-testing.md)를 참고하세요.

AI 리포트 품질 평가는 `pnpm eval:ai`로 비용 없이 준비 상태를 확인하고, 실제 API 평가는 명시적으로 `pnpm eval:ai:live -- --case=creative-rhythm`처럼 사례를 지정해 실행합니다. 평가 기준과 수동 검토표는 [`docs/ai-quality-evaluation.md`](./docs/ai-quality-evaluation.md)에 있습니다.

## 개인정보와 비밀키

- `.env.local`은 GitHub에 올리지 않습니다.
- 사용자 답변은 현재 브라우저의 localStorage에 저장됩니다.
- 결과 페이지는 서버/API 호출 없이 저장된 인터뷰 답변만으로 구성됩니다.
