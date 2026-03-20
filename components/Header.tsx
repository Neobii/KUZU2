'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import type { Session } from 'next-auth'

export function Header({ session }: { session: Session | null }) {
  if (!session?.user) return null
  const user = session.user
  const isAdmin = user.isAdmin
  const isProducer = user.isProducer
  const producerProfile = user.producerProfile
  const unreadCount = 0

  return (
    <nav className="navbar navbar-inverse">
      <Link className="navbar-brand" href="/">
        KUZU
      </Link>
      <div className="container-fluid">
        <div className="navbar-header">
          <button
            type="button"
            className="navbar-toggle collapsed"
            data-toggle="collapse"
            data-target="#bs-example-navbar-collapse-1"
            aria-expanded="false"
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="icon-bar" />
            <span className="icon-bar" />
            <span className="icon-bar" />
          </button>
        </div>
        <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
          <ul className="nav navbar-nav">
            <li>
              <button onClick={() => signOut()} style={{ background: 'none', border: 'none', color: 'inherit', padding: '15px', cursor: 'pointer' }}>
                Logout
              </button>
            </li>
            {isProducer && (
              <>
                <li><Link href="/producer/shows">My Shows</Link></li>
                <li><Link href="/producer/profile">My Producer Profile</Link></li>
                <li><Link href="/producer/program-information">My Program Information</Link></li>
                {producerProfile?.isMessagingUIEnabled && (
                  <li><Link href="/producer/messages">My Messages {unreadCount || ''}</Link></li>
                )}
              </>
            )}
          </ul>
          <ul className="nav navbar-nav navbar-right">
            <li className="dropdown">
              <a className="dropdown-toggle" data-toggle="dropdown">Extras <b className="caret" /></a>
              <ul className="dropdown-menu" role="menu">
                {(isAdmin || producerProfile?.isPioneer) && (
                  <li><Link href="/kuzu-stats">Listener Stats</Link></li>
                )}
                <li><Link href="/calendar">Calendar</Link></li>
                {(isAdmin || producerProfile?.isPioneer) && (
                  <li><Link href="/feature-requests">Feature Requests</Link></li>
                )}
              </ul>
            </li>
            {isAdmin && (
              <li className="dropdown">
                <a className="dropdown-toggle" data-toggle="dropdown">Admin <b className="caret" /></a>
                <ul className="dropdown-menu" role="menu">
                  <li><Link href="/admin/users">Users</Link></li>
                  <li><Link href="/admin/shows">Shows</Link></li>
                  <li><Link href="/admin/tracks">Tracks</Link></li>
                  <li><Link href="/admin/auto-dj-playlists">Auto DJ Playlists</Link></li>
                  <li><Link href="/admin/production-statuses">Kuzu Statuses</Link></li>
                </ul>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}
