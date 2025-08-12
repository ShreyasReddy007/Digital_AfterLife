import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [cid, setCid] = useState('');

  const handleCreate = async () => {
    const res = await axios.post('http://localhost:5001/api/vaults/create', { content: message, password });
    setCid(res.data.cid);
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Create Vault</h1>
      <textarea rows={8} style={{ width: '100%' }} value={message} onChange={(e) => setMessage(e.target.value)} />
      <input type="password" placeholder="vault password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleCreate}>Create Vault</button>
      {cid && <p>Vault CID: <code>{cid}</code></p>}
    </main>
  );
}
