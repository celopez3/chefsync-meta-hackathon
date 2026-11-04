import { z } from "zod";

export const IngredientSchema = z.object({
  id: z.string(),
  name: z.string(),
  confidence: z.number().min(0).max(1),
  sourceImageIndex: z.number().int().min(0),
  boundingBox: z.array(z.number()).length(4).optional(),
});

export const DetectResponseSchema = z.object({
  success: z.boolean(),
  sessionId: z.string(),
  demoMode: z.boolean(),
  ingredients: z.array(IngredientSchema),
});

export const GenerateRequestSchema = z.object({
  sessionId: z.string().min(1),
  selectedIngredients: z.array(z.string().min(1)).min(1, "Select at least one ingredient"),
  intent: z.enum(["single_meal", "batch_prep", "quick_snack"]),
  dietaryPreferences: z.array(z.string()).optional().default([]),
  pantryItems: z.array(z.string()).optional().default([]),
  avoidIngredients: z.array(z.string()).optional().default([]),
  servings: z.number().int().min(1).max(12).optional(),
  heatLevel: z.string().optional(),
});

export const DetectContextSchema = z.enum(["kitchen", "spice_rack"]);
export type DetectContext = z.infer<typeof DetectContextSchema>;

export const PlanSchema = z.object({
  title: z.string(),
  prepTimeMinutes: z.number().int().positive(),
  difficulty: z.string(),
  usedIngredients: z.array(z.string()),
  missingPantryStaples: z.array(z.string()).optional().default([]),
  instructions: z.array(z.string()).min(1),
});

export const RecipeResponseSchema = z.object({
  success: z.boolean(),
  demoMode: z.boolean(),
  plans: z.array(PlanSchema),
});

export type Ingredient = z.infer<typeof IngredientSchema>;
/** Input shape: fields with defaults (dietaryPreferences, pantryItems) may be omitted by callers. */
export type GenerateRequest = z.input<typeof GenerateRequestSchema>;
export type Plan = z.infer<typeof PlanSchema>;
export type Intent = GenerateRequest["intent"];
