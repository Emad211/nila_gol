import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';

// Gates admin pages: waits for the session check, then requires a logged-in
// user who is in the admins allowlist. Everyone else is sent to the login page.
export default function ProtectedRoute({ children }) {
  const { session, isAdmin, loading, checkingAdmin } = useAuth();

  if (loading || checkingAdmin) {
    return <div className="admin-gate">در حال بررسی دسترسی…</div>;
  }

  if (!session || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
