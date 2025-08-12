import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function IndexPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Wait until the session status is determined
    if (status !== 'loading') {
      if (status === 'authenticated') {
        // If logged in, go to the create vault page
        router.replace('/create');
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
      Loading...
    </div>
  );
}
