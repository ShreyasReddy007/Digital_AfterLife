// pages/trigger.tsx
import React, { useState, useEffect, JSX } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';

interface Vault {
  id: number;
  cid: string;
  name: string;
  triggerDate: string | null;
}

export default function TriggerPage(): JSX.Element {
  const { status } = useSession({ required: true, onUnauthenticated() { router.push('/login') }});
  const router = useRouter();
  
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [date, setDate] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchVaults = async () => {
        setIsLoading(true);
        try {
          const res = await axios.get('/api/vaults'); // We reuse the existing get vaults API
          setVaults(res.data);
        } catch (err) {
          setError('Failed to fetch vaults.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchVaults();
    }
  }, [status]);

  const handleSetTrigger = async () => {
    if (!selectedVault || !date) {
      setError('Please select a vault and a date.');
      return;
    }
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      await axios.post('/api/vaults/set-trigger', {
        vaultId: selectedVault.id,
        triggerDate: date,
      });
      setMessage(`Trigger for "${selectedVault.name}" set to ${new Date(date).toLocaleDateString()}.`);
      // Optionally, refresh vaults list to show the new date
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set trigger.');
    } finally {
      setIsLoading(false);
    }
  };

  const cssStyles = `
    .pageContainer { min-height: 100vh; width: 100%; background: linear-gradient(to bottom right, #0f172a, #000000, #3b0764); display: flex; align-items: center; justify-content: center; padding: 1rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .card { width: 100%; max-width: 500px; background-color: rgba(0, 0, 0, 0.2); backdrop-filter: blur(10px); border-radius: 1rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); padding: 2rem; border: 1px solid #334155; display: flex; flex-direction: column; gap: 1.5rem; }
    .title { font-size: 1.875rem; font-weight: 700; color: white; margin: 0; text-align: center; }
    .formGroup { display: flex; flex-direction: column; gap: 0.5rem; }
    .label { color: #94a3b8; font-size: 0.875rem; }
    .styledInput, .styledSelect { width: 100%; padding: 0.75rem; background-color: rgba(15, 23, 42, 0.5); border: 1px solid #475569; border-radius: 0.5rem; color: white; box-sizing: border-box; }
    .styledInput:focus, .styledSelect:focus { outline: none; box-shadow: 0 0 0 2px #a855f7; }
    .actionButton { width: 100%; padding: 0.75rem 0; background-color: #581c87; color: white; font-weight: 700; border-radius: 0.5rem; border: none; cursor: pointer; }
    .errorMessage { text-align: center; color: #fcd34d; }
    .successMessage { text-align: center; color: #6ee7b7; }
  `;

  if (status === 'loading') {
    return <div className="pageContainer"><style dangerouslySetInnerHTML={{ __html: cssStyles }} /><p style={{color: 'white'}}>Loading...</p></div>;
  }

  return (
    <div className="pageContainer">
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      <div className="card">
        <h1 className="title">Set a Trigger Date</h1>
        <div className="formGroup">
          <label htmlFor="vault-select" className="label">Select a Vault</label>
          <select 
            id="vault-select" 
            className="styledSelect"
            onChange={(e) => setSelectedVault(vaults.find(v => v.id === parseInt(e.target.value)) || null)}
          >
            <option>-- Choose a vault --</option>
            {vaults.map(vault => (
              <option key={vault.id} value={vault.id}>{vault.name}</option>
            ))}
          </select>
        </div>
        <div className="formGroup">
          <label htmlFor="date-input" className="label">Select Delivery Date</label>
          <input 
            id="date-input" 
            type="date" 
            className="styledInput"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <button className="actionButton" onClick={handleSetTrigger} disabled={isLoading}>
          {isLoading ? 'Setting Trigger...' : 'Set Trigger'}
        </button>
        {error && <p className="errorMessage">{error}</p>}
        {message && <p className="successMessage">{message}</p>}
      </div>
    </div>
  );
}
