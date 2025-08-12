import { useState } from "react";
import axios from "axios";

export default function Unlock() {
  const [cid, setCid] = useState('');
  const [password, setPassword] = useState('');
  const [content, setContent] = useState<any>(null);

  const handleUnlock = async () => {
    const res = await axios.post('http://localhost:5001/api/vaults/unlock', { cid, password });
    setContent(res.data.content);
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Unlock Vault</h1>
      <input value={cid} onChange={(e) => setCid(e.target.value)} placeholder="Vault CID" style={{ width: '100%' }} />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" style={{ width: '100%' }} />
      <button onClick={handleUnlock}>Unlock</button>
      {content && <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(content, null, 2)}</pre>}
    </main>
  );
}
