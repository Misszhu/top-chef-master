import pool from '../config/database';
import { Dish, DishCreateDTO, DishUpdateDTO, DishQueryFilters, Ingredient, Step, Tag } from '../models/dish.model';

export class DishRepository {
  async findAll(filters: DishQueryFilters = {}, limit: number = 20, offset: number = 0): Promise<Dish[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.is_public !== undefined) {
      conditions.push(`d.is_public = $${paramIndex++}`);
      values.push(filters.is_public);
    }

    if (filters.difficulty) {
      conditions.push(`d.difficulty = $${paramIndex++}`);
      values.push(filters.difficulty);
    }

    if (filters.user_id) {
      conditions.push(`d.user_id = $${paramIndex++}`);
      values.push(filters.user_id);
    }

    if (filters.search) {
      conditions.push(`(d.name ILIKE $${paramIndex} OR d.description ILIKE $${paramIndex})`);
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const query = `
      SELECT d.*, u.nickname as user_nickname, u.avatar_url as user_avatar_url,
             (SELECT AVG(rating) FROM comments WHERE dish_id = d.id) as average_rating
      FROM dishes d
      LEFT JOIN users u ON d.user_id = u.id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;
    
    values.push(limit, offset);
    
    const { rows } = await pool.query(query, values);
    return rows;
  }

  async findById(id: number): Promise<Dish | null> {
    const query = `
      SELECT d.*, u.nickname as user_nickname, u.avatar_url as user_avatar_url,
             (SELECT AVG(rating) FROM comments WHERE dish_id = d.id) as average_rating
      FROM dishes d
      LEFT JOIN users u ON d.user_id = u.id
      WHERE d.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) return null;
    
    const dish = rows[0];
    
    // Fetch ingredients
    const ingredientsQuery = 'SELECT * FROM ingredients WHERE dish_id = $1 ORDER BY sort_order ASC';
    const { rows: ingredients } = await pool.query(ingredientsQuery, [id]);
    dish.ingredients = ingredients;
    
    // Fetch steps
    const stepsQuery = 'SELECT * FROM steps WHERE dish_id = $1 ORDER BY step_number ASC';
    const { rows: steps } = await pool.query(stepsQuery, [id]);
    dish.steps = steps;
    
    // Fetch tags
    const tagsQuery = `
      SELECT t.* FROM tags t
      JOIN dish_tags dt ON t.id = dt.tag_id
      WHERE dt.dish_id = $1
    `;
    const { rows: tags } = await pool.query(tagsQuery, [id]);
    dish.tags = tags;
    
    return dish;
  }

  async create(user_id: number, dishData: DishCreateDTO): Promise<Dish> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const dishQuery = `
        INSERT INTO dishes (user_id, name, description, difficulty, cooking_time, image_url, is_public)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const dishValues = [
        user_id, 
        dishData.name, 
        dishData.description || null, 
        dishData.difficulty || null, 
        dishData.cooking_time || null, 
        dishData.image_url || null, 
        dishData.is_public !== undefined ? dishData.is_public : true
      ];
      const { rows: [dish] } = await client.query(dishQuery, dishValues);
      
      // Insert ingredients
      if (dishData.ingredients && dishData.ingredients.length > 0) {
        for (const ingredient of dishData.ingredients) {
          const ingQuery = 'INSERT INTO ingredients (dish_id, name, amount, unit, sort_order) VALUES ($1, $2, $3, $4, $5)';
          await client.query(ingQuery, [dish.id, ingredient.name, ingredient.amount, ingredient.unit, ingredient.sort_order]);
        }
      }
      
      // Insert steps
      if (dishData.steps && dishData.steps.length > 0) {
        for (const step of dishData.steps) {
          const stepQuery = 'INSERT INTO steps (dish_id, step_number, description, image_url) VALUES ($1, $2, $3, $4)';
          await client.query(stepQuery, [dish.id, step.step_number, step.description, step.image_url || null]);
        }
      }
      
      // Insert tags
      if (dishData.tag_ids && dishData.tag_ids.length > 0) {
        for (const tag_id of dishData.tag_ids) {
          const tagRelQuery = 'INSERT INTO dish_tags (dish_id, tag_id) VALUES ($1, $2)';
          await client.query(tagRelQuery, [dish.id, tag_id]);
        }
      }
      
      await client.query('COMMIT');
      return dish;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async update(id: number, dishData: DishUpdateDTO): Promise<Dish | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update dish core info
      const dishQuery = `
        UPDATE dishes
        SET name = COALESCE($1, name),
            description = COALESCE($2, description),
            difficulty = COALESCE($3, difficulty),
            cooking_time = COALESCE($4, cooking_time),
            image_url = COALESCE($5, image_url),
            is_public = COALESCE($6, is_public),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *
      `;
      const dishValues = [
        dishData.name || null,
        dishData.description || null,
        dishData.difficulty || null,
        dishData.cooking_time || null,
        dishData.image_url || null,
        dishData.is_public !== undefined ? dishData.is_public : null,
        id
      ];
      const { rows: [dish] } = await client.query(dishQuery, dishValues);
      
      if (!dish) {
        await client.query('ROLLBACK');
        return null;
      }
      
      // If ingredients provided, replace them
      if (dishData.ingredients !== undefined) {
        await client.query('DELETE FROM ingredients WHERE dish_id = $1', [id]);
        for (const ingredient of dishData.ingredients) {
          const ingQuery = 'INSERT INTO ingredients (dish_id, name, amount, unit, sort_order) VALUES ($1, $2, $3, $4, $5)';
          await client.query(ingQuery, [id, ingredient.name, ingredient.amount, ingredient.unit, ingredient.sort_order]);
        }
      }
      
      // If steps provided, replace them
      if (dishData.steps !== undefined) {
        await client.query('DELETE FROM steps WHERE dish_id = $1', [id]);
        for (const step of dishData.steps) {
          const stepQuery = 'INSERT INTO steps (dish_id, step_number, description, image_url) VALUES ($1, $2, $3, $4)';
          await client.query(stepQuery, [id, step.step_number, step.description, step.image_url || null]);
        }
      }
      
      // If tags provided, replace them
      if (dishData.tag_ids !== undefined) {
        await client.query('DELETE FROM dish_tags WHERE dish_id = $1', [id]);
        for (const tag_id of dishData.tag_ids) {
          const tagRelQuery = 'INSERT INTO dish_tags (dish_id, tag_id) VALUES ($1, $2)';
          await client.query(tagRelQuery, [id, tag_id]);
        }
      }
      
      await client.query('COMMIT');
      return dish;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM dishes WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async incrementViewCount(id: number): Promise<void> {
    const query = 'UPDATE dishes SET view_count = view_count + 1 WHERE id = $1';
    await pool.query(query, [id]);
  }
}

export const dishRepository = new DishRepository();
