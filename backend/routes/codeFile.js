const express = require("express");
const { uploadCodeAsPDF } = require("../controllers/codeFileController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/upload-pdf", authenticate, uploadCodeAsPDF);

module.exports = router;
