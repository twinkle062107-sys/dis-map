import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'MemoryBridge - Landmark-Based Walking Navigation',
  description: 'Walking navigation for elderly, neurodivergent, and anxious users. No numbers, only landmarks and colors.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900 selection:bg-blue-200">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
