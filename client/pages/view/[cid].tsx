import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Head from 'next/head';
import Image from 'next/image';

// --- TYPE DEFINITIONS ---
interface UnlockedFile {
  data: string;
  name: string;
  type: string;
}
interface VaultContent {
  message?: string;
  files?: UnlockedFile[];
}

// --- COMPONENT ---
export default function ViewVaultPage() {
  const router = useRouter();
  const { cid } = router.query;

  // --- STATE MANAGEMENT ---
  const [content, setContent] = useState<VaultContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for the preview modal
  const [modalFile, setModalFile] = useState<UnlockedFile | null>(null);

  // --- DATA FETCHING ---
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

  // --- MODAL HANDLERS ---
  const openModal = (file: UnlockedFile) => {
    setModalFile(file);
  };

  const closeModal = () => {
    setModalFile(null);
  };

  // --- RENDER LOGIC ---
  const renderContent = () => {
    if (!content) return null;
    const { message, files } = content;

    if (!message && (!files || files.length === 0)) {
      return <p style={{ textAlign: 'center', color: '#94a3b8' }}>This vault appears to be empty.</p>;
    }

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
                // Changed from <a> to <div> with an onClick handler to open the modal
                <div key={index} onClick={() => openModal(file)} className="attachmentItemContainer">
                  <div className="attachmentItem">
                    {file.type.startsWith('image/') ? (
                      <img src={file.data} alt={file.name} className="attachmentPreview" />
                    ) : file.type === 'application/pdf' ? (
                      <div className="fileIcon pdfIcon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        <span>PDF</span>
                      </div>
                    ) : (
                      <div className="fileIcon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                      </div>
                    )}
                    <span className="attachmentName">{file.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  const renderModal = () => {
    if (!modalFile) return null;

    return (
      <div className="modalOverlay" onClick={closeModal}>
        <div className="modalContent" onClick={(e) => e.stopPropagation()}>
          <div className="modalHeader">
            <span className="modalTitle">{modalFile.name}</span>
            <button className="modalCloseButton" onClick={closeModal}>&times;</button>
          </div>
          <div className="modalBody">
            {modalFile.type.startsWith('image/') ? (
              <img src={modalFile.data} alt={modalFile.name} className="modalPreviewImage" />
            ) : modalFile.type === 'application/pdf' ? (
              <iframe src={modalFile.data} title={modalFile.name} className="modalPreviewIframe" />
            ) : (
              <div className="modalGenericPreview">
                 <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                <p>No preview available for this file type.</p>
              </div>
            )}
          </div>
          <div className="modalFooter">
            <a href={modalFile.data} download={modalFile.name} className="downloadButton">Download</a>
          </div>
        </div>
      </div>
    );
  };

  // --- STYLES ---
  const cssStyles = `
    html, body { margin: 0; padding: 0; box-sizing: border-box; }
    .pageContainer { display: flex; flex-direction: column; min-height: 100vh; width: 100%; background: linear-gradient(to bottom right, #0f172a, #000000, #3b0764); padding: 2rem 1rem; font-family: 'Inter', sans-serif; }
    .header { position: relative; display: flex; justify-content: center; align-items: center; margin-bottom: 2rem; padding: 1rem 0; max-width: 1200px; margin-left: auto; margin-right: auto; }
    .header-title-container { display: flex; align-items: center; gap: 1rem; }
    .siteTitle { font-size: 3.25rem; font-weight: 800; margin: 0; background: linear-gradient(90deg, #a78bfa, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: transparent; }
    .card { width: 100%; max-width: 800px; margin: 2rem auto 0; background-color: rgba(0, 0, 0, 0.2); backdrop-filter: blur(10px); border-radius: 1rem; padding: 2.5rem; border: 1px solid #334155; }
    .title { font-size: 1.875rem; font-weight: 700; color: white; margin: 0 0 1.5rem 0; text-align: center; }
    .errorMessage { text-align: center; color: #fcd34d; }
    .contentLabel { font-weight: 600; color: white; margin: 0 0 1rem 0; }
    .unlockedContent {background: rgba(0, 0, 0, 0.3);padding: 1rem;border-radius: 0.5rem;white-space: pre-wrap;font-family: monospace;color: #00FF41;text-shadow:0 0 5px #00FF41,0 0 10px #00FF41,0 0 20px #00FF41,0 0 40px #00FF41;}
    .attachmentsGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1rem; }
    .attachmentItemContainer { text-decoration: none; cursor: pointer; }
    .attachmentItem { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 0.25rem; background-color: rgba(255, 255, 255, 0.05); border-radius: 0.5rem; transition: background-color 0.2s ease; height: 0%; }
    .attachmentItem:hover { background-color: rgba(255, 255, 255, 0.1); }
    .attachmentPreview { width: 100%; height: 120px; object-fit: cover; border-radius: 0.5rem; }
    .fileIcon { width: 100%; height: 120px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; }
    .pdfIcon { color: #f87171; }
    .attachmentName { font-size: 0.75rem; color: #94a3b8; text-decoration: none; word-break: break-all; text-align: center; margin-top: 0.5rem; }
    .modalOverlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; backdrop-filter: blur(5px); }
    .modalContent { background-color: #1e293b; color: white; border-radius: 1rem; width: 100%; max-width: 900px; max-height: 90vh; display: flex; flex-direction: column; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .modalHeader { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid #334155; }
    .modalTitle { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .modalCloseButton { background: none; border: none; color: #94a3b8; font-size: 2rem; cursor: pointer; line-height: 1; padding: 0; transition: color 0.2s ease; }
    .modalCloseButton:hover { color: white; }
    .modalBody { flex-grow: 1; padding: 1.5rem; overflow-y: auto; text-align: center; }
    .modalPreviewImage, .modalPreviewIframe { width: 100%; height: auto; max-height: 65vh; object-fit: contain; border-radius: 0.5rem; }
    .modalPreviewIframe { height: 65vh; border: none; }
    .modalGenericPreview { display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; height: 100%; min-height: 200px; }
    .modalGenericPreview p { margin-top: 1rem; font-size: 1.1rem; }
    .modalFooter { padding: 1rem 1.5rem; border-top: 1px solid #334155; text-align: right; }
    .downloadButton { background-color: #7c3aed; color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s ease; }
    .downloadButton:hover { background-color: #a78bfa; }
  `;

  return (
    <>
      <Head>
        <title>View Vault - Digital Afterlife</title>
      </Head>
      <div className="pageContainer">
        <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
        <header className="header">
          <div className="header-title-container">
            <Image src="/Logo.png" alt="Digital Afterlife Logo" width={150} height={150} priority={true} />
            <h1 className="siteTitle">Digital Afterlife</h1>
          </div>
        </header>
        <main className="card">
          <h1 className="title">A Vault Has Been Delivered to You</h1>
          {isLoading && <p style={{ textAlign: 'center' }}>Loading vault content...</p>}
          {error && <p className="errorMessage">{error}</p>}
          {content && renderContent()}
        </main>
      </div>

      {/* Render the modal outside the main layout but within the component return */}
      {renderModal()}
    </>
  );
}