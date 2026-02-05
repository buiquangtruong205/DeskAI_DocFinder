import { jobsRepo, JobRecord } from '../storage/repositories/jobs.repo';
import { indexOrchestrator } from './indexOrchestrator';

import { logToFile } from '../../utils/fileLogger';

export class JobQueue {
  private isProcessing = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private intervalMs = 1000; // Poll every second

  async start() {
    if (this.pollInterval) return;

    // Reset stuck jobs
    try {
      logToFile('[JobQueue] Resetting stuck jobs...');
      const count = jobsRepo.resetProcessingJobs();
      console.log(`[JobQueue] Reset ${count} stuck jobs to pending`);
      logToFile(`[JobQueue] Reset ${count} stuck jobs`);
    } catch (err) {
      console.error('[JobQueue] Failed to reset stuck jobs:', err);
    }

    console.log('[JobQueue] Starting job queue worker... (Interval 1000ms)');
    logToFile('[JobQueue] Starting job queue worker');
    this.pollInterval = setInterval(() => {
      // console.log('[JobQueue] Heartbeat - checking for jobs...');
      this.processNext();
    }, this.intervalMs);
  }

  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private async processNext() {
    if (this.isProcessing) return;

    try {
      const job = jobsRepo.getNextJob();
      if (!job) return; // No jobs pending

      this.isProcessing = true;
      console.log(`[JobQueue] Processing job ${job.id} (${job.type})`);

      jobsRepo.updateStatus(job.id, 'processing');

      try {
        const payload = JSON.parse(job.payloadJson);

        switch (job.type) {
          case 'INDEX_FILE':
            await indexOrchestrator.indexFile(payload.fileId, payload.filePath, payload.sourceId);
            break;
          case 'DELETE_FILE':
            await indexOrchestrator.deleteFile(payload.fileId);
            break;
          case 'SCAN':
            // Scan is usually triggered manually, but if it was a job:
            // await fileScanner.scanSource(payload.sourceId, payload.path, ...);
            // For now, SCAN is triggered directly by UI/Scanner, not stored as a job to be picked up by this worker usually, 
            // but if we did, we'd handle it here.
            break;
          default:
            console.warn(`[JobQueue] Unknown job type: ${job.type}`);
        }

        logToFile(`[JobQueue] Job ${job.id} completed`);
        jobsRepo.updateStatus(job.id, 'completed');
        console.log(`[JobQueue] Job ${job.id} completed`);

      } catch (err: any) {
        logToFile(`[JobQueue] Job ${job.id} failed`, err.message);
        console.error(`[JobQueue] Job ${job.id} failed:`, err);
        jobsRepo.updateStatus(job.id, 'failed', err.message || String(err));
      }

    } catch (err) {
      console.error('[JobQueue] Error in worker loop:', err);
    } finally {
      this.isProcessing = false;
      // Immediate check for next job without waiting for interval? 
      // Maybe not to avoid starving CPU if infinite loop of fast jobs.
    }
  }
}

export const jobQueue = new JobQueue();
