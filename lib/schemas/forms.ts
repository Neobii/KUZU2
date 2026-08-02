import { z } from 'zod'

export const trackEditSchema = z.object({
  songTitle: z.string().min(1, 'Required'),
  artist: z.string().optional(),
  album: z.string().optional(),
  label: z.string().optional(),
  trackLength: z.string().optional(),
  trackType: z.enum(['song', 'talkingPoint', 'showMeta', 'producerBio', 'kuzuDefault']),
})

export const showEditSchema = z.object({
  showName: z.string().min(1),
  showStart: z.string().optional(),
  showEnd: z.string().optional(),
  defaultMeta: z.string().optional(),
  description: z.string().optional(),
  hasRadioLogikTracking: z.boolean().optional(),
  hasMessagingEnabled: z.boolean().optional(),
  autoplayOnStart: z.boolean().optional(),
  autoplayOnDate: z.boolean().optional(),
  episodeNumber: z
    .preprocess(
      (v) => {
        if (v === '' || v == null) return null
        const n = Number(v)
        return Number.isNaN(n) ? null : n
      },
      z.number().int().nullable()
    ),
  currentShowProducerMessage: z.string().nullable().optional(),
})
