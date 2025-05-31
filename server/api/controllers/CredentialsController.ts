import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/db'; // Fixed import path
import { credentials } from '../../db/schema';
import { credentialsService } from '../../services/CredentialsService';
import { logger } from '../../utils/logger';
// UUID is handled in the service layer

/**
 * CredentialsController
 * Handles API endpoints for credentials management
 */
export class CredentialsController {
  /**
   * Get all credentials for the authenticated user
   */
  async getAllCredentials(req: Request, res: Response) {
    try {
      // Get user ID from auth middleware
      const userId = (req.user as any).id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Get credentials
      const userCredentials = await credentialsService.listCredentials(userId);
      
      return res.status(200).json(userCredentials);
    } catch (error: any) {
      logger.error('Error getting credentials:', error);
      return res.status(500).json({ error: 'Failed to get credentials' });
    }
  }

  /**
   * Get credential by ID
   */
  async getCredentialById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req.user as any).id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Check if user has access to credential
      const hasAccess = await credentialsService.userHasAccessToCredential(id, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this credential' });
      }
      
      // Get credential
      const credential = await credentialsService.getCredential(id, userId);
      
      if (!credential) {
        return res.status(404).json({ error: 'Credential not found' });
      }
      
      return res.status(200).json(credential);
    } catch (error: any) {
      logger.error(`Error getting credential ${req.params.id}:`, error);
      return res.status(500).json({ error: `Failed to get credential: ${error instanceof Error ? error.message : String(error)}` });
    }
  }

  /**
   * Create new credential
   */
  async createCredential(req: Request, res: Response) {
    try {
      const { name, type, data } = req.body;
      const userId = (req.user as any).id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Validate request
      if (!name) {
        return res.status(400).json({ error: 'Credential name is required' });
      }
      
      if (!type) {
        return res.status(400).json({ error: 'Credential type is required' });
      }
      
      if (!data || typeof data !== 'object') {
        return res.status(400).json({ error: 'Credential data must be an object' });
      }
      
      // Save credential
      const credentialId = await credentialsService.saveCredential(
        name,
        type,
        data,
        userId
      );
      
      return res.status(201).json({ id: credentialId });
    } catch (error: any) {
      logger.error('Error creating credential:', error);
      return res.status(500).json({ error: `Failed to create credential: ${error instanceof Error ? error.message : String(error)}` });
    }
  }

  /**
   * Update credential
   */
  async updateCredential(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, data } = req.body;
      const userId = (req.user as any).id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Check if user has access to credential
      const hasAccess = await credentialsService.userHasAccessToCredential(id, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this credential' });
      }
      
      // Update credential
      const updates: { name?: string; data?: Record<string, any> } = {};
      
      if (name !== undefined) {
        updates.name = name;
      }
      
      if (data !== undefined) {
        updates.data = data;
      }
      
      await credentialsService.updateCredential(id, updates, userId);
      
      return res.status(200).json({ id, updated: true });
    } catch (error: any) {
      logger.error(`Error updating credential ${req.params.id}:`, error);
      return res.status(500).json({ error: `Failed to update credential: ${error instanceof Error ? error.message : String(error)}` });
    }
  }

  /**
   * Delete credential
   */
  async deleteCredential(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req.user as any).id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Check if user has access to credential
      const hasAccess = await credentialsService.userHasAccessToCredential(id, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this credential' });
      }
      
      // Get credential to check if user is owner
      const credential = await db.query.credentials.findFirst({
        where: eq(credentials.id, id)
      });
      
      if (!credential) {
        return res.status(404).json({ error: 'Credential not found' });
      }
      
      // Only owner can delete credential
      if (credential.userId !== userId) {
        return res.status(403).json({ error: 'Only the owner can delete a credential' });
      }
      
      // Delete credential
      await credentialsService.deleteCredential(id, userId);
      
      return res.status(200).json({ success: true });
    } catch (error: any) {
      logger.error(`Error deleting credential ${req.params.id}:`, error);
      return res.status(500).json({ error: `Failed to delete credential: ${error instanceof Error ? error.message : String(error)}` });
    }
  }

  /**
   * Share credential with another user
   */
  async shareCredential(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { targetUserId } = req.body;
      const ownerUserId = (req.user as any).id;
      
      if (!ownerUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      if (!targetUserId) {
        return res.status(400).json({ error: 'Target user ID is required' });
      }
      
      // Share credential
      await credentialsService.shareCredential(id, targetUserId, ownerUserId);
      
      return res.status(200).json({ success: true });
    } catch (error: any) {
      logger.error(`Error sharing credential ${req.params.id}:`, error);
      return res.status(500).json({ error: `Failed to share credential: ${error instanceof Error ? error.message : String(error)}` });
    }
  }

  /**
   * Revoke access to credential
   */
  async revokeAccess(req: Request, res: Response) {
    try {
      const { id, userId: targetUserId } = req.params;
      const ownerUserId = (req.user as any).id;
      
      if (!ownerUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Revoke access
      await credentialsService.revokeAccess(id, parseInt(targetUserId), ownerUserId);
      
      return res.status(200).json({ success: true });
    } catch (error: any) {
      logger.error(`Error revoking access to credential ${req.params.id}:`, error);
      return res.status(500).json({ error: `Failed to revoke access: ${error instanceof Error ? error.message : String(error)}` });
    }
  }
}

// Export singleton instance
export const credentialsController = new CredentialsController();
