'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import type { Session } from 'next-auth'
import useSWR from 'swr'
import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { canAccessProducerPortal } from '@/lib/can-access-producer-portal'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

/** Top-level items: same hit box for links and buttons. */
const navLinkClass =
  'inline-flex min-h-10 w-full items-center rounded-md border-0 bg-transparent px-3.5 py-2.5 text-left text-sm font-normal leading-5 tracking-wide text-stone-200 no-underline hover:bg-stone-800 hover:text-white md:w-auto'

const menuItemClass =
  'flex min-h-12 w-full items-center px-7 py-3 text-sm leading-5 text-stone-200 no-underline hover:bg-stone-800'

const menuPanelClass =
  'relative z-10 mt-1 min-w-[15rem] rounded-md border border-stone-700 bg-stone-900 py-2 shadow-lg md:absolute md:right-0 md:mt-2'

function Chevron() {
  return (
    <svg className="ml-1.5 h-3 w-3 shrink-0 opacity-70" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
    </svg>
  )
}

export function Header({ session: initialSession }: { session: Session | null }) {
  const { data: clientSession } = useSession()
  const session = clientSession ?? initialSession
  const [navOpen, setNavOpen] = useState(false)
  const [producerOpen, setProducerOpen] = useState(false)
  const [extrasOpen, setExtrasOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)

  const closeMenus = useCallback(() => {
    setNavOpen(false)
    setProducerOpen(false)
    setExtrasOpen(false)
    setAdminOpen(false)
  }, [])

  useEffect(() => {
    if (!navOpen) return
    const onResize = () => {
      if (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
        closeMenus()
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [navOpen, closeMenus])

  if (!session?.user) return null
  const user = session.user
  const isAdmin = user.isAdmin
  const isManagingArtists = user.isManagingArtists
  const producerProfile = user.producerProfile
  const showProducerPortal = canAccessProducerPortal(user)
  const messagingEnabled = !!producerProfile?.isMessagingUIEnabled
  const { data: unreadData } = useSWR<{ count: number }>(
    messagingEnabled ? '/api/messages/unread-count' : null,
    fetcher,
    { refreshInterval: 30_000 }
  )
  const unreadCount = unreadData?.count ?? 0

  return (
    <nav className="relative z-[1030] border-b border-stone-800 bg-stone-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2.5 text-stone-200 hover:bg-stone-800 md:hidden"
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
            'absolute left-0 right-0 top-full flex-col gap-1 border-b border-stone-800 bg-stone-950 px-4 py-3 md:static md:flex md:flex-row md:items-center md:justify-end md:gap-1 md:border-0 md:bg-transparent md:p-0',
            navOpen ? 'flex' : 'hidden md:flex'
          )}
        >
          <ul className="flex list-none flex-col gap-1 md:flex-row md:items-center md:gap-x-1 lg:gap-x-2">
            {showProducerPortal && (
              <>
                <li>
                  <Link href="/producer/shows" className={navLinkClass} onClick={closeMenus}>
                    My Shows
                  </Link>
                </li>
                <li className="relative">
                  <button
                    type="button"
                    className={navLinkClass}
                    aria-expanded={producerOpen}
                    onClick={() => {
                      setProducerOpen((o) => !o)
                      setExtrasOpen(false)
                      setAdminOpen(false)
                    }}
                  >
                    Producer
                    <Chevron />
                  </button>
                  {producerOpen && (
                    <ul className={menuPanelClass} role="menu">
                      <li>
                        <Link href="/track-imports" className={menuItemClass} onClick={closeMenus}>
                          Track Imports
                        </Link>
                      </li>
                      <li>
                        <Link href="/producer/profile" className={menuItemClass} onClick={closeMenus}>
                          Profile
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/producer/program-information"
                          className={menuItemClass}
                          onClick={closeMenus}
                        >
                          Program Information
                        </Link>
                      </li>
                      {messagingEnabled && (
                        <li>
                          <Link href="/producer/messages" className={menuItemClass} onClick={closeMenus}>
                            Messages{unreadCount > 0 ? ` (${unreadCount})` : ''}
                          </Link>
                        </li>
                      )}
                    </ul>
                  )}
                </li>
              </>
            )}

            {(isAdmin || isManagingArtists) && (
              <li>
                <Link href="/artists" className={navLinkClass} onClick={closeMenus}>
                  Artists
                </Link>
              </li>
            )}

            <li className="relative">
              <button
                type="button"
                className={navLinkClass}
                aria-expanded={extrasOpen}
                onClick={() => {
                  setExtrasOpen((o) => !o)
                  setProducerOpen(false)
                  setAdminOpen(false)
                }}
              >
                Extras
                <Chevron />
              </button>
              {extrasOpen && (
                <ul className={menuPanelClass} role="menu">
                  {(isAdmin || producerProfile?.isPioneer) && (
                    <li>
                      <Link href="/kuzu-stats" className={menuItemClass} onClick={closeMenus}>
                        Listener Stats
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link href="/calendar" className={menuItemClass} onClick={closeMenus}>
                      Calendar
                    </Link>
                  </li>
                  {(isAdmin || producerProfile?.isPioneer) && (
                    <li>
                      <Link href="/feature-requests" className={menuItemClass} onClick={closeMenus}>
                        Feature Requests
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </li>

            {isAdmin && (
              <li className="relative md:ml-3 md:border-l md:border-stone-700 md:pl-3">
                <button
                  type="button"
                  className={navLinkClass}
                  aria-expanded={adminOpen}
                  onClick={() => {
                    setAdminOpen((o) => !o)
                    setProducerOpen(false)
                    setExtrasOpen(false)
                  }}
                >
                  Admin
                  <Chevron />
                </button>
                {adminOpen && (
                  <ul className={menuPanelClass} role="menu">
                    <li>
                      <Link href="/admin/users" className={menuItemClass} onClick={closeMenus}>
                        Users
                      </Link>
                    </li>
                    <li>
                      <Link href="/admin/producers" className={menuItemClass} onClick={closeMenus}>
                        Producers
                      </Link>
                    </li>
                    <li>
                      <Link href="/admin/shows" className={menuItemClass} onClick={closeMenus}>
                        Shows
                      </Link>
                    </li>
                    <li>
                      <Link href="/admin/tracks" className={menuItemClass} onClick={closeMenus}>
                        Tracks
                      </Link>
                    </li>
                    <li>
                      <Link href="/admin/posts" className={menuItemClass} onClick={closeMenus}>
                        Posts
                      </Link>
                    </li>
                    <li>
                      <Link href="/admin/auto-dj-playlists" className={menuItemClass} onClick={closeMenus}>
                        Auto DJ Playlists
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/admin/production-statuses"
                        className={menuItemClass}
                        onClick={closeMenus}
                      >
                        Kuzu Statuses
                      </Link>
                    </li>
                    <li>
                      <Link href="/admin/live-chat" className={menuItemClass} onClick={closeMenus}>
                        Live Chat
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
            )}

            <li>
              <button
                type="button"
                className={navLinkClass}
                onClick={() => {
                  closeMenus()
                  signOut()
                }}
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}
