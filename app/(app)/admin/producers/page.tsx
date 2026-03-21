import { AdminProducersClient } from '@/components/admin/AdminProducersClient'

export default function AdminProducersPage() {
  return (
    <div>
      <h2>Producers</h2>
      <p className="mb-4 text-sm text-stone-500">Users with producer flag (same as Users — filtered).</p>
      <AdminProducersClient />
    </div>
  )
}
