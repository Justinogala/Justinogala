
import React from 'react';
import { Construction } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { Card, CardContent } from '@/components/ui/card';

const AdminContent = () => {
  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <Card className="w-full max-w-lg">
           <CardContent className="pt-10 pb-10 flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-2">
                 <Construction className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Management</h1>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                This module is currently under development. You will be able to manage blog posts, documentation, and other static content here soon.
              </p>
           </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default AdminContent;
