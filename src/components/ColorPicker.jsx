
import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  '#6366f1', '#ec4899', '#06b6d4', '#22c55e', 
  '#eab308', '#f97316', '#ef4444', '#0f172a',
  '#ffffff', '#94a3b8'
];

const ColorPicker = ({ color, onChange, label, className }) => {
  const [inputValue, setInputValue] = useState(color);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setInputValue(color);
  }, [color]);

  const handleChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
  };

  const handleManualInput = (e) => {
    const val = e.target.value;
    setInputValue(val);
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      onChange(val);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inputValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="text-sm font-medium text-muted-foreground">{label}</label>}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div 
            className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded border border-border shadow-sm cursor-pointer" 
            style={{ backgroundColor: inputValue }}
          >
             <input 
              type="color" 
              value={inputValue} 
              onChange={handleChange}
              className="opacity-0 w-full h-full cursor-pointer"
            />
          </div>
          <Input 
            value={inputValue} 
            onChange={handleManualInput}
            className="pl-10 font-mono uppercase" 
            maxLength={7}
          />
        </div>
        <Button variant="outline" size="icon" onClick={copyToClipboard} title="Copy Color Code">
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {PRESET_COLORS.map(c => (
          <button
            key={c}
            type="button"
            className={cn(
              "w-6 h-6 rounded-full border border-border transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
              inputValue.toLowerCase() === c.toLowerCase() && "ring-2 ring-offset-2 ring-primary"
            )}
            style={{ backgroundColor: c }}
            onClick={() => {
              setInputValue(c);
              onChange(c);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;
