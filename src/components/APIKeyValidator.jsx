
import React, { useState } from 'react';
import { Check, X, Loader2, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

const APIKeyValidator = ({ onValid, initialValue = '' }) => {
  const [keyValue, setKeyValue] = useState(initialValue);
  const [status, setStatus] = useState('idle'); // idle, validating, success, error
  const [message, setMessage] = useState('');

  const handleValidation = async () => {
    if (!keyValue.trim()) {
      setStatus('error');
      setMessage('API Key cannot be empty');
      return;
    }

    setStatus('validating');
    setMessage('');

    // Simulate validation - in a real scenario, this would hit an API
    setTimeout(() => {
      if (keyValue.length < 20) {
        setStatus('error');
        setMessage('Invalid API Key format (too short)');
      } else {
        setStatus('success');
        setMessage('API Key looks valid');
        if (onValid) onValid(keyValue);
      }
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="password"
            placeholder="Enter AssemblyAI API Key"
            value={keyValue}
            onChange={(e) => setKeyValue(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button 
          onClick={handleValidation} 
          disabled={status === 'validating' || !keyValue}
          className="min-w-[100px]"
        >
          {status === 'validating' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Validate'
          )}
        </Button>
      </div>

      {status === 'success' && (
        <Alert className="bg-green-50 text-green-700 border-green-200">
          <Check className="h-4 w-4" />
          <AlertDescription>Success! The API key is valid.</AlertDescription>
        </Alert>
      )}

      {status === 'error' && (
        <Alert variant="destructive" className="bg-red-50 text-red-700 border-red-200">
          <X className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default APIKeyValidator;
