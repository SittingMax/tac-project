import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { useStore } from '../../store';
import { HubLocation } from '../../types';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Shield,
  Clock,
  LogIn,
  Box,
  Wifi,
  Loader2,
} from 'lucide-react';
import { AnimatedThemeToggler } from '../../components/ui/animated-theme-toggler';
import { gsap } from '@/lib/gsap';

export const Login: React.FC = () => {
  const { signIn, isAuthenticated, isLoading, error, clearError, user } = useAuthStore();
  const { login: legacyLogin, setTheme } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Animation refs
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const formItemsRef = useRef<HTMLDivElement>(null);

  // Entrance animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Card entrance
      tl.fromTo(
        cardRef.current,
        { opacity: 0, y: 24, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7 }
      );

      // Image panel
      tl.fromTo(
        imageRef.current,
        { opacity: 0, scale: 1.05 },
        { opacity: 1, scale: 1, duration: 0.8 },
        '-=0.5'
      );

      // Form items stagger
      if (formItemsRef.current) {
        tl.fromTo(
          formItemsRef.current.children,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 },
          '-=0.4'
        );
      }
    }, cardRef);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      legacyLogin({
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: user.role,
        assignedHub: (user.hubCode as HubLocation) ?? undefined,
        active: user.isActive,
        lastLogin: new Date().toISOString(),
      });
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate, legacyLogin]);

  // Clear error when inputs change
  useEffect(() => {
    if (error) clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only trigger on input changes, not on error
  }, [email, password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    const result = await signIn(email, password);

    if (result.success) {
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        toast.success(`Welcome back, ${currentUser.fullName} !`);
      }
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen antialiased selection:bg-primary/20 text-foreground font-sans">
      {/* Gradient Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-muted/50 to-background dark:from-background dark:via-primary/5 dark:to-background transition-colors duration-500">
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-none bg-primary/20 sm:bg-primary/10 blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] rounded-none bg-primary/10 sm:bg-primary/5 blur-[100px] animate-pulse"
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Top Controls */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-5 sm:p-6">
        <button
          onClick={() => navigate('/')}
          className="group flex items-center gap-2 rounded-none border border-border/40 bg-background/50 backdrop-blur-md px-3 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-background/80 hover:border-border transition-all"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </button>
        <AnimatedThemeToggler onThemeChange={setTheme} />
      </div>

      <main className="relative flex min-h-screen items-center justify-center p-4 sm:p-6">
        {/* Card */}
        <div ref={cardRef} className="relative z-10 w-full max-w-3xl opacity-0">
          <div className="group relative overflow-hidden rounded-none border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/10 backdrop-blur-lg shadow-2xl shadow-black/10 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 hover:border-black/15 dark:hover:border-white/20 hover:ring-black/10 dark:hover:ring-white/20">
            {/* Top hairline */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/20 to-transparent" />

            {/* Split: Image + Form */}
            <div className="relative flex flex-col sm:flex-row">
              {/* Image (Left) */}
              <div
                ref={imageRef}
                className="relative w-full sm:w-1/2 h-40 sm:h-auto sm:min-h-[320px] overflow-hidden opacity-0"
              >
                <img
                  src="/tac-hero-bg.jpeg"
                  alt="TAC logistics"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[8s] ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/30 to-transparent" />

                {/* Overlay badge */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-none border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <div className="flex h-5 w-5 items-center justify-center rounded-none bg-primary/30 text-primary">
                      <Wifi className="h-3 w-3" />
                    </div>
                    <span className="font-mono tracking-widest uppercase">System Online</span>
                  </div>
                  <span className="text-[11px] text-white/60">TAC v4.1</span>
                </div>
              </div>

              {/* Form (Right) */}
              <div className="p-5 sm:p-8 w-full sm:w-1/2">
                <div ref={formItemsRef}>
                  {/* Logo */}
                  <div className="mb-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group/logo">
                      <div className="grid h-10 w-10 place-items-center text-foreground/80 bg-foreground/5 border border-foreground/10 rounded-none shadow-sm group-hover/logo:bg-foreground/10 transition-colors">
                        <Box className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-mono tracking-widest text-muted-foreground uppercase">
                          TAC
                        </div>
                        <div className="text-[22px] tracking-tight font-semibold leading-tight text-foreground">
                          Cargo
                        </div>
                      </div>
                    </Link>
                    <div className="text-[10px] font-mono text-muted-foreground/60 tracking-wider">
                      v4.1
                    </div>
                  </div>

                  {/* Heading */}
                  <div className="mb-7">
                    <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
                      Welcome back
                    </h1>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Sign in to your logistics dashboard.
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div
                      data-testid="login-error-message"
                      role="alert"
                      aria-live="polite"
                      className="mb-5 p-3 rounded-none border border-destructive/30 bg-destructive/10 text-destructive dark:text-red-300 text-sm backdrop-blur-sm"
                    >
                      {error}
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleLogin} className="space-y-5">
                    {/* Email */}
                    <div className="space-y-2">
                      <label
                        htmlFor="login-email"
                        className="block text-xs font-mono uppercase tracking-wider text-muted-foreground"
                      >
                        Email
                      </label>
                      <div className="group/input relative flex items-center rounded-none border border-border bg-foreground/[0.03] px-3 py-3 transition-all hover:border-border/80 focus-within:border-primary/40 focus-within:bg-foreground/[0.05] focus-within:shadow-[0_0_0_3px] focus-within:shadow-primary/10">
                        <Mail className="mr-2.5 h-4 w-4 text-muted-foreground shrink-0" />
                        <input
                          id="login-email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          placeholder="you@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                          data-testid="login-email-input"
                          aria-describedby={error ? 'login-error-message' : undefined}
                          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <label
                        htmlFor="login-password"
                        className="block text-xs font-mono uppercase tracking-wider text-muted-foreground"
                      >
                        Password
                      </label>
                      <div className="group/input relative flex items-center rounded-none border border-border bg-foreground/[0.03] px-3 py-3 transition-all hover:border-border/80 focus-within:border-primary/40 focus-within:bg-foreground/[0.05] focus-within:shadow-[0_0_0_3px] focus-within:shadow-primary/10">
                        <Lock className="mr-2.5 h-4 w-4 text-muted-foreground shrink-0" />
                        <input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading}
                          data-testid="login-password-input"
                          aria-describedby={error ? 'login-error-message' : undefined}
                          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="ml-2 grid h-8 w-8 shrink-0 place-items-center rounded-none text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={isLoading}
                        data-testid="login-submit-button"
                        className="group/btn relative w-full inline-flex items-center justify-center rounded-none bg-primary h-12 px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 outline-none ring-1 ring-primary/30 transition-all hover:shadow-xl hover:shadow-primary/35 hover:brightness-110 hover:-translate-y-px active:translate-y-0 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="absolute inset-0 -z-10 rounded-none bg-primary/20 opacity-0 blur-xl transition-opacity group-hover/btn:opacity-100" />
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          <>
                            <LogIn className="mr-2 h-4 w-4" />
                            Sign in
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Bottom footer */}
            <div className="flex items-center justify-between rounded-none border-t border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-6 py-3 text-[11px] text-muted-foreground dark:text-white/55">
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" />
                <span>Secured access</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                <span>Contact admin for access</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
