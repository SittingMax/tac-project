import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const PageHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="mb-12 border-b border-border/40 pb-6">
    <h1 className="text-4xl font-semibold text-foreground tracking-tight mb-2">
      {title}
      <span className="text-primary">.</span>
    </h1>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export const SectionHeader = ({
  icon: Icon,
  title,
  color = 'text-primary',
  className,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  title: string;
  color?: string;
  className?: string;
}) => (
  <div className={`flex items-center gap-4 mb-8 pb-4 border-b border-border/40 ${className || ''}`}>
    <Icon className={`w-4 h-4 ${color} opacity-70`} />
    <h3 className="text-xs font-semibold border border-border px-2 py-0.5 rounded-sm text-foreground">
      {title}
    </h3>
  </div>
);

export const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <Label className="block text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 ml-0.5">
    {children}
  </Label>
);

// Custom Select styled for WGS
export const SelectField = ({
  value,
  onChange,
  options,
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) => (
  <Select value={value} onValueChange={onChange} disabled={disabled}>
    <SelectTrigger className="w-full h-11 bg-transparent hover:border-ring/50 transition-colors">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {options.map((opt) => (
        <SelectItem key={opt.value} value={opt.value}>
          {opt.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

// Toggle switch component
export const ToggleSwitch = ({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) => (
  <button
    role="switch"
    aria-checked={checked}
    className="w-full flex items-center justify-between px-4 py-4 border border-transparent hover:bg-muted/5 transition-colors group"
    onClick={onToggle}
  >
    <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
      {label}
    </span>
    <div
      className={`w-12 h-4 relative transition-colors ${checked ? 'bg-primary/20 border border-primary/50' : 'bg-muted-foreground/10 border border-border'}`}
    >
      <div
        className={`absolute top-0 w-3.5 h-3 shadow-none transition-all duration-300 ${
          checked ? 'right-0 bg-primary' : 'left-0 bg-muted-foreground/30'
        }`}
      ></div>
    </div>
  </button>
);
