// pages/view/[cid].tsx
import React, { useState, useEffect, JSX } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import Image from 'next/image';

interface UnlockedContent {
  message: string | null;
  file: {
    dataUrl: string;
    fileName: string;
  } | null;
}

export default function ViewVaultPage(): JSX.Element {
  const router = useRouter();
  const { cid } = router.query;

  const [content, setContent] = useState<UnlockedContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (cid && typeof cid === 'string') {
      const fetchContent = async () => {
        setIsLoading(true);
        setError('');
        try {
          const res = await axios.get(`/api/vaults/public-view?cid=${cid}`);
          setContent(res.data);
        } catch (err: any) {
          setError(err.response?.data?.error || 'Could not load vault content.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchContent();
    }
  }, [cid]);

  const renderContent = () => {
    if (!content) return null;
    const { message, file } = content;
    return (
      <>
        {message && (
          <div className="unlockedMessage">
            <p className="unlockedContentLabel">Message:</p>
            <p>{message}</p>
          </div>
        )}
        {file && (
          <div className="unlockedFile">
            <p className="unlockedContentLabel">Attached File:</p>
            {file.dataUrl.startsWith('data:image') ? (
              <img src={file.dataUrl} alt={file.fileName} style={{ maxWidth: '100%', borderRadius: '0.5rem', marginTop: '0.5rem' }} />
            ) : (
              <a href={file.dataUrl} download={file.fileName} className="downloadLink">
                Download {file.fileName}
              </a>
            )}
          </div>
        )}
      </>
    );
  };

  const cssStyles = `
    html, body { margin: 0; padding: 0; box-sizing: border-box; }
    .pageContainer { min-height: 100vh; width: 100%; background: linear-gradient(to bottom right, #0f172a, #000000, #3b0764); display: flex; align-items: center; justify-content: center; padding: 1rem; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .card { width: 100%; max-width: 600px; background-color: rgba(0, 0, 0, 0.2); backdrop-filter: blur(10px); border-radius: 1rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); padding: 2.5rem; border: 1px solid #334155; color: white; }
    .header { display: flex; flex-direction: column; align-items: center; gap: 1rem; margin-bottom: 2rem; }
    .siteTitle { font-size: 2.5rem; font-weight: 800; margin: 0; background: linear-gradient(90deg, #a78bfa, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: transparent; }
    .contentContainer { margin-top: 1.5rem; }
    .errorMessage { text-align: center; color: #f87171; }
    .unlockedContentLabel { font-weight: 600; color: #e8ebeeff; margin-bottom: 0.5rem; }
    .unlockedMessage { background-color: rgba(0,0,0,0.2); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; }
    .unlockedMessage p:last-of-type {margin: 0; white-space: pre-wrap; font-family: monospace; color: #00FF41; text-shadow: 0 0 5px #00FF41;}
    .downloadLink { display: block; padding: 1rem; background-color: #581c87; text-align: center; border-radius: 0.5rem; color: white; text-decoration: none; }
  `;

  return (
    <>
      <Head>
        <title>View Vault - Digital Afterlife</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />
      </Head>
      <div className="pageContainer">
        <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
        <div className="card">
          <header className="header">
            <Image src="/Logo.png" alt="Digital Afterlife Logo" width={100} height={100} />
            <h1 className="siteTitle">Digital Afterlife</h1>
          </header>
          {isLoading && <p style={{ textAlign: 'center' }}>Loading Vault...</p>}
          {error && <p className="errorMessage">{error}</p>}
          {content && <div className="contentContainer">{renderContent()}</div>}
        </div>
      </div>
    </>
  );
}

