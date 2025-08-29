// pages/create.tsx
import React, { JSX, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';

export default function CreatePage(): JSX.Element {
  const router = useRouter();
  const { data: session, status } = useSession({ 
    required: true, 
    onUnauthenticated() { router.push('/login') } 
  });
  
  const [name, setName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>('');
  const [recipientEmails, setRecipientEmails] = useState<string>('');
  
  const [cid, setCid] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleCreate = async (): Promise<void> => {
    if (!name || (!message && !file) || !password) {
      setError('Please provide a name, a password, and either a message or a file.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setCid('');
    setCopied(false);

    try {
      let fileCid = null;
      let fileMeta = {};

      // Step 1: Upload the file if it exists
      if (file) {
        setLoadingStep('Uploading file...');
        const formData = new FormData();
        formData.append('file', file);
        const fileRes = await axios.post('/api/pinata/uploadFile', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        fileCid = fileRes.data.cid;
        fileMeta = { originalFilename: file.name, mimeType: file.type || 'application/octet-stream' };
      }

      // Step 2: Upload the JSON metadata (message + file CID)
      setLoadingStep('Creating vault structure...');
      const vaultContent = {
        message: message,
        fileCid: fileCid,
      };
      const jsonRes = await axios.post('/api/pinata/upload', { content: vaultContent });
      const finalCid = jsonRes.data.cid;

      // Step 3: Save the final CID and vault details to your database
      setLoadingStep('Securing vault...');
      const vaultResponse = await axios.post('/api/vaults/create', { 
        cid: finalCid,
        password,
        name,
        recipientEmails,
        ...fileMeta, // Add originalFilename and mimeType if a file was uploaded
      });

      setCid(vaultResponse.data.cid);

    } catch (err: any) {
      setError(err.response?.data?.error || 'An unknown error occurred during vault creation.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleCopyToClipboard = (): void => {
    if (cid) {
      const textArea = document.createElement("textarea");
      textArea.value = cid;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const cssStyles = `
    html, body { margin: 0; padding: 0; box-sizing: border-box; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .pageContainer { min-height: 100vh; width: 100%; background: linear-gradient(to bottom right, #0f172a, #000000, #3b0764); display: flex; align-items: center; justify-content: center; padding: 1rem; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .vaultCard { width: 100%; max-width: 500px; background-color: rgba(0, 0, 0, 0.2); backdrop-filter: blur(10px); border-radius: 1rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); padding: 2rem; border: 1px solid #334155; display: flex; flex-direction: column; gap: 1.5rem; }
    .header { text-align: center; }
    .title { font-size: 1.875rem; font-weight: 700; color: white; margin: 0;}
    .subtitle { color: #c4b5fd; margin-top: 0.5rem; margin-bottom: 0; }
    .form { display: flex; flex-direction: column; gap: 1rem; }
    .styledInput { width: 100%; padding: 0.75rem; background-color: rgba(15, 23, 42, 0.5); border: 1px solid #475569; border-radius: 0.5rem; color: white; transition: all 0.3s; box-sizing: border-box; }
    .styledInput::placeholder { color: #94a3b8; }
    .styledInput:focus { outline: none; box-shadow: 0 0 0 2px #a855f7; }
    .fileInputLabel { display: flex; align-items: center; justify-content: center; width: 100%; height: 60px; background-color: rgba(15, 23, 42, 0.5); border: 2px dashed #475569; border-radius: 0.5rem; color: #94a3b8; cursor: pointer; transition: all 0.3s; }
    .fileInputLabel:hover { border-color: #a855f7; color: white; }
    .fileInputLabel span { text-align: center; max-width: 90%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .createButton { width: 100%; padding: 0.75rem 0; background-color: #581c87; color: white; font-weight: 700; border-radius: 0.5rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .createButton:hover { background-color: #6b21a8; }
    .createButton:disabled { background-color: #475569; cursor: not-allowed; }
    .loadingText { font-size: 0.875rem; color: #c4b5fd; text-align: center; }
    .errorMessage { text-align: center; color: #fcd34d; background-color: rgba(127, 29, 29, 0.5); padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #7f1d1d; }
    .resultDisplay { margin-top: 1.5rem; padding: 1rem; background-color: rgba(0, 0, 0, 0.4); border-radius: 0.5rem; text-align: center; color: white; border: 1px solid #334155; animation: fadeIn 0.5s ease-out forwards; }
    .cidContainer { position: relative; background-color: rgba(0, 0, 0, 0.5); padding: 0.75rem; border-radius: 0.5rem; font-family: monospace; font-size: 0.875rem; word-break: break-all; cursor: pointer; border: 1px solid #475569; margin-top: 0.5rem; }
    .copiedMessage {margin-top: 10px;font-size: 14px;color: #00ff00;text-align: center;text-shadow:0 0 5px #00ff00,0 0 10px #00ff00,0 0 20px #00ff00;}
  `;

  if (status === 'loading') {
    return (
      <div className="pageContainer">
        <Head>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
        </Head>
        <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
        <p style={{color: 'white'}}>Loading...</p>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>Create Vault - Digital Afterlife</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
      </Head>
      <div className="pageContainer">
        <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
        <div className="vaultCard">
          <div className="header">
            <h1 className="title">Create a New Vault</h1>
            <p className="subtitle">Combine a message and a file in one secure package.</p>
          </div>
          <div className="form">
            <input
              className="styledInput"
              placeholder="Vault Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
            <textarea
              className="styledInput"
              rows={5}
              placeholder="Enter a secret message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isLoading}
            />
            <label htmlFor="file-upload" className="fileInputLabel">
              <span>{file ? file.name : 'Attach a file (optional)'}</span>
            </label>
            <input id="file-upload" type="file" onChange={handleFileChange} disabled={isLoading} style={{ display: 'none' }} />
            
            <input
              className="styledInput"
              type="text"
              placeholder="Recipient Emails (comma-separated)"
              value={recipientEmails}
              onChange={(e) => setRecipientEmails(e.target.value)}
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
          <button className="createButton" onClick={handleCreate} disabled={isLoading}>
            {isLoading ? (loadingStep || 'Creating...') : 'Create Vault'}
          </button>
          {error && <p className="errorMessage">{error}</p>}
          {cid && (
            <div className="resultDisplay">
              <p style={{ fontWeight: '600' }}>Vault Created Successfully!</p>
              <div className="cidContainer" onClick={handleCopyToClipboard}>
                <code>{cid}</code>
              </div>
              {copied && <p className="copiedMessage">Copied to clipboard!</p>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
