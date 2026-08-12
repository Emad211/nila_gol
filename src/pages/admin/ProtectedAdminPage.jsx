import ProtectedRoute from '../../components/admin/ProtectedRoute';
import AdminDashboard from './AdminDashboard';

export default function ProtectedAdminPage() {
  return (
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
