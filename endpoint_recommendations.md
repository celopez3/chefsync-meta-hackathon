# `endpoint_recommendations.md` — ChefSync AI API Spec

## 1\. Architectural Adjustments for Multi-Photo & Multi-Item Selection

To support your updated workflow—where users can snap multiple photos (e.g., fridge angles, pantry shelves, or counter spreads)—the data flow updates as follows:

1. **Multi-Image Ingestion:** User uploads 1 to \$N\$ photos simultaneously.  
2. **Aggregated SAM 3.1 Processing:** The backend processes all images in parallel through SAM 3.1, deduplicates or merges detected items, and returns a unified inventory list.  
3. **Multi-Select Inventory Checklist:** Instead of picking a single priority item, the UI presents a clean checkbox grid of all detected ingredients across the photos, allowing the user to select/deselect items they want to cook with.  
4. **Action & Generation:** User chooses their intent (`Single Meal`, `Batch Prep`, etc.) and hits generate.

---

## 2\. Hono API Endpoint Definitions

The Hono backend exposes two primary RPC-typed endpoints for the React frontend.

### Endpoint 1: Detect Ingredients (`POST /api/ingredients/detect`)

Accepts a batch of images, runs SAM 3.1 segmentation, and returns a unified list of detected ingredients.

* **HTTP Method:** `POST`  
* **Content-Type:** `multipart/form-data`  
* **Request Payload:**  
  * `images`: Array of image files (`File[]`, max 4 images recommended).  
* **Response Schema (JSON via Zod):**  
    
  import { z } from 'zod';  
    
  export const DetectResponseSchema \= z.object({  
    
    success: z.boolean(),  
    
    sessionId: z.string(),  
    
    ingredients: z.array(  
    
      z.object({  
    
        id: z.string(),  
    
        name: z.string(),  
    
        confidence: z.number(),  
    
        sourceImageIndex: z.number(),  
    
        boundingBox: z.array(z.number()).optional(), // Optional crop coordinates for UI highlights  
    
      })  
    
    ),  
    
  });

### Endpoint 2: Generate Recipes (`POST /api/recipes/generate`)

Accepts the user's explicitly selected ingredients, user intent, and generates structured recipes via Muse Spark.

* **HTTP Method:** `POST`  
* **Content-Type:** `application/json`  
* **Request Payload Schema (Zod):**  
    
  import { z } from 'zod';  
    
  export const GenerateRequestSchema \= z.object({  
    
    sessionId: z.string(),  
    
    selectedIngredients: z.array(z.string()), // User-checked items from the multi-photo grid  
    
    intent: z.enum(\["single\_meal", "batch\_prep", "quick\_snack"\]),  
    
    dietaryPreferences: z.array(z.string()).optional(),  
    
  });  
    
* **Response Schema (JSON via Zod):**  
    
  export const RecipeResponseSchema \= z.object({  
    
    success: z.boolean(),  
    
    plans: z.array(  
    
      z.object({  
    
        title: z.string(),  
    
        prepTimeMinutes: z.number(),  
    
        difficulty: z.string(),  
    
        usedIngredients: z.array(z.string()),  
    
        missingPantryStaples: z.array(z.string()).optional(),  
    
        instructions: z.array(z.string()),  
    
      })  
    
    ),  
    
  });

---

## 3\. Implementation Blueprint for Muse Code

When prompting **Muse Code** to scaffold these endpoints in the Hono application, provide it with these implementation guidelines:

1. **Parallelized Model Calls:** In `POST /api/ingredients/detect`, use `Promise.all()` to process multiple image buffers concurrently when sending requests to the SAM 3.1 Meta API wrapper.  
2. **Deduplication Logic:** Implement a simple text-normalization helper in Hono to merge duplicate items detected across multiple counter/fridge photos (e.g., consolidating two distinct detections of "bell pepper").  
3. **Strict Zod Middleware:** Validate incoming form data and JSON payloads using Zod schemas at the route boundary before executing external Meta API calls.