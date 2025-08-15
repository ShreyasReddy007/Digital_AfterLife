import React, { JSX, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function UploadPage(): JSX.Element {
  const { status } = useSession({ required: true, onUnauthenticated() { router.push('/login') }});
  const router = useRouter();
  
  const [name, setName] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>('');
  const [cid, setCid] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleUpload = async (): Promise<void> => {
    if (!name || !file || !password) {
      setError('Please provide a name, file, and password.');
      return;
    }
    setIsLoading(true);
    setError('');
    setCid('');

    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // Step 1: Upload to Pinata
      const pinataResponse = await axios.post('/api/pinata/uploadFile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const realCid = pinataResponse.data.cid;

      // Step 2: Send file metadata along with vault info to your create API
      const vaultResponse = await axios.post('/api/vaults/create', { 
        cid: realCid, 
        password, 
        name,
        originalFilename: file.name, // Send the original filename
        mimeType: file.type || 'application/octet-stream', // Send the file's MIME type
      });
      
      setCid(vaultResponse.data.cid);
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred during upload.');
    } finally {
      setIsLoading(false);
    }
  };

  const cssStyles = `
    .pageContainer { min-height: 100vh; width: 100%; background: linear-gradient(to bottom right, #0f172a, #000000, #3b0764); display: flex; align-items: center; justify-content: center; padding: 1rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .vaultCard { width: 100%; max-width: 448px; background-color: rgba(0, 0, 0, 0.2); backdrop-filter: blur(10px); border-radius: 1rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); padding: 2rem; border: 1px solid #334155; display: flex; flex-direction: column; gap: 1.5rem; }
    .header { text-align: center; }
    .title { font-size: 1.875rem; font-weight: 700; color: white; margin: 0;}
    .form { display: flex; flex-direction: column; gap: 1rem; }
    .styledInput { width: 100%; padding: 0.75rem; background-color: rgba(15, 23, 42, 0.5); border: 1px solid #475569; border-radius: 0.5rem; color: white; transition: all 0.3s; box-sizing: border-box; }
    .styledInput:focus { outline: none; box-shadow: 0 0 0 2px #a855f7; }
    .fileInputLabel { display: flex; align-items: center; justify-content: center; width: 100%; height: 80px; background-color: rgba(15, 23, 42, 0.5); border: 2px dashed #475569; border-radius: 0.5rem; color: #94a3b8; cursor: pointer; transition: all 0.3s; }
    .fileInputLabel:hover { border-color: #a855f7; color: white; }
    .fileInputLabel span { text-align: center; max-width: 90%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .createButton { width: 100%; padding: 0.75rem 0; background-color: #581c87; color: white; font-weight: 700; border-radius: 0.5rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .errorMessage { text-align: center; color: #fcd34d; }
    .resultDisplay { margin-top: 1rem; padding: 1rem; background-color: rgba(0, 0, 0, 0.4); border-radius: 0.5rem; text-align: center; color: white; word-break: break-all; }
  `;

  if (status === 'loading') {
    return <div className="pageContainer"><style dangerouslySetInnerHTML={{ __html: cssStyles }} /><p style={{color: 'white'}}>Loading...</p></div>;
  }
  
  return (
    <div className="pageContainer">
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      <div className="vaultCard">
        <div className="header"><h1 className="title">Upload Secure File</h1></div>
        <div className="form">
          <input className="styledInput" placeholder="Vault Name" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
          
          <label htmlFor="file-upload" className="fileInputLabel">
            <span>{file ? file.name : 'Click to select a file'}</span>
          </label>
          <input id="file-upload" type="file" onChange={handleFileChange} disabled={isLoading} style={{ display: 'none' }} />

          <input className="styledInput" type="password" placeholder="Enter vault password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
        </div>
        <button className="createButton" onClick={handleUpload} disabled={isLoading}>{isLoading ? 'Uploading...' : 'Upload & Create Vault'}</button>
        {error && <p className="errorMessage">{error}</p>}
        {cid && <div className="resultDisplay"><p>Vault Created Successfully!</p><code>{cid}</code></div>}
      </div>
    </div>
  );
}