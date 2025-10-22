/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: ["class"],
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            "--tw-prose-body": theme("colors.gray[700]"),
            "--tw-prose-invert-body": theme("colors.gray[300]"),
            "--tw-prose-headings": theme("colors.gray[900]"),
            "--tw-prose-invert-headings": theme("colors.gray[100]"),
            "--tw-prose-links": theme("colors.blue[600]"),
            "--tw-prose-invert-links": theme("colors.blue[400]"),
            "--tw-prose-bold": theme("colors.gray[900]"),
            "--tw-prose-invert-bold": theme("colors.gray[100]"),
            "--tw-prose-counters": theme("colors.gray[500]"),
            "--tw-prose-invert-counters": theme("colors.gray[400]"),
            "--tw-prose-bullets": theme("colors.gray[300]"),
            "--tw-prose-invert-bullets": theme("colors.gray[600]"),
            "--tw-prose-hr": theme("colors.gray[200]"),
            "--tw-prose-invert-hr": theme("colors.gray[700]"),
            "--tw-prose-quotes": theme("colors.gray[900]"),
            "--tw-prose-invert-quotes": theme("colors.gray[100]"),
            "--tw-prose-quote-borders": theme("colors.gray[200]"),
            "--tw-prose-invert-quote-borders": theme("colors.gray[700]"),
            "--tw-prose-th-borders": theme("colors.gray[300]"),
            "--tw-prose-invert-th-borders": theme("colors.gray[600]"),
            "--tw-prose-td-borders": theme("colors.gray[200]"),
            "--tw-prose-invert-td-borders": theme("colors.gray[700]"),
            maxWidth: "none",
            color: "var(--tw-prose-body)",
            lineHeight: "1.6",
            fontSize: "1rem",
            p: {
              marginTop: "0.5rem",
              marginBottom: "0.5rem",
            },
            "p:first-child": {
              marginTop: "0",
            },
            "p:last-child": {
              marginBottom: "0",
            },
            h1: {
              fontSize: "1.5rem",
              fontWeight: "700",
              marginTop: "1rem",
              marginBottom: "0.5rem",
            },
            h2: {
              fontSize: "1.25rem",
              fontWeight: "600",
              marginTop: "1rem",
              marginBottom: "0.5rem",
            },
            h3: {
              fontSize: "1.125rem",
              fontWeight: "600",
              marginTop: "0.75rem",
              marginBottom: "0.5rem",
            },
            ul: {
              marginTop: "0.5rem",
              marginBottom: "0.5rem",
            },
            ol: {
              marginTop: "0.5rem",
              marginBottom: "0.5rem",
            },
            li: {
              marginTop: "0.25rem",
              marginBottom: "0.25rem",
            },
            blockquote: {
              marginTop: "0.75rem",
              marginBottom: "0.75rem",
              paddingLeft: "1rem",
              borderLeftWidth: "4px",
              borderLeftColor: "var(--tw-prose-quote-borders)",
              fontStyle: "italic",
            },
            code: {
              fontSize: "0.875rem",
              fontWeight: "400",
            },
            pre: {
              marginTop: "0.75rem",
              marginBottom: "0.75rem",
            },
            table: {
              marginTop: "0.75rem",
              marginBottom: "0.75rem",
            },
          },
        },
      }),
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      animation: {
        blink: "blink 1s step-end infinite",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("tailwind-scrollbar")({ nocompatible: true }),
  ],
};
