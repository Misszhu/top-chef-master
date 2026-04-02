import pool from '../config/database';
import { Dish, DishCreateDTO, DishUpdateDTO, DishQueryFilters, Ingredient, CookingStep } from '../models/dish.model';

export class DishRepository {
  private applyVisibilityFilter(conditions: string[], values: any[], viewerId: string | null, paramIndex: number) {
    if (!viewerId) {
      conditions.push(`d.visibility = 'public'`);
      return { paramIndex };
    }

    values.push(viewerId);
    const viewerParam = `$${paramIndex++}`;

    conditions.push(
      `(
        d.visibility = 'public'
        OR d.user_id = ${viewerParam}
        OR (
          d.visibility = 'followers'
          AND EXISTS (
            SELECT 1 FROM follows f
            WHERE f.follower_id = ${viewerParam} AND f.followee_id = d.user_id
          )
        )
      )`
    );

    return { paramIndex };
  }

  async findAllWithTotal(
    filters: DishQueryFilters = {},
    limit: number = 20,
    offset: number = 0,
    viewerId: string | null = null
  ): Promise<{ data: Dish[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

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

    if (filters.tag) {
      conditions.push(`($${paramIndex++} = ANY(d.tags))`);
      values.push(filters.tag);
    }

    conditions.push('d.deleted_at IS NULL');
    ({ paramIndex } = this.applyVisibilityFilter(conditions, values, viewerId, paramIndex));
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM dishes d
      ${whereClause}
    `;

    const dataQuery = `
      SELECT d.*, u.nickname as user_nickname, u.avatar_url as user_avatar_url
      FROM dishes d
      LEFT JOIN users u ON d.user_id = u.id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const countValues = values.slice();
    const dataValues = values.slice();
    dataValues.push(limit, offset);

    const [{ rows: countRows }, { rows: dataRows }] = await Promise.all([
      pool.query(countQuery, countValues),
      pool.query(dataQuery, dataValues),
    ]);

    return { data: dataRows, total: countRows[0]?.total ?? 0 };
  }

  async findById(id: string): Promise<Dish | null> {
    const query = `
      SELECT d.*, u.nickname as user_nickname, u.avatar_url as user_avatar_url
      FROM dishes d
      LEFT JOIN users u ON d.user_id = u.id
      WHERE d.id = $1 AND d.deleted_at IS NULL
    `;
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) return null;
    
    const dish = rows[0];
    
    // Fetch ingredients
    const ingredientsQuery = 'SELECT * FROM ingredients WHERE dish_id = $1 ORDER BY sequence ASC NULLS LAST, created_at ASC';
    const { rows: ingredients } = await pool.query<Ingredient>(ingredientsQuery, [id]);
    dish.ingredients = ingredients as any;
    
    // Fetch steps
    const stepsQuery = 'SELECT * FROM cooking_steps WHERE dish_id = $1 ORDER BY step_number ASC';
    const { rows: steps } = await pool.query<CookingStep>(stepsQuery, [id]);
    dish.steps = steps as any;
    
    return dish;
  }

  async findVisibleById(id: string, viewerId: string | null): Promise<Dish | null> {
    const conditions: string[] = ['d.id = $1', 'd.deleted_at IS NULL'];
    const values: any[] = [id];
    let paramIndex = 2;

    ({ paramIndex } = this.applyVisibilityFilter(conditions, values, viewerId, paramIndex));
    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const query = `
      SELECT d.*, u.nickname as user_nickname, u.avatar_url as user_avatar_url
      FROM dishes d
      LEFT JOIN users u ON d.user_id = u.id
      ${whereClause}
    `;
    const { rows } = await pool.query<Dish>(query, values);
    if (rows.length === 0) return null;

    const dish: any = rows[0];

    const ingredientsQuery = 'SELECT * FROM ingredients WHERE dish_id = $1 ORDER BY sequence ASC NULLS LAST, created_at ASC';
    const { rows: ingredients } = await pool.query<Ingredient>(ingredientsQuery, [id]);
    dish.ingredients = ingredients as any;

    const stepsQuery = 'SELECT * FROM cooking_steps WHERE dish_id = $1 ORDER BY step_number ASC';
    const { rows: steps } = await pool.query<CookingStep>(stepsQuery, [id]);
    dish.steps = steps as any;

    return dish;
  }

