import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dt: {
          bg:       'rgb(var(--dt-bg) / <alpha-value>)',
          surface:  'rgb(var(--dt-surface) / <alpha-value>)',
          surface2: 'rgb(var(--dt-surface2) / <alpha-value>)',
          border:   'rgb(var(--dt-border) / <alpha-value>)',
          text:     'rgb(var(--dt-text) / <alpha-value>)',
          muted:    'rgb(var(--dt-muted) / <alpha-value>)',
          accent:   'rgb(var(--dt-accent) / <alpha-value>)',
          success:  'rgb(var(--dt-success) / <alpha-value>)',
          danger:   'rgb(var(--dt-danger) / <alpha-value>)',
          warning:  'rgb(var(--dt-warning) / <alpha-value>)',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
