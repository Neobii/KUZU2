'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Header } from './Header'
import { LayoutBanners } from './LayoutBanners'

export function HomeLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        Loading...
      </div>
    )
  }

  if (!session) {
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
