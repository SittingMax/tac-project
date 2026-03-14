import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  LogIn,
  Wifi,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { TacLogo } from '@/components/shared/tac-logo';
import { AnimatedThemeToggler } from '../../components/ui/animated-theme-toggler';
import { Label } from '@/components/ui/label';
import { getDefaultRouteForRole } from '@/lib/access-control';
import { gsap } from '@/lib/gsap';

export const Login: React.FC = () => {
  const { signIn, isAuthenticated, isLoading, error, clearError, user } = useAuthStore();
  const { login: legacyLogin, setTheme } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  // Animation refs
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const formItemsRef = useRef<HTMLDivElement>(null);
  const redirectState = location.state as
    | {
        from?: {
          pathname?: string;
          search?: string;
          hash?: string;
        };
      }
    | undefined;
  const rememberedEmailKey = 'tac-remembered-login-email';
  const rememberedEmailExpiryKey = 'tac-remembered-login-email-expiry';

  // Entrance animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.inOut' } });

      // Card entrance (sharp reveal)
      tl.fromTo(
        cardRef.current,
        { opacity: 0, y: 40, clipPath: 'inset(100% 0% 0% 0%)' },
        { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8 }
      );

      // Image panel (sharp left-to-right reveal)
      tl.fromTo(
        imageRef.current,
        { opacity: 0, x: -20, clipPath: 'inset(0% 100% 0% 0%)' },
        { opacity: 1, x: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8 },
        '-=0.6'
      );

      // Form items stagger (sharp right-to-left slide)
      if (formItemsRef.current) {
        tl.fromTo(
          formItemsRef.current.children,
          { opacity: 0, x: 20 },
          { opacity: 1, x: 0, duration: 0.6, stagger: 0.1 },
          '-=0.6'
        );
      }
    }, cardRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem(rememberedEmailKey);
    const rememberedEmailExpiry = localStorage.getItem(rememberedEmailExpiryKey);
    const hasValidRememberedEmail =
      rememberedEmail && rememberedEmailExpiry && Number(rememberedEmailExpiry) > Date.now();

    if (hasValidRememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
      return;
    }

    localStorage.removeItem(rememberedEmailKey);
    localStorage.removeItem(rememberedEmailExpiryKey);
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

      const requestedPath =
        redirectState?.from?.pathname && redirectState.from.pathname !== '/login'
          ? `${redirectState.from.pathname}${redirectState.from.search ?? ''}${redirectState.from.hash ?? ''}`
          : getDefaultRouteForRole(user.role);

      navigate(requestedPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate, legacyLogin, redirectState]);

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
      if (rememberMe) {
        localStorage.setItem(rememberedEmailKey, email.trim());
        localStorage.setItem(
          rememberedEmailExpiryKey,
          String(Date.now() + 30 * 24 * 60 * 60 * 1000)
        );
      } else {
        localStorage.removeItem(rememberedEmailKey);
        localStorage.removeItem(rememberedEmailExpiryKey);
      }

      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        toast(
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-md bg-status-success/20 border border-status-success/30 flex items-center justify-center shrink-0 overflow-hidden">
              <span className="absolute inset-0 inline-flex h-full w-full rounded-md bg-status-success/40 opacity-75 animate-ping"></span>
              <img
                src="/lottie/login-success.gif"
                alt="Success"
                className="w-8 h-8 relative z-10 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-xs text-foreground">Login Successful</span>
              <span className="text-[10px] font-mono text-muted-foreground">
                Welcome back, {currentUser.fullName}!
              </span>
            </div>
          </div>,
          {
            className: 'rounded-md border border-border/50 bg-background shadow-xl p-4',
            duration: 4000,
          }
        );
      }
    } else {
      toast.error(result.error || 'Login failed', {
        className: 'rounded-md border border-destructive/50 bg-background shadow-xl text-xs',
      });
    }
  };

  return (
    <div className="min-h-screen antialiased selection:bg-primary/20 text-foreground font-sans">
      {/* Gradient Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-muted/50 to-background dark:from-background dark:via-primary/5 dark:to-background transition-colors duration-500">
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full bg-primary/20 sm:bg-primary/10 blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] rounded-full bg-primary/10 sm:bg-primary/5 blur-[100px] animate-pulse"
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Top Controls */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 sm:p-6">
        <button
          onClick={() => navigate('/')}
          className="group flex items-center gap-2 rounded-md border border-border/40 bg-background/50 backdrop-blur-md px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-background/80 hover:border-border transition-all"
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
          <div className="group relative overflow-hidden rounded-lg border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/10 backdrop-blur-lg shadow-2xl shadow-black/10 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 hover:border-black/15 dark:hover:border-white/20 hover:ring-black/10 dark:hover:ring-white/20">
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
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-md border border-white/10 bg-black/30 px-4 py-2 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/30 text-primary">
                      <Wifi className="h-3 w-3" />
                    </div>
                    <span className="text-xs font-medium tracking-tight">System Online</span>
                  </div>
                  <span className="text-[11px] text-white/60">TAC v4.1</span>
                </div>
              </div>

              {/* Form (Right) */}
              <div className="p-4 sm:p-8 w-full sm:w-1/2">
                <div ref={formItemsRef}>
                  {/* Logo */}
                  <div className="mb-6 flex items-center justify-between">
                    <TacLogo size="lg" showSubtitle />
                    <div className="text-[10px] font-mono text-muted-foreground/60 tracking-wider">
                      v4.1
                    </div>
                  </div>

                  {/* Heading */}
                  <div className="mb-7">
                    <h1 className="text-[26px] font-bold tracking-tight text-foreground uppercase">
                      Welcome back
                    </h1>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Sign in to your logistics dashboard.
                    </p>
                  </div>

                  {/* Error Message - Enhanced Design */}
                  {error && (
                    <div
                      data-testid="login-error-message"
                      role="alert"
                      aria-live="polite"
                      className="mb-5 flex items-start gap-3 p-4 rounded-md border border-destructive/30 bg-destructive/10 text-destructive dark:text-destructive text-sm backdrop-blur-sm animate-in fade-in slide-in-from-top-2"
                    >
                      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold">Authentication failed</p>
                        <p className="text-destructive/80 text-[10px] font-mono mt-0.5">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* Email Field - Enhanced */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="login-email"
                        className="block text-xs font-semibold text-foreground"
                      >
                        Email address
                      </Label>
                      <div
                        className={`group/input relative flex items-center rounded-md border bg-background px-4 h-12 transition-all duration-200 ${
                          focusedField === 'email'
                            ? 'border-primary ring-2 ring-primary/10'
                            : 'border-border hover:border-border/80'
                        } ${error ? 'border-destructive/50 ring-1 ring-destructive/20' : ''}`}
                      >
                        <Mail
                          className={`mr-3 h-5 w-5 shrink-0 transition-colors ${
                            focusedField === 'email' ? 'text-primary' : 'text-muted-foreground'
                          }`}
                        />
                        <input
                          id="login-email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          placeholder="name@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField(null)}
                          disabled={isLoading}
                          data-testid="login-email-input"
                          aria-describedby={error ? 'login-error-message' : undefined}
                          className="w-full bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50"
                        />
                        {email && <Check className="ml-2 h-4 w-4 text-status-success shrink-0" />}
                      </div>
                    </div>

                    {/* Password Field - Enhanced */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="login-password"
                          className="block text-xs font-semibold text-foreground"
                        >
                          Password
                        </Label>
                        <a
                          href="mailto:support@tac-cargo.com?subject=Password%20Reset%20Request"
                          className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
                        >
                          Forgot password?
                        </a>
                      </div>
                      <div
                        className={`group/input relative flex items-center rounded-md border bg-background px-4 h-12 transition-all duration-200 ${
                          focusedField === 'password'
                            ? 'border-primary ring-2 ring-primary/10'
                            : 'border-border hover:border-border/80'
                        } ${error ? 'border-destructive/50 ring-1 ring-destructive/20' : ''}`}
                      >
                        <Lock
                          className={`mr-3 h-5 w-5 shrink-0 transition-colors ${
                            focusedField === 'password' ? 'text-primary' : 'text-muted-foreground'
                          }`}
                        />
                        <input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField(null)}
                          disabled={isLoading}
                          data-testid="login-password-input"
                          aria-describedby={error ? 'login-error-message' : undefined}
                          className="w-full bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="ml-2 grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Remember Me & Submit */}
                    <div className="space-y-4">
                      {/* Remember Me Checkbox */}
                      <Label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            disabled={isLoading}
                            className="peer sr-only"
                          />
                          <div className="w-5 h-5 rounded-sm border border-border bg-background flex items-center justify-center transition-colors peer-checked:bg-primary peer-checked:border-primary peer-disabled:opacity-50 group-hover:border-primary/50">
                            {rememberMe && (
                              <Check className="w-3.5 h-3.5 text-primary-foreground" />
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                          Remember email for 30 days
                        </span>
                      </Label>

                      {/* Submit Button - Enhanced */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        data-testid="login-submit-button"
                        className="group/btn relative w-full inline-flex items-center justify-center rounded-md bg-primary h-12 px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 outline-none transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 overflow-hidden"
                      >
                        <div className="absolute inset-0 h-full w-full scale-0 rounded-md transition-all duration-300 ease-out group-hover/btn:scale-100 group-hover/btn:bg-primary-foreground/10"></div>
                        <span className="relative z-10 flex items-center">
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Authenticating...
                            </>
                          ) : (
                            <>
                              <LogIn className="mr-2 h-4 w-4" />
                              Sign in to Dashboard
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Bottom footer - Enhanced */}
            <div className="flex items-center justify-between border-t border-border/50 bg-muted/30 px-6 py-3 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-status-success" />
                <span>256-bit SSL encrypted</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline">Need help?</span>
                <a
                  href="mailto:support@tac-cargo.com"
                  className="hover:text-foreground hover:underline transition-colors"
                >
                  Contact support
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
