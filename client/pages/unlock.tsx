// pages/unlock.tsx
import React, { JSX, useState } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';

// --- Type Definitions ---
interface UnlockedContent {
  type: 'json' | 'file';
  data: any;
  fileName?: string;
}

export default function Unlock(): JSX.Element {
  const { status } = useSession({ required: true });
  const router = useRouter();

  const [cid, setCid] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [content, setContent] = useState<UnlockedContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleUnlock = async (): Promise<void> => {
    if (!cid || !password) {
      setError('Please provide both the Vault CID and the password.');
      return;
    }
    setIsLoading(true);
    setError('');
    setContent(null);
    try {
      const res = await axios.post('/api/vaults/unlock', { cid, password });
      setContent(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'An unknown error occurred while unlocking the vault.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Helper function to render content based on its type ---
  const renderUnlockedContent = () => {
    if (!content) return null;

    if (content.type === 'json') {
      return <pre className="contentPre">{JSON.stringify(content.data, null, 2)}</pre>;
    }

    if (content.type === 'file') {
        if (typeof content.data === 'string' && content.data.startsWith('data:image')) {
            return <img src={content.data} alt="Unlocked vault content" style={{ maxWidth: '100%', borderRadius: '0.5rem' }} />;
        }
        // Handle file downloads for other types
        const blob = new Blob([JSON.stringify(content.data, null, 2)], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        return <a href={url} download={content.fileName || 'vault_content'} className="downloadLink">Download File</a>;
    }

    return <p>Unsupported content type.</p>;
  };

  const cssStyles = `
    html, body {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
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
    .vaultCard { width: 100%; max-width: 448px; margin: 2rem auto 0; background-color: rgba(0, 0, 0, 0.2); backdrop-filter: blur(10px); border-radius: 1rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); padding: 2rem; border: 1px solid #334155; display: flex; flex-direction: column; gap: 1.5rem; }
    .header-card { text-align: center; }
    .title { font-size: 1.875rem; font-weight: 700; color: white; margin: 0;}
    .subtitle { color: #c4b5fd; margin-top: 0.5rem; margin-bottom: 0; }
    .form { display: flex; flex-direction: column; gap: 1rem; }
    .styledInput { width: 100%; padding: 0.75rem; background-color: rgba(15, 23, 42, 0.5); border: 1px solid #475569; border-radius: 0.5rem; color: white; transition: all 0.3s; box-sizing: border-box; }
    .styledInput::placeholder { color: #94a3b8; }
    .styledInput:focus { outline: none; box-shadow: 0 0 0 2px #a855f7; }
    .actionButton { width: 100%; padding: 0.75rem 0; background-color: #581c87; color: white; font-weight: 700; border-radius: 0.5rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .actionButton:disabled { background-color: #475569; cursor: not-allowed; }
    .errorMessage { text-align: center; color: #fcd34d; background-color: rgba(127, 29, 29, 0.5); padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #7f1d1d; }
    .contentDisplay { margin-top: 1.5rem; padding: 1rem; background-color: rgba(0, 0, 0, 0.4); border-radius: 0.5rem; text-align: left; color: white; border: 1px solid #334155; animation: fadeIn 0.5s ease-out forwards; }
    .contentPre { white-space: pre-wrap; word-wrap: break-word; font-family: monospace; font-size: 0.875rem; color: #e5e7eb; }
    .downloadLink { display: block; padding: 1rem; background-color: #581c87; text-align: center; border-radius: 0.5rem; color: white; text-decoration: none; font-weight: 600; }
  `;

  if (status === 'loading') {
    return (
        <div className="pageContainer">
            <Head>
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />
            </Head>
            <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
            <p style={{color: 'white'}}>Loading...</p>
        </div>
    );
  }

  return (
    <>
        <Head>
            <title>Unlock Vault</title>
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
            <div className="vaultCard">
                <div className="header-card">
                <h1 className="title">Unlock Vault</h1>
                <p className="subtitle">Retrieve content from a secure vault.</p>
                </div>
                <div className="form">
                <input className="styledInput" placeholder="Enter Vault CID" value={cid} onChange={(e) => setCid(e.target.value)} disabled={isLoading} />
                <input className="styledInput" type="password" placeholder="Enter vault password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                </div>
                <button className="actionButton" onClick={handleUnlock} disabled={isLoading}>
                {isLoading ? 'Unlocking...' : 'Unlock Vault'}
                </button>
                {error && <p className="errorMessage">{error}</p>}
                {content && (
                <div className="contentDisplay">
                    <p style={{ fontWeight: '600', color: 'white', marginTop: 0, marginBottom: '0.5rem' }}>Vault Content Unlocked:</p>
                    {renderUnlockedContent()}
                </div>
                )}
            </div>
        </div>
    </>
  );
}
