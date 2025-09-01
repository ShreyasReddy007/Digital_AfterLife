// pages/unlock.tsx
import React, { JSX, useState } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';

interface UnlockedFile { data: string; name: string; type: string; }
interface UnlockedContent { message?: string; files?: UnlockedFile[]; }

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
      setError(err.response?.data?.error || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderUnlockedContent = () => {
    if (!content) return null;
    const { message, files } = content;
    if (!message && (!files || files.length === 0)) return <p>This vault is empty.</p>;

    return (
        <div>
            {message && (
                <div>
                    <p className="contentLabel">Message:</p>
                    <pre className="unlockedContent">{message}</pre>
                </div>
            )}
            {files && files.length > 0 && (
                <div style={{ marginTop: message ? '1.5rem' : '0' }}>
                    <p className="contentLabel">Attachments:</p>
                    <div className="attachmentsGrid">
                        {files.map((file, index) => (
                            <div key={index} className="attachmentItem">
                                {file.type.startsWith('image/') ? (
                                    <img src={file.data} alt={file.name} className="attachmentPreview" />
                                ) : (
                                    <div className="fileIcon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                                    </div>
                                )}
                                <a href={file.data} download={file.name} className="attachmentName">{file.name}</a>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
  };

  const cssStyles = `
    html, body { margin: 0; padding: 0; box-sizing: border-box; }
    .pageContainer { display: flex; flex-direction: column; min-height: 100vh; width: 100%; background: linear-gradient(to bottom right, #0f172a, #000000, #3b0764); padding: 2rem 1rem; font-family: 'Inter', sans-serif; }
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
    .header-title-container { display: flex; align-items: center; gap: 1rem; }
    .siteTitle { font-size: 3.25rem; font-weight: 800; margin: 0; background: linear-gradient(90deg, #a78bfa, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: transparent; }
    .backButton { 
    position: absolute;     
    right: -250px;
    top: 50%; 
    transform: translateY(-50%); 
    background: none; 
    border: 1px solid #475569; 
    color: #d8e3f3ff; 
    padding: 0.5rem 1rem; 
    border-radius: 0.5rem; 
    cursor: pointer; 
    transition: background-color 0.2s, color 0.2s; 
}
    .backButton:hover { background-color: #475569; color: white; }
    .vaultCard { width: 100%; max-width: 448px; margin: 2rem auto 0; background-color: rgba(0, 0, 0, 0.2); backdrop-filter: blur(10px); border-radius: 1rem; padding: 2rem; border: 1px solid #334155; }
    .title { font-size: 1.875rem; font-weight: 700; color: white; margin: 0; text-align: center; }
    .subtitle { color: #c4b5fd; margin-top: 0.5rem; margin-bottom: 2rem; text-align: center; }
    .form { display: flex; flex-direction: column; gap: 1rem; }
    .styledInput { width: 100%; padding: 0.75rem; background-color: rgba(15, 23, 42, 0.5); border: 1px solid #475569; border-radius: 0.5rem; color: white; }
    .actionButton { width: 100%; padding: 0.75rem 0; background-color: #581c87; color: white; font-weight: 700; border-radius: 0.5rem; border: none; cursor: pointer; }
    .errorMessage { margin-top: 1rem; text-align: center; color: #fcd34d; }
    .contentDisplay { margin-top: 1.5rem; padding: 1rem; background-color: rgba(0, 0, 0, 0.4); border-radius: 0.5rem; }
    .contentLabel { font-weight: 600; color: white; margin: 0 0 0.5rem 0; }
    .unlockedContent {background: rgba(0, 0, 0, 0.3);padding: 1rem;border-radius: 0.5rem;white-space: pre-wrap;font-family: monospace;color: #00FF41;text-shadow:0 0 5px #00FF41,0 0 10px #00FF41,0 0 20px #00FF41,0 0 40px #00FF41;}
    .attachmentsGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 1rem; }
    .attachmentItem { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
    .attachmentPreview { width: 100%; height: 100px; object-fit: cover; border-radius: 0.5rem; background-color: rgba(255, 255, 255, 0.05); }
    .fileIcon { width: 100%; height: 100px; display: flex; align-items: center; justify-content: center; background-color: rgba(255, 255, 255, 0.05); border-radius: 0.5rem; color: #94a3b8; }
    .attachmentName { font-size: 0.75rem; color: #94a3b8; text-decoration: none; word-break: break-all; text-align: center; }
  `;

  if (status === 'loading') return <div className="pageContainer"><p style={{color: 'white'}}>Loading...</p></div>;

  return (
    <>
      <Head>
        <title>Unlock Vault</title>
      </Head>
      <div className="pageContainer">
        <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
        <header className="header">
          <div className="header-title-container">
            <Image src="/Logo.png" alt="Digital Afterlife Logo" width={150} height={150} priority={true} />
            <h1 className="siteTitle">Digital Afterlife</h1>
          </div>
          <button className="backButton" onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
        </header>
        <div className="vaultCard">
          <h1 className="title">Unlock a Vault</h1>
          <p className="subtitle">Enter a vault's CID and password to view its content.</p>
          <div className="form">
            <input 
              className="styledInput" 
              placeholder="Enter Vault CID" 
              value={cid} 
              onChange={(e) => setCid(e.target.value)} 
              disabled={isLoading} 
            />
            <input 
              className="styledInput" 
              type="password" 
              placeholder="Enter vault password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              disabled={isLoading} 
            />
          </div>
          <button className="actionButton" onClick={handleUnlock} disabled={isLoading}>
            {isLoading ? 'Unlocking...' : 'Unlock Vault'}
          </button>
          {error && <p className="errorMessage">{error}</p>}
          {content && <div className="contentDisplay">{renderUnlockedContent()}</div>}
        </div>
      </div>
    </>
  );
}

