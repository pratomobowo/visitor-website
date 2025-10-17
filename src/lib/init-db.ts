import { createDefaultAdmin } from './auth';

// Initialize database with default admin user
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    await createDefaultAdmin();
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}