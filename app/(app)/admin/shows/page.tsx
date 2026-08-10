import { PageHeader } from '@/components/ui/PageHeader'
import { AdminShowsClient } from '@/components/admin/AdminShowsClient'

export default function AdminShowsPage() {
  return (
    <div>
      <PageHeader
        title="Admin Shows"
        description="Search and manage all station shows."
      />
      <AdminShowsClient />
    </div>
  )
}
