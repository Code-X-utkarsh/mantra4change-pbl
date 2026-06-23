import type { Metadata } from 'next';
import './globals.css';
import Header from '../components/layout/Header';

export const metadata: Metadata = {
  title: 'PBL Program Intelligence & Grant Reporting',
  description: 'Mantra4Change Program Review Dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
