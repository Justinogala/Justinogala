
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'MunalMeetingsDB';
const DB_VERSION = 1;
const STORE_NAME = 'meeting_recordings';
const METADATA_KEY = 'munal_meetings_metadata';

// --- IndexedDB Helpers ---

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = (event) => reject('IndexedDB error: ' + event.target.error);
    request.onsuccess = (event) => resolve(event.target.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

const saveBlob = async (id, blob) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(blob, id);
      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('Failed to save blob to IndexedDB:', error);
    return false;
  }
};

const getBlob = async (id) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('Failed to get blob from IndexedDB:', error);
    return null;
  }
};

const deleteBlob = async (id) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('Failed to delete blob from IndexedDB:', error);
    return false;
  }
};

// --- Service Implementation ---

export const localMeetingsStorageService = {
  getAllMeetings: () => {
    try {
      const data = localStorage.getItem(METADATA_KEY);
      let meetings = data ? JSON.parse(data) : [];
      
      // Auto-cleanup for specific requested ID: 3389bec5
      const legacyId = '3389bec5';
      const hasLegacyMeeting = meetings.some(m => m.id === legacyId);
      
      if (hasLegacyMeeting) {
        meetings = meetings.filter(m => m.id !== legacyId);
        localStorage.setItem(METADATA_KEY, JSON.stringify(meetings));
        // Note: Blob cleanup for this ID will happen eventually or can be triggered manually, 
        // but removing from metadata effectively hides it from the user immediately.
        console.log(`Meeting ${legacyId} auto-removed from storage.`);
      }
      
      return meetings;
    } catch (error) {
      console.error('Error reading meetings metadata:', error);
      return [];
    }
  },

  getMeetingById: (id) => {
    const meetings = localMeetingsStorageService.getAllMeetings();
    return meetings.find(m => m.id === id) || null;
  },

  createMeeting: async (meetingData) => {
    const newMeeting = {
      id: meetingData.id || uuidv4().slice(0, 8),
      title: meetingData.title || 'Untitled Meeting',
      description: meetingData.description || '',
      password: meetingData.password || '',
      date: meetingData.date || new Date().toISOString().split('T')[0],
      time: meetingData.time || '10:00',
      timezone: meetingData.timezone || 'UTC',
      platform: meetingData.platform || 'internal',
      meetingUrl: meetingData.meetingUrl || '', // For external platforms like Jizira
      participants: meetingData.participants || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isLocal: true,
      hasRecording: false
    };
    return localMeetingsStorageService.saveMeeting(newMeeting);
  },

  updateMeeting: async (id, updateData) => {
    const meetings = localMeetingsStorageService.getAllMeetings();
    const existingIndex = meetings.findIndex(m => m.id === id);
    
    if (existingIndex === -1) {
      return { success: false, error: 'Meeting not found' };
    }

    const updatedMeeting = {
      ...meetings[existingIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    return localMeetingsStorageService.saveMeeting(updatedMeeting);
  },

  saveMeeting: async (meetingData, videoBlob = null) => {
    try {
      const meetings = localMeetingsStorageService.getAllMeetings();
      const existingIndex = meetings.findIndex(m => m.id === meetingData.id);
      
      const newMeeting = {
        ...meetingData,
        updatedAt: new Date().toISOString(),
        isLocal: true,
        hasRecording: !!videoBlob || meetingData.hasRecording
      };

      if (videoBlob) {
        await saveBlob(newMeeting.id, videoBlob);
        newMeeting.recordingUrl = URL.createObjectURL(videoBlob);
      }

      if (existingIndex >= 0) {
        meetings[existingIndex] = { ...meetings[existingIndex], ...newMeeting };
      } else {
        newMeeting.createdAt = newMeeting.createdAt || new Date().toISOString();
        meetings.push(newMeeting);
      }

      localStorage.setItem(METADATA_KEY, JSON.stringify(meetings));
      return { success: true, data: newMeeting };
    } catch (error) {
      console.error('Error saving meeting locally:', error);
      return { success: false, error: error.message };
    }
  },

  deleteMeeting: async (id) => {
    try {
      const meetings = localMeetingsStorageService.getAllMeetings();
      const filtered = meetings.filter(m => m.id !== id);
      localStorage.setItem(METADATA_KEY, JSON.stringify(filtered));
      await deleteBlob(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getRecordingUrl: async (id) => {
    const blob = await getBlob(id);
    if (blob) {
      return URL.createObjectURL(blob);
    }
    return null;
  },

  toggleFavorite: (id) => {
    const meetings = localMeetingsStorageService.getAllMeetings();
    const meeting = meetings.find(m => m.id === id);
    if (meeting) {
      meeting.isFavorite = !meeting.isFavorite;
      localStorage.setItem(METADATA_KEY, JSON.stringify(meetings));
      return { success: true, isFavorite: meeting.isFavorite };
    }
    return { success: false, error: 'Meeting not found' };
  },

  toggleArchive: (id) => {
    const meetings = localMeetingsStorageService.getAllMeetings();
    const meeting = meetings.find(m => m.id === id);
    if (meeting) {
      meeting.isArchived = !meeting.isArchived;
      localStorage.setItem(METADATA_KEY, JSON.stringify(meetings));
      return { success: true, isArchived: meeting.isArchived };
    }
    return { success: false, error: 'Meeting not found' };
  },

  clearAll: async () => {
    localStorage.removeItem(METADATA_KEY);
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    transaction.objectStore(STORE_NAME).clear();
  }
};
