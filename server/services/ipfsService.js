const axios = require("axios");
const FormData = require("form-data");

const PINATA_API = process.env.PINATA_API;
const PINATA_SECRET = process.env.PINATA_SECRET;

async function storeToIPFS(content) {
  const res = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    pinataContent: { encryptedVault: content }
  }, {
    headers: {
      pinata_api_key: PINATA_API,
      pinata_secret_api_key: PINATA_SECRET,
    },
  });

  return res.data.IpfsHash;
}

async function fetchFromIPFS(cid) {
  const res = await axios.get(`https://gateway.pinata.cloud/ipfs/${cid}`);
  // expecting pinned JSON with shape { encryptedVault: "..." }
  if (res.data && res.data.encryptedVault) return res.data.encryptedVault;
  // fallback: if the IPFS object is the encrypted string itself
  return (typeof res.data === 'string') ? res.data : JSON.stringify(res.data);
}

async function storeFileToIPFS(file) {
  const data = new FormData();
  data.append('file', file.data, file.name);

  const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', data, {
    maxBodyLength: 'Infinity',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
      pinata_api_key: PINATA_API,
      pinata_secret_api_key: PINATA_SECRET,
    },
  });
  return res.data.IpfsHash;
}

module.exports = { storeToIPFS, fetchFromIPFS, storeFileToIPFS };
