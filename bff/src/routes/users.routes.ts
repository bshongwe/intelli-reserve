/**
 * User Profile Routes
 * Endpoints for managing user profiles
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import UserProfileService, { UserProfileUpdateRequest } from '../services/userProfileService';

export function createUserRoutes(pool: Pool): Router {
  const router = Router();
  const userService = new UserProfileService(pool);

  /**
   * GET /api/users/profile
   * Retrieve user profile by host ID
   */
  router.get('/profile', async (req: Request, res: Response) => {
    try {
      const hostId = req.query.hostId as string;

      if (!hostId) {
        return res.status(400).json({ error: 'hostId query parameter is required' });
      }

      const profile = await userService.getProfile(hostId);

      if (!profile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      res.json(profile);
    } catch (error) {
      console.error('Error retrieving user profile:', error);
      res.status(500).json({ error: 'Failed to retrieve user profile' });
    }
  });

  /**
   * PUT /api/users/profile
   * Create or update user profile
   */
  router.put('/profile', async (req: Request, res: Response) => {
    try {
      const hostId = req.query.hostId as string;

      if (!hostId) {
        return res.status(400).json({ error: 'hostId query parameter is required' });
      }

      const updateData: UserProfileUpdateRequest = req.body;

      // Basic validation - at least one field should be provided
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'At least one field must be provided for update' });
      }

      // Validate email format if provided
      if (updateData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      const profile = await userService.upsertProfile(hostId, updateData);

      res.status(200).json(profile);
    } catch (error) {
      console.error('Error updating user profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user profile';
      res.status(500).json({ error: errorMessage });
    }
  });

  return router;
}

export default createUserRoutes;
