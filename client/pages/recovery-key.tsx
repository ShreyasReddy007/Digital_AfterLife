// pages/recovery-key.tsx
import React, { useState, useEffect, JSX } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import Image from 'next/image';

export default function RecoveryKeyPage(): JSX.Element {
  const { status } = useSession({ required: true, onUnauthenticated() { router.push('/login') } });
  const router = useRouter();

  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [recoveryKey, setRecoveryKey] = useState<string>('');
  const [confirmationKey, setConfirmationKey] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [keyCopied, setKeyCopied] = useState<boolean>(false);

  // Check if a key exists on page load
  useEffect(() => {
    const checkKeyStatus = async () => {
      try {
        const res = await axios.get('/api/user/recovery-key-status');
        setHasKey(res.data.hasKey);
      } catch (err) {
        setError('Could not verify recovery key status.');
      }
    };
    if (status === 'authenticated') {
      checkKeyStatus();
    }
  }, [status]);

const generateRecoveryKey = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  const key = hex.match(/.{1,8}/g)!.join('-');
  setRecoveryKey(key);
  setConfirmationKey('');
  setMessage('');
  setError('');
  setKeyCopied(false);
};

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(recoveryKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const handleSetKey = async () => {
    if (recoveryKey !== confirmationKey) {
      setError('The confirmation key does not match the generated key.');
      return;
    }
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      await axios.post('/api/user/set-recovery-key', { recoveryKey });
      setMessage('Your recovery key has been set successfully. You will be redirected to the dashboard.');
      setTimeout(() => router.push('/dashboard'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set recovery key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKey = async () => {
    setIsLoading(true);
    setError('');
    try {
      await axios.post('/api/user/delete-recovery-key');
      setHasKey(false);
      setMessage('Your old key has been deleted. You can now generate a new one.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete recovery key.');
    } finally {
      setIsLoading(false);
    }
  };

  const cssStyles = `
    html, body { margin: 0; padding: 0; box-sizing: border-box; }
    .pageContainer { min-height: 100vh; width: 100%; background: linear-gradient(to bottom right, #0f172a, #000000, #3b0764); padding: 2rem 1rem; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .header {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 2rem;
      padding: 1rem 0;
      max-width: 1200px;
      margin-left: auto;
      margin-right: auto;
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
    .backButton {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: 1px solid #475569;
      color: #94a3b8;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: background-color 0.2s, color 0.2s;
    }
    .backButton:hover { background-color: #475569; color: white; }
    .card { width: 100%; max-width: 600px; margin: 2rem auto 0; background-color: rgba(0, 0, 0, 0.2); backdrop-filter: blur(10px); border-radius: 1rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); padding: 2rem; border: 1px solid #334155; display: flex; flex-direction: column; gap: 1.5rem; }
    .title { font-size: 1.875rem; font-weight: 700; color: white; margin: 0; text-align: center; }
    .description { text-align: center; color: #94a3b8; margin-top: -0.5rem; }
    .formGroup { display: flex; flex-direction: column; gap: 0.5rem; }
    .label { color: #94a3b8; font-size: 0.875rem; }
    .styledInput { width: 100%; padding: 0.75rem; background-color: rgba(15, 23, 42, 0.5); border: 1px solid #475569; border-radius: 0.5rem; color: white; box-sizing: border-box; }
    .actionButton { width: 100%; padding: 0.75rem 0; background-color: #581c87; color: white; font-weight: 700; border-radius: 0.5rem; border: none; cursor: pointer; transition: background-color 0.2s; }
    .actionButton:disabled { background-color: #334155; cursor: not-allowed; }
    .secondaryButton { background-color: transparent; border: 1px solid #475569; }
    .deleteButton { background-color: #be123c; }
    .keyDisplay { background-color: #0f172a; border: 1px solid #475569; border-radius: 0.5rem; padding: 1rem; text-align: center; font-family: monospace; font-size: 1.25rem; letter-spacing: 2px; color: #a5b4fc; display: flex; justify-content: space-between; align-items: center; }
    .copyButton { background: none; border: none; color: #94a3b8; cursor: pointer; }
    .warning { background-color: rgba(252, 211, 77, 0.1); border: 1px solid #fcd34d; color: #fcd34d; padding: 1rem; border-radius: 0.5rem; text-align: center; }
    .infoBox { background-color: rgba(59, 130, 246, 0.1); border: 1px solid #3b82f6; color: #93c5fd; padding: 1rem; border-radius: 0.5rem; text-align: center; }
    .errorMessage { text-align: center; color: #f87171; }
    .successMessage { text-align: center; color: #6ee7b7; }
  `;

  const renderContent = () => {
    if (hasKey === null) {
      return <p style={{ textAlign: 'center' }}>Checking status...</p>;
    }

    if (hasKey) {
      return (
        <>
          <div className="infoBox">
            <strong>A recovery key is already active for your account.</strong>
            <p style={{ margin: '0.5rem 0 0' }}>For security, you must delete your old key before creating a new one. This will invalidate the previous key.</p>
          </div>
          <button className="actionButton deleteButton" onClick={handleDeleteKey} disabled={isLoading}>
            {isLoading ? 'Deleting...' : 'Delete and Create New Key'}
          </button>
        </>
      );
    }
    return (
      <>
        <button className="actionButton secondaryButton" onClick={generateRecoveryKey}>
          {recoveryKey ? 'Generate New Key' : 'Generate Key'}
        </button>
        {recoveryKey && (
          <>
            <div className="warning">
              <strong>Important:</strong> Save this key somewhere safe and offline. You will not be shown this key again.
            </div>
            <div className="formGroup">
              <label className="label">Your New Recovery Key</label>
              <div className="keyDisplay">
                <span>{recoveryKey}</span>
                <button className="copyButton" onClick={handleCopyToClipboard} title="Copy to clipboard">
                  {keyCopied ? 'Copied!' :
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" /><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zM-1 2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z" /></svg>
                  }
                </button>
              </div>
            </div>
            <div className="formGroup">
              <label htmlFor="key-confirm" className="label">Confirm Your Recovery Key</label>
              <input id="key-confirm" type="text" className="styledInput" placeholder="Type the key here to confirm you've saved it" value={confirmationKey} onChange={(e) => setConfirmationKey(e.target.value)} />
            </div>
            <button className="actionButton" onClick={handleSetKey} disabled={isLoading || recoveryKey !== confirmationKey}>
              {isLoading ? 'Saving...' : 'Save and Activate Key'}
            </button>
          </>
        )}
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Set Recovery Key</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />
      </Head>
      <div className="pageContainer">
        <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
        <header className="header">
          <div className="header-title-container">
            <Image src="/Logo.png" alt="Digital Afterlife Logo" width={150} height={150} />
            <h1 className="siteTitle">Digital Afterlife</h1>
          </div>
          <button className="backButton" onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
        </header>
        <div className="card">
          <h1 className="title">Set Your Recovery Key</h1>
          <p className="description">Generate a one-time key to give to a trusted person. This key can be used to trigger the delivery of your vaults in an emergency.</p>
          {renderContent()}
          {error && <p className="errorMessage">{error}</p>}
          {message && <p className="successMessage">{message}</p>}
        </div>
      </div>
    </>
  );
}

