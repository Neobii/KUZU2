import { describe, it, expect } from 'vitest'
import { licensingTracksToPipeCsv, tracksToDelimited } from '@/lib/csv-export'

describe('licensingTracksToPipeCsv', () => {
  it('exports pipe-delimited licensing columns with NA fallbacks', () => {
    const csv = licensingTracksToPipeCsv([
      {
        playDate: new Date('2026-08-01T12:00:00.000Z'),
        songTitle: 'Song One',
        artist: null,
        album: 'Album',
        label: '',
        trackLength: '3:45',
      },
    ])

    expect(csv).toBe(
      [
        'playDate|songTitle|artist|albumName|label|trackLength',
        '2026-08-01T12:00:00.000Z|Song One|NA|Album|NA|3:45',
      ].join('\n')
    )
  })
})

describe('tracksToDelimited', () => {
  it('still supports semicolon export for general downloads', () => {
    const csv = tracksToDelimited(
      [
        {
          trackType: 'talkingPoint',
          songTitle: 'Intro',
          artist: 'Host',
          album: null,
          label: null,
          trackLength: null,
          playDate: null,
          indexNumber: 0,
        },
      ],
      ';',
      true
    )

    expect(csv.split('\n')[0]).toContain('trackType;songTitle')
    expect(csv).toContain('talkingPoint')
  })
})
