import React, { JSX, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';

export default function CreatePage(): JSX.Element {
  const router = useRouter();
  const { data: session, status } = useSession({ required: true, onUnauthenticated() { router.push('/login') }});
  
  const [name, setName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [recipientEmails, setRecipientEmails] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  
  const [cid, setCid] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const removeFile = (fileName: string) => {
    setFiles(files.filter(file => file.name !== fileName));
  };

  const handleCreate = async (): Promise<void> => {
    if (!name || !password) {
      setError('Vault name and password are required.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setCid('');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('password', password);
    formData.append('message', message);
    formData.append('recipientEmails', recipientEmails);
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const vaultResponse = await axios.post('/api/vaults/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCid(vaultResponse.data.cid);
    } catch (err: any) {
      setError(err.response?.data?.error || 'An unknown error occurred during vault creation.');
    } finally {
      setIsLoading(false);
    }
  };

  const cssStyles = `
    html, body { margin: 0; padding: 0; box-sizing: border-box; }
    .pageContainer { display: flex; flex-direction: column; min-height: 100vh; width: 100%; background: linear-gradient(to bottom right, #0f172a, #000000, #3b0764); padding: 2rem 1rem; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .header { position: relative; display: flex; justify-content: center; align-items: center; margin-bottom: 2rem; padding: 1rem 0; max-width: 1200px; margin-left: auto; margin-right: auto; }
    .header-title-container { display: flex; align-items: center; gap: 1rem; }
    .siteTitle { font-size: 3.25rem; font-weight: 800; margin: 0; background: linear-gradient(90deg, #a78bfa, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: transparent; }
    .backButton { position: absolute; right: 0; top: 50%; transform: translateY(-50%); background: none; border: 1px solid #475569; color: #94a3b8; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; transition: background-color 0.2s, color 0.2s; }
    .backButton:hover { background-color: #475569; color: white; }
    .vaultCard { width: 100%; max-width: 600px; margin: 2rem auto 0; background-color: rgba(0, 0, 0, 0.2); backdrop-filter: blur(10px); border-radius: 1rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); padding: 2.5rem; border: 1px solid #334155; }
    .title { font-size: 1.875rem; font-weight: 700; color: white; margin: 0; text-align: center; }
    .form { display: flex; flex-direction: column; gap: 1rem; margin-top: 2rem; }
    .styledInput { width: 100%; padding: 0.75rem 1rem; background-color: rgba(15, 23, 42, 0.5); border: 1px solid #475569; border-radius: 0.5rem; color: white; box-sizing: border-box; resize: vertical; font-family: 'Inter', sans-serif; }
    .dropzone { border: 2px dashed #475569; border-radius: 0.5rem; padding: 2rem; text-align: center; color: #94a3b8; cursor: pointer; transition: border-color 0.3s; }
    .dropzone.active { border-color: #a855f7; background-color: rgba(168, 85, 247, 0.1); }
    .fileList { margin-top: 1rem; border-top: 1px solid #334155; padding-top: 1rem; }
    .fileList h4 { margin: 0 0 0.5rem 0; color: #94a3b8; font-weight: 500; }
    .fileItem { display: flex; justify-content: space-between; align-items: center; background-color: rgba(15, 23, 42, 0.5); padding: 0.5rem 1rem; border-radius: 0.5rem; margin-bottom: 0.5rem; font-size: 0.875rem; color: #e2e8f0; }
    .removeFileBtn { background: none; border: none; color: #f87171; cursor: pointer; font-size: 1.25rem; }
    .createButton { width: 100%; padding: 0.75rem 0; background-color: #581c87; color: white; font-weight: 700; border-radius: 0.5rem; border: none; cursor: pointer; }
    .errorMessage, .resultDisplay { margin-top: 1.5rem; padding: 1rem; border-radius: 0.5rem; text-align: center; }
    .errorMessage { color: #fcd34d; background-color: rgba(127, 29, 29, 0.5); }
    .resultDisplay { background-color: rgba(0, 0, 0, 0.4); color: white; }
    .resultDisplay code { word-break: break-all; }
  `;
  
  if (status === 'loading') {
    return (
        <div className="pageContainer">
            <p style={{color: 'white'}}>Loading...</p>
        </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>Create Vault - Digital Afterlife</title>
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
          <h1 className="title">Create a New Vault</h1>
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
            <div {...getRootProps({ className: `dropzone ${isDragActive ? 'active' : ''}` })}>
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>Drop the files here...</p>
              ) : (
                <p>Drag & drop files here, or click to select</p>
              )}
            </div>
            {files.length > 0 && (
              <div className="fileList">
                <h4>Staged Files:</h4>
                {files.map(file => (
                  <div key={file.name} className="fileItem">
                    <span>{file.name}</span>
                    <button onClick={() => removeFile(file.name)} className="removeFileBtn" title="Remove file">
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input 
              className="styledInput" 
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
            {isLoading ? 'Creating...' : 'Create Vault'}
          </button>
          {error && (
            <p className="errorMessage">{error}</p>
          )}
          {cid && (
            <div className="resultDisplay">
              <p>Vault Created Successfully! CID:</p>
              <code>{cid}</code>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

