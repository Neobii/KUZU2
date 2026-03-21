'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { prettifySimpleTime } from '@/lib/utils-client'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function LayoutBanners() {
  const pathname = usePathname()
  const { data: radio } = useSWR('/api/radio-logik/status', fetcher, {
    refreshInterval: 5000,
  })
  const { data: layout } = useSWR('/api/layout/banners', fetcher, {
    refreshInterval: 5000,
  })

  if (pathname === '/live-show') return null

  return (
    <>
      {layout?.armedShow && (
        <div
          style={{
            backgroundColor: '#c0a821',
            marginTop: -21,
            padding: '15px 5px',
            textAlign: 'center',
          }}
        >
          <h3>
            {layout.armedShow.showName} will autoplay soon after underwriting / call letter
            announcements.
          </h3>
        </div>
      )}
      {radio?.down && (
        <div
          style={{
            backgroundColor: '#c0a821',
            marginTop: -21,
            padding: '15px 5px',
            textAlign: 'center',
          }}
        >
          <h3>RADIO LOGIK IS DOWN, FIX IT!!!!!</h3>
        </div>
      )}
      {layout?.activeShow && layout?.canSeeBanner && (
        <div
          style={{
            backgroundColor: '#e7d0ba',
            marginTop: -21,
            padding: '15px 5px',
          }}
        >
          <Link
            style={{ textAlign: 'center', display: 'block' }}
            href={layout.canLookAtLiveShow ? '/live-show' : '#'}
            onClick={(e) => !layout.canLookAtLiveShow && e.preventDefault()}
          >
            <div className="mx-auto max-w-4xl px-3">
              <h3 className="mt-2.5 text-stone-800">
                {layout.activeShow.showName} is Live from{' '}
                {layout.activeShow.showStart
                  ? prettifySimpleTime(layout.activeShow.showStart)
                  : ''}{' '}
                -{' '}
                {layout.activeShow.showEnd
                  ? prettifySimpleTime(layout.activeShow.showEnd)
                  : ''}
                !
              </h3>
            </div>
          </Link>
        </div>
      )}
    </>
  )
}
