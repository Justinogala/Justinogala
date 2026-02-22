
import { v4 as uuidv4 } from 'uuid';
import { transcribeAudio } from './transcriptionService';

const JOBS_KEY = 'munal_transcription_jobs';

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

export const createTranscriptionJob = (file, language) => {
  const jobId = uuidv4();
  const fileId = uuidv4(); // In a real app, this would be the ID from fileService

  const initialJob = {
    jobId,
    fileId,
    fileName: file.name,
    status: 'pending',
    transcript: null,
    error: null,
    createdAt: new Date().toISOString(),
    completedAt: null
  };

  saveJob(jobId, initialJob);

  // Start the process "asynchronously"
  // In a real backend, this would be a queue. Here we just run the promise.
  (async () => {
    try {
      saveJob(jobId, { status: 'processing' });
      const transcript = await transcribeAudio(file, language);
      handleTranscriptionCompletion(jobId, transcript);
    } catch (error) {
      handleTranscriptionFailure(jobId, error.message);
    }
  })();

  return jobId;
};

export const pollTranscriptionStatus = (jobId) => {
  const jobs = getJobs();
  return jobs[jobId] || null;
};

export const handleTranscriptionCompletion = (jobId, transcript) => {
  saveJob(jobId, {
    status: 'completed',
    transcript,
    completedAt: new Date().toISOString()
  });
};

export const handleTranscriptionFailure = (jobId, error) => {
  saveJob(jobId, {
    status: 'failed',
    error,
    completedAt: new Date().toISOString()
  });
};
