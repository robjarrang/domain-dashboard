import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Domain Dashboard',
  description: 'Monitor and manage your domain DNS records',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-gray-50">
        <div className="min-h-full">
          <header className="bg-white shadow-sm py-4">
            <div className="mx-auto max-w-7xl px-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Domain Dashboard</h1>
              </div>
            </div>
          </header>
          <main className="py-6">
            <div className="mx-auto max-w-7xl px-4">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
