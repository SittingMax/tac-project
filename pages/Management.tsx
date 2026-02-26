import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/query-client';

// CRUD Components
import { CrudTable } from '@/components/crud/CrudTable';
import { CrudUpsertDialog } from '@/components/crud/CrudUpsertDialog';
import { CrudDeleteDialog } from '@/components/crud/CrudDeleteDialog';

// Hooks & Data
import {
  useStaff,
  useCreateStaff,
  useUpdateStaff,
  useToggleStaffStatus,
  useDeleteStaff,
  Staff,
} from '@/hooks/useStaff';
import { getStaffColumns } from '@/components/management/staff.columns';
import { HUBS } from '@/lib/constants';

// Schema
const staffFormSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum([
    'ADMIN',
    'MANAGER',
    'WAREHOUSE_IMPHAL',
    'WAREHOUSE_DELHI',
    'OPS',
    'INVOICE',
    'SUPPORT',
  ]),
  hub_id: z.string().optional(),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

// Sentinel value for "no hub" / global access
const GLOBAL_HUB_VALUE = '__GLOBAL__';

const defaultFormValues: StaffFormValues = {
  full_name: '',
  email: '',
  role: 'OPS',
  hub_id: GLOBAL_HUB_VALUE,
};

export const Management: React.FC = () => {
  // Data fetching
  const { data: staff = [], isLoading } = useStaff();
  const createMutation = useCreateStaff();
  const updateMutation = useUpdateStaff();
  const toggleStatusMutation = useToggleStaffStatus();
  const deleteMutation = useDeleteStaff();

  // Dialog state
  const [upsertOpen, setUpsertOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [activeRow, setActiveRow] = useState<Staff | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<Staff | null>(null);

  // Table columns with callbacks
  const columns = useMemo(
    () =>
      getStaffColumns({
        onEdit: (row) => {
          setMode('edit');
          setActiveRow(row);
          setUpsertOpen(true);
        },
        onToggleStatus: (row) => {
          toggleStatusMutation.mutate({
            id: row.id,
            isActive: row.is_active,
          });
        },
        onDelete: (row) => {
          setRowToDelete(row);
          setDeleteOpen(true);
        },
      }),
    [toggleStatusMutation]
  );

  // Form default values for editing
  const formDefaultValues: StaffFormValues = activeRow
    ? {
        full_name: activeRow.full_name,
        email: activeRow.email,
        role: activeRow.role,
        hub_id: activeRow.hub_id || GLOBAL_HUB_VALUE,
      }
    : defaultFormValues;

  // Handlers
  const handleUpsert = async (values: StaffFormValues) => {
    // Convert sentinel value back to null/undefined for database
    const hubId = values.hub_id === GLOBAL_HUB_VALUE ? undefined : values.hub_id;

    if (mode === 'create') {
      await createMutation.mutateAsync({
        full_name: values.full_name,
        email: values.email,
        role: values.role,
        hub_id: hubId,
      });
    } else if (activeRow) {
      await updateMutation.mutateAsync({
        id: activeRow.id,
        data: {
          full_name: values.full_name,
          email: values.email,
          role: values.role,
          hub_id: hubId || null,
        },
      });
    }
    setActiveRow(null);
  };

  const handleDelete = async () => {
    if (!rowToDelete) return;
    await deleteMutation.mutateAsync(rowToDelete.id);
    setRowToDelete(null);
  };

  // --- SUPER ADMIN LOGIC ---
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'OPS',
    hubCode: '',
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: createUserForm,
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success('User created successfully!');
      setCreateUserOpen(false);
      // Reset form
      setCreateUserForm({
        email: '',
        password: '',
        fullName: '',
        role: 'OPS',
        hubCode: '',
      });
      // Refresh list
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    } catch (error) {
      console.error('Create user failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff & Hubs</h1>
          <p className="text-muted-foreground text-sm">Manage access control and personnel.</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setCreateUserOpen(true)} variant="destructive">
            <Plus className="w-4 h-4 mr-2" /> Super Admin: Create User
          </Button>
        )}
      </div>

      {/* Table with CRUD */}
      <CrudTable
        columns={columns}
        data={staff}
        searchKey="full_name"
        searchPlaceholder="Search staff..."
        isLoading={isLoading}
        emptyMessage="No staff members found. Invite your first team member to get started."
        toolbar={
          <Button
            onClick={() => {
              setMode('create');
              setActiveRow(null);
              setUpsertOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Invite User
          </Button>
        }
      />

      {/* Super Admin Create User Modal */}
      <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Super Admin: Create User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                required
                value={createUserForm.email}
                onChange={(e) => setCreateUserForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                required
                value={createUserForm.password}
                onChange={(e) =>
                  setCreateUserForm((prev) => ({ ...prev, password: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                required
                value={createUserForm.fullName}
                onChange={(e) =>
                  setCreateUserForm((prev) => ({ ...prev, fullName: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={createUserForm.role}
                  onValueChange={(val) => setCreateUserForm((prev) => ({ ...prev, role: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="OPS">Operations</SelectItem>
                    <SelectItem value="INVOICE">Finance</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hub Code (Optional)</Label>
                <Input
                  placeholder="e.g. IMF, DEL"
                  value={createUserForm.hubCode}
                  onChange={(e) =>
                    setCreateUserForm((prev) => ({ ...prev, hubCode: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setCreateUserOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create User</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upsert Dialog */}
      <CrudUpsertDialog
        open={upsertOpen}
        onOpenChange={setUpsertOpen}
        mode={mode}
        title={mode === 'create' ? 'Invite New Staff' : 'Edit Staff Member'}
        description={
          mode === 'create'
            ? 'Add a new team member to your organization.'
            : 'Update staff member information.'
        }
        schema={staffFormSchema}
        defaultValues={formDefaultValues}
        onSubmit={handleUpsert}
        submitLabel={mode === 'create' ? 'Send Invite' : 'Save Changes'}
      >
        {(form) => (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Alice Johnson" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g. alice@taccargo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="OPS">Operations Staff</SelectItem>
                        <SelectItem value="WAREHOUSE_IMPHAL">Warehouse (Imphal)</SelectItem>
                        <SelectItem value="WAREHOUSE_DELHI">Warehouse (Delhi)</SelectItem>
                        <SelectItem value="INVOICE">Finance</SelectItem>
                        <SelectItem value="SUPPORT">Support</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="ADMIN">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hub_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Hub</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Global / HQ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={GLOBAL_HUB_VALUE}>Global / HQ</SelectItem>
                        {Object.values(HUBS).map((h) => (
                          <SelectItem key={h.id} value={h.id}>
                            {h.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
      </CrudUpsertDialog>

      {/* Delete Confirmation Dialog */}
      <CrudDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Remove staff member?"
        description={`This will remove "${rowToDelete?.full_name ?? ''}" from your organization. They will lose access to all systems.`}
        onConfirm={handleDelete}
        confirmLabel="Remove"
      />
    </div>
  );
};
