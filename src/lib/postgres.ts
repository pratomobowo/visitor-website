import { Pool, PoolClient } from 'pg';

// Create a connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'visitor_counter',
  user: process.env.POSTGRES_USER || 'visitor',
  password: process.env.POSTGRES_PASSWORD,
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait when connecting a new client
});

// Database connection helper
export async function getConnection(): Promise<PoolClient> {
  try {
    const client = await pool.connect();
    console.log('Database connected successfully');
    return client;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw new Error('Failed to connect to database');
  }
}

// Helper function to execute queries with automatic connection management
export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  const client = await getConnection();
  try {
    const start = Date.now();
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result.rows;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Helper function to execute a single query and return the first result
export async function queryOne<T = unknown>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper function to execute insert and return the inserted record
export async function insertAndReturn<T = unknown>(table: string, data: Record<string, unknown>): Promise<T> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
  
  const queryText = `
    INSERT INTO ${table} (${keys.join(', ')}) 
    VALUES (${placeholders}) 
    RETURNING *
  `;
  
  const result = await query<T>(queryText, values);
  if (result.length === 0) {
    throw new Error('Insert operation failed');
  }
  return result[0];
}

// Helper function to execute update and return the updated record
export async function updateAndReturn<T = unknown>(
  table: string,
  data: Record<string, unknown>,
  whereClause: string,
  whereParams: unknown[] = []
): Promise<T> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
  
  const queryText = `
    UPDATE ${table} 
    SET ${setClause} 
    WHERE ${whereClause} 
    RETURNING *
  `;
  
  const allParams = [...values, ...whereParams];
  const result = await query<T>(queryText, allParams);
  if (result.length === 0) {
    throw new Error('Update operation failed or no records matched');
  }
  return result[0];
}

// Helper function to execute delete and return the deleted record
export async function deleteAndReturn<T = unknown>(
  table: string,
  whereClause: string,
  whereParams: unknown[] = []
): Promise<T> {
  const queryText = `
    DELETE FROM ${table} 
    WHERE ${whereClause} 
    RETURNING *
  `;
  
  const result = await query<T>(queryText, whereParams);
  if (result.length === 0) {
    throw new Error('Delete operation failed or no records matched');
  }
  return result[0];
}

// Export the pool for direct access if needed
export { pool };

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('Database connection test successful:', result[0]);
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}