// pages/recovery-key.tsx
import React, { useState, JSX } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function RecoveryKeyPage(): JSX.Element {
  const { status } = useSession({ required: true, onUnauthenticated() { router.push('/login') }});
  const router = useRouter();
  
  const [recoveryKey, setRecoveryKey] = useState<string>('');
  const [confirmationKey, setConfirmationKey] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [keyCopied, setKeyCopied] = useState<boolean>(false);

  // Generates a strong, random, and easy-to-read recovery key
  const generateRecoveryKey = () => {
    const randomPart = () => Math.random().toString(36).substring(2, 8).toUpperCase();
    const key = `${randomPart()}-${randomPart()}-${randomPart()}`;
    setRecoveryKey(key);
    setConfirmationKey('');
    setMessage('');
    setError('');
    setKeyCopied(false);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(recoveryKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000); // Reset after 2 seconds
  };

  const handleSetKey = async () => {
    if (recoveryKey !== confirmationKey) {
      setError('The confirmation key does not match the generated key.');
      return;
    }
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      await axios.post('/api/user/set-recovery-key', { recoveryKey });
      setMessage('Your recovery key has been set successfully. You will be redirected to the dashboard.');
      setTimeout(() => router.push('/dashboard'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set recovery key.');
    } finally {
      setIsLoading(false);
    }
  };

  const cssStyles = `
    .pageContainer { min-height: 100vh; width: 100%; background: linear-gradient(to bottom right, #0f172a, #000000, #3b0764); display: flex; align-items: center; justify-content: center; padding: 1rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .card { width: 100%; max-width: 600px; background-color: rgba(0, 0, 0, 0.2); backdrop-filter: blur(10px); border-radius: 1rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); padding: 2rem; border: 1px solid #334155; display: flex; flex-direction: column; gap: 1.5rem; }
    .title { font-size: 1.875rem; font-weight: 700; color: white; margin: 0; text-align: center; }
    .description { text-align: center; color: #94a3b8; margin-top: -0.5rem; }
    .formGroup { display: flex; flex-direction: column; gap: 0.5rem; }
    .label { color: #94a3b8; font-size: 0.875rem; }
    .styledInput { width: 100%; padding: 0.75rem; background-color: rgba(15, 23, 42, 0.5); border: 1px solid #475569; border-radius: 0.5rem; color: white; box-sizing: border-box; }
    .actionButton { width: 100%; padding: 0.75rem 0; background-color: #581c87; color: white; font-weight: 700; border-radius: 0.5rem; border: none; cursor: pointer; transition: background-color 0.2s; }
    .actionButton:disabled { background-color: #334155; cursor: not-allowed; }
    .secondaryButton { background-color: transparent; border: 1px solid #475569; }
    .keyDisplay { background-color: #0f172a; border: 1px solid #475569; border-radius: 0.5rem; padding: 1rem; text-align: center; font-family: monospace; font-size: 1.25rem; letter-spacing: 2px; color: #a5b4fc; display: flex; justify-content: space-between; align-items: center; }
    .copyButton { background: none; border: none; color: #94a3b8; cursor: pointer; }
    .warning { background-color: rgba(252, 211, 77, 0.1); border: 1px solid #fcd34d; color: #fcd34d; padding: 1rem; border-radius: 0.5rem; text-align: center; }
    .errorMessage { text-align: center; color: #f87171; }
    .successMessage { text-align: center; color: #6ee7b7; }
  `;

  if (status === 'loading') {
    return <div className="pageContainer"><style dangerouslySetInnerHTML={{ __html: cssStyles }} /><p style={{color: 'white'}}>Loading...</p></div>;
  }

  return (
    <div className="pageContainer">
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      <div className="card">
        <h1 className="title">Set Your Recovery Key</h1>
        <p className="description">Generate a one-time key to give to a trusted person. This key can be used to trigger the delivery of your vaults in an emergency.</p>
        
        <button className="actionButton secondaryButton" onClick={generateRecoveryKey}>
          {recoveryKey ? 'Generate New Key' : 'Generate Key'}
        </button>

        {recoveryKey && (
          <>
            <div className="warning">
              <strong>Important:</strong> Save this key somewhere safe and offline. You will not be shown this key again.
            </div>

            <div className="formGroup">
              <label className="label">Your New Recovery Key</label>
              <div className="keyDisplay">
                <span>{recoveryKey}</span>
                <button className="copyButton" onClick={handleCopyToClipboard} title="Copy to clipboard">
                  {keyCopied ? 'Copied!' : 
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                      <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zM-1 2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"/>
                    </svg>
                  }
                </button>
              </div>
            </div>

            <div className="formGroup">
              <label htmlFor="key-confirm" className="label">Confirm Your Recovery Key</label>
              <input 
                id="key-confirm" 
                type="text" 
                className="styledInput"
                placeholder="Type the key here to confirm you've saved it"
                value={confirmationKey}
                onChange={(e) => setConfirmationKey(e.target.value)}
              />
            </div>

            <button 
              className="actionButton" 
              onClick={handleSetKey} 
              disabled={isLoading || recoveryKey !== confirmationKey}
            >
              {isLoading ? 'Saving...' : 'Save and Activate Key'}
            </button>
          </>
        )}
        
        {error && <p className="errorMessage">{error}</p>}
        {message && <p className="successMessage">{message}</p>}
      </div>
    </div>
  );
}
