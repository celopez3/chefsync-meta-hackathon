# `project_start.md` — ChefSync AI

## 1\. Executive Summary & Vision

**ChefSync AI** is a high-efficiency web application built for the **Meta Global AI Developer Hackathon** (Track: *Indie Developer*, Theme: *Build for Your World*).

The application converts everyday kitchen inputs—including **multiple photos** of fridges, pantries, grocery receipts, or counter spreads—into instant, actionable culinary outcomes. It emphasizes zero-friction interaction: **Multi-Photo Capture \$\\rightarrow\$ Multi-Select Ingredient Checklist \$\\rightarrow\$ Intent Selection \$\\rightarrow\$ One-Click Actionable Recipe/Prep Plan**.

---

## 2\. Technical Architecture & Stack Lock-In

### Architecture Strategy (Web Only)

To maximize iteration speed and zero-config cloud deployments during the 10-day hackathon window:

* **Front-End:** **React** SPA built with **Vite** and styled with **Tailwind CSS**.  
* **Back-End API:** **Hono** web framework running on **TypeScript**.  
* **Deployment Target:** **Cloudflare Workers / Cloudflare Pages** (Edge runtime API execution with zero server overhead or container setup).  
* **Model Inference Endpoints:** External calls to Meta APIs & serverless GPU providers (**Modal** / **Baseten**).

   ┌─────────────────────────────────────────────────────────┐

   │                     React \+ Tailwind                    │

   │           (Multi-Image Upload / Camera Capture)         │

   └────────────────────────────┬────────────────────────────┘

                                │ HTTP / JSON (Hono RPC Client)

   ┌────────────────────────────▼────────────────────────────┐

   │             Hono Web API (Cloudflare Workers)           │

   └──────┬─────────────────────┬─────────────────────┬──────┘

          │                     │                     │

          ▼                     ▼                     ▼

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐

│  SAM 3.1 API     │  │ Muse Spark API   │  │ Modal / Baseten  │

│ (Object Segment) │  │  (Recipe Gen)    │  │ (Open-Weights)   │

└──────────────────┘  └──────────────────┘  └──────────────────┘

---

## 3\. Meta Ecosystem Integration & Rules

* **SAM 3.1 (Meta Model API):**  
  * Accepts arrays of raw image buffers or base64 data.  
  * Performs concept/object segmentation to isolate grouped food items across multiple fridge/counter/pantry photos or line-item text on receipts.  
* **Muse Spark / Meta Open-Weights:**  
  * Ingests validated, user-selected inventory lists.  
  * Generates structured JSON output for recipes, prep instructions, and nutritional pairings.  
* **Muse Code Agent Optimization:**  
  * Codebase structured with clear Hono route handlers, Zod validation schemas, and exported TypeScript type signatures to leverage Muse Code for automated refactoring.

---

## 4\. Updated Multi-Photo & Checklist User Workflow

To accommodate users laying out specific items on a counter or taking multiple photos of different angles:

1. **Multi-Image Capture:** User uploads 1 to \$N\$ photos simultaneously (e.g., fridge contents, counter display, or receipt).  
2. **Aggregated Processing:** Backend processes images concurrently via SAM 3.1, deduplicates detected items, and returns a unified inventory list.  
3. **Multi-Select Inventory Grid:** The UI presents a clean checkbox grid of all detected ingredients across the photos, allowing the user to select/deselect items they want to prioritize.  
4. **Intent Selection & Generation:** User chooses their intent (`Single Meal`, `Batch Prep`, etc.) and hits generate.  
5. **Outcome:** Instant, tailored recipe or meal prep plan displayed with zero clutter.

---

## 5\. Development Guidelines for Muse Code

Adhere to the following conventions when using **Muse Code** to build features:

1. **Hono RPC Type Safety:** Export Hono app types so the React frontend can consume end-to-end typed endpoints without manual API contract syncs.  
2. **Strict Zod Parsing:** All Meta API response payloads must pass through Zod schemas in Hono handlers to ensure valid JSON reaches the UI.  
3. **Client-Side Image Pre-Processing:** Compress and resize high-res mobile photos in the browser using HTML5 Canvas before uploading to Hono to minimize edge payload latency.  
4. **Atomic Component Hierarchy:** Keep Tailwind-styled components modular (e.g., `<MultiImageUploader/>`, `<IngredientChecklist/>`, `<RecipeCard/>`).