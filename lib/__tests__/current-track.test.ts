import { describe, it, expect } from 'vitest'
import {
  formatIcecastNowPlaying,
  getIcecastSource,
  type IcecastStats,
} from '@/lib/icecast'
import { formatCurrentTrackString } from '@/lib/current-track'

describe('formatIcecastNowPlaying', () => {
  it('formats separate artist and title fields', () => {
    expect(formatIcecastNowPlaying({ artist: 'zoogz rift', title: 'look at the fool' })).toBe(
      'zoogz rift - look at the fool'
    )
  })

  it('uses title as-is when it already includes the artist', () => {
    expect(
      formatIcecastNowPlaying({
        artist: 'zoogz rift',
        title: 'zoogz rift - look at the fool',
      })
    ).toBe('zoogz rift - look at the fool')
  })

  it('uses title alone when artist is missing', () => {
    expect(formatIcecastNowPlaying({ title: 'zoogz rift - look at the fool' })).toBe(
      'zoogz rift - look at the fool'
    )
  })
})

describe('getIcecastSource', () => {
  it('prefers a mount with now-playing metadata', () => {
    const data: IcecastStats = {
      icestats: {
        source: [
          { listeners: 1 },
          { listeners: 2, title: 'look at the fool', artist: 'zoogz rift' },
        ],
      },
    }
    expect(getIcecastSource(data)?.artist).toBe('zoogz rift')
  })
})

describe('formatCurrentTrackString', () => {
  it('formats artist and title like Meteor getCurrentTrack', () => {
    expect(
      formatCurrentTrackString({
        artist: 'zoogz rift',
        songTitle: 'look at the fool',
      })
    ).toBe('zoogz rift - look at the fool')
  })
})
