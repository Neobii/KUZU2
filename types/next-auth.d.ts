import 'next-auth'

declare module 'next-auth' {
  interface User {
    id?: string
    isAdmin?: boolean
    isProducer?: boolean
    isBoardMember?: boolean
    isFieldProducer?: boolean
    isManagingArtists?: boolean
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
