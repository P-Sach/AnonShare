import "./globals.css";
import { Space_Mono, Syne } from "next/font/google";
import Header from "./components/Header";
import ErrorBoundary from "./components/ErrorBoundary";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

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
      <body className={`${syne.variable} ${spaceMono.variable}`}>
        <ErrorBoundary>
          <Header />
          <div className="page-container">{children}</div>
        </ErrorBoundary>
      </body>
    </html>
  );
}
