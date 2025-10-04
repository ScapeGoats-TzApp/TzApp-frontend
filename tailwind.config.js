/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}", "./src/**/*.html", "./src/**/*.ts"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      colors: {
        'navy': {
          DEFAULT: '#011C40',
          50: 'rgba(1, 28, 64, 0.35)',
          90: 'rgba(1, 28, 64, 0.90)',
        },
        'cyan': {
          DEFAULT: '#26658C',
          light: 'rgba(167, 235, 242, 0.20)',
          border: 'rgba(38, 101, 140, 0.34)',
        },
        'goat': {
          blue: '#54ACBF',
          teal: '#5FB2C4',
          sky: '#5D9AE3',
        }
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(180deg, #FFF 13.52%, rgba(167, 235, 242, 0.40) 76.72%, rgba(84, 172, 191, 0.68) 87.94%, #26658C 100%)',
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
