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
        <div className="bg-[#c0a821] px-3 py-2 text-center text-stone-900">
          <p className="m-0 text-sm font-semibold sm:text-base">
            {layout.armedShow.showName} will autoplay soon after underwriting / call letter
            announcements.
          </p>
        </div>
      )}
      {radio?.down && (
        <div className="bg-[#c0a821] px-3 py-2 text-center text-stone-900">
          <p className="m-0 text-sm font-semibold sm:text-base">
            RADIO LOGIK IS DOWN, FIX IT!!!!!
          </p>
        </div>
      )}
      {layout?.activeShow && layout?.canSeeBanner && (
        <div className="bg-[#e7d0ba] px-3 py-2">
          <Link
            className="block text-center no-underline"
            href={layout.canLookAtLiveShow ? '/live-show' : '#'}
            onClick={(e) => !layout.canLookAtLiveShow && e.preventDefault()}
          >
            <div className="mx-auto max-w-4xl">
              <p className="m-0 text-sm font-semibold text-stone-800 sm:text-base">
                {layout.activeShow.showName} is Live from{' '}
                {layout.activeShow.showStart
                  ? prettifySimpleTime(layout.activeShow.showStart)
                  : ''}{' '}
                -{' '}
                {layout.activeShow.showEnd
                  ? prettifySimpleTime(layout.activeShow.showEnd)
                  : ''}
                !
              </p>
            </div>
          </Link>
        </div>
      )}
    </>
  )
}
