import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export async function handleMetrics(req: Request, res: Response) {
  try {
    const metrics = req.body;
    
    // Log metrics for now - in a real app you'd store these in a database
    logger.info('Performance metrics received:', metrics);
    
    res.status(200).json({ message: 'Metrics received successfully' });
  } catch (error) {
    logger.error('Error handling metrics:', error);
    res.status(500).json({ error: 'Failed to process metrics' });
  }
} 