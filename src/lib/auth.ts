import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { query, queryOne } from './postgres';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface AuthUser extends User {
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

// JWT token generation
export function generateToken(user: User): string {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }
  
  // Fix the TypeScript error by using a more explicit approach
  // The issue is with how TypeScript interprets the types for jwt.sign
  return jwt.sign(
    payload,
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
}

// JWT token verification
export function verifyToken(token: string): jwt.JwtPayload {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }
    return jwt.verify(token, secret as string) as jwt.JwtPayload;
  } catch {
    throw new Error('Invalid token');
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Compare password
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Find user by email
export async function findUserByEmail(email: string): Promise<User | null> {
  return queryOne<User>(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
}

// Find user by ID
export async function findUserById(id: string): Promise<User | null> {
  return queryOne<User>(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
}

// Register new user
export async function registerUser(data: RegisterData): Promise<AuthUser> {
  const { email, password, name } = data;
  
  // Check if user already exists
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }
  
  // Hash password
  const passwordHash = await hashPassword(password);
  
  // Create user
  const user = await queryOne<User>(
    `INSERT INTO users (email, password_hash, name, role) 
     VALUES ($1, $2, $3, 'user') 
     RETURNING id, email, name, role, created_at, updated_at, last_login`,
    [email, passwordHash, name || null]
  );
  
  if (!user) {
    throw new Error('Failed to create user');
  }
  
  // Generate token
  const token = generateToken(user);
  
  return {
    ...user,
    token,
  };
}

// Login user
export async function loginUser(credentials: LoginCredentials): Promise<AuthUser> {
  const { email, password } = credentials;
  
  // Find user
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  // Get user password hash
  const userWithPassword = await queryOne<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE id = $1',
    [user.id]
  );
  
  if (!userWithPassword) {
    throw new Error('Invalid credentials');
  }
  
  // Verify password
  const isValidPassword = await comparePassword(password, userWithPassword.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }
  
  // Update last login
  await query(
    'UPDATE users SET last_login = NOW() WHERE id = $1',
    [user.id]
  );
  
  // Generate token
  const token = generateToken(user);
  
  return {
    ...user,
    token,
  };
}

// Get user from token
export async function getUserFromToken(token: string): Promise<User | null> {
  try {
    const decoded = verifyToken(token);
    const user = await findUserById(decoded.id);
    return user;
  } catch {
    return null;
  }
}

// Check if user is admin
export async function isAdmin(userId: string): Promise<boolean> {
  const user = await findUserById(userId);
  return user?.role === 'admin';
}

// Middleware to verify JWT token
export function authMiddleware(handler: (req: Request, user: User, ...args: unknown[]) => Promise<Response>) {
  return async (req: Request, ...args: unknown[]): Promise<Response> => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Authorization token required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const token = authHeader.substring(7);
      const user = await getUserFromToken(token);
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return handler(req, user, ...args);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}

// Middleware to require admin role
export function adminMiddleware(handler: (req: Request, user: User, ...args: unknown[]) => Promise<Response>) {
  return authMiddleware(async (req: Request, user: User, ...args: unknown[]): Promise<Response> => {
    if (user.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return handler(req, user, ...args);
  });
}

// Create default admin user if not exists
export async function createDefaultAdmin(): Promise<void> {
  const adminEmail = 'admin@visitor-counter.com';
  const adminPassword = 'admin123';
  
  const existingAdmin = await findUserByEmail(adminEmail);
  if (!existingAdmin) {
    const passwordHash = await hashPassword(adminPassword);
    await query(
      `INSERT INTO users (email, password_hash, name, role) 
       VALUES ($1, $2, 'Admin User', 'admin')`,
      [adminEmail, passwordHash]
    );
    console.log('Default admin user created');
  }
}