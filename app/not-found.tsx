import Link from 'next/link';
import { Button } from '@/components/ui/Button';

/**
 * 404 Not Found page
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-subtle px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-9xl font-bold text-dim">404</h1>
        
        <h2 className="text-2xl font-bold text-heading mb-2 -mt-8">
          Page Not Found
        </h2>
        
        <p className="text-caption mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link href="/">
          <Button variant="primary" size="md">
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
