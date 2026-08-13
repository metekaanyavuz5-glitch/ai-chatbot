import { z } from "zod";

const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1),
});

const filePartSchema = z.object({
  type: z.literal("file"),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  filename: z.string().optional(),
  url: z.string().url(),
});

const uiMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user"]),
  parts: z.array(z.union([textPartSchema, filePartSchema])).min(1),
});

export const chatRequestSchema = z.object({
  id: z.string().min(1),
  message: uiMessageSchema,
  selectedModelId: z.string().min(1),
});

export type ChatRequestBody = z.infer<typeof chatRequestSchema>;
