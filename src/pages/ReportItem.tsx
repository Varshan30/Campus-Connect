import { useState } from 'react';
import { db, app } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Upload, X, Send, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { GradientButton } from '@/components/ui/gradient-button';
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { categoryLabels, locationLabels, ItemCategory, CampusLocation } from '@/lib/data';
import { notifyAll } from '@/lib/notifications';
import { runAutoMatching } from '@/lib/matching';

const ReportItem = () => {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<'lost' | 'found'>('lost');
  const [formData, setFormData] = useState({
    name: '',
    category: '' as ItemCategory | '',
    location: '' as CampusLocation | '',
    date: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validation
    if (!formData.name || !formData.category || !formData.location || !formData.date) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    // Prepare item data
    const auth = getAuth(app);
    const user = auth.currentUser;
    
    const itemData = {
      ...formData,
      dateFound: reportType === 'found' ? formData.date : '',
      dateLost: reportType === 'lost' ? formData.date : '',
      image: imagePreview || '',
      status: 'available',
      type: reportType,
      createdAt: new Date().toISOString(),
      createdBy: user?.uid || null,
      createdByEmail: user?.email || null,
    };

    try {
      const docRef = await addDoc(collection(db, 'foundItems'), itemData);
      
      // Run auto-matching to find similar items
      const matches = await runAutoMatching(
        { ...itemData, id: docRef.id, type: reportType },
        user?.uid || null
      );
      
      // Send email/Telegram notification via Formspree
      await notifyAll({
        type: 'new_item',
        itemName: formData.name,
        itemCategory: categoryLabels[formData.category as ItemCategory] || formData.category,
        itemLocation: locationLabels[formData.location as CampusLocation] || formData.location,
        userEmail: formData.contactEmail,
        userPhone: formData.contactPhone,
        description: formData.description,
        timestamp: new Date().toLocaleString(),
      });
      
      // Show success with match info
      const matchMessage = matches.length > 0 
        ? ` We found ${matches.length} potential match${matches.length > 1 ? 'es' : ''}! Check your notifications.`
        : '';
      
      toast({
        title: 'Report submitted!',
        description: `Your ${reportType} item report has been submitted successfully.${matchMessage}`,
      });
      // Reset form
      setFormData({
        name: '',
        category: '',
        location: '',
        date: '',
        description: '',
        contactEmail: '',
        contactPhone: '',
      });
      setImagePreview(null);
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: 'There was an error submitting your report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-12 relative overflow-hidden">
        <AnimatedGridPattern
          numSquares={30}
          maxOpacity={0.02}
          duration={4}
          className={cn(
            "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
          )}
        />
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Report an Item
          </h1>
          <p className="text-muted-foreground">
            Help reunite items with their owners
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Tips Section */}
        <div className="mb-8 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Tips for a successful report</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Be as specific as possible with item descriptions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Include unique identifiers (color, brand, stickers, etc.)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Add a photo if possible - it helps with identification
                </li>
              </ul>
            </div>
          </div>
        </div>

        <Tabs value={reportType} onValueChange={(v) => setReportType(v as 'lost' | 'found')}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="lost">I Lost Something</TabsTrigger>
            <TabsTrigger value="found">I Found Something</TabsTrigger>
          </TabsList>

          <TabsContent value="lost">
            <Card>
              <CardHeader>
                <CardTitle>Report Lost Item</CardTitle>
                <CardDescription>
                  Provide as much detail as possible to help us find your item.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <FormFields
                    formData={formData}
                    handleInputChange={handleInputChange}
                    imagePreview={imagePreview}
                    handleImageChange={handleImageChange}
                    setImagePreview={setImagePreview}
                    setFormData={setFormData}
                    dateLabel="Date Lost"
                    locationLabel="Where did you last see it?"
                  />
                  <div className="flex justify-center">
                    <GradientButton type="submit" size="lg">
                      <Send className="h-5 w-5" />
                      Submit Lost Item Report
                    </GradientButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="found">
            <Card>
              <CardHeader>
                <CardTitle>Report Found Item</CardTitle>
                <CardDescription>
                  Thank you for being a good samaritan! Please provide details about the item.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <FormFields
                    formData={formData}
                    handleInputChange={handleInputChange}
                    imagePreview={imagePreview}
                    handleImageChange={handleImageChange}
                    setImagePreview={setImagePreview}
                    setFormData={setFormData}
                    dateLabel="Date Found"
                    locationLabel="Where did you find it?"
                  />
                  <div className="flex justify-center">
                    <GradientButton type="submit" size="lg">
                      <Send className="h-5 w-5" />
                      Submit Found Item Report
                    </GradientButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

interface FormFieldsProps {
  formData: {
    name: string;
    category: ItemCategory | '';
    location: CampusLocation | '';
    date: string;
    description: string;
    contactEmail: string;
    contactPhone: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  imagePreview: string | null;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setImagePreview: (value: string | null) => void;
  setFormData: (data: any) => void;
  dateLabel: string;
  locationLabel: string;
}

const FormFields = ({
  formData,
  handleInputChange,
  imagePreview,
  handleImageChange,
  setImagePreview,
  setFormData,
  dateLabel,
  locationLabel,
}: FormFieldsProps) => (
  <>
    {/* Item Name */}
    <div className="space-y-2">
      <Label htmlFor="name">Item Name *</Label>
      <Input
        id="name"
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        placeholder="e.g., Blue Hydroflask, MacBook Charger"
        required
      />
    </div>

    {/* Category & Location */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Category *</Label>
        <Select
          value={formData.category}
          onValueChange={(v) => setFormData({ ...formData, category: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{locationLabel} *</Label>
        <Select
          value={formData.location}
          onValueChange={(v) => setFormData({ ...formData, location: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(locationLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>

    {/* Date */}
    <div className="space-y-2">
      <Label htmlFor="date">{dateLabel} *</Label>
      <Input
        id="date"
        name="date"
        type="date"
        value={formData.date}
        onChange={handleInputChange}
        required
      />
    </div>

    {/* Description */}
    <div className="space-y-2">
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        name="description"
        value={formData.description}
        onChange={handleInputChange}
        placeholder="Provide any additional details that might help identify the item..."
        rows={4}
      />
    </div>

    {/* Image Upload */}
    <div className="space-y-2">
      <Label>Photo (optional)</Label>
      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
        {imagePreview ? (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-48 rounded-lg"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={() => setImagePreview(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <label className="cursor-pointer">
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              Click to upload or drag and drop
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>

    {/* Contact Info */}
    <div className="space-y-4 pt-4 border-t border-border">
      <h4 className="font-medium text-foreground">Contact Information</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Email</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            value={formData.contactEmail}
            onChange={handleInputChange}
            placeholder="your@email.edu"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">Phone</Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            value={formData.contactPhone}
            onChange={handleInputChange}
            placeholder="+91 9876543210"
          />
        </div>
      </div>
    </div>
  </>
);

export default ReportItem;
