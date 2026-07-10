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

## 개인정보와 비밀키

- `.env.local`은 GitHub에 올리지 않습니다.
- 사용자 답변은 현재 브라우저의 localStorage에 저장됩니다.
- 결과 페이지는 서버/API 호출 없이 저장된 인터뷰 답변만으로 구성됩니다.
