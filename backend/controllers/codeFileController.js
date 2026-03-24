const generateCodePDF = require("../utils/generatePDF");
const uploadPDF = require("../utils/uploadToCloudinary");
const CodeFile = require("../models/CodeFile");
const { v4: uuidv4 } = require("uuid");
const { asyncHandler } = require("../middleware/globalErrorHandler");

const uploadCodeAsPDF = asyncHandler(async (req, res) => {
  const { code, language, room_id } = req.body;

  if (!code || !language || !room_id) {
    return res.status(400).json({
      success: false,
      message: "code, language, room_id required",
    });
  }

  const pdfBuffer = await generateCodePDF(code, language);

  const uploadResult = await uploadPDF(pdfBuffer);

  const savedFile = await CodeFile.create({
    id: uuidv4(),
    room_id,
    user_id: req.user.id,
    file_url: uploadResult.secure_url,
    language,
  });

  res.status(201).json({
    success: true,
    message: "PDF uploaded successfully",
    data: savedFile,
  });
});

module.exports = {
  uploadCodeAsPDF,
};
