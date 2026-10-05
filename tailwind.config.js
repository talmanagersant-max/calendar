/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./apps/**/*.{html,ts}', './libs/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        o: {
          primary: {
            50: '#E6F2F7',
            100: '#CDE5F0',
            200: '#A3CCE0',
            300: '#77B4D0',
            400: '#4D9BC1',
            500: '#2A84B1',
            600: '#006085',
            700: '#004C6A',
            800: '#003D54',
            900: '#002D3D'
          },
          secondary: {
            50: '#FDECEF',
            100: '#FAD6DF',
            200: '#F4AFBF',
            300: '#EE87A1',
            400: '#E75D82',
            500: '#D94A6F',
            600: '#BC2444',
            700: '#8D1A34',
            800: '#681425',
            900: '#440C18'
          },
          gray: {
            50: '#F9F9F9',
            100: '#F2F2F2',
            200: '#E7E7E7',
            300: '#DCDCDC',
            400: '#CFCFCF',
            500: '#C1C1C1',
            600: '#A8A8A8',
            700: '#7E7E7E',
            800: '#565656',
            900: '#2D2D2D'
          },
          // Text-only scale. `o.gray` is too light for WCAG 2.1 AA / Section 508 body
          // text (50-600 fail 4.5:1, 700 only clears large-text/UI at ~4.1:1) - use
          // `o.gray` for backgrounds, borders, and dividers only. Use `o.ink` for any
          // text color. All stops below are verified >=4.5:1 against white/#F9F9F9.
          ink: {
            500: '#767676', // ~4.5:1 on white - floor of AA, large text (>=14pt/18.66px) or icons only, avoid for body copy
            600: '#666666', // ~5.7:1 on white - default for captions/secondary/muted text
            700: '#4D4D4D', // ~8.5:1 on white - default for labels and body text
            800: '#333333', // ~12.6:1 on white - strong body text
            900: '#1A1A1A' // ~17.4:1 on white - headings, primary text
          },
          // Secondary interactive accent (info buttons, active nav state,
          // links). Primary buttons use `o.primary`; see styles.css button
          // severity map for how each `o.*` color maps onto p-button.
          accent: {
            50: '#EEF4FF',
            100: '#DBE7FE',
            200: '#BFD3FE',
            300: '#93B4FD',
            400: '#5C8CFA',
            500: '#2F62F5',
            600: '#1447E6',
            700: '#0F37BD',
            800: '#102F93',
            900: '#122A74'
          }
        }
      },
      fontFamily: {
        sans: ['"Public Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      boxShadow: {
        soft: '0 8px 26px rgba(0, 96, 133, 0.10)'
      }
    }
  },
  plugins: []
};
