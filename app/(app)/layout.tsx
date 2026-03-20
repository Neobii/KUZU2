import { HomeLayout } from '@/components/HomeLayout'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <HomeLayout>{children}</HomeLayout>
}
