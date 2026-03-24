const pool = require("../config/db");

class CodeFile {
  static async create({ id, room_id, user_id, file_url, language }) {
    const query = `
      INSERT INTO code_files (id, room_id, user_id, file_url, language)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [id, room_id, user_id, file_url, language];

    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

module.exports = CodeFile;
