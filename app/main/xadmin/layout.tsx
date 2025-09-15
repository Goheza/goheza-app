import AdminGuard from '@/components/admin/AdminGuard'
import AdminNav from '@/components/admin/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        // <AdminGuard>
            <div className="min-h-screen bg-gray-50">
                <AdminNav />
                <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
            </div>
        // </AdminGuard>
    )
}
