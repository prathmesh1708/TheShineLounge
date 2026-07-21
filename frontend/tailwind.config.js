/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			luxury: {
  				white: '#FFFFFF',
  				black: '#111111',
  				emerald: '#FF6B00',
  				emeraldHover: '#E66000',
  				emeraldLight: '#FFF0E6',
  				gray: '#F8F9FA',
  				darkGray: '#1A1A1A',
  				mutedGray: '#7E7873',
  				border: 'rgba(255, 255, 255, 0.1)',
  				glassBg: 'rgba(255, 255, 255, 0.8)',
  				glassBgDark: 'rgba(17, 17, 17, 0.85)'
  			},
  			grooming: {
  				primary: '#FF6B00',
  				hover: '#E66000',
  				light: '#FFF0E6',
  				cream: '#F7F3EE',
  				bg: '#FAFAFA'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			'20': '20px',
  			'24': '24px'
  		},
  		boxShadow: {
  			premium: '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
  			'premium-hover': '0 30px 60px -20px rgba(0, 0, 0, 0.1)',
  			glass: '0 8px 32px 0 rgba(0, 0, 0, 0.08)'
  		},
  		backdropBlur: {
  			xs: '2px'
  		}
  	}
  },
  plugins: [],
}

