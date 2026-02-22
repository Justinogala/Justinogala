
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CallRingtoneSettings from '@/components/video/CallRingtoneSettings';

const CallSettingsModal = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle>Call Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="audio" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
            <TabsTrigger value="ringtone">Ring</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>
          
          <TabsContent value="audio" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Microphone</Label>
              <Select defaultValue="default">
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select microphone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default - MacBook Pro Microphone</SelectItem>
                  <SelectItem value="external">External USB Microphone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Speakers</Label>
              <Select defaultValue="default">
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select speakers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default - MacBook Pro Speakers</SelectItem>
                  <SelectItem value="headphones">External Headphones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="w-full border-gray-700 hover:bg-gray-800">Test Audio</Button>
          </TabsContent>
          
          <TabsContent value="video" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Camera</Label>
              <Select defaultValue="default">
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select camera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">FaceTime HD Camera</SelectItem>
                  <SelectItem value="external">Logitech Webcam</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Video Quality</Label>
              <Select defaultValue="hd">
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hd">High Definition (720p)</SelectItem>
                  <SelectItem value="sd">Standard Definition (360p)</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="ringtone" className="py-4">
            <CallRingtoneSettings className="bg-gray-800 border-gray-700" />
          </TabsContent>
          
          <TabsContent value="general" className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-gray-800 space-y-2">
               <h4 className="font-medium">Shortcuts</h4>
               <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                 <div>M - Toggle Mute</div>
                 <div>V - Toggle Video</div>
                 <div>H - Raise Hand</div>
                 <div>S - Share Screen</div>
               </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700">Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CallSettingsModal;
