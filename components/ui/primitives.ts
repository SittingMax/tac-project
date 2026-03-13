/**
 * UI Primitives - Base Layer
 * Atomic design tokens and primitive components
 * These are the foundational building blocks for all UI components
 */

// Re-export all primitive components
export { Button } from './button';
export { Input } from './input';
export { Label } from './label';
export { Textarea } from './textarea';
export { Checkbox } from './checkbox';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
export { Slider } from './slider';

// Layout primitives
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
export { Separator } from './separator';
export { ScrollArea, ScrollBar } from './scroll-area';

// Feedback primitives
export { Badge } from './badge';
export { Progress } from './progress';
export { Skeleton } from './skeleton';

// Overlay primitives
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
export {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet';
export { Popover, PopoverContent, PopoverTrigger } from './popover';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';

// Navigation primitives
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

// Data display primitives
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
export { Avatar, AvatarFallback, AvatarImage } from './avatar';

// Utility components
export { cn } from '@/lib/utils';
