import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold hover:text-gray-300 transition">
            ⏱️ Time Tracker
          </Link>
          <div className="flex gap-6">
            <Link
              href="/"
              className="hover:text-gray-300 transition font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/entries"
              className="hover:text-gray-300 transition font-medium"
            >
              Entries
            </Link>
            <Link
              href="/stats"
              className="hover:text-gray-300 transition font-medium"
            >
              Stats
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
