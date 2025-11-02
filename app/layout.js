import './globals.css'

export const metadata = {
  title: 'AnonShare - Secure File Sharing',
  description: 'Share files securely with password protection and expiration',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
