import React from 'react';
import { ChevronDown } from 'lucide-react';

export const PageHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="mb-12 border-b border-border/40 pb-6">
    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter mb-2">
      {title}
      <span className="text-primary">.</span>
    </h1>
    <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
      {description}
    </p>
  </div>
);

export const SectionHeader = ({
  icon: Icon,
  title,
  color = 'text-primary',
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  title: string;
  color?: string;
}) => (
  <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border/40">
    <Icon className={`w-4 h-4 ${color} opacity-70`} />
    <h3 className="text-xs font-mono font-black border border-border px-2 py-0.5 uppercase tracking-widest text-foreground">
      {title}
    </h3>
  </div>
);

export const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1.5 ml-0.5">
    {children}
  </label>
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
  <div className="relative group">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="flex h-10 w-full rounded-none border border-border bg-background px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-foreground transition-colors focus:outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 appearance-none pr-8 hover:bg-muted/10 cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-background">
          {opt.label}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute right-2.5 top-3 w-3.5 h-3.5 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors" />
  </div>
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
    <span className="text-[10px] font-mono uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">
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
