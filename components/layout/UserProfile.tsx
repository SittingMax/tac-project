import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useStore } from '../../store';
import { useAuthStore } from '../../store/authStore';
import { logger } from '@/lib/logger';
import { LogOut, User, Settings, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProfileDialog } from '../domain/ProfileDialog';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UserProfileProps {
  collapsed?: boolean;
  className?: string;
}

interface User {
  name: string;
  email: string;
  role: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ collapsed, className }) => {
  const { user: appUser, logout: legacyLogout } = useStore();
  const { user: authUser, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  // Combine user data (prefer auth store but fallback to app store)
  const user = authUser || appUser;

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
      legacyLogout();
      toast(
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-none bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 overflow-hidden">
            <span className="absolute inset-0 inline-flex h-full w-full rounded-none bg-primary/40 opacity-75 animate-ping"></span>
            <img
              src="/lottie/logout-success.gif"
              alt="Logout Success"
              className="w-8 h-8 relative z-10 object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-mono font-bold uppercase tracking-widest text-xs text-foreground">
              Logged Out
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              You have been securely signed out.
            </span>
          </div>
        </div>,
        {
          className: 'rounded-none border border-border/50 bg-background shadow-xl p-4',
          duration: 4000,
        }
      );
    } catch (error) {
      logger.error('UserProfile', 'Sign out failed', { error });
      toast.error('Failed to sign out', {
        className:
          'rounded-none border border-destructive/50 bg-background shadow-xl font-mono uppercase tracking-widest text-xs',
      });
    }
  };

  // Get display name safely handling both User and StaffUser types
  const getDisplayName = () => {
    if ('fullName' in user) return user.fullName;
    if ('name' in user) return user.name;
    return 'User';
  };

  const displayName = getDisplayName();

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayEmail = user.email || '';
  const displayRole = (user.role || '').replace('_', ' ');
  const avatarUrl = 'avatarUrl' in user ? user.avatarUrl : undefined;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'flex items-center gap-2 p-2 rounded-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full border border-transparent hover:border-sidebar-border/50 group',
              collapsed ? 'justify-center' : 'justify-between',
              className
            )}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Avatar className="h-9 w-9 border border-border/40 shrink-0 shadow-sm transition-transform group-hover:scale-105">
                <AvatarImage src={avatarUrl || ''} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>

              {!collapsed && (
                <div className="flex flex-col items-start text-left min-w-0">
                  <span className="text-sm font-bold truncate w-full text-foreground leading-tight group-hover:text-primary transition-colors">
                    {displayName}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate w-full leading-tight font-medium">
                    {displayRole}
                  </span>
                </div>
              )}
            </div>

            {!collapsed && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0 group-hover:text-primary transition-colors" />
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-60 mb-2 p-2"
          align={collapsed ? 'center' : 'start'}
          side="right"
          sideOffset={collapsed ? 20 : 8}
          forceMount
        >
          <DropdownMenuLabel className="font-normal px-2 py-2">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-bold leading-none text-primary">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground truncate">{displayEmail}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuGroup>
            <DropdownMenuItem
              className="cursor-pointer py-2.5"
              onClick={() => setShowProfileDialog(true)}
            >
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Profile</span>
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer py-2.5"
              onClick={() => navigate('/settings')}
            >
              <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Settings</span>
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 py-2.5"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileDialog open={showProfileDialog} onOpenChange={setShowProfileDialog} />
    </>
  );
};