  async create(user_id: string, dishData: DishCreateDTO): Promise<Dish> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const dishQuery = `
        INSERT INTO dishes (user_id, name, description, difficulty, cooking_time, servings, image_url, tags, visibility, comments_enabled)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      const dishValues = [
        user_id, 
        dishData.name, 
        dishData.description || null, 
        dishData.difficulty || null, 
        dishData.cooking_time || null,
        dishData.servings || null,
        dishData.image_url || null,
        dishData.tags || [],
        dishData.visibility || 'private',
        dishData.comments_enabled !== undefined ? dishData.comments_enabled : true
      ];
      const { rows: [dish] } = await client.query(dishQuery, dishValues);
      
      // Insert ingredients
      if (dishData.ingredients && dishData.ingredients.length > 0) {
        for (const ingredient of dishData.ingredients) {
          const ingQuery =
            'INSERT INTO ingredients (dish_id, name, quantity, unit, note, sequence) VALUES ($1, $2, $3, $4, $5, $6)';
          await client.query(ingQuery, [
            dish.id,
            ingredient.name,
            (ingredient as any).quantity ?? null,
            ingredient.unit ?? null,
            (ingredient as any).note ?? null,
            (ingredient as any).sequence ?? null,
          ]);
        }
      }
      
      // Insert steps
      if (dishData.steps && dishData.steps.length > 0) {
        for (const step of dishData.steps) {
          const stepQuery =
            'INSERT INTO cooking_steps (dish_id, step_number, description, image_url, duration_minutes) VALUES ($1, $2, $3, $4, $5)';
          await client.query(stepQuery, [
            dish.id,
            step.step_number,
            step.description,
            step.image_url || null,
            (step as any).duration_minutes ?? null,
          ]);
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

  async update(id: string, dishData: DishUpdateDTO, ifMatchVersion?: number): Promise<Dish | null> {
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
            servings = COALESCE($5, servings),
            image_url = COALESCE($6, image_url),
            tags = COALESCE($7, tags),
            visibility = COALESCE($8, visibility),
            comments_enabled = COALESCE($9, comments_enabled),
            version = version + 1,
            updated_at = NOW()
        WHERE id = $10
          AND ($11::int IS NULL OR version = $11::int)
        RETURNING *
      `;
      const dishValues = [
        dishData.name || null,
        dishData.description || null,
        dishData.difficulty || null,
        dishData.cooking_time || null,
        dishData.servings ?? null,
        dishData.image_url || null,
        dishData.tags ?? null,
        dishData.visibility ?? null,
        dishData.comments_enabled ?? null,
        id,
        ifMatchVersion ?? null,
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
          const ingQuery =
            'INSERT INTO ingredients (dish_id, name, quantity, unit, note, sequence) VALUES ($1, $2, $3, $4, $5, $6)';
          await client.query(ingQuery, [
            id,
            ingredient.name,
            (ingredient as any).quantity ?? null,
            ingredient.unit ?? null,
            (ingredient as any).note ?? null,
            (ingredient as any).sequence ?? null,
          ]);
        }
      }
      
      // If steps provided, replace them
      if (dishData.steps !== undefined) {
        await client.query('DELETE FROM cooking_steps WHERE dish_id = $1', [id]);
        for (const step of dishData.steps) {
          const stepQuery =
            'INSERT INTO cooking_steps (dish_id, step_number, description, image_url, duration_minutes) VALUES ($1, $2, $3, $4, $5)';
          await client.query(stepQuery, [
            id,
            step.step_number,
            step.description,
            step.image_url || null,
            (step as any).duration_minutes ?? null,
          ]);
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

  async delete(id: string): Promise<boolean> {
    const query = 'UPDATE dishes SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL';
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async incrementViewCount(id: string): Promise<void> {
    const query = 'UPDATE dishes SET view_count = view_count + 1 WHERE id = $1';
    await pool.query(query, [id]);
  }

  async likeDish(dishId: string, userId: string): Promise<number> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('INSERT INTO dish_likes (dish_id, user_id) VALUES ($1, $2)', [dishId, userId]);
      const { rows } = await client.query('UPDATE dishes SET like_count = like_count + 1 WHERE id = $1 RETURNING like_count', [
        dishId,
      ]);
      await client.query('COMMIT');
      return rows[0]?.like_count ?? 0;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async refreshRatingAggregates(dishId: string): Promise<void> {
    const query = `
      UPDATE dishes
      SET rating_count = (
          SELECT COUNT(*)::int
          FROM comments
          WHERE dish_id = $1 AND deleted_at IS NULL AND rating IS NOT NULL
        ),
        rating_avg = COALESCE(
          (
            SELECT ROUND(AVG(rating::numeric), 2)::decimal(3,2)
            FROM comments
            WHERE dish_id = $1 AND deleted_at IS NULL AND rating IS NOT NULL
          ),
          0
        )
      WHERE id = $1
    `;
    await pool.query(query, [dishId]);
  }

  async isLikedByUser(dishId: string, userId: string): Promise<boolean> {
    const { rows } = await pool.query(
      'SELECT 1 FROM dish_likes WHERE dish_id = $1 AND user_id = $2 LIMIT 1',
      [dishId, userId]
    );
    return rows.length > 0;
  }

  async isFavoritedByUser(dishId: string, userId: string): Promise<boolean> {
    const { rows } = await pool.query(
      'SELECT 1 FROM favorites WHERE dish_id = $1 AND user_id = $2 LIMIT 1',
      [dishId, userId]
    );
    return rows.length > 0;
  }

  /** 某作者名下、当前访问者可见的菜谱数量（用于主页展示） */
  async countVisibleByAuthor(authorId: string, viewerId: string | null): Promise<number> {
    const conditions: string[] = ['d.user_id = $1', 'd.deleted_at IS NULL'];
    const values: any[] = [authorId];
    let paramIndex = 2;
    ({ paramIndex } = this.applyVisibilityFilter(conditions, values, viewerId, paramIndex));
    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const { rows } = await pool.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM dishes d ${whereClause}`,
      values
    );
    return rows[0]?.total ?? 0;
  }

  async unlikeDish(dishId: string, userId: string): Promise<number> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const del = await client.query('DELETE FROM dish_likes WHERE dish_id = $1 AND user_id = $2', [dishId, userId]);
      if ((del.rowCount ?? 0) > 0) {
        const { rows } = await client.query(
          'UPDATE dishes SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1 RETURNING like_count',
          [dishId]
        );
        await client.query('COMMIT');
        return rows[0]?.like_count ?? 0;
      }
      const { rows } = await client.query('SELECT like_count FROM dishes WHERE id = $1', [dishId]);
      await client.query('COMMIT');
      return rows[0]?.like_count ?? 0;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

export const dishRepository = new DishRepository();
