/**
 * Composition Patterns
 * Higher-order components built from primitives
 * These demonstrate flexible composition patterns for complex UI patterns
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Separator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/primitives';

// ============================================
// Pattern 1: Compound Component with Context
// ============================================

// Example: Expandable Card with Context
interface ExpandableCardContextValue {
  isExpanded: boolean;
  toggle: () => void;
}

const ExpandableCardContext = React.createContext<ExpandableCardContextValue | null>(null);

function useExpandableCard() {
  const context = React.useContext(ExpandableCardContext);
  if (!context) {
    throw new Error('useExpandableCard must be used within ExpandableCard');
  }
  return context;
}

// Root component manages state
interface ExpandableCardProps {
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

function ExpandableCard({ children, defaultExpanded = false, className }: ExpandableCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  const value = React.useMemo(
    () => ({
      isExpanded,
      toggle: () => setIsExpanded((prev) => !prev),
    }),
    [isExpanded]
  );

  return (
    <ExpandableCardContext.Provider value={value}>
      <Card className={cn('overflow-hidden', className)}>{children}</Card>
    </ExpandableCardContext.Provider>
  );
}

// Header with toggle
function ExpandableCardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { toggle } = useExpandableCard();

  return (
    <CardHeader className={cn('cursor-pointer', className)} onClick={toggle}>
      {children}
    </CardHeader>
  );
}

// Content that shows/hides
function ExpandableCardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isExpanded } = useExpandableCard();

  if (!isExpanded) return null;

  return <CardContent className={className}>{children}</CardContent>;
}

// Export compound component
export { ExpandableCard, ExpandableCardHeader, ExpandableCardContent };

// ============================================
// Pattern 2: Render Props
// ============================================

// Example: Data Fetcher with render props
interface DataFetcherProps<T> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  children: (data: { data: T | null; isLoading: boolean; error: Error | null }) => React.ReactNode;
}

function DataFetcher<T>({ queryKey, queryFn, children }: DataFetcherProps<T>) {
  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(null);

    queryFn()
      .then((result) => {
        if (mounted) {
          setData(result);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- queryKey array serialized for comparison
  }, [queryKey.join(','), queryFn]);

  return <>{children({ data, isLoading, error })}</>;
}

export { DataFetcher };

// ============================================
// Pattern 3: Slot Pattern
// ============================================

// Example: Card with named slots
interface SlottedCardProps {
  header?: React.ReactNode;
  content?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

function SlottedCard({ header, content, footer, className }: SlottedCardProps) {
  return (
    <Card className={className}>
      {header && (
        <>
          <CardHeader>{header}</CardHeader>
          <Separator />
        </>
      )}
      {content && <CardContent>{content}</CardContent>}
      {footer && (
        <>
          <Separator />
          <div className="p-4">{footer}</div>
        </>
      )}
    </Card>
  );
}

export { SlottedCard };

// ============================================
// Pattern 4: Polymorphic Component
// ============================================

// Example: Text component that can be any element
type AsProp<E extends React.ElementType> = {
  as?: E;
};

type PropsToOmit<E extends React.ElementType, P> = keyof (AsProp<E> & P);

type PolymorphicComponentProps<
  E extends React.ElementType,
  Props = object,
> = React.PropsWithChildren<Props & AsProp<E>> &
  Omit<React.ComponentPropsWithoutRef<E>, PropsToOmit<E, Props>>;

interface TextProps {
  variant?: 'default' | 'muted' | 'primary';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles: Record<NonNullable<TextProps['variant']>, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
};

const sizeStyles: Record<NonNullable<TextProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

function Text<E extends React.ElementType = 'span'>({
  as,
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}: PolymorphicComponentProps<E, TextProps>) {
  const Component = as || 'span';

  return (
    <Component className={cn(variantStyles[variant], sizeStyles[size], className)} {...props}>
      {children}
    </Component>
  );
}

export { Text };

// ============================================
// Pattern 5: Container/Item Pattern
// ============================================

// Example: List with automatic context
interface ListContextValue {
  orientation: 'horizontal' | 'vertical';
  gap: 'sm' | 'md' | 'lg';
}

const ListContext = React.createContext<ListContextValue>({
  orientation: 'vertical',
  gap: 'md',
});

const gapStyles: Record<ListContextValue['gap'], string> = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

interface ListProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

function List({ children, orientation = 'vertical', gap = 'md', className }: ListProps) {
  const value = React.useMemo(() => ({ orientation, gap }), [orientation, gap]);

  return (
    <ListContext.Provider value={value}>
      <div
        className={cn(
          'flex',
          orientation === 'vertical' ? 'flex-col' : 'flex-row',
          gapStyles[gap],
          className
        )}
      >
        {children}
      </div>
    </ListContext.Provider>
  );
}

interface ListItemProps {
  children: React.ReactNode;
  className?: string;
}

function ListItem({ children, className }: ListItemProps) {
  const { orientation } = React.useContext(ListContext);

  return (
    <div className={cn(orientation === 'horizontal' ? 'flex-1' : 'w-full', className)}>
      {children}
    </div>
  );
}

export { List, ListItem };

// ============================================
// Pattern 6: State Machine Pattern
// ============================================

// Example: Status-based component
type Status = 'idle' | 'loading' | 'success' | 'error';

interface StatusState {
  status: Status;
  data?: unknown;
  error?: Error;
}

interface StatusComponentProps {
  state: StatusState;
  children?: {
    idle?: React.ReactNode;
    loading?: React.ReactNode;
    success?: (data: unknown) => React.ReactNode;
    error?: (error: Error) => React.ReactNode;
  };
  defaultLoading?: React.ReactNode;
  defaultError?: React.ReactNode;
}

function StatusComponent({
  state,
  children,
  defaultLoading = <div>Loading...</div>,
  defaultError = <div>An error occurred</div>,
}: StatusComponentProps) {
  switch (state.status) {
    case 'idle':
      return <>{children?.idle}</>;
    case 'loading':
      return <>{children?.loading || defaultLoading}</>;
    case 'success':
      return <>{children?.success?.(state.data)}</>;
    case 'error':
      return <>{children?.error?.(state.error as Error) || defaultError}</>;
    default:
      return null;
  }
}

export { StatusComponent };
export type { Status, StatusState };

// ============================================
// Pattern 7: Recomposition Pattern
// ============================================

// Example: Button with icon slots
interface IconButtonProps {
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
  className?: string;
}

function IconButton({ icon, iconPosition = 'left', children, className }: IconButtonProps) {
  return (
    <Button className={cn('gap-2', className)}>
      {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </Button>
  );
}

export { IconButton };

// ============================================
// Pattern 8: Controlled/Uncontrolled Pattern
// ============================================

// Example: Input that can be controlled or uncontrolled
interface FlexibleInputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

function FlexibleInput({
  value: controlledValue,
  defaultValue = '',
  onChange,
  className,
}: FlexibleInputProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const isControlled = controlledValue !== undefined;

  const currentValue = isControlled ? controlledValue : uncontrolledValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (!isControlled) {
      setUncontrolledValue(newValue);
    }

    onChange?.(newValue);
  };

  return <Input value={currentValue} onChange={handleChange} className={className} />;
}

export { FlexibleInput };

// ============================================
// Pattern 9: Collection Pattern
// ============================================

// Example: Tabs with automatic registration
interface TabsCollectionContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  registerTab: (id: string) => void;
  tabs: string[];
}

const TabsCollectionContext = React.createContext<TabsCollectionContextValue | null>(null);

function useTabsCollection() {
  const context = React.useContext(TabsCollectionContext);
  if (!context) throw new Error('useTabsCollection must be used within TabsCollection');
  return context;
}

interface TabsCollectionProps {
  defaultTab?: string;
  children: React.ReactNode;
  className?: string;
}

function TabsCollection({ defaultTab, children, className }: TabsCollectionProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab || '');
  const [tabs, setTabs] = React.useState<string[]>([]);

  const registerTab = React.useCallback((id: string) => {
    setTabs((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, []);

  // Set first tab as active if none selected
  React.useEffect(() => {
    if (!activeTab && tabs.length > 0) {
      setActiveTab(tabs[0]);
    }
  }, [activeTab, tabs]);

  const value = React.useMemo(
    () => ({ activeTab, setActiveTab, registerTab, tabs }),
    [activeTab, registerTab, tabs]
  );

  return (
    <TabsCollectionContext.Provider value={value}>
      <div className={className}>{children}</div>
    </TabsCollectionContext.Provider>
  );
}

interface TabTriggerProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

function TabTrigger({ id, children, className }: TabTriggerProps) {
  const { activeTab, setActiveTab, registerTab } = useTabsCollection();

  React.useEffect(() => {
    registerTab(id);
  }, [id, registerTab]);

  return (
    <Button
      variant={activeTab === id ? 'default' : 'ghost'}
      size="sm"
      onClick={() => setActiveTab(id)}
      className={className}
    >
      {children}
    </Button>
  );
}

interface TabPanelProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

function TabPanel({ id, children, className }: TabPanelProps) {
  const { activeTab } = useTabsCollection();

  if (activeTab !== id) return null;

  return <div className={className}>{children}</div>;
}

export { TabsCollection, TabTrigger, TabPanel };

// ============================================
// Pattern 10: Builder Pattern
// ============================================

// Example: Dialog builder for step-by-step construction
class DialogBuilder {
  private title: string = '';
  private description: string = '';
  private content: React.ReactNode = null;
  private actions: React.ReactNode = null;

  withTitle(title: string): this {
    this.title = title;
    return this;
  }

  withDescription(description: string): this {
    this.description = description;
    return this;
  }

  withContent(content: React.ReactNode): this {
    this.content = content;
    return this;
  }

  withActions(actions: React.ReactNode): this {
    this.actions = actions;
    return this;
  }

  build() {
    const BuiltDialog = ({
      open,
      onOpenChange,
    }: {
      open: boolean;
      onOpenChange: (open: boolean) => void;
    }) => (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{this.title}</DialogTitle>
            {this.description && (
              <p className="text-sm text-muted-foreground">{this.description}</p>
            )}
          </DialogHeader>
          {this.content}
          {this.actions && <DialogFooter>{this.actions}</DialogFooter>}
        </DialogContent>
      </Dialog>
    );

    return BuiltDialog;
  }
}

export { DialogBuilder };

// ============================================
// Utility: Compose Multiple Components
// ============================================

// Helper to compose multiple components together
function compose<TProps extends { children?: React.ReactNode }>(
  ...components: Array<React.ComponentType<TProps>>
): React.FC<TProps> {
  return components.reduce<React.FC<TProps>>(
    (Acc, Next) => {
      const Composed: React.FC<TProps> = (props) => (
        <Acc {...props}>
          <Next {...props} />
        </Acc>
      );

      return Composed;
    },
    ({ children }) => <>{children}</>
  );
}

export { compose };
