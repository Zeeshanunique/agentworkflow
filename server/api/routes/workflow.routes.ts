import { Router } from 'express';
import { workflowController } from '../controllers/WorkflowController';
import { authenticateUser } from '../../middleware/auth';

const router = Router();

// Apply authentication middleware to all workflow routes
router.use(authenticateUser);

// Workflow CRUD endpoints
router.get('/', workflowController.getAllWorkflows.bind(workflowController));
router.get('/:id', workflowController.getWorkflowById.bind(workflowController));
router.post('/', workflowController.createWorkflow.bind(workflowController));
router.put('/:id', workflowController.updateWorkflow.bind(workflowController));
router.delete('/:id', workflowController.deleteWorkflow.bind(workflowController));

// Workflow execution endpoints
router.post('/:id/execute', workflowController.executeWorkflow.bind(workflowController));
router.get('/:id/executions', workflowController.getWorkflowExecutions.bind(workflowController));
router.get('/:workflowId/executions/:executionId', workflowController.getExecutionById.bind(workflowController));

// Workflow active status
router.patch('/:id/active', workflowController.setWorkflowActive.bind(workflowController));

export default router;
