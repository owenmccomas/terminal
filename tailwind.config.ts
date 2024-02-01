import { type Config } from "tailwindcss";
import { withUt } from "uploadthing/tw";

export default withUt({
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Cascadia Code", "sans-serif"],
      },
    },
  },
  plugins: [],
}) satisfies Config;
