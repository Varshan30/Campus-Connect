import { useState } from 'react';
import { FoundItem, locationLabels, categoryLabels } from '@/lib/data';
import { notifyAll } from '@/lib/notifications';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GradientButton } from '@/components/ui/gradient-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Package } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface ClaimDialogProps {
  item: FoundItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClaimSubmitted?: (itemId: string) => void;
}

const ClaimDialog = ({ item, open, onOpenChange, onClaimSubmitted }: ClaimDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const auth = getAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast({
        title: 'Missing information',
        description: 'Please fill in your name and email.',
        variant: 'destructive',
      });
      return;
    }

    if (!item) return;

    setIsSubmitting(true);
    
    try {
      // Save claim to Firestore
      await addDoc(collection(db, 'claims'), {
        itemId: item.id,
        itemName: item.name,
        claimerName: formData.name,
        claimerEmail: formData.email,
        claimerPhone: formData.phone,
        identificationDescription: formData.description,
        claimedAt: new Date().toISOString(),
        status: 'pending',
        userId: auth.currentUser?.uid || null,
      });

      // Update item status to pending
      await updateDoc(doc(db, 'foundItems', item.id), {
        status: 'pending',
      });

      // Create notification
      await addDoc(collection(db, 'notifications'), {
        type: 'claim',
        message: `New claim submitted for "${item.name}" by ${formData.name}`,
        itemId: item.id,
        userId: auth.currentUser?.uid || null,
        read: false,
        createdAt: new Date().toISOString(),
      });

      // Send email/Telegram notification via Formspree
      await notifyAll({
        type: 'claim',
        itemName: item.name,
        itemCategory: categoryLabels[item.category] || item.category,
        itemLocation: locationLabels[item.location] || item.location,
        userName: formData.name,
        userEmail: formData.email,
        userPhone: formData.phone,
        description: formData.description,
        timestamp: new Date().toLocaleString(),
      });

      setIsSuccess(true);
      
      toast({
        title: 'Claim submitted!',
        description: 'We will contact you shortly to verify your claim.',
      });

      // Notify parent component
      if (onClaimSubmitted) {
        onClaimSubmitted(item.id);
      }

      // Reset after showing success
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({ name: '', email: '', phone: '', description: '' });
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: 'There was an error submitting your claim. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {isSuccess ? (
          <div className="py-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              Claim Submitted!
            </h3>
            <p className="text-sm text-muted-foreground">
              We'll review your claim and contact you soon.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Claim This Item
              </DialogTitle>
              <DialogDescription>
                Fill in your details to claim <strong>{item.name}</strong> found at {locationLabels[item.location]}.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@campus.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">How can you identify this item?</Label>
                <Textarea
                  id="description"
                  placeholder="Describe any unique features or markings..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <GradientButton type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                </GradientButton>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClaimDialog;
