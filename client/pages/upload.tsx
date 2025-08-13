import React, { JSX, useState } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';

export default function Upload(): JSX.Element {
  const { status } = useSession({ required: true });

  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>('');
  const [cid, setCid] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setCid('');
    setError('');
    setCopied(false);
  };

  const handleUpload = async (): Promise<void> => {
    if (!file || !password) {
      setError('Please select a file and enter a password.');
      return;
    }
    setIsLoading(true);
    setError('');
    setCid('');
    setCopied(false);

    try {
      // Step 1: Upload the file to Pinata to get a real CID
      const formData = new FormData();
      formData.append('file', file);
      
      const pinataResponse = await axios.post('/api/pinata/uploadFile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const realCid = pinataResponse.data.cid;

      // Step 2: Save the real CID and hashed password to your database
      const vaultResponse = await axios.post('/api/vaults/create', {
        cid: realCid,
        password: password,
      });

      setCid(vaultResponse.data.cid);

    } catch (err: any) {
      setError(err.response?.data?.error || 'An unknown error occurred during upload.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopyToClipboard = (): void => {
    if (cid) {
      navigator.clipboard.writeText(cid).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const cssStyles = `
    /* CSS styles remain the same */
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .pageContainer { min-height: 100vh; width: 100%; background: linear-gradient(to bottom right, #0f172a, #000000, #3b0764); display: flex; align-items: center; justify-content: center; padding: 1rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .vaultCard { width: 100%; max-width: 448px; background-color: rgba(0, 0, 0, 0.2); backdrop-filter: blur(10px); border-radius: 1rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); padding: 2rem; border: 1px solid #334155; display: flex; flex-direction: column; gap: 1.5rem; }
    .header { text-align: center; }
    .title { font-size: 1.875rem; font-weight: 700; color: white; margin: 0;}
    .subtitle { color: #c4b5fd; margin-top: 0.5rem; margin-bottom: 0; }
    .fileInputLabel { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem 1rem; border: 2px dashed #475569; border-radius: 0.5rem; cursor: pointer; transition: border-color 0.3s; text-align: center; }
    .fileInputLabel:hover { border-color: #6b21a8; }
    .fileInput { display: none; }
    .fileName { color: #d1d5db; margin-top: 0.5rem; font-weight: 500; }
    .styledInput { width: 100%; padding: 0.75rem; background-color: rgba(15, 23, 42, 0.5); border: 1px solid #475569; border-radius: 0.5rem; color: white; transition: all 0.3s; box-sizing: border-box; }
    .styledInput:focus { outline: none; box-shadow: 0 0 0 2px #a855f7; }
    .actionButton { width: 100%; padding: 0.75rem 0; background-color: #581c87; color: white; font-weight: 700; border-radius: 0.5rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .actionButton:hover { background-color: #6b21a8; }
    .actionButton:disabled { background-color: #475569; cursor: not-allowed; }
    .errorMessage { text-align: center; color: #fcd34d; background-color: rgba(127, 29, 29, 0.5); padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #7f1d1d; }
    .resultDisplay { margin-top: 1.5rem; padding: 1rem; background-color: rgba(0, 0, 0, 0.4); border-radius: 0.5rem; text-align: center; color: white; border: 1px solid #334155; animation: fadeIn 0.5s ease-out forwards; }
    .cidContainer { position: relative; background-color: rgba(0, 0, 0, 0.5); padding: 0.75rem; border-radius: 0.5rem; font-family: monospace; font-size: 0.875rem; word-break: break-all; cursor: pointer; border: 1px solid #475569; margin-top: 0.5rem; }
    .copiedMessage { font-size: 0.75rem; color: #6ee7b7; margin-top: 0.5rem; }
  `;

  if (status === 'loading') {
    return <div className="pageContainer"><style dangerouslySetInnerHTML={{ __html: cssStyles }} /><p style={{color: 'white'}}>Loading...</p></div>;
  }

  return (
    <div className="pageContainer">
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      <div className="vaultCard">
        <div className="header">
          <h1 className="title">Upload File to Vault</h1>
          <p className="subtitle">Secure a file on the other side.</p>
        </div>
        <div>
          <label className="fileInputLabel">
            <svg xmlns="http://www.w3.org/2000/svg" style={{width: '40px', height: '40px', color: '#64748b'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span style={{color: 'white', marginTop: '1rem'}}>{file ? 'Click to change file' : 'Click to select a file'}</span>
            {file && <span className="fileName">{file.name}</span>}
            <input type="file" className="fileInput" onChange={handleFileChange} disabled={isLoading} />
          </label>
        </div>
        <input className="styledInput" type="password" placeholder="Enter vault password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
        <button className="actionButton" onClick={handleUpload} disabled={isLoading || !file}>
          {isLoading ? 'Uploading...' : 'Upload File'}
        </button>
        {error && <p className="errorMessage">{error}</p>}
        {cid && (
          <div className="resultDisplay">
            <p style={{ fontWeight: '600' }}>File Uploaded Successfully!</p>
            <div className="cidContainer" onClick={handleCopyToClipboard}>
              <code>{cid}</code>
            </div>
            {copied && <p className="copiedMessage">Copied to clipboard!</p>}
          </div>
        )}
      </div>
    </div>
  );
}
