import "./globals.css";
import Header from "./components/Header";
import ErrorBoundary from "./components/ErrorBoundary";

export const metadata = {
  title: "VaultDrop — Secure ephemeral file sharing",
  description: "Share files and messages that vanish after delivery. No account required.",
  openGraph: {
    title: "VaultDrop",
    description: "Share files and messages that vanish after delivery.",
    url: "https://vaultdrop.app",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ErrorBoundary>
          <Header />
          <div className="page-container">{children}</div>
        </ErrorBoundary>
      </body>
    </html>
  );
}
