/**
 * User Profile Service
 * Business logic for user profile operations
 */

import { Pool } from 'pg';

export interface UserProfile {
  id: string;
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileUpdateRequest {
  fullName?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
}

class UserProfileService {
  constructor(private readonly pool: Pool) {}

  /**
   * Get user profile by host ID
   */
  async getProfile(hostId: string): Promise<UserProfile | null> {
    const result = await this.pool.query(
      `SELECT id, full_name, business_name, email, phone, bio, location, avatar_url, created_at, updated_at
       FROM users 
       WHERE id = $1`,
      [hostId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProfile(result.rows[0]);
  }

  /**
   * Create or update user profile
   */
  async upsertProfile(hostId: string, data: UserProfileUpdateRequest): Promise<UserProfile> {
    const now = new Date().toISOString();

    // Try to update first
    let result = await this.pool.query(
      `UPDATE users 
       SET 
         full_name = COALESCE($2, full_name),
         business_name = COALESCE($3, business_name),
         email = COALESCE($4, email),
         phone = COALESCE($5, phone),
         bio = COALESCE($6, bio),
         location = COALESCE($7, location),
         avatar_url = COALESCE($8, avatar_url),
         updated_at = $9
       WHERE id = $1
       RETURNING id, full_name, business_name, email, phone, bio, location, avatar_url, created_at, updated_at`,
      [hostId, data.fullName, data.businessName, data.email, data.phone, data.bio, data.location, data.avatarUrl, now]
    );

    // If no rows updated, insert new user
    if (result.rows.length === 0) {
      // Validate required fields for new user
      if (!data.fullName || !data.businessName || !data.email || !data.phone) {
        throw new Error('fullName, businessName, email, and phone are required for new users');
      }

      result = await this.pool.query(
        `INSERT INTO users (id, full_name, business_name, email, phone, bio, location, avatar_url, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, full_name, business_name, email, phone, bio, location, avatar_url, created_at, updated_at`,
        [hostId, data.fullName, data.businessName, data.email, data.phone, data.bio, data.location, data.avatarUrl, now, now]
      );
    }

    return this.mapRowToProfile(result.rows[0]);
  }

  /**
   * Delete user profile
   */
  async deleteProfile(hostId: string): Promise<void> {
    const result = await this.pool.query(
      `DELETE FROM users WHERE id = $1`,
      [hostId]
    );

    if (result.rowCount === 0) {
      throw new Error('User profile not found');
    }
  }

  /**
   * Map database row to profile object
   */
  private mapRowToProfile(row: any): UserProfile {
    return {
      id: row.id,
      fullName: row.full_name,
      businessName: row.business_name,
      email: row.email,
      phone: row.phone,
      bio: row.bio,
      location: row.location,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default UserProfileService;
