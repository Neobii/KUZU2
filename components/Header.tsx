'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import type { Session } from 'next-auth'
import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { canAccessProducerPortal } from '@/lib/can-access-producer-portal'

export function Header({ session }: { session: Session | null }) {
  const [navOpen, setNavOpen] = useState(false)
  const [extrasOpen, setExtrasOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)

  const closeMenus = useCallback(() => {
    setNavOpen(false)
    setExtrasOpen(false)
    setAdminOpen(false)
  }, [])

  useEffect(() => {
    if (!navOpen) return
    const onResize = () => {
      if (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
        setNavOpen(false)
        setExtrasOpen(false)
        setAdminOpen(false)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [navOpen])

  if (!session?.user) return null
  const user = session.user
  const isAdmin = user.isAdmin
  const producerProfile = user.producerProfile
  const showProducerPortal = canAccessProducerPortal(user)
  const unreadCount = 0

  const navLinkClass =
    'block rounded px-3 py-2 text-sm text-stone-200 hover:bg-stone-800 hover:text-white md:inline-block'

  return (
    <nav className="relative z-[1030] border-b border-stone-800 bg-stone-950">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-2 md:px-4">
        <div className="flex min-w-0 flex-1 items-center justify-between md:flex-none md:justify-start md:gap-4">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-stone-200 hover:bg-stone-800 md:hidden"
            onClick={() => setNavOpen((o) => !o)}
            aria-expanded={navOpen}
            aria-controls="kuzu-navbar-collapse"
            aria-label="Toggle navigation"
          >
            <span className="sr-only">Menu</span>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              {navOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <Link
            href="/"
            className="text-xl font-semibold tracking-wide text-amber-400 no-underline hover:text-amber-300"
            onClick={closeMenus}
          >
            KUZU
          </Link>
        </div>

        <div
          id="kuzu-navbar-collapse"
          className={cn(
            'w-full flex-col gap-2 md:flex md:max-w-none md:flex-1 md:flex-row md:flex-wrap md:items-center md:justify-end md:gap-x-4',
            navOpen ? 'flex' : 'hidden md:flex'
          )}
        >
          <ul className="mt-2 flex list-none flex-col gap-1 md:mt-0 md:flex-row md:flex-wrap md:items-center">
            <li>
              <button
                type="button"
                className={cn(navLinkClass, 'w-full text-left')}
                onClick={() => {
                  closeMenus()
                  signOut()
                }}
              >
                Logout
              </button>
            </li>
            {showProducerPortal && (
              <>
                <li>
                  <Link href="/producer/shows" className={navLinkClass} onClick={closeMenus}>
                    My Shows
                  </Link>
                </li>
                <li>
                  <Link href="/track-imports" className={navLinkClass} onClick={closeMenus}>
                    Track Imports
                  </Link>
                </li>
                <li>
                  <Link href="/producer/profile" className={navLinkClass} onClick={closeMenus}>
                    My Producer Profile
                  </Link>
                </li>
                <li>
                  <Link href="/producer/program-information" className={navLinkClass} onClick={closeMenus}>
                    My Program Information
                  </Link>
                </li>
                {producerProfile?.isMessagingUIEnabled && (
                  <li>
                    <Link href="/producer/messages" className={navLinkClass} onClick={closeMenus}>
                      My Messages {unreadCount || ''}
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>

          <ul className="flex list-none flex-col md:ml-3 md:flex-row md:items-center">
            <li className="relative">
              <button
                type="button"
                className={cn(navLinkClass, 'flex w-full items-center gap-1 text-left md:w-auto')}
                onClick={() => {
                  setExtrasOpen((o) => !o)
                  setAdminOpen(false)
                }}
              >
                Extras
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </button>
              {extrasOpen && (
                <ul
                  className="relative z-10 mt-1 min-w-[12rem] rounded-md border border-stone-700 bg-stone-900 py-1 shadow-lg md:absolute md:right-0 md:mt-0"
                  role="menu"
                >
                  {(isAdmin || producerProfile?.isPioneer) && (
                    <li>
                      <Link
                        href="/kuzu-stats"
                        className="block px-4 py-2.5 text-sm text-stone-200 no-underline hover:bg-stone-800"
                        onClick={closeMenus}
                      >
                        Listener Stats
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link
                      href="/calendar"
                      className="block px-4 py-2 text-sm text-stone-200 no-underline hover:bg-stone-800"
                      onClick={closeMenus}
                    >
                      Calendar
                    </Link>
                  </li>
                  {(isAdmin || producerProfile?.isPioneer) && (
                    <li>
                      <Link
                        href="/feature-requests"
                        className="block px-4 py-2.5 text-sm text-stone-200 no-underline hover:bg-stone-800"
                        onClick={closeMenus}
                      >
                        Feature Requests
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </li>
            {isAdmin && (
              <li className="relative md:ml-2">
                <button
                  type="button"
                  className={cn(navLinkClass, 'flex w-full items-center gap-1 text-left md:w-auto')}
                  onClick={() => {
                    setAdminOpen((o) => !o)
                    setExtrasOpen(false)
                  }}
                >
                  Admin
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </button>
                {adminOpen && (
                  <ul
                    className="relative z-10 mt-1 min-w-[12rem] rounded-md border border-stone-700 bg-stone-900 py-1.5 shadow-lg md:absolute md:right-0 md:mt-0"
                    role="menu"
                  >
                    <li>
                      <Link
                        href="/admin/users"
                        className="block px-4 py-2.5 text-sm text-stone-200 no-underline hover:bg-stone-800"
                        onClick={closeMenus}
                      >
                        Users
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/admin/producers"
                        className="block px-4 py-2.5 text-sm text-stone-200 no-underline hover:bg-stone-800"
                        onClick={closeMenus}
                      >
                        Producers
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/admin/shows"
                        className="block px-4 py-2.5 text-sm text-stone-200 no-underline hover:bg-stone-800"
                        onClick={closeMenus}
                      >
                        Shows
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/admin/tracks"
                        className="block px-4 py-2.5 text-sm text-stone-200 no-underline hover:bg-stone-800"
                        onClick={closeMenus}
                      >
                        Tracks
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/admin/posts"
                        className="block px-4 py-2.5 text-sm text-stone-200 no-underline hover:bg-stone-800"
                        onClick={closeMenus}
                      >
                        Posts
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/admin/auto-dj-playlists"
                        className="block px-4 py-2.5 text-sm text-stone-200 no-underline hover:bg-stone-800"
                        onClick={closeMenus}
                      >
                        Auto DJ Playlists
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/admin/production-statuses"
                        className="block px-4 py-2.5 text-sm text-stone-200 no-underline hover:bg-stone-800"
                        onClick={closeMenus}
                      >
                        Kuzu Statuses
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/admin/live-chat"
                        className="block px-4 py-2.5 text-sm text-stone-200 no-underline hover:bg-stone-800"
                        onClick={closeMenus}
                      >
                        Live Chat
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}
