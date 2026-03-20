import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'KUZU',
  description:
    'KUZU 92.9FM is a community-programmed, non-commercial, LPFM station serving Denton, Texas.',
  openGraph: {
    siteName: 'KUZU',
    title: 'HOME',
    url: 'http://www.kuzu.fm/',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Abel&family=Source+Code+Pro:wght@300;400;500;700&display=swap"
        />
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@3.4.1/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
