import React, { createContext, useContext, useState } from 'react';
import { ChevronDown } from 'lucide-react';

// Select Components
interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

interface SelectProps {
  children: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
}

export const Select: React.FC<SelectProps> = ({ children, value, onValueChange }) => {
  const [open, setOpen] = useState(false);
  
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectTrigger must be used within Select');
  
  const { open, setOpen } = context;
  
  return (
    <button
      onClick={() => setOpen(!open)}
      className={`
        flex items-center justify-between w-full px-3 py-2 text-sm 
        bg-white border border-gray-300 rounded-md shadow-sm 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        ${className}
      `}
    >
      {children}
      <ChevronDown className="h-4 w-4 text-gray-400" />
    </button>
  );
};

export const SelectValue: React.FC = () => {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectValue must be used within Select');
  
  const { value } = context;
  
  return <span>{value}</span>;
};

export const SelectContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectContent must be used within Select');
  
  const { open, setOpen } = context;
  
  if (!open) return null;
  
  return (
    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
      <div className="py-1">
        {children}
      </div>
    </div>
  );
};

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
}

export const SelectItem: React.FC<SelectItemProps> = ({ children, value }) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectItem must be used within Select');
  
  const { onValueChange, setOpen } = context;
  
  return (
    <button
      onClick={() => {
        onValueChange(value);
        setOpen(false);
      }}
      className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
    >
      {children}
    </button>
  );
};