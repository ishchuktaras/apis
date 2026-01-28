/**
 * Authentication Utilities for Self-Hosted PostgreSQL
 * Clean Slate Strategy - Local Auth without Supabase Auth
 * 
 * Implements secure password hashing and session management
 */

import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { query, transaction } from './db'

// JWT configuration
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)
const JWT_ISSUER = 'apis-saas'
const JWT_AUDIENCE = 'apis-users'
const SESSION_DURATION = 60 * 60 * 24 * 7 // 7 days in seconds

// User types
export interface User {
  id: string
  email: string
  name: string | null
  role: 'admin' | 'salon_owner' | 'employee' | 'customer'
  salon_id: string | null
  created_at: Date
  updated_at: Date
}

export interface Session {
  user: User
  expires_at: Date
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Create JWT token for user session
 */
export async function createSessionToken(user: User): Promise<string> {
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    salon_id: user.salon_id
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(JWT_SECRET)

  return token
}

/**
 * Verify JWT token and return payload
 */
export async function verifySessionToken(token: string): Promise<{
  sub: string
  email: string
  role: string
  salon_id: string | null
} | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    })
    return payload as {
      sub: string
      email: string
      role: string
      salon_id: string | null
    }
  } catch {
    return null
  }
}

/**
 * Sign up new user
 */
export async function signUp(
  email: string,
  password: string,
  name: string,
  role: 'salon_owner' | 'customer' = 'customer'
): Promise<{ user: User | null; error: string | null }> {
  try {
    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (existingUser.rows.length > 0) {
      return { user: null, error: 'Uživatel s tímto emailem již existuje' }
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const result = await query<User>(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, salon_id, created_at, updated_at`,
      [email.toLowerCase(), passwordHash, name, role]
    )

    return { user: result.rows[0], error: null }
  } catch (error) {
    console.error('[Auth] Sign up error:', error)
    return { user: null, error: 'Registrace se nezdařila' }
  }
}

/**
 * Sign in user with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ user: User | null; token: string | null; error: string | null }> {
  try {
    // Find user
    const result = await query<User & { password_hash: string }>(
      `SELECT id, email, name, role, salon_id, password_hash, created_at, updated_at
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    )

    if (result.rows.length === 0) {
      return { user: null, token: null, error: 'Neplatné přihlašovací údaje' }
    }

    const userData = result.rows[0]

    // Verify password
    const isValidPassword = await verifyPassword(password, userData.password_hash)
    if (!isValidPassword) {
      return { user: null, token: null, error: 'Neplatné přihlašovací údaje' }
    }

    // Create session token
    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      salon_id: userData.salon_id,
      created_at: userData.created_at,
      updated_at: userData.updated_at
    }

    const token = await createSessionToken(user)

    // Update last login
    await query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    )

    return { user, token, error: null }
  } catch (error) {
    console.error('[Auth] Sign in error:', error)
    return { user: null, token: null, error: 'Přihlášení se nezdařilo' }
  }
}

/**
 * Get current session from cookies
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return null
    }

    const payload = await verifySessionToken(sessionToken)
    if (!payload) {
      return null
    }

    // Fetch fresh user data
    const result = await query<User>(
      `SELECT id, email, name, role, salon_id, created_at, updated_at
       FROM users WHERE id = $1`,
      [payload.sub]
    )

    if (result.rows.length === 0) {
      return null
    }

    return {
      user: result.rows[0],
      expires_at: new Date(Date.now() + SESSION_DURATION * 1000)
    }
  } catch {
    return null
  }
}

/**
 * Sign out - clear session cookie
 */
export async function signOut(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

/**
 * Change user password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Get current password hash
    const result = await query<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    )

    if (result.rows.length === 0) {
      return { success: false, error: 'Uživatel nenalezen' }
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, result.rows[0].password_hash)
    if (!isValid) {
      return { success: false, error: 'Nesprávné aktuální heslo' }
    }

    // Hash new password
    const newHash = await hashPassword(newPassword)

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, userId]
    )

    return { success: true, error: null }
  } catch (error) {
    console.error('[Auth] Change password error:', error)
    return { success: false, error: 'Změna hesla se nezdařila' }
  }
}
