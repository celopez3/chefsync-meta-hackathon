/** General goods a home cook typically owns. Used by the Pantry panel and to
 *  stop recipes flagging things you already have as "missing". */
export const PANTRY_CATEGORIES: { label: string; items: string[] }[] = [
  {
    label: "Baking staples",
    items: ["Flour", "White Sugar", "Brown Sugar", "Powdered Sugar", "Vanilla Extract", "Baking Powder", "Baking Soda", "Cornstarch", "Cocoa Powder", "Honey"],
  },
  {
    label: "Pantry basics",
    items: ["Olive Oil", "Vegetable Oil", "Salt", "Black Pepper", "Rice", "Pasta", "Soy Sauce", "Vinegar", "Sesame Oil", "Stock Cubes"],
  },
  {
    label: "Spices & herbs",
    items: ["Paprika", "Smoked Paprika", "Cumin", "Chili Powder", "Garlic Powder", "Onion Powder", "Cinnamon", "Nutmeg", "Turmeric", "Curry Powder", "Italian Seasoning", "Red Pepper Flakes", "Bay Leaves", "Oregano", "Thyme", "Rosemary"],
  },
];

export const ALL_PANTRY_ITEMS: string[] = PANTRY_CATEGORIES.flatMap((c) => c.items);

/** One-tap starter set for the "Select most common" pantry button. */
export const COMMON_PANTRY_ITEMS: string[] = [
  "Flour", "White Sugar", "Brown Sugar", "Olive Oil", "Vegetable Oil",
  "Salt", "Black Pepper", "Garlic Powder", "Paprika", "Cinnamon",
  "Baking Powder", "Baking Soda", "Vanilla Extract", "Rice", "Pasta", "Soy Sauce",
];
