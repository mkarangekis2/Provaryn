import OpenAI from "openai";
import { z } from "zod";
import { env } from "@/lib/env";

const client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

export async function runStructuredPrompt<T>(
  input: {
    system: string;
    user: string;
    promptVersion: string;
    runType: string;
  },
  schema: z.ZodSchema<T>
): Promise<{ data: T; model: string; confidence: number }> {
  if (!client) throw new Error("OPENAI_API_KEY missing");

  const completion = await client.responses.create({
    model: env.OPENAI_MODEL,
    input: [
      { role: "system", content: input.system },
      { role: "user", content: input.user }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "structured_output",
        schema: {
          type: "object",
          additionalProperties: true
        }
      }
    }
  });

  const outputText = completion.output_text;
  const parsed = schema.parse(JSON.parse(outputText));
  return { data: parsed, model: completion.model, confidence: 0.8 };
}
