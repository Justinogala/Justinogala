
import React from 'react';
import { Briefcase, MapPin, Edit2, Trash2, Eye, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const WorkplaceListSection = ({ workplaces, onDelete, onEdit, onView }) => {
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this workplace?")) {
      onDelete(id);
    }
  };

  const getBadgeColor = (type) => {
    switch (type.toLowerCase()) {
      case 'office': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'remote': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'hybrid': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Workplaces</h2>
      
      {workplaces.length === 0 ? (
        <Card className="bg-gray-50 dark:bg-slate-900 border-dashed border-2 border-gray-300 dark:border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-600 dark:text-gray-300">No workplaces created</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create a workplace to organize your team</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {workplaces.map((wp) => (
            <div 
              key={wp.id} 
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{wp.name}</h3>
                  <Badge className={`rounded-full px-2 py-0.5 text-xs font-medium ${getBadgeColor(wp.type)}`}>
                    {wp.type}
                  </Badge>
                </div>
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    <span>{wp.industry}</span>
                  </div>
                  {wp.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>{wp.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-gray-600 dark:text-gray-300">{wp.members.length}</span>
                    <span>members</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button variant="ghost" size="sm" onClick={() => onView(wp)}>
                  <Eye className="w-4 h-4 mr-2" /> View
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onEdit(wp)} title="Edit">
                  <Edit2 className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(wp.id)} title="Delete">
                  <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkplaceListSection;
