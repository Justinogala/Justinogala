
import { v4 as uuidv4 } from 'uuid';
import { generateSummary, extractKeyPoints, extractActionItems } from './summarizationService';

const JOBS_KEY = 'munal_summarization_jobs';

const getJobs = () => {
  try {
    return JSON.parse(localStorage.getItem(JOBS_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveJob = (jobId, data) => {
  const jobs = getJobs();
  jobs[jobId] = { ...jobs[jobId], ...data };
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
  return jobs[jobId];
};

export const createSummarizationJob = (transcriptId, transcriptText) => {
  const jobId = uuidv4();

  const initialJob = {
    jobId,
    transcriptId,
    status: 'pending',
    summary: null,
    keyPoints: null,
    actionItems: null,
    error: null,
    createdAt: new Date().toISOString(),
    completedAt: null
  };

  saveJob(jobId, initialJob);

  (async () => {
    try {
      saveJob(jobId, { status: 'processing' });
      
      // Run in parallel for speed
      const [summary, keyPoints, actionItems] = await Promise.all([
        generateSummary(transcriptText),
        extractKeyPoints(transcriptText),
        extractActionItems(transcriptText)
      ]);

      handleSummarizationCompletion(jobId, summary, keyPoints, actionItems);
    } catch (error) {
      handleSummarizationFailure(jobId, error.message);
    }
  })();

  return jobId;
};

export const pollSummarizationStatus = (jobId) => {
  const jobs = getJobs();
  return jobs[jobId] || null;
};

export const handleSummarizationCompletion = (jobId, summary, keyPoints, actionItems) => {
  saveJob(jobId, {
    status: 'completed',
    summary,
    keyPoints,
    actionItems,
    completedAt: new Date().toISOString()
  });
};

export const handleSummarizationFailure = (jobId, error) => {
  saveJob(jobId, {
    status: 'failed',
    error,
    completedAt: new Date().toISOString()
  });
};
