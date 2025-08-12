const express = require("express");
const { createVault, unlockVault, uploadFile } = require("../controllers/vaultController");

const router = express.Router();

router.post("/create", createVault);
router.post("/unlock", unlockVault);
router.post("/upload", uploadFile);

module.exports = router;
