import Sidebar from './components/Sidebar';

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <Sidebar />
      <div className="ml-64 p-6">
        <h1 className="text-2xl font-bold text-white mb-4">Welcome to Gmail Assistant</h1>
        {/* Add home page content here */}
      </div>
    </main>
  );
}
