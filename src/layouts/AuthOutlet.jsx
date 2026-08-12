import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../context/AuthProvider';

export default function AuthOutlet() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
