import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["MS-DOS"],
      },
      textShadow: {
        "neon-green": "0 0 1px #00cc00, 0 0 5px #00cc00",
      },
    },
  },
  variants: {
    textShadow: ["responsive"],
  },
  plugins: [require("tailwindcss-textshadow")],
} satisfies Config;
