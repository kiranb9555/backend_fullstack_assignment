import { extractedDataSchema, ExtractedData } from "../modules/intelligence/intelligence.schemas.js";

export class AiExtractionService {

  async extractFromTranscript(
    transcript: string
  ): Promise<ExtractedData> {

    /**
     * DEMO IMPLEMENTATION
     * -------------------
     * Replace this block later with OpenAI/Gemini call.
     * For now, we simulate AI extraction from transcript text.
     */

    const lower =
      transcript.toLowerCase();

    const callbackRequested =
      lower.includes("call me back") ||
      lower.includes("callback") ||
      lower.includes("contact me");

    let sentiment:
      | "positive"
      | "neutral"
      | "negative" = "neutral";

    if (
      lower.includes("bad experience") ||
      lower.includes("urgent") ||
      lower.includes("no one picked up")
    ) {
      sentiment = "negative";
    } else if (
      lower.includes("interested") ||
      lower.includes("schedule") ||
      lower.includes("please") ||
      lower.includes("want")
    ) {
      sentiment = "positive";
    }

    let intent: string | null = null;

    if (
      lower.includes("rent") ||
      lower.includes("lease")
    ) {
      intent = "rental inquiry";
    } else if (
      lower.includes("pricing") ||
      lower.includes("price")
    ) {
      intent = "pricing inquiry";
    } else if (
      lower.includes("site visit")
    ) {
      intent = "site visit request";
    } else if (
      lower.includes("warehouse")
    ) {
      intent = "warehouse inquiry";
    } else if (
      lower.includes("office")
    ) {
      intent = "office space inquiry";
    } else if (
      lower.includes("shop")
    ) {
      intent = "shop space inquiry";
    } else if (
      lower.includes("villa")
    ) {
      intent = "villa availability inquiry";
    } else if (
      lower.includes("loan")
    ) {
      intent = "loan support inquiry";
    } else if (
      lower.includes("maintenance")
    ) {
      intent = "maintenance charges inquiry";
    }

    let name: string | null = null;

    const possibleNames = [
      "ramesh",
      "priya",
      "suresh",
      "kavya",
      "arjun",
      "neha",
      "manoj",
      "swathi",
      "rahul",
      "deepa"
    ];

    for (const candidate of possibleNames) {
      if (lower.includes(candidate)) {
        name =
          candidate.charAt(0).toUpperCase() +
          candidate.slice(1);
        break;
      }
    }

    const parsed =
      extractedDataSchema.parse({
        name,
        intent,
        sentiment,
        callbackRequested
      });

    return parsed;
  }
}