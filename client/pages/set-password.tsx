// pages/set-password.tsx
import React, { useState, useEffect, JSX } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import Image from 'next/image';

const PasswordStrengthIndicator = ({ password }: { password: string }) => {
    const checks = {
        length: password.length >= 11,
        uppercase: /[A-Z]/.test(password),
        digit: /[0-9]/.test(password),
        symbol: /[^A-Za-z0-9]/.test(password),
    };
    const Requirement = ({ label, met }: { label: string, met: boolean }) => (
        <li style={{ color: met ? '#6ee7b7' : '#94a3b8', transition: 'color 0.3s', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '0.5rem', lineHeight: '1' }}>{met ? '✓' : '○'}</span>{label}
        </li>
    );
    return (
        <div className="strengthIndicator">
            <ul style={{ listStyleType: 'none', margin: 0, padding: 0, fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <Requirement met={checks.length} label="At least 11 characters" />
                <Requirement met={checks.uppercase} label="At least one uppercase letter" />
                <Requirement met={checks.digit} label="At least one digit" />
                <Requirement met={checks.symbol} label="At least one symbol" />
            </ul>
        </div>
    );
};

export default function SetPasswordPage(): JSX.Element {
  const router = useRouter();
  const { data: session, status, update } = useSession({ required: true, onUnauthenticated() { router.push('/login') } });
  
  const [password, setPassword] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const hasLength = password.length >= 11;
    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    setIsPasswordValid(hasLength && hasUppercase && hasDigit && hasSymbol);
  }, [password]);

  const handleSetPassword = async () => {
    if (!isPasswordValid) {
      setError('Password does not meet the strength requirements.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('/api/auth/set-password', { password });
      
      await update();

      setSuccess('Your secondary password has been set! Redirecting...');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const cssStyles = `
    html, body { margin: 0; padding: 0; box-sizing: border-box; }
    .pageContainer { display: flex; flex-direction: column; min-height: 100vh; width: 100%; background: linear-gradient(to bottom right, #0f172a, #000000, #3b0764); padding: 2rem 1rem; font-family: 'Inter', sans-serif; }
    .header { position: relative; display: flex; justify-content: center; align-items: center; margin-bottom: 2rem; padding: 1rem 0; max-width: 1200px; margin-left: auto; margin-right: auto; }
    .header-title-container { display: flex; align-items: center; gap: 1rem; }
    .siteTitle { font-size: 3.25rem; font-weight: 800; margin: 0; background: linear-gradient(90deg, #a78bfa, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: transparent; }
    .backButton { position: absolute; right: 0; top: 50%; transform: translateY(-50%); background: none; border: 1px solid #475569; color: #94a3b8; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; }
    .card { width: 100%; max-width: 500px; margin: 2rem auto 0; background-color: rgba(0, 0, 0, 0.2); backdrop-filter: blur(10px); border-radius: 1rem; padding: 2.5rem; border: 1px solid #334155; }
    .title { font-size: 1.875rem; font-weight: 700; color: white; margin: 0; text-align: center; }
    .styledInput { width: 100%; padding: 0.75rem 1rem; background-color: rgba(15, 23, 42, 0.5); border: 1px solid #475569; border-radius: 0.5rem; color: white; box-sizing: border-box; }
    .actionButton { width: 100%; padding: 0.75rem 0; background-color: #581c87; color: white; font-weight: 700; border-radius: 0.5rem; border: none; cursor: pointer; }
    .actionButton:disabled { background-color: #374151; cursor: not-allowed; }
    .strengthIndicator { background-color: rgba(15, 23, 42, 0.5); padding: 1rem; border-radius: 0.5rem; margin-top: 1rem; }
    .errorMessage, .successMessage { margin-top: 1rem; text-align: center; }
    .errorMessage { color: #f87171; }
    .successMessage { color: #6ee7b7; }
  `;

  if (status === 'loading') return <div className="pageContainer"><p>Loading...</p></div>;

  return (
    <>
      <Head><title>Set Secondary Password</title></Head>
      <div className="pageContainer">
        <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
        <header className="header">
          <div className="header-title-container">
            <Image src="/Logo.png" alt="Digital Afterlife Logo" width={150} height={150} priority={true} />
            <h1 className="siteTitle">Digital Afterlife</h1>
          </div>
          <button className="backButton" onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
        </header>
        <div className="card">
          <h1 className="title">Set Secondary Password</h1>
          <p style={{textAlign: 'center', color: '#94a3b8'}}>Create a strong password to add an extra layer of security. This will be required each time you log in.</p>
          <input className="styledInput" type="password" placeholder="Enter new password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <PasswordStrengthIndicator password={password} />
          <button className="actionButton" style={{marginTop: '1.5rem'}} onClick={handleSetPassword} disabled={isLoading || !isPasswordValid}>
            {isLoading ? 'Saving...' : 'Set Password'}
          </button>
          {error && <p className="errorMessage">{error}</p>}
          {success && <p className="successMessage">{success}</p>}
        </div>
      </div>
    </>
  );
}

