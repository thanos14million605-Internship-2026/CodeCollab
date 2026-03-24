const pool = require("../config/db");
const { v4: uuidv4 } = require("uuid");

class Message {
  static async create(messageData) {
    const { id, room_id, user_id, content, message_type, created_at } =
      messageData;

    // Hash password

    const query = `
        INSERT INTO messages (id, room_id, user_id, content, message_type, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `;

    try {
      const result = await pool.query(query, [
        id,
        room_id,
        user_id,
        content,
        message_type,
        created_at,
      ]);
      return result.rows[0];
    } catch (error) {
      throw new Error("Error creating message: " + error.message);
    }
  }

  static async getMessages(room_id, limit = 50, offset = 0) {
    const query = `
      SELECT 
        m.*,
        u.id as user_id,
        u.name,
        u.role,
        u.avatar_url
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.room_id = $1
      ORDER BY m.created_at ASC
      LIMIT $2 OFFSET $3
    `;

    try {
      const result = await pool.query(query, [room_id, limit, offset]);

      return result.rows.map((row) => ({
        id: row.id,
        room_id: row.room_id,
        content: row.content,
        user_id: row.user_id,
        message_type: row.message_type,
        created_at: row.created_at,
        user: {
          id: row.user_id,
          name: row.name,
          role: row.role,
          avatar_url: row.avatar_url,
        },
      }));
    } catch (error) {
      throw new Error("Error fetching messages: " + error.message);
    }
  }
}

module.exports = Message;
