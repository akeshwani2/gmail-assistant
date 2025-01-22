import Sidebar from '../components/Sidebar';
import ChatInterface from '../components/ChatInterface';

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-black">
      <Sidebar />
      <ChatInterface />
    </main>
  );
}