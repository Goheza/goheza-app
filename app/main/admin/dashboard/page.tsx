

import AdminAccessGate from '@/components/admin/AdminAccessGate';
import AdminDashboardPage from '@/components/admin/AdminDashboardPage';

export default function SecuredAdminPage() {
    return (
        <AdminAccessGate>
            {/* Your actual dashboard content is protected by the gate */}
            <AdminDashboardPage />
        </AdminAccessGate>
    );
}


