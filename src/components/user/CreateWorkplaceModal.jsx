
import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validateWorkplaceForm } from '@/utils/validation';
import { useToast } from '@/components/ui/use-toast';
import { X, Plus, MapPin, Briefcase, Globe } from 'lucide-react';

const CreateWorkplaceModal = ({ isOpen, onClose, onSave }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    description: '',
    industry: '',
    members: []
  });
  const [memberInput, setMemberInput] = useState('');
  const [errors, setErrors] = useState({});

  const workplaceTypes = ['Office', 'Remote', 'Hybrid'];
  const industries = ['Tech', 'Finance', 'Healthcare', 'Education', 'Other'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (memberInput && /\S+@\S+\.\S+/.test(memberInput)) {
      if (!formData.members.includes(memberInput)) {
        setFormData(prev => ({ 
          ...prev, 
          members: [...prev.members, memberInput] 
        }));
        setMemberInput('');
      } else {
        toast({ title: "Duplicate Email", description: "This member is already added.", variant: "destructive" });
      }
    } else {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
    }
  };

  const removeMember = (email) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter(m => m !== email)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateWorkplaceForm(formData);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast({
        title: "Validation Error",
        description: "Please check the form for errors.",
        variant: "destructive"
      });
      return;
    }

    onSave({ ...formData, id: Date.now().toString() });
    toast({
      title: "Success",
      description: "Workplace created successfully.",
      className: "bg-green-600 text-white border-none"
    });
    onClose();
    setFormData({ name: '', type: '', location: '', description: '', industry: '', members: [] });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Workplace" className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6">
          <Input
            label="Workplace Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="e.g. Engineering Team"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Workplace Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={`w-full h-11 rounded-lg border bg-white/5 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${errors.type ? 'border-red-500' : 'border-white/20'}`}
              >
                <option value="" disabled className="bg-slate-800">Select Type</option>
                {workplaceTypes.map(type => (
                  <option key={type} value={type} className="bg-slate-800">{type}</option>
                ))}
              </select>
              {errors.type && <p className="mt-1.5 text-sm text-red-400">{errors.type}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Industry</label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className={`w-full h-11 rounded-lg border bg-white/5 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${errors.industry ? 'border-red-500' : 'border-white/20'}`}
              >
                <option value="" disabled className="bg-slate-800">Select Industry</option>
                {industries.map(ind => (
                  <option key={ind} value={ind} className="bg-slate-800">{ind}</option>
                ))}
              </select>
              {errors.industry && <p className="mt-1.5 text-sm text-red-400">{errors.industry}</p>}
            </div>
          </div>

          <Input
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="City, Country or Remote"
          />

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
              placeholder="What is this workplace for?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Team Members</label>
            <div className="flex gap-2 mb-3">
              <Input
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                placeholder="member@example.com"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddMember(e)}
              />
              <Button type="button" onClick={handleAddMember} variant="secondary">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.members.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.members.map(email => (
                  <div key={email} className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-sm">
                    <span>{email}</span>
                    <button type="button" onClick={() => removeMember(email)} className="hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]">
            Create Workplace
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateWorkplaceModal;
