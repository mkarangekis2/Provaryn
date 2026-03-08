import { z } from "zod";

export const checkInSchema = z.object({
  sessionDate: z.string(),
  entries: z.array(
    z.object({
      category: z.string(),
      severity: z.number().min(0).max(10),
      frequency: z.number().min(0).max(7),
      impact: z.string(),
      careSought: z.boolean()
    })
  )
});
