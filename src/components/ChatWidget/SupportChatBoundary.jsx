import { AuthProvider } from '../../context/AuthProvider';
import ChatWidget from './ChatWidget';

export default function SupportChatBoundary() {
  return (
    <AuthProvider>
      <ChatWidget />
    </AuthProvider>
  );
}
