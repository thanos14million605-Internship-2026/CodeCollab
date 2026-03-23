const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class Room {
  // Generate unique room code
  static generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Create new room
  static async create(roomData) {
    const { name, description, created_by, max_participants = 50 } = roomData;
    const room_code = this.generateRoomCode();
    
    const query = `
      INSERT INTO rooms (name, description, created_by, room_code, max_participants)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [name, description, created_by, room_code, max_participants]);
      return result.rows[0];
    } catch (error) {
      throw new Error('Error creating room: ' + error.message);
    }
  }

  // Find room by code
  static async findByCode(room_code) {
    const query = `
      SELECT r.*, u.name as creator_name, u.email as creator_email
      FROM rooms r
      JOIN users u ON r.created_by = u.id
      WHERE r.room_code = $1 AND r.is_active = true
    `;
    
    try {
      const result = await pool.query(query, [room_code]);
      return result.rows[0];
    } catch (error) {
      throw new Error('Error finding room: ' + error.message);
    }
  }

  // Find room by ID
  static async findById(id) {
    const query = `
      SELECT r.*, u.name as creator_name, u.email as creator_email
      FROM rooms r
      JOIN users u ON r.created_by = u.id
      WHERE r.id = $1
    `;
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error('Error finding room: ' + error.message);
    }
  }

  // Get rooms created by user
  static async findByCreator(creator_id) {
    const query = `
      SELECT r.*, 
             (SELECT COUNT(*) FROM participants p WHERE p.room_id = r.id) as participant_count
      FROM rooms r
      WHERE r.created_by = $1
      ORDER BY r.created_at DESC
    `;
    
    try {
      const result = await pool.query(query, [creator_id]);
      return result.rows;
    } catch (error) {
      throw new Error('Error finding rooms: ' + error.message);
    }
  }

  // Join room (add participant)
  static async addParticipant(room_id, user_id, is_teacher = false) {
    const query = `
      INSERT INTO participants (room_id, user_id, is_teacher)
      VALUES ($1, $2, $3)
      ON CONFLICT (room_id, user_id) DO NOTHING
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [room_id, user_id, is_teacher]);
      return result.rows[0];
    } catch (error) {
      throw new Error('Error adding participant: ' + error.message);
    }
  }

  // Get room participants
  static async getParticipants(room_id) {
    const query = `
      SELECT p.*, u.name, u.email, u.avatar_url, u.role
      FROM participants p
      JOIN users u ON p.user_id = u.id
      WHERE p.room_id = $1
      ORDER BY p.joined_at ASC
    `;
    
    try {
      const result = await pool.query(query, [room_id]);
      return result.rows;
    } catch (error) {
      throw new Error('Error getting participants: ' + error.message);
    }
  }

  // Remove participant from room
  static async removeParticipant(room_id, user_id) {
    const query = 'DELETE FROM participants WHERE room_id = $1 AND user_id = $2 RETURNING *';
    
    try {
      const result = await pool.query(query, [room_id, user_id]);
      return result.rows[0];
    } catch (error) {
      throw new Error('Error removing participant: ' + error.message);
    }
  }

  // Update room status
  static async updateStatus(id, is_active) {
    const query = `
      UPDATE rooms 
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [is_active, id]);
      return result.rows[0];
    } catch (error) {
      throw new Error('Error updating room: ' + error.message);
    }
  }
}

module.exports = Room;
