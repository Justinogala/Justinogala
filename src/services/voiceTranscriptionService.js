
import { format } from 'date-fns';

const STORAGE_KEY = 'voice_transcriptions_history';

export const saveVoiceTranscription = async (userId, transcriptionData) => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const newEntry = {
      id: crypto.randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
      ...transcriptionData
    };

    const history = getVoiceTranscriptionHistory(userId);
    const updatedHistory = [newEntry, ...history];
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    
    return { success: true, data: newEntry };
  } catch (error) {
    console.error('Error saving transcription:', error);
    return { success: false, error: error.message };
  }
};

export const getVoiceTranscriptionHistory = (userId) => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : [];
    // Filter by userId in a real app, though localStorage is shared here
    return parsed; 
  } catch (error) {
    console.error('Error fetching history:', error);
    return [];
  }
};

export const deleteVoiceTranscription = async (transcriptionId) => {
  try {
    const history = getVoiceTranscriptionHistory();
    const updatedHistory = history.filter(item => item.id !== transcriptionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    return true;
  } catch (error) {
    console.error('Error deleting transcription:', error);
    return false;
  }
};

export const downloadTranscription = (transcript, filename = 'transcription') => {
  try {
    const element = document.createElement("a");
    const file = new Blob([transcript], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${filename}_${format(new Date(), 'yyyyMMdd_HHmm')}.txt`;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
    return true;
  } catch (error) {
    console.error('Download failed:', error);
    return false;
  }
};

export const formatTranscriptWithTimestamps = (segments) => {
  if (!segments || !segments.length) return '';
  
  return segments.map(segment => {
    return `[${segment.timestamp}] ${segment.text}`;
  }).join('\n');
};
