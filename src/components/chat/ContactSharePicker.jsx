import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Check, X, User, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock contacts (in real app, fetch from backend)
const MOCK_CONTACTS = [
  { id: '1', name: 'John Doe', email: 'john@example.com', phone: '+1 234 567 8901', avatar: null },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '+1 234 567 8902', avatar: null },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com', phone: '+1 234 567 8903', avatar: null },
  { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com', phone: '+1 234 567 8904', avatar: null },
  { id: '5', name: 'David Brown', email: 'david@example.com', phone: '+1 234 567 8905', avatar: null },
  { id: '6', name: 'Emily Davis', email: 'emily@example.com', phone: '+1 234 567 8906', avatar: null },
];

const ContactSharePicker = ({ onShareContact }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);

  const filteredContacts = MOCK_CONTACTS.filter(contact =>
    contact.name.toLowerCase().includes(search.toLowerCase()) ||
    contact.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleContact = (contact) => {
    setSelectedContacts(prev => {
      const isSelected = prev.find(c => c.id === contact.id);
      if (isSelected) {
        return prev.filter(c => c.id !== contact.id);
      } else {
        return [...prev, contact];
      }
    });
  };

  const handleShare = () => {
    if (selectedContacts.length > 0) {
      selectedContacts.forEach(contact => {
        onShareContact({
          type: 'contact',
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          avatar: contact.avatar
        });
      });
      setSelectedContacts([]);
      setSearch('');
      setIsOpen(false);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button 
          type="button" 
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Users className="w-4 h-4 text-blue-500" />
          <span>Contact</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Share Contact
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="pl-9 bg-gray-50 dark:bg-slate-800"
            />
          </div>

          {/* Selected Contacts Chips */}
          {selectedContacts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedContacts.map(contact => (
                <motion.div
                  key={contact.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm"
                >
                  <span className="truncate max-w-[100px]">{contact.name}</span>
                  <button 
                    onClick={() => toggleContact(contact)}
                    className="hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Contact List */}
          <ScrollArea className="h-64 border border-gray-100 dark:border-slate-800 rounded-lg">
            <div className="p-2 space-y-1">
              {filteredContacts.map(contact => {
                const isSelected = selectedContacts.find(c => c.id === contact.id);
                return (
                  <button
                    key={contact.id}
                    onClick={() => toggleContact(contact)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                        : 'hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                        {getInitials(contact.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {contact.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{contact.email}</p>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
              
              {filteredContacts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No contacts found</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={handleShare}
              disabled={selectedContacts.length === 0}
            >
              Share {selectedContacts.length > 0 && `(${selectedContacts.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactSharePicker;
