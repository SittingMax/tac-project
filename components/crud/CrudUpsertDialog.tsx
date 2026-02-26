'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, UseFormReturn, DefaultValues } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';

export interface CrudUpsertDialogProps<TSchema extends z.ZodTypeAny> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  title: string;
  description?: string;
  schema: TSchema;
  defaultValues: DefaultValues<z.infer<TSchema>>;
  onSubmit: (values: z.infer<TSchema>) => Promise<void>;
  /**
   * Render prop for the form fields.
   * Receives the form instance to use with FormField components.
   */
  children: (form: UseFormReturn<z.infer<TSchema>>) => React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
}

/**
 * Reusable upsert (create/edit) dialog for CRUD operations.
 * Integrates react-hook-form with zod validation.
 *
 * @example
 * <CrudUpsertDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   mode="create"
 *   title="Create Customer"
 *   schema={customerSchema}
 *   defaultValues={{ name: "", email: "" }}
 *   onSubmit={handleCreate}
 * >
 *   {(form) => (
 *     <>
 *       <FormField control={form.control} name="name" ... />
 *       <FormField control={form.control} name="email" ... />
 *     </>
 *   )}
 * </CrudUpsertDialog>
 */
export function CrudUpsertDialog<TSchema extends z.ZodTypeAny>({
  open,
  onOpenChange,
  mode,
  title,
  description,
  schema,
  defaultValues,
  onSubmit,
  children,
  submitLabel,
  cancelLabel = 'Cancel',
}: CrudUpsertDialogProps<TSchema>) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  // Reset form when dialog opens with new default values
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, defaultValues, form]);

  const handleSubmit = async (values: z.infer<TSchema>) => {
    setIsLoading(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Submit operation failed:', error);
      // Error handling should be done in the onSubmit callback
    } finally {
      setIsLoading(false);
    }
  };

  const buttonLabel = submitLabel ?? (mode === 'create' ? 'Create' : 'Save Changes');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl max-h-[90vh] overflow-y-auto"
        data-testid={`${mode}-dialog`}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {children(form)}

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                data-testid="dialog-cancel-button"
              >
                {cancelLabel}
              </Button>
              <Button type="submit" disabled={isLoading} data-testid="dialog-submit-button">
                {isLoading ? 'Saving...' : buttonLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
