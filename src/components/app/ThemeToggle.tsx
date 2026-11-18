import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  useEffect(() => {
    const t = (localStorage.getItem("tk-theme") as "light" | "dark") ?? "dark";
    setTheme(t);
    const obs = new MutationObserver(() => setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light"));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

export function applyStoredTheme() {
  const t = localStorage.getItem("tk-theme") ?? "dark";
  document.documentElement.classList.toggle("dark", t === "dark");
}

export function ThemeToggle() {
  const theme = useTheme();
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("tk-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };
  return <Button variant="ghost" size="sm" onClick={toggle}>{theme === "dark" ? "Light" : "Dark"} mode</Button>;
}
