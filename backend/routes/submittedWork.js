const express = require("express");

const { getSubmittedWork } = require("../controllers/submittedWorkController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/all", authenticate, getSubmittedWork);

module.exports = router;
