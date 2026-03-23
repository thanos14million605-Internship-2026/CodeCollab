const pool = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  // Create new user
  static async create(userData) {
    const { name, email, password, role } = userData;
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const query = `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at
    `;
    
    try {
      const result = await pool.query(query, [name, email, hashedPassword, role]);
      return result.rows[0];
    } catch (error) {
      throw new Error('Error creating user: ' + error.message);
    }
  }

  // Find user by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    
    try {
      const result = await pool.query(query, [email]);
      return result.rows[0];
    } catch (error) {
      throw new Error('Error finding user: ' + error.message);
    }
  }

  // Find user by ID
  static async findById(id) {
    const query = 'SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error('Error finding user: ' + error.message);
    }
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update user profile
  static async update(id, userData) {
    const { name, avatar_url } = userData;
    const query = `
      UPDATE users 
      SET name = $1, avatar_url = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, name, email, role, avatar_url, updated_at
    `;
    
    try {
      const result = await pool.query(query, [name, avatar_url, id]);
      return result.rows[0];
    } catch (error) {
      throw new Error('Error updating user: ' + error.message);
    }
  }
}

module.exports = User;
