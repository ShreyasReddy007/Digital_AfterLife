// pages/dashboard.tsx
import React, { useState, useEffect, JSX } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';

// --- Type Definitions ---
interface Vault {
  id: number;
  cid: string;
  created_at: string;
}

export default function DashboardPage(): JSX.Element {
  const { data: session, status } = useSession({ required: true, onUnauthenticated() { router.push('/login') }});
  const router = useRouter();
  
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [password, setPassword] = useState<string>('');
  const [modalError, setModalError] = useState<string>('');
  const [unlockedContent, setUnlockedContent] = useState<any | null>(null);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchVaults = async () => {
        try {
          const res = await axios.get('/api/vaults');
          setVaults(res.data);
        } catch (err) {
          setError('Failed to fetch vaults. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchVaults();
    }
  }, [status]);

  const openUnlockModal = (vault: Vault) => {
    setSelectedVault(vault);
    setIsModalOpen(true);
    setPassword('');
    setModalError('');
    setUnlockedContent(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVault(null);
  };

  const handleUnlock = async () => {
    if (!password || !selectedVault) return;
    setIsUnlocking(true);
    setModalError('');
    setUnlockedContent(null);
    try {
      // **KEY CHANGE: Calling the real backend API**
      const res = await axios.post('/api/vaults/unlock', {
        cid: selectedVault.cid,
        password: password,
      });
      setUnlockedContent(res.data.content);
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to unlock vault.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const cssStyles = `
    /* Same styles as before for consistency */
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .pageContainer { min-height: 100vh; width: 100%; background: linear-gradient(to bottom right, #0f172a, #000000, #3b0764); padding: 2rem 1rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: white; }
    .dashboardContent { max-width: 1200px; margin: 0 auto; animation: fadeIn 0.5s ease-out; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .title { font-size: 2.25rem; font-weight: 700; margin: 0; }
    .signOutButton { background: none; border: 1px solid #475569; color: #eb4808; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; }
    .signOutButton:hover { background-color: #334155; color: white; }
    .navActions { display: flex; gap: 1rem; margin-bottom: 2rem; }
    .navButton { flex-grow: 1; padding: 1rem; background-color: rgba(0,0,0,0.2); border: 1px solid #475569; border-radius: 0.5rem; text-align: center; cursor: pointer; transition: all 0.2s; }
    .navButton:hover { background-color: #581c87; border-color: #a855f7; }
    .vaultsGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .vaultCard { background-color: rgba(0,0,0,0.3); border: 1px solid #334155; border-radius: 0.5rem; padding: 1.5rem; cursor: pointer; transition: all 0.2s; }
    .vaultCard:hover { transform: translateY(-5px); border-color: #a855f7; }
    .vaultCid { font-family: monospace; font-size: 0.875rem; word-break: break-all; color: #c4b5fd; }
    .vaultDate { font-size: 0.75rem; color: #94a3b8; margin-top: 1rem; }
    .modalOverlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modalContent { background: #1a1a2e; border: 1px solid #475569; border-radius: 1rem; padding: 2rem; width: 90%; max-width: 500px; animation: fadeIn 0.3s; }
    .modalHeader { display: flex; justify-content: space-between; align-items: center; }
    .modalCloseButton { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
    .styledInput { width: 100%; padding: 0.75rem; background-color: rgba(15, 23, 42, 0.5); border: 1px solid #475569; border-radius: 0.5rem; color: white; transition: all 0.3s; box-sizing: border-box; margin: 1.5rem 0; }
    .styledInput:focus { outline: none; box-shadow: 0 0 0 2px #a855f7; }
    .actionButton { width: 100%; padding: 0.75rem 0; background-color: #581c87; color: white; font-weight: 700; border-radius: 0.5rem; border: none; cursor: pointer; }
    .errorMessage { color: #fcd34d; text-align: center; margin-top: 1rem; }
    .unlockedContent { background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 0.5rem; margin-top: 1.5rem; white-space: pre-wrap; font-family: monospace;color: #95f00cff; }
  `;

  if (status === 'loading') {
    return <div className="pageContainer"><style dangerouslySetInnerHTML={{ __html: cssStyles }} /><p>Loading session...</p></div>;
  }

  return (
    <>
      <div className="pageContainer">
        <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
        <div className="dashboardContent">
          <header className="header">
            <div><h1 className="title">My Vaults</h1><p style={{ margin: 0, color: '#94a3b8' }}>Welcome, {session?.user?.name}</p></div>
            <button className="signOutButton" onClick={() => signOut()}>Sign Out</button>
          </header>
          <nav className="navActions">
            <div className="navButton" onClick={() => router.push('/create')}>Create New Vault</div>
            <div className="navButton" onClick={() => router.push('/unlock')}>Unlock a Vault</div>
          </nav>
          <main>
            {isLoading ? <p>Loading your vaults...</p> : error ? <p className="errorMessage">{error}</p> : vaults.length > 0 ? (
              <div className="vaultsGrid">{vaults.map(vault => (<div key={vault.id} className="vaultCard" onClick={() => openUnlockModal(vault)}><p className="vaultCid">{vault.cid}</p><p className="vaultDate">Created: {new Date(vault.created_at).toLocaleString()}</p></div>))}</div>
            ) : <p>You haven't created any vaults yet.</p>}
          </main>
        </div>
      </div>
      {isModalOpen && (
        <div className="modalOverlay" onClick={closeModal}>
          <div className="modalContent" onClick={e => e.stopPropagation()}>
            <div className="modalHeader"><h2 style={{margin:0}}>Unlock Vault</h2><button className="modalCloseButton" onClick={closeModal}>&times;</button></div>
            <p style={{color: '#94a3b8', wordBreak: 'break-all'}}>CID: {selectedVault?.cid}</p>
            {unlockedContent ? (
              <div><p>Content Unlocked:</p><pre className="unlockedContent">{JSON.stringify(unlockedContent, null, 2)}</pre></div>
            ) : (
              <>
                <input type="password" className="styledInput" placeholder="Enter vault password" value={password} onChange={e => setPassword(e.target.value)} disabled={isUnlocking} />
                <button className="actionButton" onClick={handleUnlock} disabled={isUnlocking}>{isUnlocking ? 'Unlocking...' : 'Unlock'}</button>
                {modalError && <p className="errorMessage">{modalError}</p>}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
