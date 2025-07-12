import '../app/styles/globals.css'; // ✅ correct path from layout.tsx

export const metadata = {
  title: 'Interview AI - MVP',
  description: 'AI-Powered Interview Assistant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
      </body>
    </html>
  );
}
