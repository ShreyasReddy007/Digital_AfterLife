import React, { JSX,useState } from 'react';
interface UnlockVaultResponse {
  data: {
    content: any;
  };
}

const mockUnlockVaultAPI = (cid: string, password: string): Promise<UnlockVaultResponse> => {
  console.log("Simulating unlock with:", { cid, password });
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (password.toLowerCase() !== 'password') {
        reject(new Error('Invalid CID or password.'));
        return;
      }
      const mockContent = {
        from: "The Other Side",
        message: "This is a secret message that has been unlocked.",
        timestamp: new Date().toISOString(),
        secrets: [
          "The veil is thin.",
          "Listen to the silence."
        ]
      };
      resolve({ data: { content: mockContent } });
    }, 1500);
  });
};

export default function Unlock(): JSX.Element {
  const [cid, setCid] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [content, setContent] = useState<any | null>(null);
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
      const res: UnlockVaultResponse = await mockUnlockVaultAPI(cid, password);
      setContent(res.data.content);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while unlocking the vault.');
      }
    } finally {
      setIsLoading(false);
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
      box-sizing: border-box;
    }
    .styledInput::placeholder { color: #94a3b8; }
    .styledInput:focus { outline: none; box-shadow: 0 0 0 2px #a855f7; }
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
    .contentDisplay {
      margin-top: 1.5rem;
      padding: 1rem;
      background-color: rgba(0, 0, 0, 0.4);
      border-radius: 0.5rem;
      text-align: left;
      color: white;
      border: 1px solid #334155;
      animation: fadeIn 0.5s ease-out forwards;
    }
    .contentPre {
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: monospace;
      font-size: 0.875rem;
      color: #d1d5db;
    }
  `;

  return (
    <div className="pageContainer">
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      
      <div className="vaultCard">
        <div className="header">
          <h1 className="title">Unlock Vault</h1>
          <p className="subtitle">Retrieve a message from the other side.</p>
        </div>

        <div className="form">
          <input
            className="styledInput"
            placeholder="Enter Vault CID"
            value={cid}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCid(e.target.value)}
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

        <button className="actionButton" onClick={handleUnlock} disabled={isLoading}>
          {isLoading ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{width: '20px', height: '20px', marginRight: '0.75rem', animation: 'spin 1s linear infinite'}}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{opacity: 0.25}}></circle>
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style={{opacity: 0.75}}></path>
              </svg>
              Unlocking...
            </>
          ) : (
            'Unlock Vault'
          )}
        </button>

        {error && <p className="errorMessage">{error}</p>}

        {content && (
          <div className="contentDisplay">
            <p style={{ fontWeight: '600', color: 'white', marginTop: 0, marginBottom: '0.5rem' }}>Vault Content Unlocked:</p>
            <pre className="contentPre">
              {JSON.stringify(content, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
