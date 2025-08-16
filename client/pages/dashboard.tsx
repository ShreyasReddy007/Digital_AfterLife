// pages/dashboard.tsx
import React, { useState, useEffect, JSX } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';

interface Vault {
  id: number;
  cid: string;
  name: string;
  created_at: string;
  triggerDate: string | null;
}

interface UnlockedContent {
  type: 'json' | 'file';
  data: any;
  fileName?: string;
}

export default function DashboardPage(): JSX.Element {
  const { data: session, status } = useSession({ required: true, onUnauthenticated() { router.push('/login') }});
  const router = useRouter();
  
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [password, setPassword] = useState<string>('');
  const [modalError, setModalError] = useState<string>('');
  const [unlockedContent, setUnlockedContent] = useState<UnlockedContent | null>(null);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

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

  useEffect(() => {
    if (status === 'authenticated') {
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

  const openDeleteModal = (vault: Vault) => {
    setSelectedVault(vault);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedVault(null);
  };

  const handleUnlock = async () => {
    if (!password || !selectedVault) return;
    setIsUnlocking(true);
    setModalError('');
    try {
      const res = await axios.post('/api/vaults/unlock', { cid: selectedVault.cid, password });
      setUnlockedContent(res.data);
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to unlock vault.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVault) return;
    setIsDeleting(true);
    setModalError('');
    try {
      await axios.post('/api/vaults/delete', { cid: selectedVault.cid });
      closeModal();
      fetchVaults(); // Refresh the vault list
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to delete vault.');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderUnlockedContent = () => {
    if (!unlockedContent) return null;
    
    if (unlockedContent.type === 'json') {
      return <pre className="unlockedContent">{JSON.stringify(unlockedContent.data, null, 2)}</pre>;
    }
    
    if (unlockedContent.type === 'file') {
      if (unlockedContent.data.startsWith('data:image')) {
        return <img src={unlockedContent.data} alt="Unlocked content" style={{ maxWidth: '100%', borderRadius: '0.5rem' }} />;
      }
      return <a href={unlockedContent.data} download={unlockedContent.fileName || 'vault_content'} className="downloadLink">Download File</a>;
    }

    return null;
  };

  const cssStyles = `
    .pageContainer { display: flex; flex-direction: column; min-height: 100vh; width: 100%; background: linear-gradient(to bottom right, #0f172a, #000000, #3b0764); padding: 2rem 1rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: white; }
    .dashboardContent { max-width: 1200px; margin: 0 auto; width: 100%; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .title { font-size: 2.25rem; font-weight: 700; margin: 0; }
    .refreshButton { background: none; border: 1px solid #475569; color: #94a3b8; padding: 0.5rem; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .signOutButton { background: none; border: 1px solid #475569; color: #e14b29ff; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; transition: background-color 0.2s, color 0.2s; }
    .signOutButton:hover { background-color: #e14b29ff; color: white; }
    .navActions { display: flex; gap: 1rem; margin-bottom: 2rem; }
    .navButton { flex-grow: 1; padding: 1rem; background-color: rgba(0,0,0,0.2); border: 1px solid #475569; border-radius: 0.5rem; text-align: center; cursor: pointer; transition: background-color 0.2s; }
    .navButton:hover { background-color: rgba(0,0,0,0.4); }
    .infoSection { background-color: rgba(255, 255, 255, 0.05); border: 1px solid #334155; border-radius: 0.75rem; padding: 1.5rem 2rem; margin-bottom: 2.5rem; text-align: center; }
    .infoTitle { font-size: 1.5rem; font-weight: 600; margin-top: 0; margin-bottom: 0.75rem; color: #e2e8f0; }
    .infosubTitle { font-size: 1.2rem; font-weight: 500; margin-top: 0; margin-bottom: 0.75rem; color: #d1d5db; }
    .infoPoints { list-style: none; padding: 0; }
    .infoText { font-size: 1rem; color: #94a3b8; line-height: 1.6; max-width: 800px; margin: 0.5rem auto; }
    .vaultsGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .vaultCard { background-color: rgba(0,0,0,0.3); border: 1px solid #334155; border-radius: 0.5rem; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; }
    .vaultName { font-size: 1.125rem; font-weight: 600; margin: 0; word-break: break-all; }
    .vaultDate { font-size: 0.75rem; color: #94a3b8; margin-top: 1rem; margin-bottom: 0.5rem; }
    .triggerInfo { font-size: 0.875rem; color: #a5b4fc; margin-top: 1rem; padding: 0.5rem; background-color: rgba(71, 85, 105, 0.2); border-radius: 0.25rem; text-align: center; }
    .vaultActions { display: flex; gap: 0.5rem; margin-top: 1.5rem; }
    .unlockButton { flex-grow: 1; padding: 0.5rem 1rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 500; background: linear-gradient(to right, #581c87, #9333ea); color: white; }
    .deleteButton { padding: 0.5rem 1rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 500; background-color: #be123c; color: white; }
    .modalOverlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modalContent { background: #1a1a2e; border: 1px solid #475569; border-radius: 1rem; padding: 2rem; width: 90%; max-width: 500px; }
    .modalHeader { display: flex; justify-content: space-between; align-items: center; }
    .modalCloseButton { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
    .styledInput { width: 100%; padding: 0.75rem; background-color: rgba(15, 23, 42, 0.5); border: 1px solid #475569; border-radius: 0.5rem; color: white; margin: 1.5rem 0; }
    .errorMessage { color: #fcd34d; text-align: center; margin-top: 1rem; }
    .unlockedContent {background: rgba(0, 0, 0, 0.3);padding: 1rem;border-radius: 0.5rem;margin-top: 1.5rem;white-space: pre-wrap;font-family: monospace;color: #00FF41;text-shadow:0 0 5px #00FF41,0 0 10px #00FF41,0 0 20px #00FF41,0 0 40px #00FF41;}
    .downloadLink { display: block; margin-top: 1.5rem; padding: 1rem; background-color: #581c87; text-align: center; border-radius: 0.5rem; color: white; text-decoration: none; }
    .footer { text-align: center; padding-top: 2rem; margin-top: auto; color: #64748b; font-size: 0.875rem; }
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
            <div className="header-left">
              <h1 className="title">My Vaults</h1>
              <button className="refreshButton" onClick={fetchVaults} title="Refresh Vaults">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                  <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                </svg>
              </button>
            </div>
            <button className="signOutButton" onClick={() => signOut()}>Sign Out</button>
          </header>
          <nav className="navActions">
            <div className="navButton" onClick={() => router.push('/create')}>Create New Vault</div>
            <div className="navButton" onClick={() => router.push('/upload')}>Upload File</div>
            <div className="navButton" onClick={() => router.push('/trigger')}>Set Trigger Date</div>
          </nav>

          <section className="infoSection">
            <h2 className="infoTitle">Whispers Beyond Time</h2>
            <ul className="infoPoints">
              <h3 className="infosubTitle">A Bridge Between Today’s Moments and Tomorrow’s Memories</h3>
              <p className="infoText">Store heartfelt messages, memories, and documents securely.</p>
              <p className="infoText">Encrypted to protect your privacy until the right moment arrives.</p>
              <p className="infoText">Ensure your legacy reaches loved ones exactly when you intend.</p>
              </ul>
          </section>

          <main>
            {isLoading ? <p>Loading...</p> : error ? <p className="errorMessage">{error}</p> : vaults.length > 0 ? (
              <div className="vaultsGrid">{vaults.map(vault => (
                <div key={vault.id} className="vaultCard">
                  <div>
                    <h3 className="vaultName">{vault.name}</h3>
                    <p className="vaultDate">Created: {new Date(vault.created_at).toLocaleString()}</p>
                    {vault.triggerDate && (
                      <div className="triggerInfo">
                        Trigger set for: {new Date(vault.triggerDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="vaultActions">
                    <button className="unlockButton" onClick={() => openUnlockModal(vault)}>Unlock</button>
                    <button className="deleteButton" onClick={() => openDeleteModal(vault)}>Delete</button>
                  </div>
                </div>))}
              </div>
            ) : <p>You haven't created any vaults yet.</p>}
          </main>
        </div>
        <footer className="footer">
          <p>&copy; {new Date().getFullYear()} P.Shreyas Reddy. All Rights Reserved.</p>
        </footer>
      </div>
      {isModalOpen && (
        <div className="modalOverlay" onClick={closeModal}>
          <div className="modalContent" onClick={e => e.stopPropagation()}>
            <div className="modalHeader"><h2 style={{margin:0}}>Unlock Vault</h2><button className="modalCloseButton" onClick={closeModal}>&times;</button></div>
            <p style={{color: '#94a3b8', wordBreak: 'break-all'}}>CID: {selectedVault?.cid}</p>
            {unlockedContent ? (
              <div>
                <p>Content Unlocked:</p>
                {renderUnlockedContent()}
              </div>
            ) : (
              <>
                <input type="password" className="styledInput" placeholder="Enter vault password" value={password} onChange={e => setPassword(e.target.value)} disabled={isUnlocking} />
                <button className="unlockButton" style={{width: '100%'}} onClick={handleUnlock} disabled={isUnlocking}>{isUnlocking ? 'Unlocking...' : 'Unlock'}</button>
                {modalError && <p className="errorMessage">{modalError}</p>}
              </>
            )}
          </div>
        </div>
      )}
      {isDeleteModalOpen && (
        <div className="modalOverlay" onClick={closeModal}>
          <div className="modalContent" onClick={e => e.stopPropagation()}>
            <div className="modalHeader"><h2 style={{margin:0}}>Delete Vault</h2><button className="modalCloseButton" onClick={closeModal}>&times;</button></div>
            <p style={{color: '#94a3b8', marginTop: '1rem'}}>Are you sure you want to permanently delete "{selectedVault?.name}"? This action cannot be undone.</p>
            <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
              <button className="unlockButton" style={{backgroundColor: '#475569', flexGrow: 1}} onClick={closeModal}>Cancel</button>
              <button className="deleteButton" style={{flexGrow: 1}} onClick={handleDelete} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete'}</button>
            </div>
            {modalError && <p className="errorMessage">{modalError}</p>}
          </div>
        </div>
      )}
    </>
  );
}
