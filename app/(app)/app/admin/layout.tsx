import AdminAccessGate from '@/components/workspace/pages/admin/AdminAccessGate'

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminAccessGate>
            <div>{children}</div>
        </AdminAccessGate>
    )
}
