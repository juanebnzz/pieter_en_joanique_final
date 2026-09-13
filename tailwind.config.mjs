/**
 * Semantic colour tokens. The values live as CSS custom properties in
 * src/styles/global.css (`:root`, overridden per `[data-mode]`), so one
 * utility — bg-surface, text-ink, border-rule, text-accent — paints correctly
 * inside any section. Loaded by `@config` in global.css.
 */
/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        surface: 'var(--color-surface)',
        ink: 'var(--color-ink)',
        rule: 'var(--color-rule)',
        accent: 'var(--color-accent)',
      },
    },
  },
};
