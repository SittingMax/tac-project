import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useStore } from '../../store';
import { SizedDialog } from '@/components/ui-core/dialog/sized-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '@/components/ui/label';
import { Moon, Sun, Monitor, User as UserIcon } from 'lucide-react';
import { FormSection, FormGrid } from '@/components/ui-core';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileDialog: React.FC<ProfileDialogProps> = ({ open, onOpenChange }) => {
  const { user, updateProfile } = useAuthStore();
  const { theme, setTheme } = useStore();

  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);

  // Profile Form
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isUploading, setIsUploading] = useState(false);

  // Reset form when dialog opens or user changes
  React.useEffect(() => {
    if (open && user) {
      setFullName(user.fullName || '');
      setAvatarUrl(user.avatarUrl || '');
      setActiveTab('profile');
    }
  }, [open, user]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id || 'unknown'}/${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      logger.error('ProfileDialog', 'Upload error', { error });
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      await updateProfile({ fullName, avatarUrl });
      toast.success('Profile updated successfully');
      onOpenChange(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) return null;

  return (
    <SizedDialog open={open} onOpenChange={onOpenChange} title="Edit Profile" size="sm">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 py-4">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-2 border-primary/20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <FormSection icon={UserIcon} title="Personal Information">
            <FormGrid columns={1} className="gap-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Full Name
                </Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Avatar Image
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                    disabled={isUploading}
                  />
                  {isUploading && (
                    <span className="text-xs text-muted-foreground animate-pulse">Uploading...</span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Upload a PNG, JPG or GIF image (max 2MB)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium leading-none opacity-50">Email</Label>
                  <Input value={user.email} disabled className="bg-muted opacity-50" />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium leading-none opacity-50">Role</Label>
                  <Input value={user.role} disabled className="bg-muted opacity-50" />
                </div>
              </div>
            </FormGrid>
          </FormSection>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveProfile} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6 py-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Theme</h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center justify-center p-4 rounded-md border-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted'}`}
              >
                <Sun className="w-5 h-5 mb-2" />
                <span className="text-xs">Light</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center justify-center p-4 rounded-md border-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted'}`}
              >
                <Moon className="w-5 h-5 mb-2" />
                <span className="text-xs">Dark</span>
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center justify-center p-4 rounded-md border-2 transition-all ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted'}`}
              >
                <Monitor className="w-5 h-5 mb-2" />
                <span className="text-xs">System</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Theme settings are saved on this device for your workspace.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </SizedDialog>
  );
};
