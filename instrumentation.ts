export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const {
      startListenerPolling,
      rescheduleAllAutoStartShows,
      rescheduleAllStopShows,
    } = await import('@/lib/cron')
    if (process.env.ENABLE_CRON !== 'false') {
      startListenerPolling()
      void rescheduleAllAutoStartShows()
      void rescheduleAllStopShows()
    }
  }
}
