const { encryptVault, decryptVault } = require("../../shared/encryption");
const { storeToIPFS, fetchFromIPFS, storeFileToIPFS } = require("../services/ipfsService");

exports.createVault = async (req, res) => {
  const { content, password } = req.body;
  if (!content || !password) return res.status(400).json({error: 'missing content or password'});

  try {
    const encrypted = encryptVault(content, password);
    const cid = await storeToIPFS(encrypted);
    res.status(200).json({ cid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Vault creation failed" });
  }
};

exports.unlockVault = async (req, res) => {
  const { cid, password } = req.body;
  if (!cid || !password) return res.status(400).json({error: 'missing cid or password'});

  try {
    const encrypted = await fetchFromIPFS(cid);
    const decrypted = decryptVault(encrypted, password);
    res.status(200).json({ content: decrypted });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Incorrect password or corrupt vault" });
  }
};

exports.uploadFile = async (req, res) => {
  const file = req.files?.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const cid = await storeFileToIPFS(file);
    res.json({ cid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "File upload failed" });
  }
};
