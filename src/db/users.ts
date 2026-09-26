// src/db/users.ts
import { db as drizzleDb } from './index.js';
import { users as usersTable } from './schema.js';
import { eq } from 'drizzle-orm';
import { db as memoryDb } from '../../server/db/database.js';
import type { User } from '../../server/types.js';

export function isCloudSqlConfigured(): boolean {
  return Boolean(process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_PASSWORD);
}

/**
 * Sync all users from Cloud SQL PostgreSQL into the in-memory store on server startup
 */
export async function syncUsersFromCloudSql(): Promise<void> {
  if (!isCloudSqlConfigured()) return;
  try {
    const pgUsers = await drizzleDb.select().from(usersTable);
    for (const u of pgUsers) {
      const existing = memoryDb.getUserById(u.uid);
      const userModel: User = {
        id: u.uid,
        email: u.email,
        name: u.name || u.email.split('@')[0] || 'Trader',
        role: (u.role as 'ADMIN' | 'USER') || 'USER',
        plan: (u.plan as any) || 'PRO',
        subscription_status: (u.subscription_status as any) || 'active',
        is_verified: u.is_verified,
        verification_status: (u.verification_status as any) || 'verified',
        password_hash: u.password_hash || '',
        salt: u.salt || '',
        created_at: u.created_at ? u.created_at.toISOString() : new Date().toISOString(),
        updated_at: u.updated_at ? u.updated_at.toISOString() : new Date().toISOString(),
      };

      if (!existing) {
        memoryDb.insertUser(userModel);
      } else {
        memoryDb.updateUser(u.uid, userModel);
      }
    }
    console.log(`[Cloud SQL] Successfully loaded ${pgUsers.length} user(s) from persistent PostgreSQL.`);
  } catch (error) {
    console.warn('[Cloud SQL] User sync warning:', error);
  }
}

/**
 * Upsert user into Cloud SQL PostgreSQL and mirror to in-memory store
 */
export async function getOrCreateUser(uid: string, email: string, name?: string) {
  const cleanEmail = email.toLowerCase().trim();
  const userName = name || cleanEmail.split('@')[0] || 'Trader';

  // 1. First ensure it's saved in Cloud SQL PostgreSQL for durability
  if (isCloudSqlConfigured()) {
    try {
      await drizzleDb
        .insert(usersTable)
        .values({
          uid,
          email: cleanEmail,
          name: userName,
          role: cleanEmail === 'wildanmn1933@gmail.com' ? 'ADMIN' : 'USER',
          plan: 'PRO',
          subscription_status: 'active',
          is_verified: true,
          verification_status: 'verified',
        })
        .onConflictDoUpdate({
          target: usersTable.uid,
          set: {
            email: cleanEmail,
            name: userName,
            updated_at: new Date(),
          },
        });
    } catch (sqlErr) {
      console.warn('[Cloud SQL] Error persisting user to PostgreSQL:', sqlErr);
    }
  }

  // 2. Also keep in-memory store updated for fast zero-latency access
  try {
    let memoryUser = memoryDb.getUserByEmail(cleanEmail);
    if (!memoryUser) {
      memoryUser = {
        id: uid,
        email: cleanEmail,
        password_hash: '',
        salt: '',
        name: userName,
        role: cleanEmail === 'wildanmn1933@gmail.com' ? 'ADMIN' : 'USER',
        is_verified: true,
        verification_status: 'verified',
        plan: 'PRO',
        subscription_status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryDb.insertUser(memoryUser);
    } else {
      memoryUser = memoryDb.updateUser(memoryUser.id, {
        is_verified: true,
        verification_status: 'verified',
        ...(userName ? { name: userName } : {}),
        updated_at: new Date().toISOString(),
      }) || memoryUser;
    }

    return memoryUser;
  } catch (error) {
    console.warn('[Database] getOrCreateUser notice:', error);
    return null;
  }
}

export async function getUserById(uid: string) {
  try {
    // Check in-memory first
    const cached = memoryDb.getUserById(uid);
    if (cached) return cached;

    // Check Cloud SQL
    if (isCloudSqlConfigured()) {
      const rows = await drizzleDb.select().from(usersTable).where(eq(usersTable.uid, uid)).limit(1);
      if (rows.length > 0) {
        const u = rows[0];
        const userModel: User = {
          id: u.uid,
          email: u.email,
          name: u.name || 'Trader',
          role: (u.role as 'ADMIN' | 'USER') || 'USER',
          plan: (u.plan as any) || 'PRO',
          subscription_status: (u.subscription_status as any) || 'active',
          is_verified: u.is_verified,
          verification_status: (u.verification_status as any) || 'verified',
          password_hash: u.password_hash || '',
          salt: u.salt || '',
          created_at: u.created_at ? u.created_at.toISOString() : new Date().toISOString(),
          updated_at: u.updated_at ? u.updated_at.toISOString() : new Date().toISOString(),
        };
        memoryDb.insertUser(userModel);
        return userModel;
      }
    }
    return null;
  } catch (error) {
    console.warn('[Database] getUserById notice:', error);
    return null;
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    if (isCloudSqlConfigured()) {
      const rows = await drizzleDb.select().from(usersTable);
      if (rows.length > 0) {
        return rows.map(u => ({
          id: u.uid,
          email: u.email,
          name: u.name || 'Trader',
          role: (u.role as 'ADMIN' | 'USER') || 'USER',
          plan: (u.plan as any) || 'PRO',
          subscription_status: (u.subscription_status as any) || 'active',
          is_verified: u.is_verified,
          verification_status: (u.verification_status as any) || 'verified',
          password_hash: u.password_hash || '',
          salt: u.salt || '',
          created_at: u.created_at ? u.created_at.toISOString() : new Date().toISOString(),
          updated_at: u.updated_at ? u.updated_at.toISOString() : new Date().toISOString(),
        }));
      }
    }
    return memoryDb.getAllUsers();
  } catch (err) {
    console.warn('[Database] getAllUsers fallback to memory:', err);
    return memoryDb.getAllUsers();
  }
}
