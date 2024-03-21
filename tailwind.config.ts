import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      boxShadow: {
        spread: "0px 0px 4px 4px rgba(255, 255, 255, 0.1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
