import "server-only";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { ModelProvider } from "./models";

const bedrock = createAmazonBedrock({
  region: process.env.AWS_REGION ?? "us-east-1",
});

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export function getLanguageModel(modelId: string, provider: ModelProvider, anthropicApiId?: string) {
  if (provider === "google") {
    return google(modelId);
  }
  if (provider === "anthropic" && anthropicApiId && process.env.ANTHROPIC_API_KEY) {
    return anthropic(anthropicApiId);
  }
  return bedrock(modelId);
}
