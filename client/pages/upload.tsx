import React, { JSX,useState } from 'react';
interface UploadResponse {
  data: {
    cid: string;
  };
}

const mockUploadAPI = (file: File): Promise<UploadResponse> => {
  console.log("Simulating upload for file:", file.name, `(${Math.round(file.size / 1024)} KB)`);
  return new Promise((resolve) => {
    setTimeout(() => {
      const fakeCid = 'zQm' + Array(43).fill(0).map(() => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(Math.floor(Math.random() * 62))).join('');
      resolve({ data: { cid: fakeCid } });
    }, 2000);
  });
};

export default function Upload(): JSX.Element {
  const [file, setFile] = useState<File | null>(null);
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
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    setIsLoading(true);
    setError('');
    setCid('');
    setCopied(false);

    try {
      const res: UploadResponse = await mockUploadAPI(file);
      setCid(res.data.cid);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred during the upload.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopyToClipboard = (): void => {
    if (cid) {
      navigator.clipboard.writeText(cid).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    }
  };

  const cssStyles = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .pageContainer {
      min-height: 100vh;
      width: 100%;
      background: linear-gradient(to bottom right, #0f172a, #000000, #3b0764);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
    }
    .vaultCard {
      width: 100%;
      max-width: 448px;
      background-color: rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      padding: 2rem;
      border: 1px solid #334155;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .header { text-align: center; }
    .title { font-size: 1.875rem; font-weight: 700; color: white; margin: 0;}
    .subtitle { color: #c4b5fd; margin-top: 0.5rem; margin-bottom: 0; }
    .fileInputLabel {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      border: 2px dashed #475569;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: border-color 0.3s;
      text-align: center;
    }
    .fileInputLabel:hover { border-color: #6b21a8; }
    .fileInput { display: none; }
    .fileName { color: #d1d5db; margin-top: 0.5rem; font-weight: 500; }
    .actionButton {
      width: 100%;
      padding: 0.75rem 0;
      background-color: #581c87;
      color: white;
      font-weight: 700;
      border-radius: 0.5rem;
      border: none;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
      transition: all 0.3s;
      transform-origin: center;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .actionButton:hover { background-color: #6b21a8; transform: scale(1.05); }
    .actionButton:disabled { background-color: #475569; cursor: not-allowed; transform: none; }
    .errorMessage {
      text-align: center;
      color: #fcd34d;
      background-color: rgba(127, 29, 29, 0.5);
      padding: 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid #7f1d1d;
    }
    .resultDisplay {
      margin-top: 1.5rem;
      padding: 1rem;
      background-color: rgba(0, 0, 0, 0.4);
      border-radius: 0.5rem;
      text-align: center;
      color: white;
      border: 1px solid #334155;
      animation: fadeIn 0.5s ease-out forwards;
    }
    .cidContainer {
      position: relative;
      background-color: rgba(0, 0, 0, 0.5);
      padding: 0.75rem;
      border-radius: 0.5rem;
      font-family: monospace;
      font-size: 0.875rem;
      word-break: break-all;
      cursor: pointer;
      border: 1px solid #475569;
      margin-top: 0.5rem;
    }
    .copiedMessage { font-size: 0.75rem; color: #6ee7b7; margin-top: 0.5rem; }
  `;

  return (
    <div className="pageContainer">
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      
      <div className="vaultCard">
        <div className="header">
          <h1 className="title">Upload File to Vault</h1>
          <p className="subtitle">Send a file to the other side.</p>
        </div>

        <div>
          <label className="fileInputLabel">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} style={{width: '40px', height: '40px', color: '#64748b'}}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span style={{color: 'white', marginTop: '1rem'}}>
              {file ? 'Click to change file' : 'Click to select a file'}
            </span>
            {file && <span className="fileName">{file.name}</span>}
            <input 
              type="file" 
              className="fileInput" 
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </label>
        </div>

        <button className="actionButton" onClick={handleUpload} disabled={isLoading || !file}>
          {isLoading ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{width: '20px', height: '20px', marginRight: '0.75rem', animation: 'spin 1s linear infinite'}}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{opacity: 0.25}}></circle>
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style={{opacity: 0.75}}></path>
              </svg>
              Uploading...
            </>
          ) : (
            'Upload File'
          )}
        </button>

        {error && <p className="errorMessage">{error}</p>}

        {cid && (
          <div className="resultDisplay">
            <p style={{ fontWeight: '600', color: 'white', marginTop: 0, marginBottom: '0.5rem' }}>File Uploaded Successfully!</p>
            <p className="subtitle" style={{fontSize: '0.875rem', marginBottom: '0.5rem'}}>Here is your File CID:</p>
            <div className="cidContainer" onClick={handleCopyToClipboard}>
              <code>{cid}</code>
              <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#9ca3af' }}>
                {copied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" style={{height: '20px', width: '20px', color: '#34d399'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" style={{height: '20px', width: '20px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
            </div>
            {copied && <p className="copiedMessage">Copied to clipboard!</p>}
          </div>
        )}
      </div>
    </div>
  );
}
