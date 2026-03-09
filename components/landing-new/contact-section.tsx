import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Check, Loader2, Send, AlertCircle, Phone, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getOrCreateDefaultOrg } from '@/lib/org-helper';
import { logger } from '@/lib/logger';

export function ContactSection() {
  const [name, setName] = useState('');
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
      const orgId = await getOrCreateDefaultOrg();
      const { error: insertError } = await supabase.from('contact_messages').insert({
        org_id: orgId,
        name,
        phone,
        message,
        status: 'unread',
      });

      if (insertError) throw insertError;

      setName('');
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
    <section id="contact" className="py-24 lg:py-32">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-muted/50 border border-border/50 text-xs font-mono font-bold text-primary mb-6 uppercase tracking-widest">
            Get in Touch
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tight">
            Ready to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
              Elevate
            </span>{' '}
            your Logistics?
          </h2>
          <p className="text-lg text-muted-foreground font-mono leading-relaxed">
            Our team of experts is ready to design a custom supply chain solution for your business.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 p-8 md:p-12 rounded-none bg-card border border-border/50 shadow-xl shadow-black/5 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-none blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
          {/* Contact Info */}
          <div className="space-y-8 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-mono font-bold uppercase tracking-widest text-foreground text-sm mb-1">
                  Corporate Headquarters
                </h4>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                  Guwahati, Assam
                  <br />
                  Northeast India Logistics Hub
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-mono font-bold uppercase tracking-widest text-foreground text-sm mb-1">
                  Contact Numbers
                </h4>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                  Sales: +91 98765 43210
                  <br />
                  Support: +91 98765 43211
                </p>
              </div>
            </div>

            <div className="p-6 rounded-none bg-muted/50 border border-border/50 backdrop-blur-sm">
              <h4 className="font-mono font-bold uppercase tracking-widest text-foreground text-sm mb-3">
                Operating Hours
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground font-mono">
                <li>Monday - Saturday: 9:00 AM - 8:00 PM</li>
                <li>Sunday: 10:00 AM - 4:00 PM</li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div>
              <Label
                htmlFor="name"
                className="text-xs font-mono font-bold uppercase tracking-widest"
              >
                Full Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="h-12 rounded-none border-border/50 bg-background shadow-sm focus-visible:ring-primary/20 font-mono text-sm"
              />
            </div>
            <div>
              <Label
                htmlFor="phone"
                className="text-xs font-mono font-bold uppercase tracking-widest"
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
                className="h-12 rounded-none border-border/50 bg-background shadow-sm focus-visible:ring-primary/20 font-mono text-sm"
              />
            </div>
            <div>
              <Label
                htmlFor="message"
                className="text-xs font-mono font-bold uppercase tracking-widest"
              >
                Message
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about your logistics needs..."
                required
                className="w-full min-h-[120px] rounded-none border border-border/50 bg-background shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 resize-none p-4 font-mono text-sm"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-none border border-destructive/20 font-mono">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-primary text-primary-foreground rounded-none font-bold uppercase tracking-widest text-xs hover:scale-[1.02] transition-all duration-300 shadow-[0_0_20px_-5px_var(--primary)] mt-2"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </span>
              ) : isSubmitted ? (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Message Sent
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Send Message
                </span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
