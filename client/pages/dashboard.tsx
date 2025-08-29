// pages/dashboard.tsx
import React, { useState, useEffect, JSX } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import Image from 'next/image';

// vaults created
interface Vault {
  id: number;
  cid: string;
  name: string;
  created_at: string;
  triggerDate: string | null;
  inactivityTrigger: boolean;
}

// vaults shared
interface RecipientVault {
  id: number;
  cid: string;
  name: string;
  created_at: string;
  ownerName: string;
}

interface UnlockedContent {
  message: string | null;
  file: {
    dataUrl: string;
    fileName: string;
  } | null;
}

export default function DashboardPage(): JSX.Element {
  const { data: session, status } = useSession({ required: true, onUnauthenticated() { router.push('/login') }});
  const router = useRouter();
  
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [recipientVaults, setRecipientVaults] = useState<RecipientVault[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedVault, setSelectedVault] = useState<Vault | RecipientVault | null>(null);
  const [password, setPassword] = useState<string>('');
  const [modalError, setModalError] = useState<string>('');
  const [unlockedContent, setUnlockedContent] = useState<UnlockedContent | null>(null);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchAllData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [myVaultsRes, recipientVaultsRes] = await Promise.all([
        axios.get('/api/vaults'),
        axios.get('/api/vaults/recipient-vaults')
      ]);
      setVaults(myVaultsRes.data);
      setRecipientVaults(recipientVaultsRes.data);
    } catch (err) {
      setError('Failed to fetch vaults.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAllData();
    }
  }, [status]);

  const handleInactivityToggle = async (vaultId: number, isEnabled: boolean) => {
    setVaults(currentVaults =>
      currentVaults.map(v =>
        v.id === vaultId ? { ...v, inactivityTrigger: isEnabled } : v
      )
    );
    try {
      await axios.post('/api/vaults/toggle-inactivity', { vaultId, isEnabled });
    } catch (err) {
      setError('Failed to update trigger. Please try again.');
      setVaults(currentVaults =>
        currentVaults.map(v =>
          v.id === vaultId ? { ...v, inactivityTrigger: !isEnabled } : v
        )
      );
    }
  };

  const handleRecipientUnlock = async (vault: RecipientVault) => {
    setIsUnlocking(true);
    setModalError('');
    try {
      const res = await axios.post('/api/vaults/recipient-unlock', { cid: vault.cid });
      setUnlockedContent(res.data);
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to unlock vault.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleOwnerUnlock = async () => {
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

  const openUnlockModal = (vault: Vault | RecipientVault) => {
    setSelectedVault(vault);
    setIsModalOpen(true);
    setPassword('');
    setModalError('');
    setUnlockedContent(null);
    if ('ownerName' in vault) {
      handleRecipientUnlock(vault);
    }
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

  const handleDelete = async () => {
    if (!selectedVault || 'ownerName' in selectedVault) return;
    setIsDeleting(true);
    setModalError('');
    try {
      await axios.post('/api/vaults/delete', { cid: selectedVault.cid });
      closeModal();
      fetchAllData();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to delete vault.');
    } finally {
      setIsDeleting(false);
    }
  };

  // **MODIFIED**: This function now correctly renders the combined content
  const renderUnlockedContent = () => {
    if (!unlockedContent) return null;

    const { message, file } = unlockedContent;

    return (
      <div className="unlockedContentContainer">
        {message && (
          <div className="unlockedMessage">
            <p className="unlockedContentLabel">Message:</p>
            <p>{message}</p>
          </div>
        )}
        {file && (
          <div className="unlockedFile">
            <p className="unlockedContentLabel">Attached File:</p>
            {file.dataUrl.startsWith('data:image') ? (
              <img src={file.dataUrl} alt={file.fileName} style={{ maxWidth: '100%', borderRadius: '0.5rem', marginTop: '0.5rem' }} />
            ) : (
              <a href={file.dataUrl} download={file.fileName} className="downloadLink">
                Download {file.fileName}
              </a>
            )}
          </div>
        )}
      </div>
    );
  };

  const cssStyles = `
    html, body {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    .pageContainer { display: flex; flex-direction: column; min-height: 100vh; width: 100%; background: linear-gradient(to bottom right, #0f172a, #000000, #3b0764); padding: 2rem 1rem; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: white; }
    .dashboardContent { max-width: 1200px; margin: 0 auto; width: 100%; }
    .header {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 2rem;
      padding: 1rem 0;
    }
    .header-title-container {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .siteTitle {
      font-size: 3.25rem;
      font-weight: 800;
      margin: 0;
      background: linear-gradient(90deg, #a78bfa, #7c3aed);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      color: transparent;
    }
    .signOutButton {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: 1px solid #475569;
      color: #e14b29ff;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: background-color 0.2s, color 0.2s;
    }
    .signOutButton:hover { background-color: #e14b29ff; color: white; }
    .title { font-size: 2.25rem; font-weight: 700; margin: 0; }
    .navActions { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
    .navButton { flex-grow: 1; padding: 1rem; background-color: rgba(0,0,0,0.2); border: 1px solid #475569; border-radius: 0.5rem; text-align: center; cursor: pointer; transition: background-color 0.2s; min-width: 150px; }
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
    .unlockedContentContainer { margin-top: 1rem; }
    .unlockedContentLabel { font-weight: 600; color: #e1e5ebff; margin-bottom: 0.5rem; }
    .unlockedMessage { background-color: rgba(0,0,0,0.2); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; }
    .unlockedMessage p:last-child {margin: 0; white-space: pre-wrap;font-family: monospace;color: #00FF41;text-shadow: 0 0 5px #00FF41, 0 0 10px #00FF41;}
    .downloadLink { display: block; margin-top: 1.5rem; padding: 1rem; background-color: #581c87; text-align: center; border-radius: 0.5rem; color: white; text-decoration: none; }
    .footer { text-align: center; padding-top: 2rem; margin-top: auto; }
    .toggleContainer { display: flex; align-items: center; justify-content: space-between; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #334155; }
    .toggleLabel { font-size: 0.875rem; color: #94a3b8; }
    .switch { position: relative; display: inline-block; width: 40px; height: 24px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #475569; transition: .4s; border-radius: 24px; }
    .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }
    input:checked + .slider { background-color: #9333ea; }
    input:checked + .slider:before { transform: translateX(16px); }
  `;

  if (status === 'loading') {
    return (
        <div className="pageContainer">
            <Head>
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />
            </Head>
            <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
            <p>Loading session...</p>
        </div>
    );
  }

  return (
    <>
      <Head>
          <title>Digital Afterlife</title>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />
      </Head>
      <div className="pageContainer">
        <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
        <div className="dashboardContent">
          <header className="header">
            <div className="header-title-container">
              <Image src="/Logo.png" alt="Digital Afterlife Logo" width={150} height={150} />
              <h1 className="siteTitle">Digital Afterlife</h1>
            </div>
            <button className="signOutButton" onClick={() => signOut()}>Sign Out</button>
          </header>
          <nav className="navActions">
            <div className="navButton" onClick={() => router.push('/create')}>Create New Vault</div>
            <div className="navButton" onClick={() => router.push('/trigger')}>Set Trigger Date</div>
            <div className="navButton" onClick={() => router.push('/recovery-key')}>Set Recovery Key</div>
            <div className="navButton" onClick={() => router.push('/deliver')}>Deliver by Key</div>
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
            <h2 className="title" style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>My Vaults</h2>
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
                  <div>
                    <div className="toggleContainer">
                      <span className="toggleLabel">Inactivity Trigger</span>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={vault.inactivityTrigger}
                          onChange={(e) => handleInactivityToggle(vault.id, e.target.checked)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="vaultActions">
                      <button className="unlockButton" onClick={() => openUnlockModal(vault)}>Unlock</button>
                      <button className="deleteButton" onClick={() => openDeleteModal(vault)}>Delete</button>
                    </div>
                  </div>
                </div>))}
              </div>
            ) : <p>You haven't created any vaults yet.</p>}

            {recipientVaults.length > 0 && (
              <div style={{marginTop: '4rem'}}>
                <h2 className="title" style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Shared With Me</h2>
                <div className="vaultsGrid">{recipientVaults.map(vault => (
                  <div key={vault.id} className="vaultCard">
                    <div>
                      <h3 className="vaultName">{vault.name}</h3>
                      <p className="vaultDate">Shared by: {vault.ownerName}</p>
                      <p className="vaultDate">Delivered: {new Date(vault.created_at).toLocaleString()}</p>
                    </div>
                    <div className="vaultActions">
                      <button className="unlockButton" onClick={() => openUnlockModal(vault)}>View Content</button>
                    </div>
                  </div>))}
                </div>
              </div>
            )}
          </main>
        </div>
        <footer className="footer">
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', maxWidth: '650px', margin: '0 auto 1rem', lineHeight: '1.6' }}>
           Disclaimer : By enabling the inactivity trigger for a vault, you agree that its contents will be delivered to the recipients if your account remains inactive for a period of 6 months. This action is irreversible.
          </p>
          <p style={{ color: '#64748b', fontSize: '0.75rem' }}>
            &copy; {new Date().getFullYear()} P.Shreyas Reddy. All Rights Reserved.
          </p>
        </footer>
      </div>
      {isModalOpen && (
        <div className="modalOverlay" onClick={closeModal}>
          <div className="modalContent" onClick={e => e.stopPropagation()}>
            <div className="modalHeader"><h2 style={{margin:0,color: "white"}}>Vault Content</h2><button className="modalCloseButton" onClick={closeModal}>&times;</button></div>
            <p style={{color: '#94a3b8', wordBreak: 'break-all'}}>CID: {selectedVault?.cid}</p>
            
            {unlockedContent ? (
              <div>{renderUnlockedContent()}</div>
            ) : isUnlocking ? (
              <p>Unlocking...</p>
            ) : (selectedVault && 'ownerName' in selectedVault) ? (
              <p>Verifying access and retrieving content...</p>
            ) : (
              <>
                <input type="password" className="styledInput" placeholder="Enter vault password" value={password} onChange={e => setPassword(e.target.value)} disabled={isUnlocking} />
                <button className="unlockButton" style={{width: '100%'}} onClick={handleOwnerUnlock} disabled={isUnlocking}>{isUnlocking ? 'Unlocking...' : 'Unlock'}</button>
              </>
            )}
            {modalError && <p className="errorMessage">{modalError}</p>}
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
