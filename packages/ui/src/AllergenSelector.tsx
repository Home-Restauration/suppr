import React from "react";
const BIG9 = ["milk","eggs","fish","shellfish","tree_nuts","peanuts","wheat","soy","sesame","other"] as const;
const DIETARY = ["vegetarian","vegan","halal","kosher","gluten_free","dairy_free","nut_free"] as const;
interface AllergenSelectorProps {
  allergens: string[]; dietary: string[];
  onAllergensChange: (v: string[]) => void; onDietaryChange: (v: string[]) => void;
}
const toggle = (arr: string[], val: string) => arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
export function AllergenSelector({ allergens, dietary, onAllergensChange, onDietaryChange }: AllergenSelectorProps) {
  return (
    <div style={{ fontSize: 13 }}>
      <p style={{ fontWeight: 500, marginBottom: 8 }}>Allergens</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {BIG9.map(a => (
          <label key={a} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer",
            background: allergens.includes(a) ? "var(--color-alert-bg)" : "var(--color-surface-2)",
            color: allergens.includes(a) ? "var(--color-alert)" : "var(--color-text-2)",
            padding: "4px 10px", borderRadius: "var(--radius-sm)" }}>
            <input type="checkbox" style={{ display: "none" }} checked={allergens.includes(a)} onChange={() => onAllergensChange(toggle(allergens, a))} />
            {a.replace("_", " ")}
          </label>
        ))}
      </div>
      <p style={{ fontWeight: 500, marginBottom: 8 }}>Dietary preferences</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {DIETARY.map(d => (
          <label key={d} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer",
            background: dietary.includes(d) ? "var(--color-note-bg)" : "var(--color-surface-2)",
            color: dietary.includes(d) ? "var(--color-note)" : "var(--color-text-2)",
            padding: "4px 10px", borderRadius: "var(--radius-sm)" }}>
            <input type="checkbox" style={{ display: "none" }} checked={dietary.includes(d)} onChange={() => onDietaryChange(toggle(dietary, d))} />
            {d.replace("_", " ")}
          </label>
        ))}
      </div>
    </div>
  );
}
