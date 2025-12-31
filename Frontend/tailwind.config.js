/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{ts,tsx}', // si tienes carpeta components en src/, ajusta la ruta
    // elimina las rutas de "app/**" si no usas Next
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        pink:   { DEFAULT: "#ec4899" }, 
        purple: { DEFAULT: "#cb00e3" },
        gray:   { DEFAULT: "#697076" },
        backgroundGeneral: { DEFAULT: "#f4f6f8" },

        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        'gradient-start': '#ec4899',
        'gradient-middle': '#d946ef',
        'gradient-end': '#8b5cf6',
      },
      // 👇 OJO: fontFamily va aquí, como "hermano" de colors (no dentro de colors)
      fontFamily: {
        poppins: ['"Poppins"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Si no usas next/font, comenta estas dos:
        // geist: ['var(--font-geist-sans)', 'sans-serif'],
        // mono: ['var(--font-geist-mono)', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      backgroundImage: {
        'DigiTicket-gradient':
          'linear-gradient(135deg, #ec4899 0%, #d946ef 50%, #8b5cf6 100%)',
      },
      boxShadow: {
        card: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function({ addUtilities }) {
      addUtilities({
        '.btn-inset': {
          transitionProperty: 'background-color, border-color, color, opacity, box-shadow, transform',
          fontWeight: '500',
          transform: 'scale(1)',  // Estado base sin escala
          boxShadow: 'inset 0 2px 5px rgba(0, 0, 0, 0.1)',  // Efecto de sombra interna
          transitionDuration: '500ms',  // Duración de la transición
        },
        '.btn-inset:active': {
          transform: 'scale(0.90)',  // Efecto de "hundimiento" al hacer clic
          boxShadow: 'inset 0 4px 10px rgba(0, 0, 0, 0.1)',  // Sombra más pronunciada
        },
      });
    },
  ],
}
