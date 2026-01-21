import { useState, useMemo, useRef } from 'react';
import { FoundItem, locationLabels, categoryLabels, ItemCategory } from '@/lib/data';
import { notifyAll } from '@/lib/notifications';
import { calculateMatchScore } from '@/lib/matching';
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
import { CheckCircle2, Package, ShieldCheck, Upload, X, Mail, Image as ImageIcon } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Security questions based on item category
const categorySecurityQuestions: Record<ItemCategory, { id: string; question: string; placeholder: string }[]> = {
  electronics: [
    { id: 'color', question: 'What is the color of the device?', placeholder: 'e.g., Space Gray, Silver, Black' },
    { id: 'caseColor', question: 'What is the color/type of the case (if any)?', placeholder: 'e.g., Clear case, Blue silicone, No case' },
    { id: 'damage', question: 'Are there any visible damages or scratches?', placeholder: 'e.g., Scratch on the back, Cracked corner, None' },
    { id: 'uniqueFeature', question: 'Any unique identifying marks or stickers?', placeholder: 'e.g., Logo sticker, Engraving, Custom skin' },
  ],
  books: [
    { id: 'bookColor', question: 'What is the cover color of the book?', placeholder: 'e.g., Blue hardcover, Red paperback' },
    { id: 'bookMarks', question: 'Any bookmarks or notes inside?', placeholder: 'e.g., Yellow sticky notes, Highlighter marks' },
    { id: 'ownerName', question: 'Is your name written anywhere in the book?', placeholder: 'e.g., Inside front cover, First page' },
  ],
  clothing: [
    { id: 'clothingColor', question: 'What is the primary color?', placeholder: 'e.g., Navy blue, Black and white stripes' },
    { id: 'clothingBrand', question: 'What is the brand?', placeholder: 'e.g., Nike, Adidas, Uniqlo' },
    { id: 'clothingSize', question: 'What size is it?', placeholder: 'e.g., Medium, Large, XL' },
  ],
  keys: [
    { id: 'keyCount', question: 'How many keys are on the keychain?', placeholder: 'e.g., 3 keys, 5 keys' },
    { id: 'keychainDesc', question: 'Describe any keychains or attachments', placeholder: 'e.g., Red lanyard, Bottle opener charm' },
    { id: 'keyType', question: 'What types of keys are included?', placeholder: 'e.g., Car key, Dorm key, Padlock key' },
  ],
  'id-cards': [
    { id: 'cardType', question: 'What type of ID card is it?', placeholder: 'e.g., Student ID, Employee badge, Library card' },
    { id: 'cardholderName', question: 'What name is on the card?', placeholder: 'Enter the full name on the card' },
    { id: 'cardExpiry', question: 'What is the expiration date or ID number prefix?', placeholder: 'e.g., Expires 2025, ID starts with 2023...' },
  ],
  accessories: [
    { id: 'accessoryColor', question: 'What is the primary color?', placeholder: 'e.g., Black, Rose gold, Navy blue' },
    { id: 'accessoryBrand', question: 'What is the brand (if known)?', placeholder: 'e.g., Ray-Ban, Apple, Fossil' },
    { id: 'accessoryFeature', question: 'Any unique features or damage?', placeholder: 'e.g., Scratched lens, Custom engraving, Broken clasp' },
  ],
  bags: [
    { id: 'bagColor', question: 'What is the bag color?', placeholder: 'e.g., Black, Gray with blue accents' },
    { id: 'bagBrand', question: 'What is the brand?', placeholder: 'e.g., Herschel, JanSport, Nike' },
    { id: 'bagContents', question: 'What items were inside the bag?', placeholder: 'e.g., Laptop, Notebooks, Water bottle' },
  ],
  other: [
    { id: 'itemColor', question: 'What is the primary color?', placeholder: 'Describe the main color' },
    { id: 'itemFeature', question: 'Any unique identifying features?', placeholder: 'Describe what makes this item yours' },
  ],
};

interface ClaimDialogProps {
  item: FoundItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClaimSubmitted?: (itemId: string) => void;
}

