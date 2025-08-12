import { useState } from "react";
import axios from "axios";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [cid, setCid] = useState('');

  const handleUpload = async () => {
    if (!file) return alert('select file');
    const data = new FormData();
    data.append('file', file);
    const res = await axios.post('http://localhost:5001/api/vaults/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setCid(res.data.cid);
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Upload File</h1>
      <input type="file" onChange={(e:any) => setFile(e.target.files?.[0] || null)} />
      <button onClick={handleUpload}>Upload</button>
      {cid && <p>Uploaded CID: <code>{cid}</code></p>}
    </main>
  );
}
