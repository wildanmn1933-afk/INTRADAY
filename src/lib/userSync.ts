import { db } from './firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { User } from '../types';

const USERS_COLLECTION = 'users';

/**
 * Fetch all synchronized users from Firestore
 */
export async function getUsersFromFirestore(): Promise<User[]> {
  try {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    const users: User[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && (data.email || data.id)) {
        users.push({
          id: data.id || docSnap.id,
          email: data.email || '',
          name: data.name || (data.email ? data.email.split('@')[0] : 'User'),
          role: data.role === 'ADMIN' ? 'ADMIN' : 'USER',
          is_verified: Boolean(data.is_verified),
          verification_status: data.verification_status || (data.is_verified ? 'verified' : 'pending_verification'),
          avatar_url: data.avatar_url,
          plan: data.plan || 'FREE',
          subscription_status: data.subscription_status || 'active',
          subscription_expires_at: data.subscription_expires_at,
        });
      }
    });

    return users;
  } catch (err) {
    console.warn('[userSync] Error fetching users from Firestore:', err);
    return [];
  }
}

/**
 * Save or update a user record in Firestore
 */
export async function saveUserToFirestore(user: Partial<User> & { id: string; email: string }): Promise<void> {
  if (!user.id && !user.email) return;
  const docId = user.id || user.email.replace(/[^a-zA-Z0-9_-]/g, '_');

  try {
    const cleanUserRecord: Record<string, any> = {
      id: user.id || docId,
      email: user.email.toLowerCase().trim(),
      name: user.name || user.email.split('@')[0],
      role: user.role || 'USER',
      is_verified: Boolean(user.is_verified),
      verification_status: user.verification_status || (user.is_verified ? 'verified' : 'pending_verification'),
      plan: user.plan || 'FREE',
      subscription_status: user.subscription_status || 'active',
      updated_at: serverTimestamp(),
    };

    if (user.avatar_url) cleanUserRecord.avatar_url = user.avatar_url;
    if (user.subscription_expires_at) cleanUserRecord.subscription_expires_at = user.subscription_expires_at;

    await setDoc(doc(db, USERS_COLLECTION, docId), cleanUserRecord, { merge: true });
  } catch (err) {
    console.warn('[userSync] Error saving user to Firestore:', err);
  }
}

/**
 * Delete a user record from Firestore
 */
export async function deleteUserFromFirestore(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
  } catch (err) {
    console.warn('[userSync] Error deleting user from Firestore:', err);
  }
}

/**
 * Reconcile users from backend (Postgres/SQLite) and Firestore, deduplicating by ID or email
 */
export function reconcileUsers(backendUsers: User[], firestoreUsers: User[]): User[] {
  const userMap = new Map<string, User>();

  // Insert firestore users first
  for (const user of firestoreUsers) {
    if (user.id) userMap.set(user.id, user);
    if (user.email) userMap.set(`email:${user.email.toLowerCase().trim()}`, user);
  }

  // Merge backend users (backend takes precedence for authoritative status/role)
  for (const bUser of backendUsers) {
    const emailKey = `email:${bUser.email.toLowerCase().trim()}`;
    const existing = userMap.get(bUser.id) || userMap.get(emailKey);

    const merged: User = {
      ...existing,
      ...bUser,
      // Ensure booleans and fallbacks
      is_verified: bUser.is_verified !== undefined ? bUser.is_verified : (existing?.is_verified ?? false),
      role: bUser.role || existing?.role || 'USER',
      plan: bUser.plan || existing?.plan || 'FREE',
      subscription_status: bUser.subscription_status || existing?.subscription_status || 'active',
    };

    userMap.set(bUser.id, merged);
    userMap.set(emailKey, merged);
  }

  // Deduplicate unique user instances
  const uniqueUsers = new Set<User>();
  const seenIds = new Set<string>();
  const seenEmails = new Set<string>();

  for (const user of userMap.values()) {
    const normEmail = user.email.toLowerCase().trim();
    if (!seenIds.has(user.id) && !seenEmails.has(normEmail)) {
      seenIds.add(user.id);
      seenEmails.add(normEmail);
      uniqueUsers.add(user);
    }
  }

  return Array.from(uniqueUsers);
}
