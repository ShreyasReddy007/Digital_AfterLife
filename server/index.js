const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
require('dotenv').config();

const vaultRoutes = require("./routes/vaultRoutes");

const app = express();
app.use(cors());
app.use(bodyParser.json({limit: '10mb'}));
app.use(fileUpload());

app.use("/api/vaults", vaultRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
