import { eq, and } from 'drizzle-orm';
import { db } from '../db/db'; // Fixed import path
import { credentials, sharedCredentials, users } from '../db/schema';
import { encryptionService } from '../utils/encryption';
import { logger } from '../utils/logger';

/**
 * Interface for credential data
 */
export interface ICredential {
  id: string;
  name: string;
  type: string;
  data: Record<string, any>;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Credentials Service
 * Handles secure storage and retrieval of credentials using encryption
 */
export class CredentialsService {
  /**
   * Save a credential
   * Encrypts the data before saving to database
   */
  async saveCredential(
    name: string,
    type: string,
    data: Record<string, any>,
    userId: number
  ): Promise<string> {
    try {
      // Encrypt the credential data
      const encryptedData = encryptionService.encrypt(JSON.stringify(data));
      
      // Insert into database
      const result = await db.insert(credentials)
        .values({
          name,
          type,
          encryptedData,
          userId
        })
        .returning({ id: credentials.id });
      
      if (!result[0]) {
        throw new Error('Failed to save credential');
      }
      
      return result[0].id;
    } catch (error: any) {
      logger.error('Error saving credential:', error);
      throw new Error(`Failed to save credential: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update an existing credential
   */
  async updateCredential(
    id: string,
    updates: {
      name?: string;
      data?: Record<string, any>;
    },
    userId: number
  ): Promise<boolean> {
    try {
      // First check if user has access to this credential
      const hasAccess = await this.userHasAccessToCredential(id, userId);
      if (!hasAccess) {
        throw new Error('Unauthorized access to credential');
      }
      
      // Prepare update data
      const updateData: any = {};
      
      if (updates.name !== undefined) {
        updateData.name = updates.name;
      }
      
      if (updates.data !== undefined) {
        updateData.encryptedData = encryptionService.encrypt(JSON.stringify(updates.data));
      }
      
      updateData.updatedAt = new Date();
      
      // Update in database
      await db.update(credentials)
        .set(updateData)
        .where(eq(credentials.id, id));
      
      return true;
    } catch (error: any) {
      logger.error('Error updating credential:', error);
      throw new Error(`Failed to update credential: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a credential by ID
   * Decrypts the data before returning
   */
  async getCredential(id: string, userId: number): Promise<ICredential | null> {
    try {
      // Check if user has access to this credential
      const hasAccess = await this.userHasAccessToCredential(id, userId);
      if (!hasAccess) {
        throw new Error('Unauthorized access to credential');
      }
      
      // Get from database
      const result = await db.query.credentials.findFirst({
        where: eq(credentials.id, id)
      });
      
      if (!result) {
        return null;
      }
      
      // Decrypt the data
      const decryptedData = JSON.parse(encryptionService.decrypt(result.encryptedData));
      
      return {
        id: result.id,
        name: result.name,
        type: result.type,
        data: decryptedData,
        userId: result.userId,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    } catch (error: any) {
      logger.error('Error getting credential:', error);
      throw new Error(`Failed to get credential: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete a credential
   */
  async deleteCredential(id: string, userId: number): Promise<boolean> {
    try {
      // Check if user has access to this credential
      const hasAccess = await this.userHasAccessToCredential(id, userId);
      if (!hasAccess) {
        throw new Error('Unauthorized access to credential');
      }
      
      // Delete shared access first
      await db.delete(sharedCredentials)
        .where(eq(sharedCredentials.credentialId, id));
      
      // Delete the credential
      await db.delete(credentials)
        .where(eq(credentials.id, id));
      
      return true;
    } catch (error: any) {
      logger.error('Error deleting credential:', error);
      throw new Error(`Failed to delete credential: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * List credentials for a user (including shared credentials)
   */
  async listCredentials(userId: number): Promise<Omit<ICredential, 'data'>[]> {
    try {
      // Get user's own credentials
      const ownCredentials = await db.query.credentials.findMany({
        where: eq(credentials.userId, userId)
      });
      
      // Get shared credentials
      const sharedWithUser = await db.query.sharedCredentials.findMany({
        where: eq(sharedCredentials.userId, userId),
        with: {
          credential: true
        }
      });
      
      // Combine and format the results
      const allCredentials = [
        ...ownCredentials.map((cred: any) => ({
          id: cred.id,
          name: cred.name,
          type: cred.type,
          userId: cred.userId,
          createdAt: cred.createdAt,
          updatedAt: cred.updatedAt
        })),
        ...sharedWithUser.map((shared: any) => ({
          id: shared.credentialId,
          name: shared.credential.name,
          type: shared.credential.type,
          userId: shared.credential.userId,
          createdAt: shared.credential.createdAt,
          updatedAt: shared.credential.updatedAt
        }))
      ];
      
      return allCredentials;
    } catch (error: any) {
      logger.error('Error listing credentials:', error);
      throw new Error(`Failed to list credentials: ${error.message}`);
    }
  }

  /**
   * Share a credential with another user
   */
  async shareCredential(
    credentialId: string,
    targetUserId: number,
    ownerUserId: number
  ): Promise<boolean> {
    try {
      // Check if owner has access to this credential
      const credential = await db.query.credentials.findFirst({
        where: eq(credentials.id, credentialId)
      });
      
      if (!credential) {
        throw new Error('Credential not found');
      }
      
      // Verify that the requesting user is the owner
      if (credential.userId !== ownerUserId) {
        throw new Error('Only the credential owner can share it');
      }
      
      // Check if the target user exists
      const targetUser = await db.query.users.findFirst({
        where: eq(users.id, targetUserId)
      });
      
      if (!targetUser) {
        throw new Error('Target user not found');
      }
      
      // Check if already shared
      const existingShare = await db.query.sharedCredentials.findFirst({
        where: and(
          eq(sharedCredentials.credentialId, credentialId),
          eq(sharedCredentials.userId, targetUserId)
        )
      });
      
      if (existingShare) {
        // Already shared
        return true;
      }
      
      // Create sharing record
      await db.insert(sharedCredentials)
        .values({
          credentialId,
          userId: targetUserId,
          updatedBy: ownerUserId
        });
      
      return true;
    } catch (error: any) {
      logger.error('Error sharing credential:', error);
      throw new Error(`Failed to share credential: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Revoke shared access to a credential
   */
  async revokeAccess(
    credentialId: string,
    targetUserId: number,
    ownerUserId: number
  ): Promise<boolean> {
    try {
      // Check if owner has access to this credential
      const credential = await db.query.credentials.findFirst({
        where: eq(credentials.id, credentialId)
      });
      
      if (!credential) {
        throw new Error('Credential not found');
      }
      
      // Verify that the requesting user is the owner
      if (credential.userId !== ownerUserId) {
        throw new Error('Only the credential owner can revoke access');
      }
      
      // Delete the sharing record
      await db.delete(sharedCredentials)
        .where(
          and(
            eq(sharedCredentials.credentialId, credentialId),
            eq(sharedCredentials.userId, targetUserId)
          )
        );
      
      return true;
    } catch (error: any) {
      logger.error('Error revoking credential access:', error);
      throw new Error(`Failed to revoke credential access: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if a user has access to a credential
   * Either as owner or through sharing
   */
  async userHasAccessToCredential(credentialId: string, userId: number): Promise<boolean> {
    try {
      // Check if user is the owner
      const isOwner = await db.query.credentials.findFirst({
        where: and(
          eq(credentials.id, credentialId),
          eq(credentials.userId, userId)
        )
      });
      
      if (isOwner) {
        return true;
      }
      
      // Check if credential is shared with user
      const isShared = await db.query.sharedCredentials.findFirst({
        where: and(
          eq(sharedCredentials.credentialId, credentialId),
          eq(sharedCredentials.userId, userId)
        )
      });
      
      return !!isShared;
    } catch (error: any) {
      logger.error('Error checking credential access:', error);
      return false;
    }
  }
}

// Singleton instance
export const credentialsService = new CredentialsService();
