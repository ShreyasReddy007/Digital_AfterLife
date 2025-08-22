// pages/trigger.tsx
import React, { useState, useEffect, JSX } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchVaults = async () => {
        setIsLoading(true);
        try {
          const res = await axios.get('/api/vaults');
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
      // Refresh vaults to show updated trigger date on the dashboard
      // This is optional but good UX.
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set trigger.');
    } finally {
      setIsLoading(false);
    }
  };

  const cssStyles = `
    html, body {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    .pageContainer { min-height: 100vh; width: 100%; background: linear-gradient(to bottom right, #0f172a, #000000, #3b0764); display: flex; align-items: center; justify-content: center; padding: 1rem; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .card { width: 100%; max-width: 500px; background-color: rgba(17, 24, 39, 0.5); backdrop-filter: blur(10px); border-radius: 1rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); padding: 2.5rem; border: 1px solid rgba(255, 255, 255, 0.1); display: flex; flex-direction: column; gap: 1.5rem; }
    .title { font-size: 1.875rem; font-weight: 700; color: white; margin: 0; text-align: center; }
    .formGroup { display: flex; flex-direction: column; gap: 0.5rem; }
    .label { color: #94a3b8; font-size: 0.875rem; font-weight: 500; }
    .styledInput { width: 100%; padding: 0.75rem 1rem; background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 0.5rem; color: white; box-sizing: border-box; transition: all 0.2s ease; }
    .styledInput:focus { outline: none; box-shadow: 0 0 0 2px #a855f7; border-color: #a855f7; }
    .dateInputContainer { position: relative; }
    .dateInputContainer svg { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
    .styledInput[type="date"] { padding-left: 3rem; color-scheme: dark; }
    .styledInput[type="date"]::-webkit-calendar-picker-indicator { background: transparent; bottom: 0; color: transparent; cursor: pointer; height: auto; left: 0; position: absolute; right: 0; top: 0; width: auto; }
    .actionButton { width: 100%; padding: 0.85rem 0; background: linear-gradient(to right, #7c3aed, #a855f7); color: white; font-weight: 600; border-radius: 0.5rem; border: none; cursor: pointer; transition: all 0.2s ease; }
    .actionButton:hover { box-shadow: 0 0 15px rgba(168, 85, 247, 0.5); transform: translateY(-2px); }
    .actionButton:disabled { background: #374151; cursor: not-allowed; transform: none; box-shadow: none; }
    .errorMessage { text-align: center; color: #f87171; }
    .successMessage { text-align: center; color: #6ee7b7; }
    .customDropdown { position: relative; }
    .dropdownButton { width: 100%; padding: 0.75rem 1rem; background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 0.5rem; color: white; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease; }
    .dropdownButton:focus, .dropdownButton.open { outline: none; box-shadow: 0 0 0 2px #a855f7; border-color: #a855f7; }
    .dropdownMenu { position: absolute; top: 100%; left: 0; right: 0; background-color: #1f2937; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 0.5rem; margin-top: 0.5rem; z-index: 10; max-height: 200px; overflow-y: auto; }
    .dropdownItem { padding: 0.75rem 1rem; color: #d1d5db; cursor: pointer; }
    .dropdownItem:hover { background-color: #374151; color: white; }
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
            <title>Set Trigger Date</title>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
        </Head>
        <div className="pageContainer">
        <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
        <div className="card">
            <h1 className="title">Set a Trigger Date</h1>
            <div className="formGroup">
            <label htmlFor="vault-select" className="label">Select a Vault</label>
            <div className="customDropdown">
                <button 
                    className={`dropdownButton ${isDropdownOpen ? 'open' : ''}`}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    <span>{selectedVault ? selectedVault.name : '-- Choose a vault --'}</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                        <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                {isDropdownOpen && (
                    <div className="dropdownMenu">
                        {vaults.map(vault => (
                        <div 
                            key={vault.id} 
                            className="dropdownItem"
                            onClick={() => {
                                setSelectedVault(vault);
                                setIsDropdownOpen(false);
                            }}
                        >
                            {vault.name}
                        </div>
                        ))}
                    </div>
                )}
            </div>
            </div>
            <div className="formGroup">
            <label htmlFor="date-input" className="label">Select Delivery Date</label>
            <div className="dateInputContainer">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <input 
                    id="date-input" 
                    type="date" 
                    className="styledInput"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
            </div>
            </div>
            <button className="actionButton" onClick={handleSetTrigger} disabled={isLoading}>
            {isLoading ? 'Setting Trigger...' : 'Set Trigger'}
            </button>
            {error && <p className="errorMessage">{error}</p>}
            {message && <p className="successMessage">{message}</p>}
        </div>
        </div>
    </>
  );
}
