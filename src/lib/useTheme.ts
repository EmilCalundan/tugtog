import { useEffect } from "react";

// Iisa na lang ang tema ng Tugtog (dark glass), kaya laging naka-dark
export function useTheme() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);
}
