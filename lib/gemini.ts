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

/**
 * 공식 문서 기준 텍스트 생성용 모델 (예: gemini-2.5-flash).
 * `gemini-1.5-flash-8b` 등 일부 이름은 v1beta에서 404가 나므로 넣지 않습니다.
 * @see https://ai.google.dev/gemini-api/docs/models/gemini
 */
function getGeminiModelCandidates(): string[] {
  const override = process.env.GEMINI_MODEL?.trim();
  const defaults = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ];
  if (override) {
    return [override, ...defaults.filter((m) => m !== override)];
  }
  return defaults;
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
    payloadStr = JSON.stringify(dbData);
  } catch {
    payloadStr = String(dbData);
  }
  if (payloadStr.length > 900_000) {
    payloadStr = `${payloadStr.slice(0, 900_000)}…(truncated)`;
  }

  const prompt = `
당신은 골프 동호회 데이터 분석 전문가입니다.
아래 [데이터]에는 Supabase(\`ypga_members\`, \`ypga_participants\`, \`ypga_tournaments\`)에서 가져온 표·집계, 자료실 페이지 마크다운, \`public/documents\` PDF에서 추출한 본문 발췌가 포함될 수 있습니다. 이를 근거로 사용자 [질문]에 답하세요. 최종 문장은 한국어로 작성합니다.

[작성 규칙]
- [데이터]에 없는 사실은 지어내지 마세요. 부족하면 부족하다고 말하세요.
- 숫자·경기장명·회원·조편·정관 관련 내용이 있으면 우선 인용하세요.
- 읽기 쉽게 줄바꿈, ### 제목, **강조**, • 목록을 사용하세요.

[질문]: ${userQuestion}

[데이터]: ${payloadStr}
`;

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastMessage = "";
  const candidates = getGeminiModelCandidates();

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
        lastMessage =
          inner instanceof Error ? inner.message : "응답 텍스트를 읽지 못했습니다.";
        continue;
      }

      const trimmed = text?.trim() ?? "";
      if (trimmed) {
        return { ok: true, text: trimmed };
      }
      lastMessage = "모델이 빈 텍스트를 반환했습니다.";
    } catch (e) {
      lastMessage =
        e instanceof Error ? e.message : "Gemini 요청 중 알 수 없는 오류입니다.";
      continue;
    }
  }

  console.error("Gemini 분석 실패(모든 모델 시도 후):", lastMessage);
  return {
    ok: false,
    message:
      `Gemini 응답을 생성하지 못했습니다. API 키·쿼터를 확인하거나, .env에 GEMINI_MODEL=gemini-2.5-flash 처럼 지원되는 모델 ID를 지정하세요. (${lastMessage})`,
  };
}
