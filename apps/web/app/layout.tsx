import type { Metadata, Viewport } from 'next';
import { Sora, Manrope } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from '@/components/ui/sonner';
import Providers from '@/app/providers';
import './globals.css';

const display = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});
const sans = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BudgetBite - Plan Your Meals, Stick to Your Budget',
  description:
    'A food budget planning app that suggests meals from nearby restaurants and tracks your spending. Built for the Pakistani food lover.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
};

export const viewport: Viewport = {
  /* Tints the mobile browser chrome. Two entries rather than one because a
     single value leaves half the users with a light bar above a near-black
     page. The light entry is the brand teal it has always been; the dark one
     is `canvas`, so the chrome continues the page instead of capping it. */
  // Next serialises these into a <meta> tag, where a var() would arrive as the
  // literal string "var(--canvas)" and be ignored — hence the guard exemption.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#178a8a' }, // token-guard-allow
    { media: '(prefers-color-scheme: dark)', color: '#14110c' }, // token-guard-allow
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /* `suppressHydrationWarning` is required, not cosmetic: next-themes writes
       the resolved theme onto <html> in a blocking pre-hydration script, so the
       server-rendered markup and the DOM React sees genuinely differ by one
       class. Without it React logs a hydration mismatch on every page load. */
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} scroll-smooth`}
    >
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster />
          <Analytics />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}
