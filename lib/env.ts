import { z } from "zod";

const optionalString = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}, z.string().min(1).optional());

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess((value) => (value === "" ? undefined : value), z.string().url().optional()),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  OPENAI_API_KEY: optionalString,
  OPENAI_MODEL: z.string().default("gpt-4.1"),
  STRIPE_SECRET_KEY: optionalString,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  STRIPE_PRICE_RECON_UNLOCK: optionalString,
  STRIPE_PRICE_PREMIUM: optionalString,
  STRIPE_PRICE_CLAIM_BUILDER: optionalString,
  APP_BASE_URL: z.string().url().default("http://localhost:3000")
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_RECON_UNLOCK: process.env.STRIPE_PRICE_RECON_UNLOCK,
  STRIPE_PRICE_PREMIUM: process.env.STRIPE_PRICE_PREMIUM,
  STRIPE_PRICE_CLAIM_BUILDER: process.env.STRIPE_PRICE_CLAIM_BUILDER,
  APP_BASE_URL: process.env.APP_BASE_URL
});

export function requireServerEnv(key: "SUPABASE_SERVICE_ROLE_KEY" | "OPENAI_API_KEY" | "STRIPE_SECRET_KEY") {
  const value = env[key];
  if (!value) throw new Error(`${key} missing`);
  return value;
}
