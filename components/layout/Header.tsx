import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-card shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-heading">
              MyApp
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-body hover:text-heading px-3 py-2 rounded-md text-sm font-medium">
              Dashboard
            </Link>
            <Link href="/login" className="text-body hover:text-heading px-3 py-2 rounded-md text-sm font-medium">
              Login
            </Link>
            <Link href="/register" className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
