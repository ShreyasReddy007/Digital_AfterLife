import React from 'react';
import { useState, useEffect, JSX, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import Image from 'next/image';

// INTERFACES
interface Vault { id: number; cid: string; name: string; created_at: string; triggerDate: string | null; inactivityTrigger: boolean; recipientEmails: string[] | null; }
interface RecipientVault { id: number; cid: string; name: string; created_at: string; ownerName: string; }
interface UnlockedFile { data: string; name: string; type: string; }
interface UnlockedContent { message?: string; files?: UnlockedFile[]; }

export default function DashboardPage(): JSX.Element {
  const { data: session, status, update } = useSession({ required: true, onUnauthenticated() { router.push('/login') } });
  const router = useRouter();

  // STATE MANAGEMENT
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [recipientVaults, setRecipientVaults] = useState<RecipientVault[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');

  // Second-layer authentication state
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // MODAL STATES
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [previewModalFile, setPreviewModalFile] = useState<UnlockedFile | null>(null);

  // ACTION STATES
  const [selectedVault, setSelectedVault] = useState<Vault | RecipientVault | null>(null);
  const [password, setPassword] = useState<string>('');
  const [modalError, setModalError] = useState<string>('');
  const [unlockedContent, setUnlockedContent] = useState<UnlockedContent | null>(null);
  const [editingVault, setEditingVault] = useState<Vault | null>(null);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFetchingContent, setIsFetchingContent] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmails, setEditEmails] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);

  // DATA FETCHING
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // We only fetch data after the user has been verified for this session.
    if (status === 'authenticated' && session?.user?.isVerified) {
      fetchAllData();
    }
  }, [status, session?.user?.isVerified]); // This effect now depends on the session's verified status

  // ACTION HANDLERS
  const handleVerifyPassword = async () => {
    setIsVerifying(true);
    setVerifyError('');
    try {
      await axios.post('/api/auth/verify-password', { password: verifyPassword });
      await update({ user: { isVerified: true } });
    } catch (err: any) {
      setVerifyError(err.response?.data?.error || 'Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const filteredAndSortedVaults = useMemo(() => {
    let processedVaults = [...vaults];
    if (searchTerm) {
      processedVaults = processedVaults.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterBy === 'date') {
      processedVaults = processedVaults.filter(v => v.triggerDate);
    } else if (filterBy === 'inactivity') {
      processedVaults = processedVaults.filter(v => v.inactivityTrigger);
    }
    processedVaults.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
    return processedVaults;
  }, [vaults, searchTerm, sortBy, filterBy]);

  const handleInactivityToggle = async (vaultId: number, isEnabled: boolean) => {
    setVaults(vaults.map(v => v.id === vaultId ? { ...v, inactivityTrigger: isEnabled } : v));
    try {
      await axios.post('/api/vaults/toggle-inactivity', { vaultId, isEnabled });
    } catch (err) {
      setError('Failed to update trigger.');
      setVaults(vaults.map(v => v.id === vaultId ? { ...v, inactivityTrigger: !isEnabled } : v));
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

  const handleDelete = async () => {
    if (!selectedVault || 'ownerName' in selectedVault) return;
    setIsDeleting(true);
    setModalError('');
    try {
      await axios.post('/api/vaults/delete', { cid: selectedVault.cid });
      closeAllModals();
      fetchAllData();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to delete vault.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingVault) return;
    setIsEditing(true);
    setModalError('');
    const formData = new FormData();
    formData.append('vaultId', editingVault.id.toString());
    formData.append('name', editName);
    formData.append('recipientEmails', editEmails);
    formData.append('message', editMessage);
    if (editFile) formData.append('file', editFile);
    try {
      await axios.post('/api/vaults/edit', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      closeAllModals();
      fetchAllData();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to update vault.');
    } finally {
      setIsEditing(false);
    }
  };

  // MODAL CONTROLS
  const openUnlockModal = (vault: Vault | RecipientVault) => {
    setSelectedVault(vault);
    setIsModalOpen(true);
    if ('ownerName' in vault) {
      handleRecipientUnlock(vault as RecipientVault);
    }
  };

  const openDeleteModal = (vault: Vault) => {
    setSelectedVault(vault);
    setIsDeleteModalOpen(true);
  };

  const openEditModal = async (vault: Vault) => {
    setEditingVault(vault);
    setEditName(vault.name);
    setEditEmails(vault.recipientEmails ? vault.recipientEmails.join(', ') : '');
    setIsEditModalOpen(true);
    setModalError('');
    setIsFetchingContent(true);
    try {
      const res = await axios.get(`/api/vaults/content?cid=${vault.cid}`);
      setEditMessage(res.data.message || '');
    } catch (err) {
      setModalError('Could not load vault content.');
    } finally {
      setIsFetchingContent(false);
    }
  };

  const openPreviewModal = (file: UnlockedFile) => {
    setPreviewModalFile(file);
  };
  
  const closeAllModals = () => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsEditModalOpen(false);
    setPreviewModalFile(null);
    setSelectedVault(null);
    setEditingVault(null);
    setEditFile(null);
    setPassword('');
    setModalError('');
    setUnlockedContent(null);
  };

  // RENDER FUNCTIONS
  const renderUnlockedContent = () => {
    if (!unlockedContent) return null;
    const { message, files } = unlockedContent;
    if (!message && (!files || files.length === 0)) {
      return <p>This vault appears to be empty.</p>;
    }
    return (
      <div>
        {message && (
          <div>
            <p className="modalLabel">Message:</p>
            <pre className="unlockedContent">{message}</pre>
          </div>
        )}
        {files && files.length > 0 && (
          <div style={{ marginTop: message ? '1.5rem' : '0' }}>
            <p className="modalLabel">Attachments:</p>
            <div className="attachmentsGrid">
              {files.map((file, index) => (
                <div key={index} className="attachmentItemContainer" onClick={() => openPreviewModal(file)}>
                  <div className="attachmentItem">
                    {file.type.startsWith('image/') ? (
                      <img src={file.data} alt={file.name} className="attachmentPreview" />
                    ) : file.type === 'application/pdf' ? (
                      <div className="fileIcon pdfIcon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        <span>PDF</span>
                      </div>
                    ) : (
                      <div className="fileIcon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                      </div>
                    )}
                    <span className="attachmentName">{file.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPreviewModal = () => {
    if (!previewModalFile) return null;
    return (
      <div className="modalOverlay" onClick={closeAllModals}>
        <div className="previewModalContent" onClick={(e) => e.stopPropagation()}>
          <div className="modalHeader">
            <h2 className="modalTitle">{previewModalFile.name}</h2>
            <button className="modalCloseButton" onClick={closeAllModals}>&times;</button>
          </div>
          <div className="modalBody">
            {previewModalFile.type.startsWith('image/') ? (
              <img src={previewModalFile.data} alt={previewModalFile.name} className="modalPreviewImage" />
            ) : previewModalFile.type === 'application/pdf' ? (
              <iframe src={previewModalFile.data} title={previewModalFile.name} className="modalPreviewIframe" />
            ) : (
              <div className="modalGenericPreview">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                <p>No preview available for this file type.</p>
              </div>
            )}
          </div>
          <div className="modalFooter">
            <a href={previewModalFile.data} download={previewModalFile.name} className="downloadButton">Download</a>
          </div>
        </div>
      </div>
    );
  };

  const cssStyles = `
    html, body { margin: 0; padding: 0; box-sizing: border-box; }
    .pageContainer { display: flex; flex-direction: column; min-height: 100vh; width: 100%; background: linear-gradient(to bottom right, #0f172a, #000000, #3b0764); padding: 2rem 1rem; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: white; }
    .dashboardContent { max-width: 1200px; margin: 0 auto; width: 100%; }
    .header { position: relative; display: flex; justify-content: center; align-items: center; margin-bottom: 2rem; padding: 1rem 0; }
    .header-title-container { display: flex; align-items: center; gap: 1rem; }
    .siteTitle { font-size: 3.25rem; font-weight: 800; margin: 0; background: linear-gradient(90deg, #a78bfa, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: transparent; }
    .signOutButton { position: absolute; right: 0; top: 50%; transform: translateY(-50%); background: none; border: 1px solid #475569; color: #e14b29ff; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; transition: background-color 0.2s, color 0.2s; }
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
    .controlsContainer { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; margin-bottom: 2rem; padding: 1rem; background-color: rgba(255, 255, 255, 0.05); border-radius: 0.75rem; }
    .searchBox { position: relative; flex-grow: 2; min-width: 250px; }
    .searchBox input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.5rem; background-color: rgba(15, 23, 42, 0.5); border: 1px solid #475569; border-radius: 0.5rem; color: white; box-sizing: border-box; }
    .searchBox svg { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
    .controlGroup { display: flex; align-items: center; gap: 0.75rem; }
    .controlLabel { font-size: 0.875rem; color: #94a3b8; }
    .sortSelect { padding: 0.75rem 1rem; background-color: rgba(15, 23, 42, 0.5); border: 1px solid #475569; border-radius: 0.5rem; color: white; }
    .filterButtons { display: flex; gap: 0.5rem; background-color: rgba(15, 23, 42, 0.5); border-radius: 0.5rem; padding: 0.25rem; }
    .filterButton { padding: 0.5rem 1rem; border: none; background: transparent; color: #94a3b8; cursor: pointer; border-radius: 0.375rem; transition: all 0.2s; }
    .filterButton.active { background-color: #581c87; color: white; }
    .vaultsGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .vaultCard { background-color: rgba(0,0,0,0.3); border: 1px solid #334155; border-radius: 0.5rem; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; }
    .vaultName { font-size: 1.125rem; font-weight: 600; margin: 0; word-break: break-all; }
    .vaultDate { font-size: 0.75rem; color: #94a3b8; margin-top: 1rem; margin-bottom: 0.5rem; }
    .triggerInfo { font-size: 0.875rem; color: #a5b4fc; margin-top: 1rem; padding: 0.5rem; background-color: rgba(71, 85, 105, 0.2); border-radius: 0.25rem; text-align: center; }
    .vaultActions { display: flex; gap: 0.5rem; margin-top: 1.5rem; }
    .actionButton { flex-grow: 1; padding: 0.5rem 1rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 500; transition: background-color 0.2s; }
    .unlockButton { background: linear-gradient(to right, #581c87, #9333ea); color: white; }
    .editButton { background-color: #475569; color: white; }
    .deleteButton { background-color: #be123c; color: white; }
    .modalOverlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modalContent { background: #1a1a2e; border: 1px solid #475569; border-radius: 1rem; padding: 2rem; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
    .modalHeader { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 1rem; margin-bottom: 1rem;}
    .modalCloseButton { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
    .styledInput { width: 100%; padding: 0.75rem; background-color: rgba(15, 23, 42, 0.5); border: 1px solid #475569; border-radius: 0.5rem; color: white; margin-top: 1rem; box-sizing: border-box; }
    .errorMessage { color: #fcd34d; text-align: center; margin-top: 1rem; }
    .unlockedContent {background: rgba(0, 0, 0, 0.3);padding: 1rem;border-radius: 0.5rem;white-space: pre-wrap;font-family: monospace;color: #00FF41;text-shadow:0 0 5px #00FF41,0 0 10px #00FF41,0 0 20px #00FF41,0 0 40px #00FF41;}
    .modalLabel { font-weight: 600; color: white; margin: 0 0 0.5rem 0; }
    .footer { text-align: center; padding-top: 2rem; margin-top: auto; }
    .toggleContainer { display: flex; align-items: center; justify-content: space-between; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #334155; }
    .toggleLabel { font-size: 0.875rem; color: #94a3b8; }
    .switch { position: relative; display: inline-block; width: 40px; height: 24px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #475569; transition: .4s; border-radius: 24px; }
    .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }
    input:checked + .slider { background-color: #9333ea; }
    input:checked + .slider:before { transform: translateX(16px); }
    .fileInputLabel { display: flex; align-items: center; justify-content: center; width: 100%; height: 60px; background-color: rgba(15, 23, 42, 0.5); border: 2px dashed #475569; border-radius: 0.5rem; color: #94a3b8; cursor: pointer; transition: all 0.3s; margin-top: 0; }
    .fileInputLabel:hover { border-color: #a855f7; color: white; }
    .fileInputLabel span { text-align: center; max-width: 90%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .attachmentsGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.5rem; }
    .attachmentItemContainer { cursor: pointer; }
    .attachmentItem { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; height: 100%; padding: 0.5rem; background-color: rgba(255, 255, 255, 0.05); border-radius: 0.5rem; transition: background-color 0.2s; }
    .attachmentItem:hover { background-color: rgba(255, 255, 255, 0.1); }
    .attachmentPreview { width: 100%; height: 100px; object-fit: cover; border-radius: 0.5rem; }
    .fileIcon { width: 100%; height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; }
    .pdfIcon { color: #f87171; }
    .attachmentName { font-size: 0.75rem; color: #94a3b8; text-decoration: none; word-break: break-all; text-align: center; margin-top: 0.25rem; }
    .previewModalContent { background-color: #1e293b; color: white; border-radius: 1rem; width: 100%; max-width: 900px; max-height: 90vh; display: flex; flex-direction: column; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .modalTitle { font-size: 1.25rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; color: white;}
    .modalBody { flex-grow: 1; padding: 1.5rem; overflow-y: auto; text-align: center; }
    .modalPreviewImage, .modalPreviewIframe { width: 100%; height: auto; max-height: 65vh; object-fit: contain; border-radius: 0.5rem; }
    .modalPreviewIframe { height: 65vh; border: none; }
    .modalGenericPreview { display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; height: 100%; min-height: 200px; }
    .modalGenericPreview p { margin-top: 1rem; font-size: 1.1rem; }
    .modalFooter { padding: 1rem 1.5rem; border-top: 1px solid #334155; text-align: right; }
    .downloadButton { background-color: #7c3aed; color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s ease; }
    .downloadButton:hover { background-color: #a78bfa; }
  `;

  // --- MAIN RENDER ---
  if (status === 'loading') {
    return (
      <div className="pageContainer">
        <Head><title>Loading...</title></Head>
        <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
        <p>Loading session...</p>
      </div>
    );
  }

  if (status === 'authenticated' && session.user?.hasSecondaryPassword && !session.user?.isVerified) {
    return (
      <>
        <Head><title>Verify Access</title></Head>
        <div className="pageContainer">
            <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
            <div className="modalOverlay" style={{position: 'relative', backdropFilter: 'none'}}>
                <div className="modalContent">
                    <h2 style={{ color: 'white', marginTop: 0, textAlign: 'center' }}>Secondary Verification</h2>
                    <p style={{ color: '#94a3b8', textAlign: 'center' }}>
                        For your security, please enter your secondary password to access your dashboard.
                    </p>
                    <input 
                        type="password" 
                        className="styledInput" 
                        value={verifyPassword} 
                        onChange={(e) => setVerifyPassword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleVerifyPassword()}
                        placeholder="Enter secondary password" 
                    />
                    <button 
                        className="actionButton unlockButton" 
                        style={{ width: '100%', marginTop: '1.5rem' }} 
                        onClick={handleVerifyPassword}
                        disabled={isVerifying}
                    >
                        {isVerifying ? 'Verifying...' : 'Unlock Dashboard'}
                    </button>
                    {verifyError && <p className="errorMessage">{verifyError}</p>}
                </div>
            </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Digital Afterlife</title>
      </Head>
      <div className="pageContainer">
        <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
        <div className="dashboardContent">
          <header className="header">
            <div className="header-title-container">
              <Image src="/Logo.png" alt="Digital Afterlife Logo" width={150} height={150} priority={true} />
              <h1 className="siteTitle">Digital Afterlife</h1>
            </div>
            <button className="signOutButton" onClick={() => signOut()}>Sign Out</button>
          </header>

          <nav className="navActions">
            <div className="navButton" onClick={() => router.push('/create')}>Create New Vault</div>
            <div className="navButton" onClick={() => router.push('/trigger')}>Set Trigger Date</div>
            <div className="navButton" onClick={() => router.push('/recovery-key')}>Set Recovery Key</div>
            {!session?.user?.hasSecondaryPassword && (
                 <div className="navButton" onClick={() => router.push('/set-password')}>Set Secondary Password</div>
            )}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 className="title" style={{ fontSize: '1.75rem', margin: 0 }}>My Vaults</h2>
            </div>
            <div className="controlsContainer">
              <div className="searchBox">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>
                <input type="text" placeholder="Search vaults by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="controlGroup">
                <label className="controlLabel">Sort by:</label>
                <select className="sortSelect" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="newest">Date Created (Newest)</option>
                  <option value="oldest">Date Created (Oldest)</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
              <div className="controlGroup">
                <label className="controlLabel">Filter by:</label>
                <div className="filterButtons">
                  <button className={`filterButton ${filterBy === 'all' ? 'active' : ''}`} onClick={() => setFilterBy('all')}>All</button>
                  <button className={`filterButton ${filterBy === 'date' ? 'active' : ''}`} onClick={() => setFilterBy('date')}>Date Trigger</button>
                  <button className={`filterButton ${filterBy === 'inactivity' ? 'active' : ''}`} onClick={() => setFilterBy('inactivity')}>Inactivity</button>
                </div>
              </div>
            </div>

            {isLoading ? <p style={{textAlign: 'center'}}>Loading vaults...</p> : error ? <p className="errorMessage">{error}</p> : filteredAndSortedVaults.length > 0 ? (
              <div className="vaultsGrid">{filteredAndSortedVaults.map(vault => (
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
                      <button className="actionButton unlockButton" onClick={() => openUnlockModal(vault)}>Unlock</button>
                      <button className="actionButton editButton" onClick={() => openEditModal(vault)}>Edit</button>
                      <button className="actionButton deleteButton" onClick={() => openDeleteModal(vault)}>Delete</button>
                    </div>
                  </div>
                </div>))}
              </div>
            ) : <p style={{textAlign: 'center', color: '#94a3b8'}}>No vaults match your criteria. Create a new vault to get started!</p>}

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
                      <button className="actionButton unlockButton" style={{width: '100%'}} onClick={() => openUnlockModal(vault)}>View Content</button>
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

      {/* Unlock Modal */}
      {isModalOpen && (
        <div className="modalOverlay" onClick={closeAllModals}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">Vault Content</h2>
              <button className="modalCloseButton" onClick={closeAllModals}>&times;</button>
            </div>
            <p style={{ color: '#94a3b8', wordBreak: 'break-all', fontSize: '0.8rem' }}>CID: {selectedVault?.cid}</p>
            {unlockedContent ? (
              <div>{renderUnlockedContent()}</div>
            ) : isUnlocking ? (
              <p style={{ color: "white", textAlign: 'center' }}>Unlocking...</p>
            ) : selectedVault && 'ownerName' in selectedVault ? (
              <p style={{textAlign: 'center'}}>Verifying access and retrieving content...</p>
            ) : (
              <>
                <input type="password" className="styledInput" placeholder="Enter vault password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isUnlocking} />
                <button className="actionButton unlockButton" style={{ width: '100%', marginTop: '1rem' }} onClick={handleOwnerUnlock} disabled={isUnlocking}>
                  {isUnlocking ? 'Unlocking...' : 'Unlock'}
                </button>
              </>
            )}
            {modalError && <p className="errorMessage">{modalError}</p>}
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="modalOverlay" onClick={closeAllModals}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">Delete Vault</h2>
              <button className="modalCloseButton" onClick={closeAllModals}>&times;</button>
            </div>
            <p style={{ color: '#94a3b8', marginTop: '1rem' }}>
              Are you sure you want to permanently delete "{selectedVault?.name}"? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="actionButton" style={{ backgroundColor: '#475569' }} onClick={closeAllModals}>Cancel</button>
              <button className="actionButton deleteButton" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
            {modalError && <p className="errorMessage">{modalError}</p>}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="modalOverlay" onClick={closeAllModals}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">Edit Vault</h2>
              <button className="modalCloseButton" onClick={closeAllModals}>&times;</button>
            </div>
            {isFetchingContent ? (
              <p style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>Loading current content...</p>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Vault Name</label>
                    <input type="text" className="styledInput" style={{ marginTop: '0.5rem' }} value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Message</label>
                    <textarea rows={4} className="styledInput" style={{ marginTop: '0.5rem', resize: 'vertical' }} value={editMessage} onChange={(e) => setEditMessage(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Recipient Emails (comma-separated)</label>
                    <input type="text" className="styledInput" style={{ marginTop: '0.5rem' }} value={editEmails} onChange={(e) => setEditEmails(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Replace Attachment (Optional)</label>
                    <label htmlFor="edit-file-upload" className="fileInputLabel" style={{marginTop: '0.5rem'}}>
                      <span>{editFile ? editFile.name : 'Click to select a new file'}</span>
                    </label>
                    <input id="edit-file-upload" type="file" onChange={(e) => setEditFile(e.target.files ? e.target.files[0] : null)} style={{ display: 'none' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button className="actionButton" style={{ backgroundColor: '#475569' }} onClick={closeAllModals}>Cancel</button>
                  <button className="actionButton unlockButton" onClick={handleEdit} disabled={isEditing}>
                    {isEditing ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}
            {modalError && <p className="errorMessage">{modalError}</p>}
          </div>
        </div>
      )}
      
      {/* File Preview Modal */}
      {renderPreviewModal()}
    </>
  );
}
