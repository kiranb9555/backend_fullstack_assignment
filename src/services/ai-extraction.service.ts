import { extractedDataSchema, ExtractedData } from "../modules/intelligence/intelligence.schemas.js";
import { env } from "../config/env.js";

const EXTRACTION_PROMPT = `You are an information extraction system.
Extract structured data from the voicemail transcript.

Return ONLY valid JSON (no markdown, no explanation) with this exact schema:
{
  "name": string | null,
  "intent": string | null,
  "sentiment": "positive" | "neutral" | "negative",
  "callbackRequested": boolean
}

Rules:
- intent must be maximum 20 words.
- If unknown, use null for name/intent.
- callbackRequested=true only if the caller asks to be called/contacted back.`;

const OPENAI_URL =
  "https://api.openai.com/v1/chat/completions";

const getGeminiUrl = (apiKey: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

const extractFirstJsonObject = (
  text: string
) => {
  const fencedMatch = text.match(
    /```(?:json)?\s*([\s\S]*?)\s*```/i
  );

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    lastBrace > firstBrace
  ) {
    return text
      .slice(firstBrace, lastBrace + 1)
      .trim();
  }

  throw new Error(
    "AI response did not contain valid JSON"
  );
};

export class AiExtractionService {
  private async extractWithOpenAi(
    transcript: string
  ): Promise<ExtractedData> {
    if (!env.openAiApiKey) {
      throw new Error(
        "OPENAI_API_KEY is required for AI_PROVIDER=openai"
      );
    }

    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
        Authorization: `Bearer ${env.openAiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: EXTRACTION_PROMPT
          },
          {
            role: "user",
            content: `Transcript:\n${transcript}`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorBody =
        await response.text();
      throw new Error(
        `OpenAI extraction failed: ${response.status} ${errorBody}`
      );
    }

    const payload =
      (await response.json()) as {
        choices?: Array<{
          message?: {
            content?: string;
          };
        }>;
      };

    const content =
      payload.choices?.[0]?.message
        ?.content;

    if (!content) {
      throw new Error(
        "OpenAI extraction returned empty content"
      );
    }

    const jsonText =
      extractFirstJsonObject(content);

    return extractedDataSchema.parse(
      JSON.parse(jsonText)
    );
  }

  private async extractWithGemini(
    transcript: string
  ): Promise<ExtractedData> {
    if (!env.geminiApiKey) {
      throw new Error(
        "GEMINI_API_KEY is required for AI_PROVIDER=gemini"
      );
    }

    const response = await fetch(
      getGeminiUrl(env.geminiApiKey),
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${EXTRACTION_PROMPT}\n\nTranscript:\n${transcript}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2
          }
        })
      }
    );

    if (!response.ok) {
      const errorBody =
        await response.text();
      throw new Error(
        `Gemini extraction failed: ${response.status} ${errorBody}`
      );
    }

    const payload =
      (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
            }>;
          };
        }>;
      };

    const content =
      payload.candidates?.[0]?.content
        ?.parts?.[0]?.text;

    if (!content) {
      throw new Error(
        "Gemini extraction returned empty content"
      );
    }

    const jsonText =
      extractFirstJsonObject(content);

    return extractedDataSchema.parse(
      JSON.parse(jsonText)
    );
  }

  async extractFromTranscript(
    transcript: string
  ): Promise<ExtractedData> {
    if (env.aiProvider === "openai") {
      return this.extractWithOpenAi(
        transcript
      );
    }

    if (env.aiProvider === "gemini") {
      return this.extractWithGemini(
        transcript
      );
    }

    throw new Error(
      `Unsupported AI_PROVIDER: ${env.aiProvider}`
    );
  }
}