'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from './Header'
import { LayoutBanners } from './LayoutBanners'

export function HomeLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === 'loading') {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        Loading...
      </div>
    )
  }

  if (!session) {
    router.replace('/login')
    return null
  }

  return (
    <>
      <Header session={session} />
      <LayoutBanners />
      <main id="page">
        <div id="content" className="main-content">
          {children}
        </div>
      </main>
    </>
  )
}
