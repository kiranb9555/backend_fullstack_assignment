import "dotenv/config";
import { z } from "zod";

const apiKey = process.env.GEMINI_API_KEY;

const extractedDataSchema = z.object({
  name: z.string().min(1).max(100).nullable(),
  intent: z
    .string()
    .min(1)
    .max(200)
    .refine(
      value => value.trim().split(/\s+/).filter(Boolean).length <= 20,
      "Intent must contain at most 20 words"
    )
    .nullable(),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  callbackRequested: z.boolean()
});

const prompt = `You are an information extraction system.
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
- callbackRequested=true only if the caller asks to be called/contacted back.

Transcript:
Hi, I'm Neha. Please share details about the property loan support and payment options. Call me when possible.`;

const extractFirstJsonObject = (text: string) => {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1).trim();
  }

  throw new Error("Gemini response did not contain a JSON object");
};

const main = async () => {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in .env");
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  console.log("Checking Gemini gemini-1.5-flash...");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2
      }
    })
  });

  console.log(`HTTP status: ${response.status} ${response.statusText}`);

  const responseBody = await response.text();

  if (!response.ok) {
    console.error(responseBody);
    throw new Error("Gemini returned a non-2xx response");
  }

  const payload = JSON.parse(responseBody) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  const content = payload.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error("Gemini returned no text content");
  }

  console.log("Raw Gemini text:");
  console.log(content);

  const jsonText = extractFirstJsonObject(content);
  const parsed = extractedDataSchema.parse(JSON.parse(jsonText));

  console.log("Validated extracted data:");
  console.log(JSON.stringify(parsed, null, 2));
};

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error);

  console.error("Gemini check failed:");
  console.error(message);

  if (error instanceof Error && error.cause) {
    console.error("Cause:");
    console.error(error.cause);
  }

  process.exitCode = 1;
});
