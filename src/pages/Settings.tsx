import { useState, useEffect } from 'react';
import { Moon, Sun, Bell, Mail, Smartphone, Shield, Settings as SettingsIcon, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import CinematicToggle from '@/components/CinematicToggle';
import { Button } from '@/components/ui/button';
import { GradientButton } from '@/components/ui/gradient-button';
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getAuth, onAuthStateChanged, signOut, updateProfile, updateEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { app, db } from '../firebase';

const auth = getAuth(app);

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(auth.currentUser);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [settings, setSettings] = useState({
    darkMode: false,
    emailNotifications: true,
    pushNotifications: false,
    matchAlerts: true,
    weeklyDigest: false,
    twoFactorAuth: false,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setDisplayName(currentUser.displayName || '');
        setEmail(currentUser.email || '');
        
        // Load user settings from Firestore
        const settingsDoc = await getDoc(doc(db, 'userSettings', currentUser.uid));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setSettings(prev => ({ ...prev, ...data.preferences }));
          setPhone(data.phone || '');
          if (data.preferences?.darkMode) {
            document.documentElement.classList.add('dark');
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const updateSetting = async (key: keyof typeof settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    if (key === 'darkMode') {
      document.documentElement.classList.toggle('dark', value);
    }

    // Save to Firestore
    if (user) {
      try {
        await setDoc(doc(db, 'userSettings', user.uid), {
          preferences: newSettings,
          phone,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        // Show confirmation for each setting
        const messages: Record<string, string> = {
          darkMode: value ? 'Dark mode enabled' : 'Light mode enabled',
          emailNotifications: value ? 'Email notifications enabled' : 'Email notifications disabled',
          pushNotifications: value ? 'Push notifications enabled' : 'Push notifications disabled',
          matchAlerts: value ? 'Match alerts enabled - you\'ll be notified when your item is found' : 'Match alerts disabled',
          weeklyDigest: value ? 'Weekly digest enabled - you\'ll receive a summary every week' : 'Weekly digest disabled',
          twoFactorAuth: value ? 'Two-factor authentication enabled for extra security' : 'Two-factor authentication disabled',
        };

        toast({
          title: messages[key] || 'Setting updated',
          description: 'Your preference has been saved.',
        });
      } catch (error) {
        toast({
          title: 'Failed to save',
          description: 'Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsUpdating(true);
    
    try {
      await updateProfile(user, { displayName });
      
      // Save phone to Firestore
      await setDoc(doc(db, 'userSettings', user.uid), {
        phone,
        preferences: settings,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved.',
      });
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
    toast({
      title: 'Logged out',
      description: 'You have been signed out.',
    });
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Please log in to access settings</h2>
            <GradientButton onClick={() => navigate('/auth')}>Go to Login</GradientButton>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
        <AnimatedGridPattern
          numSquares={30}
          maxOpacity={0.02}
          duration={4}
          className={cn(
            "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
            "inset-x-0 inset-y-0 h-full"
          )}
        />
        <div className="container mx-auto px-4 py-12 max-w-xl relative z-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <SettingsIcon className="h-7 w-7 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Customize your experience</p>
          </div>

          {/* Settings List */}
          <div className="space-y-2">
            {/* Appearance Section */}
            <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
              <div className="px-4 py-3 bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Appearance</p>
              </div>
              <div className="p-4">
                <SettingRow
                  icon={settings.darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  label="Dark Mode"
                  description="Switch theme"
                  checked={settings.darkMode}
                  onChange={(v) => updateSetting('darkMode', v)}
                />
              </div>
            </div>

            {/* Profile Section */}
            <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
              <div className="px-4 py-3 bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profile</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={email}
                    disabled
                    className="bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                  />
                </div>
                <GradientButton 
                  onClick={handleUpdateProfile} 
                  disabled={isUpdating}
                  className="w-full"
                >
                  {isUpdating ? 'Saving...' : 'Save Profile'}
                </GradientButton>
              </div>
            </div>

            {/* Account Actions */}
            <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
              <div className="px-4 py-3 bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</p>
              </div>
              <div className="p-4">
                <GradientButton 
                  onClick={handleLogout}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </GradientButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Compact Setting Row Component
const SettingRow = ({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <CinematicToggle
      label=""
      checked={checked}
      onCheckedChange={onChange}
    />
  </div>
);

export default Settings;
