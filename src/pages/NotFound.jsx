
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet';
import { MoveLeft, FileQuestion } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <Helmet>
        <title>404: Page Not Found - Munal</title>
      </Helmet>
      
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-10 blur-3xl">
            <div className="w-48 h-48 bg-violet-600 rounded-full"></div>
          </div>
          <FileQuestion className="w-24 h-24 mx-auto text-violet-600 relative z-10" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            Page not found
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate(-1)} 
            variant="outline"
            className="h-12 px-6"
          >
            <MoveLeft className="mr-2 w-4 h-4" />
            Go Back
          </Button>
          <Button 
            onClick={() => navigate('/')}
            className="h-12 px-6 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20"
          >
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
