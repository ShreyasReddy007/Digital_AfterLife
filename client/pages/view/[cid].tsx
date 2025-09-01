// pages/view/[cid].tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Head from 'next/head';
import Image from 'next/image';

interface UnlockedFile { data: string; name: string; type: string; }
interface VaultContent { message?: string; files?: UnlockedFile[]; }

export default function ViewVaultPage() {
  const router = useRouter();
  const { cid } = router.query;
  const [content, setContent] = useState<VaultContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cid) {
      const fetchContent = async () => {
        setIsLoading(true);
        setError('');
        try {
          const res = await axios.get(`/api/vaults/public-view?cid=${cid}`);
          setContent(res.data);
        } catch (err) {
          setError('Failed to retrieve vault data. The link may be invalid or the content has been moved.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchContent();
    }
  }, [cid]);

  const renderContent = () => {
    if (!content) return null;
    const { message, files } = content;

    return (
        <>
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
        </>
    );
  };
  
  const cssStyles = `
    html, body { margin: 0; padding: 0; box-sizing: border-box; }
    .pageContainer { display: flex; flex-direction: column; min-height: 100vh; width: 100%; background: linear-gradient(to bottom right, #0f172a, #000000, #3b0764); padding: 2rem 1rem; font-family: 'Inter', sans-serif; }
    .header { position: relative; display: flex; justify-content: center; align-items: center; margin-bottom: 2rem; padding: 1rem 0; max-width: 1200px; margin-left: auto; margin-right: auto; }
    .header-title-container { display: flex; align-items: center; gap: 1rem; }
    .siteTitle { font-size: 3.25rem; font-weight: 800; margin: 0; background: linear-gradient(90deg, #a78bfa, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: transparent; }
    .card { width: 100%; max-width: 800px; margin: 2rem auto 0; background-color: rgba(0, 0, 0, 0.2); backdrop-filter: blur(10px); border-radius: 1rem; padding: 2.5rem; border: 1px solid #334155; }
    .title { font-size: 1.875rem; font-weight: 700; color: white; margin: 0 0 1rem 0; text-align: center; }
    .errorMessage { text-align: center; color: #fcd34d; }
    .contentLabel { font-weight: 600; color: white; margin: 0 0 0.5rem 0; }
    .unlockedContent {background: rgba(0, 0, 0, 0.3);padding: 1rem;border-radius: 0.5rem;white-space: pre-wrap;font-family: monospace;color: #00FF41;text-shadow:0 0 5px #00FF41,0 0 10px #00FF41,0 0 20px #00FF41,0 0 40px #00FF41;}
    .attachmentsGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1rem; }
    .attachmentItem { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
    .attachmentPreview { width: 100%; height: 120px; object-fit: cover; border-radius: 0.5rem; background-color: rgba(255, 255, 255, 0.05); }
    .fileIcon { width: 100%; height: 120px; display: flex; align-items: center; justify-content: center; background-color: rgba(255, 255, 255, 0.05); border-radius: 0.5rem; color: #94a3b8; }
    .attachmentName { font-size: 0.75rem; color: #94a3b8; text-decoration: none; word-break: break-all; text-align: center; }
  `;

  return (
    <>
      <Head><title>View Vault</title></Head>
      <div className="pageContainer">
        <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
        <header className="header">
          <div className="header-title-container">
            <Image src="/Logo.png" alt="Digital Afterlife Logo" width={150} height={150} priority={true} />
            <h1 className="siteTitle">Digital Afterlife</h1>
          </div>
        </header>
        <div className="card">
          <h1 className="title">A Vault Has Been Delivered to You</h1>
          {isLoading && <p style={{textAlign: 'center'}}>Loading vault content...</p>}
          {error && <p className="errorMessage">{error}</p>}
          {content && renderContent()}
        </div>
      </div>
    </>
  );
}
