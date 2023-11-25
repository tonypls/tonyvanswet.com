import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["MS-DOS"],
      },
    },
  },
  plugins: [],
} satisfies Config;
