import { useState, useEffect } from 'react';
import { Moon, Sun, Bell, Mail, Smartphone, Shield, Settings as SettingsIcon, User, LogOut, Brain, Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { getGrokApiKey, setGrokApiKey, removeGrokApiKey, isGrokConfigured, isUsingBuiltInKey, testGrokConnection } from '@/lib/grokAI';
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

  // AI Configuration state
  const [aiConnected] = useState(() => isGrokConfigured());
  const [aiBuiltIn] = useState(() => isUsingBuiltInKey());
  const [aiTesting, setAiTesting] = useState(false);
  const [aiStatus, setAiStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [aiMessage, setAiMessage] = useState('');
  const [showAdvancedAI, setShowAdvancedAI] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');

  const handleTestGrokConnection = async () => {
    setAiTesting(true);
    setAiStatus('idle');
    setAiMessage('');
    try {
      const result = await testGrokConnection();
      setAiStatus(result.success ? 'success' : 'error');
      setAiMessage(result.message);
      if (result.success) {
        toast({ title: '🤖 AI Connected!', description: 'Groq AI is ready for intelligent matchmaking.' });
      } else {
        toast({ title: 'Connection Failed', description: result.message, variant: 'destructive' });
      }
    } catch (e) {
      setAiStatus('error');
      setAiMessage('Unexpected error testing connection');
    } finally {
      setAiTesting(false);
    }
  };

  const handleSaveCustomKey = () => {
    if (!customApiKey.trim()) {
      removeGrokApiKey();
      toast({ title: 'Override Removed', description: 'Using default AI backend key.' });
      setCustomApiKey('');
      return;
    }
    setGrokApiKey(customApiKey.trim());
    toast({ title: 'Custom Key Saved', description: 'Your custom Groq API key is now active.' });
  };

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

            {/* AI Verification Section — Always Active */}
            <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Claim Verification</p>
                  <span className={`ml-auto flex items-center gap-1 text-xs ${aiConnected ? 'text-green-600' : 'text-yellow-600'}`}>
                    <Zap className="h-3 w-3" /> {aiConnected ? 'Active' : 'Standby'}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {/* Status Banner */}
                <div className={`flex items-center gap-3 p-3 rounded-lg ${aiConnected ? 'bg-green-500/10 border border-green-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
                  {aiConnected ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">AI Verification Active</p>
                        <p className="text-xs text-green-600/80 dark:text-green-400/70">
                          {aiBuiltIn ? 'Using built-in Groq AI backend' : 'Using custom API key'} — every claim is automatically verified.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-yellow-600 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">AI Unavailable — Using Rule-Based Checks</p>
                        <p className="text-xs text-yellow-600/80 dark:text-yellow-400/70">
                          Claims are still verified using 9 fraud detection rules. AI adds deeper ownership analysis.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* What AI does */}
                <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <p className="text-xs font-medium text-foreground">🛡️ Every claim goes through:</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>• 9 automated fraud detection checks (duplicate, rate-limit, self-claim, etc.)</li>
                    <li>• AI-powered ownership analysis via Groq (llama-3.3-70b)</li>
                    <li>• Smart scoring: AI 55% + local checks 30% + rule bonuses 15%</li>
                    <li>• Auto-approve, auto-reject, or send to admin review</li>
                  </ul>
                </div>

                {/* Test Connection */}
                <Button
                  variant="outline"
                  onClick={handleTestGrokConnection}
                  disabled={!aiConnected || aiTesting}
                  className="w-full"
                >
                  {aiTesting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Testing AI Connection...</>
                  ) : (
                    <><Zap className="h-4 w-4 mr-2" /> Test AI Connection</>
                  )}
                </Button>

                {aiStatus !== 'idle' && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                    aiStatus === 'success' ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-red-500/10 text-red-700 dark:text-red-400'
                  }`}>
                    {aiStatus === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {aiMessage}
                  </div>
                )}

                {/* Advanced: Custom API key override */}
                <button
                  onClick={() => setShowAdvancedAI(!showAdvancedAI)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  {showAdvancedAI ? '▾' : '▸'} Advanced: Use your own API key
                </button>
                {showAdvancedAI && (
                  <div className="space-y-2 p-3 rounded-lg border border-border/50 bg-muted/30">
                    <p className="text-xs text-muted-foreground">
                      Optionally override the built-in key with your own Groq API key from{' '}
                      <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">console.groq.com</a>.
                    </p>
                    <Input
                      type="password"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder="gsk_... (leave empty to use default)"
                    />
                    <div className="flex gap-2">
                      <GradientButton onClick={handleSaveCustomKey} className="flex-1 text-xs">
                        Save Override
                      </GradientButton>
                      <Button variant="outline" className="flex-1 text-xs" onClick={() => { removeGrokApiKey(); setCustomApiKey(''); toast({ title: 'Reset', description: 'Using default AI backend.' }); }}>
                        Reset to Default
                      </Button>
                    </div>
                  </div>
                )}
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