// Valid campus email domains
const VALID_CAMPUS_DOMAINS = ['edu', 'ac.in', 'edu.in', 'campus.edu', 'university.edu'];

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
  const [securityAnswers, setSecurityAnswers] = useState<Record<string, string>>({});
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailError, setEmailError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get security questions based on item category
  const securityQuestions = useMemo(() => {
    if (!item) return [];
    return categorySecurityQuestions[item.category] || categorySecurityQuestions.other;
  }, [item]);

  // Reset security answers when item changes
  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', description: '' });
    setSecurityAnswers({});
    setProofImages([]);
    setEmailVerified(false);
    setEmailError('');
  };

  const handleSecurityAnswerChange = (questionId: string, value: string) => {
    setSecurityAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  // Validate campus email
  const validateCampusEmail = (email: string) => {
    const emailLower = email.toLowerCase();
    const isValid = VALID_CAMPUS_DOMAINS.some(domain => 
      emailLower.endsWith(`.${domain}`) || emailLower.includes(`@${domain}`)
    );
    
    if (!email) {
      setEmailError('');
      setEmailVerified(false);
    } else if (!isValid) {
      setEmailError('Please use a valid campus/university email (.edu, .ac.in)');
      setEmailVerified(false);
    } else {
      setEmailError('');
      setEmailVerified(true);
    }
    return isValid;
  };

  // Handle email change with validation
  const handleEmailChange = (email: string) => {
    setFormData({ ...formData, email });
    if (email.length > 5) {
      validateCampusEmail(email);
    } else {
      setEmailError('');
      setEmailVerified(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Images must be under 5MB',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImages(prev => [...prev, reader.result as string].slice(0, 3));
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove uploaded image
  const removeImage = (index: number) => {
    setProofImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateSecurityQuestions = () => {
    // At least 2 security questions must be answered
    const answeredQuestions = Object.values(securityAnswers).filter(answer => answer.trim() !== '');
    return answeredQuestions.length >= 2;
  };

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

    if (!emailVerified) {
      toast({
        title: 'Campus email required',
        description: 'Please use a valid campus/university email address.',
        variant: 'destructive',
      });
      return;
    }

    if (!validateSecurityQuestions()) {
      toast({
        title: 'Security verification required',
        description: 'Please answer at least 2 security questions to verify ownership.',
        variant: 'destructive',
      });
      return;
    }

    if (!item) return;

    setIsSubmitting(true);
    
    try {
      // Calculate match score based on security answers
      const matchScore = calculateMatchScore(item, securityAnswers, formData.description);
      
      // Save claim to Firestore
      await addDoc(collection(db, 'claims'), {
        itemId: item.id,
        itemName: item.name,
        itemCategory: item.category,
        itemDescription: item.description,
        claimerName: formData.name,
        claimerEmail: formData.email,
        claimerPhone: formData.phone,
        identificationDescription: formData.description,
        securityAnswers: securityAnswers,
        proofImages: proofImages,
        matchScore: matchScore,
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
        resetForm();
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
                <Label htmlFor="email" className="flex items-center gap-2">
                  Campus Email *
                  {emailVerified && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@university.edu"
                    value={formData.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={`pl-10 ${emailError ? 'border-destructive' : emailVerified ? 'border-green-500' : ''}`}
                  />
                </div>
                {emailError && (
                  <p className="text-xs text-destructive">{emailError}</p>
                )}
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

              {/* Security Questions Section */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Security Verification</span>
                  <span className="text-xs text-muted-foreground">(Answer at least 2)</span>
                </div>
                <p className="text-xs text-muted-foreground -mt-2">
                  To verify ownership, please answer the following questions about the {categoryLabels[item.category].toLowerCase()}.
                </p>
                
                {securityQuestions.map((q) => (
                  <div key={q.id} className="space-y-1.5">
                    <Label htmlFor={q.id} className="text-sm">
                      {q.question}
                    </Label>
                    <Input
                      id={q.id}
                      placeholder={q.placeholder}
                      value={securityAnswers[q.id] || ''}
                      onChange={(e) => handleSecurityAnswerChange(q.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              {/* Proof of Ownership Section */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <span>Proof of Ownership</span>
                  <span className="text-xs text-muted-foreground">(Optional but recommended)</span>
                </div>
                <p className="text-xs text-muted-foreground -mt-2">
                  Upload photos showing proof of ownership (receipt, older photo with the item, serial number, etc.)
                </p>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
                
                <div className="flex flex-wrap gap-2">
                  {proofImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Proof ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  
                  {proofImages.length < 3 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload</span>
                    </button>
                  )}
                </div>
                {proofImages.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {proofImages.length}/3 images uploaded
                  </p>
                )}
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
