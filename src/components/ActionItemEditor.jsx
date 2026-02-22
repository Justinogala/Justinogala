
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';

const ActionItemEditor = ({ isOpen, onClose, onSave, initialData }) => {
  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      text: '',
      assignee: '',
      deadline: '',
      priority: 'Medium'
    }
  });

  useEffect(() => {
    if (isOpen && initialData) {
      reset({
        text: initialData.text || '',
        assignee: initialData.assignee || '',
        deadline: initialData.deadline || '',
        priority: initialData.priority || 'Medium'
      });
    } else if (isOpen) {
      reset({
        text: '',
        assignee: '',
        deadline: '',
        priority: 'Medium'
      });
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = (data) => {
    onSave({
      ...initialData, // preserve ID if editing
      ...data
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Action Item' : 'New Action Item'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="text">Action Item Description</Label>
            <Textarea
              id="text"
              placeholder="What needs to be done?"
              className="resize-none"
              {...register("text", { required: true })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Input
                id="assignee"
                placeholder="Name"
                {...register("assignee")}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                {...register("deadline")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select 
              onValueChange={(val) => setValue("priority", val)} 
              defaultValue={initialData?.priority || "Medium"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Action Item</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ActionItemEditor;
