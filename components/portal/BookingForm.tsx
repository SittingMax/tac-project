import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Package, Send, Plus, MapPin, User, Phone } from 'lucide-react';

export const BookingForm: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [sender, setConsignor] = useState({ name: '', phone: '', address: '' });
    const [receiver, setConsignee] = useState({ name: '', phone: '', address: '' });
    const [whatsapp, setWhatsapp] = useState('');

    const [packages, setPackages] = useState([
        { length: 10, width: 10, height: 10, weight: 1, quantity: 1 }
    ]);

    const addPackage = () => {
        setPackages([...packages, { length: 10, width: 10, height: 10, weight: 1, quantity: 1 }]);
    };

    const updatePackage = (index: number, field: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        const newPackages = [...packages];
        newPackages[index] = { ...newPackages[index], [field]: numValue };
        setPackages(newPackages);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.from('bookings').insert({
                consignor_details: sender,
                consignee_details: receiver,
                whatsapp_number: whatsapp,
                volume_matrix: packages,
                status: 'PENDING'
            });

            if (error) throw error;

            setSuccess(true);
            toast.success('Booking request submitted successfully!');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error('Error submitting booking:', err);
            toast.error(err.message || 'Failed to submit booking');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Card className="p-8 text-center bg-card/50 border-border animate-in fade-in zoom-in">
                <div className="w-16 h-16 rounded-none bg-status-success/20 flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-status-success" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Booking Received!</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    We have received your booking request. Our operations team will contact you shortly on your WhatsApp number to confirm pickup details.
                </p>
                <Button onClick={() => setSuccess(false)} variant="outline">
                    Book Another Shipment
                </Button>
            </Card>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Consignor Details */}
            <Card className="p-6 bg-card/80 border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" /> Consignor Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Full Name *</label>
                        <Input
                            required
                            value={sender.name}
                            onChange={e => setConsignor({ ...sender, name: e.target.value })}
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Phone Number *</label>
                        <Input
                            required
                            value={sender.phone}
                            onChange={e => setConsignor({ ...sender, phone: e.target.value })}
                            placeholder="+91 9876543210"
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-foreground">Pickup Address *</label>
                        <Input
                            required
                            value={sender.address}
                            onChange={e => setConsignor({ ...sender, address: e.target.value })}
                            placeholder="123 Origin St, City, State"
                        />
                    </div>
                </div>
            </Card>

            {/* Consignee Details */}
            <Card className="p-6 bg-card/80 border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-status-info" /> Consignee Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Full Name *</label>
                        <Input
                            required
                            value={receiver.name}
                            onChange={e => setConsignee({ ...receiver, name: e.target.value })}
                            placeholder="Jane Smith"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Phone Number *</label>
                        <Input
                            required
                            value={receiver.phone}
                            onChange={e => setConsignee({ ...receiver, phone: e.target.value })}
                            placeholder="+91 9876543211"
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-foreground">Delivery Address *</label>
                        <Input
                            required
                            value={receiver.address}
                            onChange={e => setConsignee({ ...receiver, address: e.target.value })}
                            placeholder="456 Destination Ave, City, State"
                        />
                    </div>
                </div>
            </Card>

            {/* Package Details */}
            <Card className="p-6 bg-card/80 border-border">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Package className="w-5 h-5 text-status-warning" /> Volume Matrix
                    </h3>
                    <Button type="button" variant="outline" size="sm" onClick={addPackage}>
                        <Plus className="w-4 h-4 mr-2" /> Add Package
                    </Button>
                </div>

                <div className="space-y-4">
                    {packages.map((pkg, idx) => (
                        <div key={idx} className="grid grid-cols-5 gap-3 p-4 bg-muted/30 rounded-none">
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Qty</label>
                                <Input type="number" min="1" value={pkg.quantity} onChange={e => updatePackage(idx, 'quantity', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">L (cm)</label>
                                <Input type="number" min="1" value={pkg.length} onChange={e => updatePackage(idx, 'length', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">W (cm)</label>
                                <Input type="number" min="1" value={pkg.width} onChange={e => updatePackage(idx, 'width', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">H (cm)</label>
                                <Input type="number" min="1" value={pkg.height} onChange={e => updatePackage(idx, 'height', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Wt (kg)</label>
                                <Input type="number" min="0.1" step="0.1" value={pkg.weight} onChange={e => updatePackage(idx, 'weight', e.target.value)} />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Contact Preferences */}
            <Card className="p-6 bg-card/80 border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-status-success" /> Updates & Confirmation
                </h3>
                <div className="space-y-2 max-w-md">
                    <label className="text-sm font-medium text-foreground">WhatsApp Number for Updates *</label>
                    <Input
                        required
                        value={whatsapp}
                        onChange={e => setWhatsapp(e.target.value)}
                        placeholder="+91 9876543210"
                    />
                    <p className="text-xs text-muted-foreground mt-1">We will send tracking updates and booking confirmation to this number.</p>
                </div>
            </Card>

            <div className="flex justify-end pt-4">
                <Button
                    type="submit"
                    disabled={loading}
                    size="lg"
                    className="w-full md:w-auto px-8 py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wide"
                >
                    {loading ? 'Submitting...' : 'Submit Booking Request'}
                </Button>
            </div>
        </form>
    );
};
