import pool from '../config/database';
import { User, UserDTO } from '../models/user.model';

export class UserRepository {
  async findByOpenId(openid: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE openid = $1';
    const { rows } = await pool.query(query, [openid]);
    return rows[0] || null;
  }

  async findById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async create(openid: string, userData: UserDTO): Promise<User> {
    const query = `
      INSERT INTO users (openid, nickname, avatar_url)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [openid, userData.nickname || null, userData.avatar_url || null];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async update(id: number, userData: UserDTO): Promise<User | null> {
    const query = `
      UPDATE users
      SET nickname = COALESCE($1, nickname),
          avatar_url = COALESCE($2, avatar_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const values = [userData.nickname || null, userData.avatar_url || null, id];
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }
}

export const userRepository = new UserRepository();
