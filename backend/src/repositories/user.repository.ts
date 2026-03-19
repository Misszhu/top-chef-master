import pool from '../config/database';
import { User, UserDTO } from '../models/user.model';

export class UserRepository {
  async findByOpenId(openid: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE wechat_openid = $1';
    const { rows } = await pool.query(query, [openid]);
    return rows[0] || null;
  }

  async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async create(openid: string, userData: UserDTO): Promise<User> {
    const query = `
      INSERT INTO users (wechat_openid, nickname, avatar_url, phone, email)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [openid, userData.nickname || null, userData.avatar_url || null, userData.phone || null, userData.email || null];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async update(id: string, userData: UserDTO): Promise<User | null> {
    const query = `
      UPDATE users
      SET nickname = COALESCE($1, nickname),
          avatar_url = COALESCE($2, avatar_url),
          phone = COALESCE($3, phone),
          email = COALESCE($4, email),
          updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;
    const values = [userData.nickname || null, userData.avatar_url || null, userData.phone || null, userData.email || null, id];
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }
}

export const userRepository = new UserRepository();
