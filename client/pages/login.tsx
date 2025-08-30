// File: pages/login.tsx
import React, { JSX,useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';

export default function LoginPage(): JSX.Element {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard'); 
    }
  }, [status, router]);

  const cssStyles = `
    html, body {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    .pageContainer {
      min-height: 100vh;
      width: 100%;
      background: linear-gradient(to bottom right, #0f172a, #000000, #3b0764);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      gap: 2rem;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif;
    }
    .header-title-container {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .siteTitle {
      font-size: 3.25rem;
      font-weight: 800;
      margin: 0;
      background: linear-gradient(90deg, #a78bfa, #7c3aed);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      color: transparent;
    }
    .loginCard {
      width: 100%;
      max-width: 400px;
      background-color: rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      padding: 2.5rem;
      border: 1px solid #334155;
      text-align: center;
      color: white;
    }
    .title {
      font-size: 2.25rem;
      font-weight: 700;
      margin: 0;
    }
    .subtitle {
      color: #c4b5fd;
      margin-top: 0.75rem;
      margin-bottom: 2rem;
    }
    .googleButton {
      width: 100%;
      padding: 0.75rem 1rem;
      background-color: #fff;
      color: #1f2937;
      font-weight: 600;
      border-radius: 0.5rem;
      border: none;
      transition: all 0.3s;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      font-size: 1rem;
    }
    .googleButton:hover {
      background-color: #f3f4f6;
    }
  `;

  // Render a loading state while the session is being checked.
  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="pageContainer">
        <Head>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" />
        </Head>
        <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
        <p style={{ color: 'white' }}>Loading...</p>
      </div>
    );
  }

  return (
    <>
        <Head>
            <title>Login - Digital Afterlife</title>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" />
        </Head>
        <div className="pageContainer">
        <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
        
        <header className="header-title-container">
            <Image src="/Logo.png" alt="Digital Afterlife Logo" width={150} height={150} />
            <h1 className="siteTitle">Digital Afterlife</h1>
        </header>

        <div className="loginCard">
            <h1 className="title">Welcome</h1>
            <p className="subtitle">Sign in to manage your vaults.</p>
            <button className="googleButton" onClick={() => signIn('google')}>
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
            Sign in with Google
            </button>
        </div>
        </div>
    </>
  );
}