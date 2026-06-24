import React from 'react';
import { Monitor, Camera, Mic, Square, Download, Trash2, Play, Pause, RotateCcw, Clock, HardDrive, Loader2, FolderOpen, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DEFAULT_CATEGORIES = ['Uncategorized', 'Meetings', 'Tutorials', 'Presentations', 'Bug Reports', 'Personal'];

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const RecordingControls = ({
  recordingType, setRecordingType, includeMicrophone, setIncludeMicrophone,
  selectedCategory, setSelectedCategory,
  isRecording, isPaused, recordedBlob, previewUrl, recordingTime, isSaving,
  selectedRecording, isLoadingVideo, livePreviewRef,
  onStart, onStop, onTogglePause, onSave, onDownload, onRecordAgain, onDiscard, onClosePlayer,
}) => (
  <motion.div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
    
    {/* Preview Area */}
    <AnimatePresence mode="wait">
      {(isRecording || previewUrl || selectedRecording?.videoUrl) && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-gray-900 relative">
          {isRecording && (
            <video ref={livePreviewRef} autoPlay muted playsInline className="w-full aspect-video object-contain bg-black" />
          )}
          {previewUrl && !isRecording && (
            <video src={previewUrl} controls className="w-full aspect-video object-contain" />
          )}
          {selectedRecording?.videoUrl && !isRecording && !previewUrl && (
            <video src={selectedRecording.videoUrl} controls autoPlay className="w-full aspect-video object-contain" />
          )}
          
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-3">
              <div className="flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full shadow-lg">
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                <span className="text-white text-sm font-semibold">LIVE</span>
              </div>
              <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <Clock className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium tabular-nums">{formatTime(recordingTime)}</span>
              </div>
              {isPaused && (
                <div className="flex items-center gap-2 bg-yellow-500 px-3 py-1.5 rounded-full">
                  <Pause className="w-4 h-4 text-black" />
                  <span className="text-black text-sm font-semibold">PAUSED</span>
                </div>
              )}
            </div>
          )}
          
          {isRecording && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
              {recordingType === 'screen' ? (
                <><Monitor className="w-4 h-4 text-blue-400" /><span className="text-white text-sm">Screen</span></>
              ) : (
                <><Camera className="w-4 h-4 text-purple-400" /><span className="text-white text-sm">Camera</span></>
              )}
            </div>
          )}
          
          {isLoadingVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>

    <div className="p-8">
      {/* Recording Setup */}
      {!isRecording && !previewUrl && !selectedRecording?.videoUrl && (
        <>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Record Your Video</h2>
            <p className="text-gray-500 dark:text-gray-400">Choose how you&apos;d like to record</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button onClick={() => setRecordingType('screen')} data-testid="record-screen-btn" className={cn("flex flex-col items-center justify-center p-8 rounded-xl border-2 transition-all", recordingType === 'screen' ? "border-rose-500 bg-rose-50 dark:bg-rose-950/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300")}>
              <Monitor className={cn("w-10 h-10 mb-4", recordingType === 'screen' ? "text-rose-600" : "text-gray-400")} />
              <span className={cn("font-semibold mb-1", recordingType === 'screen' ? "text-rose-600" : "text-gray-700 dark:text-gray-300")}>Screen</span>
              <span className="text-sm text-gray-500">Share your screen</span>
            </button>
            <button onClick={() => setRecordingType('camera')} data-testid="record-camera-btn" className={cn("flex flex-col items-center justify-center p-8 rounded-xl border-2 transition-all", recordingType === 'camera' ? "border-rose-500 bg-rose-50 dark:bg-rose-950/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300")}>
              <Camera className={cn("w-10 h-10 mb-4", recordingType === 'camera' ? "text-rose-600" : "text-gray-400")} />
              <span className={cn("font-semibold mb-1", recordingType === 'camera' ? "text-rose-600" : "text-gray-700 dark:text-gray-300")}>Camera</span>
              <span className="text-sm text-gray-500">Use your webcam</span>
            </button>
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Category</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2"><FolderOpen className="w-4 h-4" />{selectedCategory}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {DEFAULT_CATEGORIES.map(cat => (
                  <DropdownMenuItem key={cat} onClick={() => setSelectedCategory(cat)}>{cat}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <Checkbox id="microphone" checked={includeMicrophone} onCheckedChange={setIncludeMicrophone} className="mt-0.5 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500" />
              <div>
                <label htmlFor="microphone" className="font-medium text-gray-900 dark:text-white cursor-pointer flex items-center gap-2">
                  <Mic className="w-4 h-4" /> Include microphone audio
                </label>
                <p className="text-sm text-gray-500 mt-1">Recommended for explanations and narration.</p>
              </div>
            </div>
          </div>
        </>
      )}

      {isRecording && (
        <div className="flex items-center justify-center gap-4 py-4">
          <Button onClick={onTogglePause} variant="outline" size="lg" className="gap-2">
            {isPaused ? <><Play className="w-4 h-4" /> Resume</> : <><Pause className="w-4 h-4" /> Pause</>}
          </Button>
          <Button onClick={onStop} variant="destructive" size="lg" className="gap-2 bg-rose-500 hover:bg-rose-600">
            <Square className="w-4 h-4" /> Stop Recording
          </Button>
        </div>
      )}

      {previewUrl && !isRecording && (
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button onClick={onSave} disabled={isSaving} className="gap-2 bg-rose-500 hover:bg-rose-600" size="lg">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Save Recording'}
            </Button>
            <Button onClick={onDownload} variant="outline" size="lg" className="gap-2"><Download className="w-4 h-4" /> Download</Button>
            <Button onClick={onRecordAgain} variant="outline" size="lg" className="gap-2"><RotateCcw className="w-4 h-4" /> Record Again</Button>
            <Button onClick={onDiscard} variant="ghost" size="lg" className="gap-2 text-gray-500 hover:text-red-500"><Trash2 className="w-4 h-4" /> Discard</Button>
          </div>
          <p className="text-center text-sm text-gray-500">Duration: {formatTime(recordingTime)} • Expires in 7 days</p>
        </div>
      )}

      {selectedRecording?.videoUrl && !isRecording && !previewUrl && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">Playing: {selectedRecording.title}</p>
          <Button onClick={onClosePlayer} variant="outline" size="sm" className="mt-2">Close Player</Button>
        </div>
      )}

      {!isRecording && !previewUrl && !selectedRecording?.videoUrl && (
        <>
          <Button onClick={onStart} disabled={!recordingType} className={cn("w-full h-12 text-base font-medium gap-2 transition-all", recordingType ? "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg shadow-rose-500/25" : "bg-rose-300 cursor-not-allowed")}>
            <div className="w-3 h-3 rounded-full bg-white/80" /> Start Recording
          </Button>
          <p className="text-center text-sm text-gray-400 mt-4">Maximum recording time: 30 minutes</p>
        </>
      )}
    </div>
  </motion.div>
);
