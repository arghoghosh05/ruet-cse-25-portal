"use client";

import { useEffect } from "react";

export default function AutoSection() {
  useEffect(() => {
    const updateSectionValue = (val: string) => {
      const roll = parseInt(val, 10);
      const sectionInput = document.querySelector('input[name="section"]') as HTMLInputElement;
      if (!sectionInput) return;

      if (roll >= 2503001 && roll <= 2503060) sectionInput.value = "a";
      else if (roll >= 2503061 && roll <= 2503120) sectionInput.value = "b";
      else if (roll >= 2503121 && roll <= 2503180) sectionInput.value = "c";
      else sectionInput.value = "";
    };

    // Run once on load (useful for the Edit page)
    const rollInput = document.querySelector('input[name="roll"]') as HTMLInputElement;
    if (rollInput) updateSectionValue(rollInput.value);

    // Run every time the admin types
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target && target.name === "roll") {
         updateSectionValue(target.value);
      }
    };

    document.addEventListener("input", handleInput);
    return () => document.removeEventListener("input", handleInput);
  }, []);

  return null;
}