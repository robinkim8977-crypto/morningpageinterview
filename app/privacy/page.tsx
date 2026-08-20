import type { Metadata } from "next";
import { LegalDocument, LegalList, type LegalSection } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "모닝페이지 인터뷰 개인정보처리방침"
};

const sections: LegalSection[] = [
  {
    title: "처리하는 개인정보 항목",
    content: (
      <>
        <p>회사는 회원가입 없이 모닝페이지 인터뷰 서비스를 제공합니다.</p>
        <p className="font-semibold text-black/82">서비스 이용 시</p>
        <LegalList>
          <li>이용자가 직접 입력한 이름, 미래 시점 및 인터뷰 답변</li>
          <li>AI 리포트 생성 결과와 이용 기록</li>
          <li>접속 일시, 방문 페이지, 브라우저·기기 정보 등 서비스 이용 과정에서 생성되는 기술적 기록</li>
        </LegalList>
        <p>인터뷰 답변과 생성된 리포트, 72시간 첫 행동은 이용자의 브라우저 로컬 저장소에 저장되며 회사의 별도 데이터베이스에는 저장되지 않습니다. 회사는 리포트 재열람을 위한 이메일 주소를 수집하지 않습니다.</p>
        <p className="font-semibold text-black/82">유료서비스 이용 시</p>
        <LegalList>
          <li>주문번호, 상품명, 결제금액, 결제상태 및 결제일시</li>
          <li>결제수단 구분과 결제대행사가 제공하는 거래 식별정보</li>
        </LegalList>
        <p>신용카드 번호 등 결제수단의 상세 정보는 결제대행사가 직접 처리하며 회사가 직접 저장하지 않는 것을 원칙으로 합니다.</p>
      </>
    )
  },
  {
    title: "개인정보의 처리 목적",
    content: (
      <LegalList>
        <li>모닝페이지 인터뷰 서비스 제공과 답변의 브라우저 내 저장</li>
        <li>AI 기반 미래좌표 리포트 생성 및 제공</li>
        <li>주문 및 결제 상태 확인, 중복결제·결제 오류 확인</li>
        <li>환불, 고객문의 및 서비스 장애 대응</li>
        <li>부정 이용 방지와 서비스 안정성·품질 개선</li>
      </LegalList>
    )
  },
  {
    title: "인터뷰 답변 및 AI 분석",
    content: (
      <>
        <p>이용자가 작성한 인터뷰 답변은 미래좌표 리포트 등 AI 기반 콘텐츠를 생성하기 위해 처리됩니다. 리포트 생성 과정에서 이름, 미래 시점, 질문과 답변의 전부 또는 일부가 회사가 이용하는 AI 서비스 제공업체의 시스템을 통해 처리될 수 있습니다.</p>
        <p>현재 회사는 OpenAI API 요청 시 응답 저장을 최소화하기 위한 설정을 사용합니다. 다만 서비스 제공업체의 보안·부정사용 방지 정책과 관계 법령에 따라 제한적인 기술 기록이 일정 기간 처리될 수 있습니다.</p>
        <p>AI 분석 결과는 자기성찰과 목표 탐색을 돕는 참고 콘텐츠이며 의료·심리·법률·재무·투자 등 전문적인 진단이나 자문을 목적으로 하지 않습니다.</p>
      </>
    )
  },
  {
    title: "보유 및 이용기간",
    content: (
      <>
        <p>브라우저 로컬 저장소에 저장된 인터뷰 답변과 리포트는 이용자가 인터뷰를 초기화하거나 브라우저의 사이트 데이터를 삭제할 때까지 남을 수 있습니다. 동일한 기기와 브라우저에서만 다시 확인할 수 있습니다.</p>
        <p>결제대행사와 회사가 유료서비스 거래 과정에서 처리하는 거래기록은 전자상거래 관련 법령에 따라 다음 기간 동안 보관될 수 있습니다.</p>
        <LegalList>
          <li>표시·광고에 관한 기록: 6개월</li>
          <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
          <li>대금결제 및 서비스 공급에 관한 기록: 5년</li>
          <li>소비자 불만 또는 분쟁처리에 관한 기록: 3년</li>
        </LegalList>
      </>
    )
  },
  {
    title: "제3자 제공",
    content: <p>회사는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다. 이용자의 사전 동의가 있거나 법령에 특별한 규정이 있는 경우, 관계기관의 적법한 요청이 있는 경우에는 예외로 합니다.</p>
  },
  {
    title: "개인정보 처리업무의 위탁",
    content: (
      <>
        <p>회사는 서비스 제공을 위해 다음 업체에 개인정보 처리업무의 일부를 위탁합니다.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left text-sm">
            <thead><tr className="border-y border-black/25"><th className="py-3 pr-4">업체</th><th className="py-3 pr-4">업무</th><th className="py-3">현재 상태</th></tr></thead>
            <tbody>
              <tr className="border-b border-black/15"><td className="py-3 pr-4">Vercel</td><td className="py-3 pr-4">웹사이트 호스팅 및 서비스 운영</td><td className="py-3">사용 중</td></tr>
              <tr className="border-b border-black/15"><td className="py-3 pr-4">OpenAI</td><td className="py-3 pr-4">인터뷰 답변 분석 및 AI 리포트 생성</td><td className="py-3">사용 중</td></tr>
              <tr className="border-b border-black/15"><td className="py-3 pr-4">Google</td><td className="py-3 pr-4">Google Analytics 4를 통한 이용 통계 분석</td><td className="py-3">사용 중</td></tr>
              <tr><td className="py-3 pr-4">PortOne 및 NHN KCP</td><td className="py-3 pr-4">결제 승인·조회·취소·환불</td><td className="py-3">연동 완료</td></tr>
            </tbody>
          </table>
        </div>
      </>
    )
  },
  {
    title: "개인정보의 국외 이전",
    content: (
      <>
        <p>AI 분석, 웹사이트 호스팅 및 이용 통계 제공 과정에서 개인정보의 국외 이전이 발생할 수 있습니다.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead><tr className="border-y border-black/25"><th className="py-3 pr-4">이전받는 자</th><th className="py-3 pr-4">이전 항목·목적</th><th className="py-3 pr-4">이전 국가·방법</th><th className="py-3">보유기간</th></tr></thead>
            <tbody>
              <tr className="border-b border-black/15"><td className="py-3 pr-4">OpenAI OpCo, LLC</td><td className="py-3 pr-4">이름, 미래 시점, 인터뷰 답변의 AI 분석</td><td className="py-3 pr-4">미국 등 처리시설 소재국으로 네트워크 전송</td><td className="py-3">서비스 제공업체 정책 및 계약에서 정한 기간</td></tr>
              <tr className="border-b border-black/15"><td className="py-3 pr-4">Vercel Inc.</td><td className="py-3 pr-4">접속 기록과 서비스 운영에 필요한 기술정보</td><td className="py-3 pr-4">미국 등 처리시설 소재국으로 네트워크 전송</td><td className="py-3">서비스 제공업체 정책 및 계약에서 정한 기간</td></tr>
              <tr><td className="py-3 pr-4">Google LLC</td><td className="py-3 pr-4">쿠키, 기기·브라우저 정보와 이용 기록의 통계 분석</td><td className="py-3 pr-4">미국 등 Google 처리시설 소재국으로 네트워크 전송</td><td className="py-3">Google Analytics 설정 및 정책에서 정한 기간</td></tr>
            </tbody>
          </table>
        </div>
        <p>이용자는 서비스 이용을 중단함으로써 국외 이전을 거부할 수 있습니다. 다만 AI 분석에 필요한 이전을 거부하면 미래좌표 리포트 생성이 제한될 수 있습니다.</p>
      </>
    )
  },
  {
    title: "개인정보의 파기",
    content: <p>회사는 개인정보의 보유기간이 경과하거나 처리 목적이 달성된 경우 관련 법령에 따라 지체 없이 파기합니다. 전자적 파일은 복구 또는 재생이 어렵도록 삭제합니다.</p>
  },
  {
    title: "이용자의 권리 및 행사방법",
    content: (
      <>
        <LegalList>
          <li>개인정보 열람·정정·삭제·처리정지 요청</li>
          <li>브라우저에 저장된 정보의 삭제 방법 안내 요청</li>
          <li>유료서비스 이용 과정에서 회사가 보유하게 되는 주문정보의 삭제 요청</li>
        </LegalList>
        <p>요청은 <a className="font-semibold underline underline-offset-4" href="mailto:morningpageinterview@gmail.com">morningpageinterview@gmail.com</a>으로 접수할 수 있습니다.</p>
      </>
    )
  },
  {
    title: "개인정보의 안전성 확보조치",
    content: <p>회사는 개인정보의 분실, 도난, 유출, 변조 또는 훼손을 방지하기 위해 서비스 규모와 개인정보 처리 특성에 적합한 기술적·관리적 보호조치를 시행합니다.</p>
  },
  {
    title: "개인정보 보호책임자 및 문의",
    content: (
      <div className="space-y-1">
        <p><strong>상호</strong> 로웬스테이션</p><p><strong>대표자</strong> 김소윤</p><p><strong>사업자등록번호</strong> 254-08-03629</p><p><strong>통신판매업 신고번호</strong> 2026-강원춘천-0587</p><p><strong>사업장 주소</strong> 강원도 춘천시 서부대성로 327</p><p><strong>전화번호</strong> <a className="underline underline-offset-4" href="tel:07080274816">070-8027-4816</a></p><p><strong>이메일</strong> <a className="underline underline-offset-4" href="mailto:morningpageinterview@gmail.com">morningpageinterview@gmail.com</a></p>
      </div>
    )
  },
  {
    title: "개인정보처리방침의 변경",
    content: <p>회사는 법령, 서비스 내용 또는 개인정보 처리 방식의 변경에 따라 본 방침을 수정할 수 있으며 중요한 변경사항은 서비스 내 공지를 통해 안내합니다.</p>
  }
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      eyebrow="PRIVACY POLICY"
      title="개인정보처리방침"
      effectiveDate="2026년 8월 15일"
      description={<><p>로웬스테이션은 이용자의 개인정보를 중요하게 생각하며 관련 법령을 준수합니다.</p><p>본 방침은 모닝페이지 인터뷰 서비스에서 어떤 정보를 처리하고 어떤 목적으로 이용하는지 안내합니다.</p></>}
      sections={sections}
    />
  );
}
