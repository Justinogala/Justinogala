
import { realtimeService } from './realtimeService';

// Simple stack for Undo/Redo
const HISTORY_LIMIT = 50;

class LiveEditingService {
  constructor() {
    this.history = [];
    this.future = [];
    this.currentText = "";
    this.isRecording = false;
  }

  initialize(initialText, transcriptId) {
    this.currentText = initialText;
    this.transcriptId = transcriptId;
    this.history = [];
    this.future = [];
    
    // Listen for remote edits
    realtimeService.subscribe(`transcript:${transcriptId}:edit`, (payload) => {
      this.handleRemoteEdit(payload);
    });
  }

  /**
   * Apply a local edit
   * @param {string} newText - The full new text content
   * @param {object} selection - Cursor position { start, end }
   */
  applyLocalEdit(newText, selection) {
    if (newText === this.currentText) return;

    // Push current state to history before changing
    this.addToHistory({
      text: this.currentText,
      selection: selection,
      timestamp: Date.now()
    });

    this.currentText = newText;
    this.future = []; // Clear redo stack on new edit

    // Broadcast change
    realtimeService.broadcast(`transcript:${this.transcriptId}:edit`, {
      type: 'TEXT_UPDATE',
      text: newText,
      selection: selection
    });
  }

  handleRemoteEdit(payload) {
    if (payload.type === 'TEXT_UPDATE') {
      // In a real OT system, we would transform operations.
      // For this prototype, we'll use a "Last Write Wins" or direct replacement strategy
      // but notify listeners to update their view.
      this.currentText = payload.text;
      
      // Dispatch event for UI to update
      window.dispatchEvent(new CustomEvent(`transcript-update-${this.transcriptId}`, {
        detail: { text: payload.text, remote: true }
      }));
    }
  }

  undo() {
    if (this.history.length === 0) return null;

    const previousState = this.history.pop();
    
    // Push current to future
    this.future.push({
      text: this.currentText,
      timestamp: Date.now()
    });

    this.currentText = previousState.text;
    
    // Broadcast undo
    realtimeService.broadcast(`transcript:${this.transcriptId}:edit`, {
      type: 'TEXT_UPDATE',
      text: this.currentText
    });

    return previousState;
  }

  redo() {
    if (this.future.length === 0) return null;

    const nextState = this.future.pop();

    // Push current to history
    this.addToHistory({
      text: this.currentText,
      timestamp: Date.now()
    });

    this.currentText = nextState.text;

    // Broadcast redo
    realtimeService.broadcast(`transcript:${this.transcriptId}:edit`, {
      type: 'TEXT_UPDATE',
      text: this.currentText
    });

    return nextState;
  }

  addToHistory(state) {
    if (this.history.length >= HISTORY_LIMIT) {
      this.history.shift();
    }
    this.history.push(state);
  }

  getCurrentText() {
    return this.currentText;
  }
}

export const liveEditingService = new LiveEditingService();
