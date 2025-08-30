// pages/deliver.tsx
import React, { useState, JSX } from 'react';
import axios from 'axios';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';

export default function DeliverPage(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [recoveryKey, setRecoveryKey] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleDeliver = async () => {
    if (!email || !recoveryKey) {
      setError("Please enter the owner's email and the recovery key.");
      return;
    }
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await axios.post('/api/vaults/deliver-by-key', {
        email,
        recoveryKey,
      });
      setMessage(res.data.message);
    } catch (err: any) {
      setError(err.response?.data?.error || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const cssStyles = `
    html, body {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
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
    .card { width: 100%; max-width: 500px; margin: 2rem auto 0; background-color: rgba(0, 0, 0, 0.2); backdrop-filter: blur(10px); border-radius: 1rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); padding: 2rem; border: 1px solid #334155; display: flex; flex-direction: column; gap: 1.5rem; }
    .title { font-size: 1.875rem; font-weight: 700; color: white; margin: 0; text-align: center; }
    .formGroup { display: flex; flex-direction: column; gap: 0.5rem; }
    .label { color: #94a3b8; font-size: 0.875rem; }
    .styledInput { width: 100%; padding: 0.75rem; background-color: rgba(15, 23, 42, 0.5); border: 1px solid #475569; border-radius: 0.5rem; color: white; box-sizing: border-box; }
    .styledInput:focus { outline: none; box-shadow: 0 0 0 2px #a855f7; }
    .actionButton { width: 100%; padding: 0.75rem 0; background-color: #581c87; color: white; font-weight: 700; border-radius: 0.5rem; border: none; cursor: pointer; transition: background-color 0.2s; }
    .actionButton:disabled { background-color: #334155; cursor: not-allowed; }
    .errorMessage { text-align: center; color: #f87171; }
    .successMessage { text-align: center; color: #6ee7b7; }
  `;

  return (
    <>
      <Head>
        <title>Deliver Vaults</title>
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
          <h1 className="title">Deliver Vaults</h1>
          <p className="label" style={{textAlign: 'center', color: '#94a3b8'}}>Enter the original owner's email and the recovery key they provided to trigger the immediate delivery of their vaults. This action is irreversible. Do not break the trust of the actual owner.</p>
          <div className="formGroup">
            <label htmlFor="email-input" className="label">Owner's Email Address</label>
            <input 
              id="email-input" 
              type="email" 
              className="styledInput"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="formGroup">
            <label htmlFor="key-input" className="label">Recovery Key</label>
            <input 
              id="key-input" 
              type="password" 
              className="styledInput"
              value={recoveryKey}
              onChange={(e) => setRecoveryKey(e.target.value)}
            />
          </div>
          <button className="actionButton" onClick={handleDeliver} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Deliver Vaults'}
          </button>
          {error && <p className="errorMessage">{error}</p>}
          {message && <p className="successMessage">{message}</p>}
        </div>
      </div>
    </>
  );
}
