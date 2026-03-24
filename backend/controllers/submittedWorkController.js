const pool = require("../config/db");
const { asyncHandler } = require("../middleware/globalErrorHandler");

const getSubmittedWork = asyncHandler(async (req, res) => {
  const teacherId = req.user.id;

  const roomsResult = await pool.query(
    `SELECT id, name, room_code 
     FROM rooms 
     WHERE created_by = $1`,
    [teacherId]
  );

  const rooms = roomsResult.rows;

  if (!rooms.length) {
    return res.status(200).json({
      success: true,
      data: [],
      message: "No rooms found for this teacher",
    });
  }

  const roomIds = rooms.map((r) => r.id);

  const submittedResult = await pool.query(
    `
    SELECT cf.id, cf.file_url, cf.language, cf.created_at,
           u.id AS student_id, u.name AS student_name, u.email AS student_email,
           r.id AS room_id, r.name AS room_name, r.room_code
    FROM code_files cf
    JOIN users u ON cf.user_id = u.id
    JOIN rooms r ON cf.room_id = r.id
    WHERE cf.room_id = ANY($1::uuid[])
    ORDER BY cf.created_at DESC
    `,
    [roomIds]
  );

  res.status(200).json({
    success: true,
    data: submittedResult.rows,
  });
});

module.exports = {
  getSubmittedWork,
};
