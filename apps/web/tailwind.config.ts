import type { Config } from "tailwindcss";
import { supprTokens } from "@suppr/tokens/tailwind";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: supprTokens,
};
export default config;
