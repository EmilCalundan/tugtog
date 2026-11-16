import { useEffect, useState } from "react";

function loadTheme(): string {
  try {
    return localStorage.getItem("tugtog-theme") ?? "light";
  } catch {
    return "light";
  }
}

// Light o dark mode, na natatandaan ng browser
export function useTheme() {
  const [theme, setTheme] = useState(loadTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("tugtog-theme", theme);
    } catch {
      // Walang problema kung hindi makapag-save
    }
  }, [theme]);

  return { theme, toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark") };
}
