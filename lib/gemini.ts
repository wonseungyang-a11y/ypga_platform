import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";

/** 서버 전용 — 클라이언트에 노출하지 말 것 (NEXT_PUBLIC_* 사용 금지) */
export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

function getGeminiApiKey(): string {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    ""
  );
}

/** v1beta generateContent 에서 404가 나는 구형 모델 — 폴백 목록에 넣지 않음 */
const DEPRECATED_GEMINI_MODELS = new Set([
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro",
  "gemini-1.5-pro-latest",
  "gemini-pro",
]);

/**
 * 공식 문서 기준 텍스트 생성용 모델.
 * @see https://ai.google.dev/gemini-api/docs/models/gemini
 */
function getGeminiModelCandidates(): string[] {
  const override = process.env.GEMINI_MODEL?.trim();
  const defaults = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
  ];
  const list = override
    ? [override, ...defaults.filter((m) => m !== override)]
    : defaults;
  return list.filter((m) => !DEPRECATED_GEMINI_MODELS.has(m));
}

function isModelUnavailableError(message: string): boolean {
  const s = message.toLowerCase();
  return (
    s.includes("404") ||
    s.includes("not found") ||
    s.includes("is not supported for generatecontent")
  );
}

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

export type GeminiAnalysisResult =
  | { ok: true; text: string }
  | { ok: false; message: string };

/**
 * Supabase로 조회한 요약(컨텍스트)을 바탕으로 Gemini가 자연어 답변을 생성합니다.
 */
export async function analyzeWithGemini(
  userQuestion: string,
  dbData: unknown,
): Promise<GeminiAnalysisResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return { ok: false, message: "GEMINI_API_KEY 가 설정되어 있지 않습니다." };
  }

  let payloadStr: string;
  try {
    payloadStr = JSON.stringify(dbData, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    );
  } catch {
    payloadStr = String(dbData);
  }
  if (payloadStr.length > 900_000) {
    payloadStr = `${payloadStr.slice(0, 900_000)}…(truncated)`;
  }

  const prompt = `
당신은 골프 동호회 데이터 분석 전문가입니다.
아래 [데이터]에는 Supabase 또는 CSV의 **회원·조편성·대회** 데이터가 포함됩니다. 특히 **회원+조편 통합 분석**은 \`membersParticipantsIntegrated\`(회원별 \`participant_rows\`, \`venues_played\` 등)를 **가장 먼저** 참고하세요. \`ypga_members\`, \`ypga_participants\` 원본 표도 함께 있습니다. 자료실 마크다운·PDF 발췌가 있을 수 있습니다. 최종 문장은 한국어로 작성합니다.

[작성 규칙]
- [데이터]에 없는 사실은 지어내지 마세요. \`datasetSummary\`에 회원·조편 행 수가 0보다 크면 데이터가 있는 것이므로 "자료 없음"이라고 하지 마세요.
- 회원·조편·거주지·닉네임·경기장 질문은 \`membersParticipantsIntegrated.membersWithParticipation\`을 우선 활용하세요.
- 특정 인물 질문은 \`memberProfileForName\`, \`participantRowsForName\`을 확인하세요.
- 숫자·경기장명·정관 관련 내용이 있으면 인용하세요.
- 읽기 쉽게 줄바꿈, ### 제목, **강조**, • 목록을 사용하세요.

[질문]: ${userQuestion}

[데이터]: ${payloadStr}
`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const candidates = getGeminiModelCandidates();
  if (candidates.length === 0) {
    return {
      ok: false,
      message:
        "GEMINI_MODEL 이 구형(1.5) 모델로 설정되어 있습니다. Vercel·.env.local 에 GEMINI_MODEL=gemini-2.5-flash 로 바꾸세요.",
    };
  }

  const attemptErrors: string[] = [];

  for (const modelName of candidates) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        safetySettings,
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.4,
        },
      });
      const result = await model.generateContent(prompt);
      const response = result.response;

      let text: string;
      try {
        text = response.text();
      } catch (inner) {
        const msg =
          inner instanceof Error ? inner.message : "응답 텍스트를 읽지 못했습니다.";
        attemptErrors.push(`${modelName}: ${msg}`);
        continue;
      }

      const trimmed = text?.trim() ?? "";
      if (trimmed) {
        return { ok: true, text: trimmed };
      }
      attemptErrors.push(`${modelName}: 빈 텍스트 응답`);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Gemini 요청 중 알 수 없는 오류입니다.";
      attemptErrors.push(`${modelName}: ${msg}`);
      if (isModelUnavailableError(msg)) {
        continue;
      }
    }
  }

  const summary = attemptErrors.slice(-3).join(" | ");
  console.error("Gemini 분석 실패(모든 모델 시도 후):", attemptErrors);
  return {
    ok: false,
    message:
      `Gemini 응답을 생성하지 못했습니다. API 키·쿼터를 확인하고, Vercel 환경 변수에 GEMINI_MODEL=gemini-2.5-flash 를 설정한 뒤 재배포하세요. (시도: ${candidates.join(", ")}. 최근 오류: ${summary})`,
  };
}
