"use client";
import { useEffect } from "react";

export function DarkThemeMount() {
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-theme", "dark");
    return () => html.removeAttribute("data-theme");
  }, []);
  return null;
}
