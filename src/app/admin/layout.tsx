import { AdminNav } from '@/components/admin/AdminNav'

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Manage your portfolio projects',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AdminNav />
      <main className="flex-1">{children}</main>
    </div>
  )
}
