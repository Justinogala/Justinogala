import React, { useState } from 'react';
import { MapPin, Navigation, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const LocationPicker = ({ onSendLocation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const { toast } = useToast();

  const getCurrentLocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      toast({ variant: 'destructive', title: 'Error', description: 'Geolocation is not supported by your browser' });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoading(false);
      },
      (error) => {
        toast({ variant: 'destructive', title: 'Location Error', description: error.message });
        setLoading(false);
      }
    );
  };

  const handleSend = () => {
    if (location) {
      onSendLocation(location);
      setIsOpen(false);
      setLocation(null);
    }
  };

  // Construct OSM embed URL
  const getMapUrl = (lat, lng) => {
    // Small bounding box around point
    const bbox = `${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          className="text-gray-500 hover:text-indigo-600 rounded-full"
        >
          <MapPin className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle>Share Location</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="h-64 bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden relative flex items-center justify-center border border-gray-200 dark:border-slate-700">
            {location ? (
              <iframe
                title="Location Map"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                src={getMapUrl(location.lat, location.lng)}
                className="w-full h-full"
              />
            ) : (
              <div className="text-center text-gray-500 p-6">
                <MapPin className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Click below to find your current location</p>
              </div>
            )}
            
            {loading && (
              <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            )}
          </div>

          <div className="flex gap-3">
             <Button 
               variant="outline" 
               className="flex-1" 
               onClick={getCurrentLocation}
               disabled={loading}
             >
               <Navigation className="w-4 h-4 mr-2" /> 
               {location ? 'Update Location' : 'Locate Me'}
             </Button>
             
             <Button 
               className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" 
               onClick={handleSend}
               disabled={!location}
             >
               <Send className="w-4 h-4 mr-2" /> Share
             </Button>
          </div>
          
          {location && (
            <p className="text-xs text-center text-gray-400 font-mono">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPicker;