

import AdminAccessGate from '@/components/workspace/pages/admin/AdminAccessGate';
import AdminDashboardPage from '@/components/workspace/pages/admin/AdminDashboardPage';

export default function SecuredAdminPage() {
    return (
        <AdminAccessGate>
            {/* Your actual dashboard content is protected by the gate */}
            <AdminDashboardPage />
        </AdminAccessGate>
    );
}


