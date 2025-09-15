import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function IndexPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'loading') {
      if (status === 'authenticated') {
        router.replace('/dashboard');
      } else {
        // If not logged in, go to the login page
        router.replace('/login');
      }
    }
  }, [status, router]);

  // Render a simple loading screen while the check is happening
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#000',
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
    Hold Tight...
    </div>
  );
}
