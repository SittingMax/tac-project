import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { MapPin, Phone, Check, Send, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { FadeUp } from '@/components/motion/FadeUp';
import { LottieSlot } from './lottie-slot';

export function ContactSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('contact_messages').insert({
        name,
        email,
        phone,
        message,
        status: 'unread',
        archived: false,
        replied: false,
      });

      if (insertError) throw insertError;

      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setIsSubmitted(true);
      toast.success('Message sent successfully!');

      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to send message. Please try again.';
      logger.error('ContactSection', 'Error submitting form', { error: err });
      setError(errorMessage);
      toast.error('Failed to send message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="py-16 lg:py-24 bg-background text-foreground relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <FadeUp className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <LottieSlot
              src="/lottie/envelope.json"
              className="w-24 h-24 opacity-80"
              fallbackIcon={<Send className="h-10 w-10 text-primary opacity-50" />}
            />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-card border border-border text-xs font-semibold text-primary mb-6 shadow-sm">
            Get in Touch
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tight [text-wrap:balance]">
            Ready to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50 italic pr-2">
              Elevate
            </span>{' '}
            your Logistics?
          </h2>
          <p className="text-lg text-muted-foreground font-mono text-sm leading-relaxed [text-wrap:balance]">
            Share your shipment requirements here and the request will be routed into our contact
            inbox for follow-up by the operations team.
          </p>
        </FadeUp>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 p-8 md:p-12 rounded-md bg-card/50 border border-border shadow-xl relative overflow-hidden backdrop-blur-sm">
          {/* Subtly animated gradient inside card */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />

          {/* Contact Info */}
          <FadeUp delay={0.1} className="space-y-10 relative z-10">
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm">
                <MapPin className="w-7 h-7" strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm mb-2">Request Routing</h4>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                  Include your origin, destination, and cargo details so the team can review the
                  correct corridor and service requirements.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm">
                <Phone className="w-7 h-7" strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm mb-2">Response Channels</h4>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                  Add a working WhatsApp number and email address so the follow-up can happen on the
                  same details captured with this request.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-md bg-muted/30 border border-border/50 backdrop-blur-sm shadow-inner">
              <h4 className="font-semibold text-foreground text-sm mb-3">What to Include</h4>
              <ul className="space-y-2 text-sm text-muted-foreground font-mono">
                <li>Origin and destination cities</li>
                <li>Shipment size, weight, or package count</li>
                <li>Urgency, service expectations, or special handling notes</li>
              </ul>
            </div>

            <div className="p-6 rounded-md bg-primary/5 border-l-2 border-primary relative mt-8">
              <div className="absolute -top-4 right-4 text-primary/10 text-5xl font-serif leading-none italic select-none">
                "
              </div>
              <p className="text-sm italic text-muted-foreground mb-5 relative z-10 leading-relaxed [text-wrap:balance]">
                "Your message is stored directly in the team inbox from this form, so complete route
                and cargo details will help speed up the follow-up."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-primary border border-primary/50 flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-sm shadow-primary/30">
                  IN
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Inbox Workflow</p>
                  <p className="text-[10px] text-muted-foreground">Contact Requests</p>
                </div>
              </div>
            </div>
          </FadeUp>

          {/* Contact Form */}
          <FadeUp delay={0.2} className="relative z-10">
            <form onSubmit={handleSubmit} className="space-y-5 lg:pl-4">
              <div>
                <Label
                  htmlFor="name"
                  className="text-xs font-semibold text-muted-foreground mb-2 block"
                >
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="h-12 rounded-md border border-input bg-background/50 text-foreground shadow-sm focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 text-sm placeholder:text-muted-foreground/50 transition-all hover:bg-background"
                />
              </div>
              <div>
                <Label
                  htmlFor="email"
                  className="text-xs font-semibold text-muted-foreground mb-2 block"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@company.com"
                  required
                  className="h-12 rounded-md border border-input bg-background/50 text-foreground shadow-sm focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 text-sm placeholder:text-muted-foreground/50 transition-all hover:bg-background"
                />
              </div>
              <div>
                <Label
                  htmlFor="phone"
                  className="text-xs font-semibold text-muted-foreground mb-2 block"
                >
                  WhatsApp Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="h-12 rounded-md border border-input bg-background/50 text-foreground shadow-sm focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 text-sm placeholder:text-muted-foreground/50 transition-all hover:bg-background"
                />
              </div>
              <div>
                <Label
                  htmlFor="message"
                  className="text-xs font-semibold text-muted-foreground mb-2 block"
                >
                  Message
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your logistics needs..."
                  required
                  className="w-full min-h-[140px] rounded-md border border-input bg-background/50 text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 resize-y p-4 text-sm placeholder:text-muted-foreground/50 transition-all hover:bg-background"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="flex items-start gap-2 text-destructive text-sm bg-destructive/5 p-3 rounded-md border border-destructive/20"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-primary text-primary-foreground rounded-md font-semibold text-sm hover:-translate-y-0.5 transition-all duration-300 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 mt-4 disabled:opacity-70 disabled:hover:translate-y-0"
                aria-live="polite"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending...
                  </span>
                ) : isSubmitted ? (
                  <span className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Message Sent
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Send Message
                  </span>
                )}
              </Button>
            </form>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
