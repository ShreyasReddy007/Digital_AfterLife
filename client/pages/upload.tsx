import React, { JSX, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function CreatePage(): JSX.Element {
  const { status } = useSession({ required: true, onUnauthenticated() { router.push('/login') }});
  const router = useRouter();
  
  const [name, setName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [cid, setCid] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const handleCreate = async (): Promise<void> => {
    if (!name || !message || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    setError('');
    setCid('');
    try {
      const pinataResponse = await axios.post('/api/pinata/upload', { content: { message } });
      const realCid = pinataResponse.data.cid;
      const vaultResponse = await axios.post('/api/vaults/create', { cid: realCid, password, name });
      setCid(vaultResponse.data.cid);
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred.');
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
    .createButton { width: 100%; padding: 0.75rem 0; background-color: #581c87; color: white; font-weight: 700; border-radius: 0.5rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .errorMessage { text-align: center; color: #fcd34d; }
    .resultDisplay { margin-top: 1rem; padding: 1rem; background-color: rgba(0, 0, 0, 0.4); border-radius: 0.5rem; text-align: center; color: white; }
  `;

  if (status === 'loading') {
    return <div className="pageContainer"><style dangerouslySetInnerHTML={{ __html: cssStyles }} /><p style={{color: 'white'}}>Loading...</p></div>;
  }
  
  return (
    <div className="pageContainer">
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      <div className="vaultCard">
        <div className="header"><h1 className="title">Create Secure Vault</h1></div>
        <div className="form">
          <input className="styledInput" placeholder="Vault Name" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
          <textarea className="styledInput" rows={6} placeholder="Enter your secret message..." value={message} onChange={(e) => setMessage(e.target.value)} disabled={isLoading} />
          <input className="styledInput" type="password" placeholder="Enter vault password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
        </div>
        <button className="createButton" onClick={handleCreate} disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Vault'}</button>
        {error && <p className="errorMessage">{error}</p>}
        {cid && <div className="resultDisplay"><p>Vault Created Successfully!</p><code>{cid}</code></div>}
      </div>
    </div>
  );
}
