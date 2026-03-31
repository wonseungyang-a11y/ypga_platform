"use client";

import type { InputHTMLAttributes } from "react";

export type SiteSearchInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "defaultValue" | "onInput"
> & {
  onQueryChange: (q: string) => void;
};

/**
 * 목록 필터용 검색란. `value`로 제어하지 않고 `onInput`만 사용해
 * 한글 IME 조합 중에도 React가 DOM을 덮어쓰지 않도록 합니다.
 */
export function SiteSearchInput({
  onQueryChange,
  type = "text",
  ...rest
}: SiteSearchInputProps) {
  return (
    <input
      {...rest}
      type={type}
      defaultValue=""
      onInput={(e) => onQueryChange(e.currentTarget.value)}
    />
  );
}
