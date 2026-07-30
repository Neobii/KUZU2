import 'next-auth'

declare module 'next-auth' {
  interface User {
    id?: string
    isAdmin?: boolean
    isProducer?: boolean
    isBoard?: boolean
    isStudioMonitor?: boolean
    producerProfile?: {
      isMessagingUIEnabled?: boolean
      isPioneer?: boolean
    }
  }

  interface Session {
    user: User & {
      id: string
    }
  }
}
