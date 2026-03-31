import Image from "next/image";

type EmblemLockupProps = {
  variant?: "default" | "compact";
  /** true면 스크린리더가 이미지를 건너뜀(푸터 등 본문에 학교명이 있을 때) */
  decorative?: boolean;
  className?: string;
};

/** 보성 엠블럼과 시각적 무게를 맞추기 위해 연세 엠블럼만 더 크게 둠 */
const SIZES = {
  default: { yonsei: 46, boseong: 36 },
  compact: { yonsei: 32, boseong: 26 },
} as const;

const WRAP_PAD = {
  default: "px-2 py-1.5",
  compact: "px-1.5 py-1",
} as const;

export function EmblemLockup({
  variant = "default",
  decorative = false,
  className = "",
}: EmblemLockupProps) {
  const { yonsei: sy, boseong: sb } = SIZES[variant];
  const altY = decorative ? "" : "연세대학교";
  const altB = decorative ? "" : "보성고등학교";
  const dividerH = Math.max(sy, sb);
  const pad = WRAP_PAD[variant];

  return (
    <div
      className={`flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-zinc-200/55 bg-white dark:border-zinc-600/40 dark:bg-white ${pad} ${className}`}
    >
      <div
        className="relative flex shrink-0 items-center justify-center"
        style={{ width: sy, height: sy }}
      >
        <Image
          src="/emblems/yonsei.png"
          alt={altY}
          width={sy}
          height={sy}
          className="max-h-full max-w-full object-contain"
          priority={variant === "default" && !decorative}
        />
      </div>
      <div
        className="w-px shrink-0 self-stretch bg-zinc-300/70"
        style={{ minHeight: dividerH }}
        aria-hidden
      />
      <div
        className="relative flex shrink-0 items-center justify-center"
        style={{ width: sb, height: sb }}
      >
        <Image
          src="/emblems/boseong.png"
          alt={altB}
          width={sb}
          height={sb}
          className="max-h-full max-w-full object-contain"
          priority={variant === "default" && !decorative}
        />
      </div>
    </div>
  );
}
