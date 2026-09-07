import Script from 'next/script';
import './globals.css';

export const metadata = {
  title: 'ArtsPay 3D Secure (fatzebra.js): Next.js example',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Script src="https://cdn.pmnts-sandbox.io/sdk/v1/fatzebra.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
