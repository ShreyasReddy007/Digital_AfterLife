// pages/unlock.tsx
import React, { JSX, useState } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';

export default function Unlock(): JSX.Element {
  const { status } = useSession({ required: true });

  const [cid, setCid] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [content, setContent] = useState<any | null>(null);
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
      // **KEY CHANGE: Calling the real backend API**
      const res = await axios.post('/api/vaults/unlock', { cid, password });
      setContent(res.data.content);
    } catch (err: any) {
      setError(err.response?.data?.error || 'An unknown error occurred while unlocking the vault.');
    } finally {
      setIsLoading(false);
    }
  };

  const cssStyles = `
    /* Same styles as before for consistency */
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .pageContainer { min-height: 100vh; width: 100%; background: linear-gradient(to bottom right, #0f172a, #000000, #3b0764); display: flex; align-items: center; justify-content: center; padding: 1rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .vaultCard { width: 100%; max-width: 448px; background-color: rgba(0, 0, 0, 0.2); backdrop-filter: blur(10px); border-radius: 1rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); padding: 2rem; border: 1px solid #334155; display: flex; flex-direction: column; gap: 1.5rem; }
    .header { text-align: center; }
    .title { font-size: 1.875rem; font-weight: 700; color: white; margin: 0;}
    .subtitle { color: #c4b5fd; margin-top: 0.5rem; margin-bottom: 0; }
    .form { display: flex; flex-direction: column; gap: 1rem; }
    .styledInput { width: 100%; padding: 0.75rem; background-color: rgba(15, 23, 42, 0.5); border: 1px solid #475569; border-radius: 0.5rem; color: white; transition: all 0.3s; box-sizing: border-box; }
    .styledInput::placeholder { color: #94a3b8; }
    .styledInput:focus { outline: none; box-shadow: 0 0 0 2px #a855f7; }
    .actionButton { width: 100%; padding: 0.75rem 0; background-color: #581c87; color: white; font-weight: 700; border-radius: 0.5rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .actionButton:hover { background-color: #6b21a8; }
    .actionButton:disabled { background-color: #475569; cursor: not-allowed; }
    .errorMessage { text-align: center; color: #fcd34d; background-color: rgba(127, 29, 29, 0.5); padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #7f1d1d; }
    .contentDisplay { margin-top: 1.5rem; padding: 1rem; background-color: rgba(0, 0, 0, 0.4); border-radius: 0.5rem; text-align: left; color: white; border: 1px solid #334155; animation: fadeIn 0.5s ease-out forwards; }
    .contentPre { white-space: pre-wrap; word-wrap: break-word; font-family: monospace; font-size: 0.875rem; color: #d1d5db; }
  `;

  if (status === 'loading') {
    return <div className="pageContainer"><style dangerouslySetInnerHTML={{ __html: cssStyles }} /><p style={{color: 'white'}}>Loading...</p></div>;
  }

  return (
    <div className="pageContainer">
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      <div className="vaultCard">
        <div className="header">
          <h1 className="title">Unlock Vault</h1>
          <p className="subtitle">Retrieve a message from the other side.</p>
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
            <pre className="contentPre">{JSON.stringify(content, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
