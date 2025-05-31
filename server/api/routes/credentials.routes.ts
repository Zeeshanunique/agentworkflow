import { Router } from 'express';
import { credentialsController } from '../controllers/CredentialsController';
import { authenticateUser } from '../../middleware/auth';

const router = Router();

// Apply authentication middleware to all credentials routes
router.use(authenticateUser);

// Credentials CRUD endpoints
router.get('/', credentialsController.getAllCredentials.bind(credentialsController));
router.get('/:id', credentialsController.getCredentialById.bind(credentialsController));
router.post('/', credentialsController.createCredential.bind(credentialsController));
router.put('/:id', credentialsController.updateCredential.bind(credentialsController));
router.delete('/:id', credentialsController.deleteCredential.bind(credentialsController));

// Credential sharing endpoints
router.post('/:id/share', credentialsController.shareCredential.bind(credentialsController));
router.delete('/:id/share/:userId', credentialsController.revokeAccess.bind(credentialsController));

export default router;
