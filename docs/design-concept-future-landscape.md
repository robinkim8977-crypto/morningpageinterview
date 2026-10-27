# 디자인 컨셉: 미래로 향하는 조용한 포털

첨부 레퍼런스의 자연 풍경, 금속성 오브제, 부분 블러와 시각적 여백을 반영했다. 샌드스톤·세이지·모브 계열의 풍경 위에 실제 CSS backdrop-filter 패널을 배치하고, 텍스트는 HTML로 유지했다. 메인·미래좌표 상품·결과 화면과 인터뷰 공통 스타일에 적용했다.

## 결과 구조

1. 미래의 나 소개
2. 미래의 나의 하루 스케줄표 (4~8개, 상상한 시간임을 안내)
3. 핵심 습관 5개 (행동, 실행 계기, 이유)
4. 30/60/365일 미션과 관찰 가능한 미래지표
5. 24시간 안의 미션과 행동 약속 (실행 일시, 소요시간, 브라우저 저장)

새 AI 응답의 필수 형식과 프롬프트, 미리보기 데이터, 이미지 내보내기를 함께 변경했다. 과거 구매 리포트는 재생성 없이 열람되며 과거 버전에 없는 항목은 안내한다. 개발 미리보기는 실제 리포트·결제·약속 저장소를 덮어쓰지 않는다.

## 이미지 제작 기록

- 방식: 기본 내장 image_gen 도구
- 프로젝트 자산: `public/images/redesign/future-landscape.png`
- 최종 프롬프트:

> Use case: stylized-concept. Create a premium wide landscape website background, 1536x1024 or wider, no text or UI. A serene exotic futuristic landscape: sculptural sandstone cliffs and pale sand terraces beside a still reflective pool, a monumental thin brushed chrome oval portal standing on the right side, sparse sculptural grasses and one small muted pink luminous sphere. Dusty mauve dawn sky, sage gray water, warm champagne stone. Editorial architectural photography meets refined surreal 3D art, realistic tactile materials, understated, quiet, sophisticated. Open softer landscape and sky on left half for overlay text. Reference mood: luxury glass objects in natural landscape, visual pause, soft haze. No people, no lettering, no logos.
