export type ModelProvider =
  | "google"
  | "anthropic"
  | "meta"
  | "amazon"
  | "mistral"
  | "deepseek"
  | "openai";

export type ChatModel = {
  id: string;
  name: string;
  provider: ModelProvider;
  description: string;
  vision: boolean;
  // Some Bedrock providers reject tool use combined with response streaming
  // (AI_APICallError: "This model doesn't support tool use in streaming mode").
  // Confirmed unsupported on Meta, Mistral, and DeepSeek Bedrock models as of 2026-08.
  supportsTools: boolean;
  // Direct Anthropic API model ID. When set and ANTHROPIC_API_KEY is present,
  // requests bypass Bedrock and go straight to the Anthropic API.
  anthropicApiId?: string;
};

// Model IDs are Amazon Bedrock inference-profile / foundation-model IDs.
// One AWS credential gives access to every provider below.
export const chatModels: ChatModel[] = [
  {
    id: "gemini-flash-latest",
    name: "Gemini Flash",
    provider: "google",
    description: "Google'ın hızlı, ücretsiz kotayla kullanılabilen modeli.",
    vision: true,
    supportsTools: true,
  },
  {
    id: "gemini-pro-latest",
    name: "Gemini Pro",
    provider: "google",
    description: "Google'ın en güçlü modeli. Karmaşık görevler için.",
    vision: true,
    supportsTools: true,
  },
  {
    id: "us.anthropic.claude-sonnet-5",
    name: "Claude Sonnet 5",
    provider: "anthropic",
    description: "Hız ve zeka dengesi en iyi model. Günlük sohbet ve genel görevler için varsayılan.",
    vision: true,
    supportsTools: true,
    anthropicApiId: "claude-sonnet-5",
  },
  {
    id: "us.anthropic.claude-opus-4-8",
    name: "Claude Opus 4.8",
    provider: "anthropic",
    description: "En yetenekli Claude modeli. Karmaşık akıl yürütme ve uzun görevler için.",
    vision: true,
    supportsTools: true,
    anthropicApiId: "claude-opus-4-8",
  },
  {
    id: "us.anthropic.claude-haiku-4-5-20251001-v1:0",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    description: "En hızlı ve ekonomik Claude modeli.",
    vision: true,
    supportsTools: true,
    anthropicApiId: "claude-haiku-4-5-20251001",
  },
  {
    id: "us.meta.llama4-maverick-17b-instruct-v1:0",
    name: "Llama 4 Maverick",
    provider: "meta",
    description: "Meta'nın çok modlu (metin + görsel) açık modeli.",
    vision: true,
    supportsTools: false,
  },
  {
    id: "us.amazon.nova-pro-v1:0",
    name: "Amazon Nova Pro",
    provider: "amazon",
    description: "Amazon'un çok modlu, uzun bağlamlı yapay zeka modeli.",
    vision: true,
    supportsTools: true,
  },
  {
    id: "us.mistral.pixtral-large-2502-v1:0",
    name: "Mistral Pixtral Large",
    provider: "mistral",
    description: "Mistral'in görsel destekli en güçlü modeli.",
    vision: true,
    supportsTools: false,
  },
  {
    id: "us.deepseek.r1-v1:0",
    name: "DeepSeek R1",
    provider: "deepseek",
    description: "Derin akıl yürütme (reasoning) odaklı model.",
    vision: false,
    supportsTools: false,
  },
  {
    id: "openai.gpt-oss-120b-1:0",
    name: "GPT-OSS 120B",
    provider: "openai",
    description: "OpenAI'nin açık ağırlıklı büyük modeli.",
    vision: false,
    supportsTools: true,
  },
];

export const DEFAULT_MODEL_ID = chatModels[0].id;

const modelById = new Map(chatModels.map((m) => [m.id, m]));

export function getChatModel(id: string): ChatModel {
  return modelById.get(id) ?? chatModels[0];
}

export function isValidModelId(id: string): boolean {
  return modelById.has(id);
}

export const providerLabels: Record<ModelProvider, string> = {
  google: "Google",
  anthropic: "Anthropic",
  meta: "Meta",
  amazon: "Amazon",
  mistral: "Mistral",
  deepseek: "DeepSeek",
  openai: "OpenAI",
};
