import React, { JSX, useState } from 'react';
interface VaultResponse {
  data: {
    cid: string;
  };
}

const mockCreateVaultAPI = (content: string, password: string): Promise<VaultResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const fakeCid = 'zQm' + Array(43).fill(0).map(() => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(Math.floor(Math.random() * 62))).join('');
      resolve({ data: { cid: fakeCid } });
    }, 1500);
  });
};


export default function App(): JSX.Element {
  const [message, setMessage] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [cid, setCid] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const handleCreate = async (): Promise<void> => {
    if (!message || !password) {
      setError('Please fill in both the message and the password.');
      return;
    }
    setIsLoading(true);
    setError('');
    setCid('');
    setCopied(false);
    try {
      const res: VaultResponse = await mockCreateVaultAPI(message, password);
      // TypeScript now understands that res.data.cid exists and is a string.
      setCid(res.data.cid);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred. Please try again.');
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
    .form { display: flex; flex-direction: column; gap: 1rem; }
    .styledInput {
      width: 100%;
      padding: 0.75rem;
      background-color: rgba(15, 23, 42, 0.5);
      border: 1px solid #475569;
      border-radius: 0.5rem;
      color: white;
      transition: all 0.3s;
      box-sizing: border-box; /* Ensures padding doesn't affect width */
    }
    .styledInput::placeholder { color: #94a3b8; }
    .styledInput:focus { outline: none; box-shadow: 0 0 0 2px #a855f7; }
    .createButton {
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
    .createButton:hover { background-color: #6b21a8; transform: scale(1.05); }
    .createButton:disabled { background-color: #475569; cursor: not-allowed; transform: none; }
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
          <h1 className="title">Create Secure Vault</h1>
          <p className="subtitle">Encrypt your message for the other side.</p>
        </div>

        <div className="form">
          <textarea
            className="styledInput"
            rows={6}
            placeholder="Enter your secret message..."
            value={message}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
            disabled={isLoading}
          />
          <input
            className="styledInput"
            type="password"
            placeholder="Enter vault password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <button className="createButton" onClick={handleCreate} disabled={isLoading}>
          {isLoading ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{width: '20px', height: '20px', marginRight: '0.75rem', animation: 'spin 1s linear infinite'}}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{opacity: 0.25}}></circle>
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style={{opacity: 0.75}}></path>
              </svg>
              Creating...
            </>
          ) : (
            'Create Vault'
          )}
        </button>

        {error && <p className="errorMessage">{error}</p>}

        {cid && (
          <div className="resultDisplay">
            <p style={{ fontWeight: '600' }}>Vault Created Successfully!</p>
            <p className="subtitle" style={{fontSize: '0.875rem', marginBottom: '0.5rem'}}>Here is your Vault CID:</p>
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
