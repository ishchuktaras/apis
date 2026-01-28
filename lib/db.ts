/**
 * PostgreSQL Database Connection for Wedos VPS ON
 * Self-hosted PostgreSQL via Coolify
 * 
 * Uses pg library directly instead of Supabase client
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg'

// Connection pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections in pool
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Connection timeout 2s
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// Log pool errors
pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err)
  process.exit(-1)
})

/**
 * Execute a SQL query with parameterized values
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now()
  try {
    const result = await pool.query<T>(text, params)
    const duration = Date.now() - start
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[DB] Query executed:', { text: text.substring(0, 50), duration, rows: result.rowCount })
    }
    
    return result
  } catch (error) {
    console.error('[DB] Query error:', error)
    throw error
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  const client = await pool.connect()
  return client
}

/**
 * Execute queries within a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Close the pool gracefully
 */
export async function closePool(): Promise<void> {
  await pool.end()
}

/**
 * Health check for database connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT 1 as health')
    return result.rows.length > 0
  } catch {
    return false
  }
}

// Export pool for advanced usage
export { pool }
