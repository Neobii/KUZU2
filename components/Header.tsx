'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import type { Session } from 'next-auth'
import { useCallback, useEffect, useState } from 'react'

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
  const isProducer = user.isProducer
  const producerProfile = user.producerProfile
  const unreadCount = 0

  return (
    <nav className="navbar navbar-inverse">
      <div className="container-fluid">
        <div className="navbar-header">
          <button
            type="button"
            className="navbar-toggle"
            onClick={() => setNavOpen((o) => !o)}
            aria-expanded={navOpen}
            aria-controls="kuzu-navbar-collapse"
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="icon-bar" />
            <span className="icon-bar" />
            <span className="icon-bar" />
          </button>
          <Link className="navbar-brand" href="/" onClick={closeMenus}>
            KUZU
          </Link>
        </div>
        <div
          className={`navbar-collapse kuzu-nav-collapse${navOpen ? ' kuzu-nav-open' : ''}`}
          id="kuzu-navbar-collapse"
        >
          <ul className="nav navbar-nav">
            <li>
              <button
                type="button"
                onClick={() => {
                  closeMenus()
                  signOut()
                }}
                style={{ background: 'none', border: 'none', color: 'inherit', padding: '15px', cursor: 'pointer' }}
              >
                Logout
              </button>
            </li>
            {isProducer && (
              <>
                <li>
                  <Link href="/producer/shows" onClick={closeMenus}>
                    My Shows
                  </Link>
                </li>
                <li>
                  <Link href="/track-imports" onClick={closeMenus}>
                    Track Imports
                  </Link>
                </li>
                <li>
                  <Link href="/producer/profile" onClick={closeMenus}>
                    My Producer Profile
                  </Link>
                </li>
                <li>
                  <Link href="/producer/program-information" onClick={closeMenus}>
                    My Program Information
                  </Link>
                </li>
                {producerProfile?.isMessagingUIEnabled && (
                  <li>
                    <Link href="/producer/messages" onClick={closeMenus}>
                      My Messages {unreadCount || ''}
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>
          <ul className="nav navbar-nav navbar-right">
            <li className={`dropdown${extrasOpen ? ' open' : ''}`}>
              <a
                href="#"
                className="dropdown-toggle"
                onClick={(e) => {
                  e.preventDefault()
                  setExtrasOpen((o) => !o)
                  setAdminOpen(false)
                }}
              >
                Extras <b className="caret" />
              </a>
              <ul className="dropdown-menu" role="menu">
                {(isAdmin || producerProfile?.isPioneer) && (
                  <li>
                    <Link href="/kuzu-stats" onClick={closeMenus}>
                      Listener Stats
                    </Link>
                  </li>
                )}
                <li>
                  <Link href="/calendar" onClick={closeMenus}>
                    Calendar
                  </Link>
                </li>
                {(isAdmin || producerProfile?.isPioneer) && (
                  <li>
                    <Link href="/feature-requests" onClick={closeMenus}>
                      Feature Requests
                    </Link>
                  </li>
                )}
              </ul>
            </li>
            {isAdmin && (
              <li className={`dropdown${adminOpen ? ' open' : ''}`}>
                <a
                  href="#"
                  className="dropdown-toggle"
                  onClick={(e) => {
                    e.preventDefault()
                    setAdminOpen((o) => !o)
                    setExtrasOpen(false)
                  }}
                >
                  Admin <b className="caret" />
                </a>
                <ul className="dropdown-menu" role="menu">
                  <li>
                    <Link href="/admin/users" onClick={closeMenus}>
                      Users
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/producers" onClick={closeMenus}>
                      Producers
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/shows" onClick={closeMenus}>
                      Shows
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/tracks" onClick={closeMenus}>
                      Tracks
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/posts" onClick={closeMenus}>
                      Posts
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/auto-dj-playlists" onClick={closeMenus}>
                      Auto DJ Playlists
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/production-statuses" onClick={closeMenus}>
                      Kuzu Statuses
                    </Link>
                  </li>
                </ul>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}
