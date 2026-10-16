const logoIcon = '/assets/koreanre-ai-icon.png';
import { KeywordHighlightText } from './KeywordHighlightText';
import type { ReactNode } from 'react';

/**
 * 각 탭 상단의 "AI 요약정보" 박스.
 * 껍데기(그라데이션 박스 + 아이콘 + 타이틀)는 공통이고, 표시할 내용(value)만 탭마다 다르다.
 * value는 탭별로 소스가 다르므로(U/W 추론내용, 약관 요약, 요율 요약 등) 호출부에서 주입한다.
 *
 * - 타이틀은 한 줄로 고정(flex-none), 내용은 자연스럽게 줄바꿈된다.
 * - 백엔드가 개행을 리터럴 "\n"으로 내려주므로 실제 개행 문자로 변환해 whitespace-pre-line으로 렌더한다.
 * - children은 박스 안 우측 부가 요소를 위한 슬롯이다.
 */
export function AiSummaryBox({ value, children }: { value?: string | null; children?: ReactNode }) {
  return (
    <div className="gradient-outline items-center mb-4">
      <div className="flex items-center gap-2 flex-none">
        <span className="size-9 flex items-center justify-center bg-box rounded-full">
          <img src={logoIcon} alt="AI" className="size-5" />
        </span>
        <strong className="text-font-b">AI 요약정보</strong>
      </div>
      <p className="flex-1 min-w-0 max-h-[250px] overflow-y-auto text-sm text-font-b">
        <KeywordHighlightText text={value} />
      </p>
      {children}
    </div>
  );
}
