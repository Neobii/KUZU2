import 'next-auth'

declare module 'next-auth' {
  interface User {
    id?: string
    isAdmin?: boolean
    isProducer?: boolean
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
