import { useState } from 'react';
import { Moon, Sun, Bell, Mail, Smartphone, Shield } from 'lucide-react';
import Layout from '@/components/Layout';
import CinematicToggle from '@/components/CinematicToggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const Settings = () => {
  const [settings, setSettings] = useState({
    darkMode: false,
    emailNotifications: true,
    pushNotifications: false,
    matchAlerts: true,
    weeklyDigest: false,
    twoFactorAuth: false,
  });

  const updateSetting = (key: keyof typeof settings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    
    // Handle dark mode toggle
    if (key === 'darkMode') {
      document.documentElement.classList.toggle('dark', value);
    }
  };

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Customize your Lost & Found experience
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Appearance */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  {settings.darkMode ? (
                    <Moon className="h-5 w-5 text-primary" />
                  ) : (
                    <Sun className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize how the app looks</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CinematicToggle
                label="Dark Mode"
                description="Switch between light and dark themes"
                checked={settings.darkMode}
                onCheckedChange={(v) => updateSetting('darkMode', v)}
              />
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Manage how you receive updates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <CinematicToggle
                label="Email Notifications"
                description="Receive updates via email"
                checked={settings.emailNotifications}
                onCheckedChange={(v) => updateSetting('emailNotifications', v)}
              />
              
              <Separator />
              
              <CinematicToggle
                label="Push Notifications"
                description="Get notified on your device"
                checked={settings.pushNotifications}
                onCheckedChange={(v) => updateSetting('pushNotifications', v)}
              />
              
              <Separator />
              
              <CinematicToggle
                label="Match Alerts"
                description="Get notified when your lost item might be found"
                checked={settings.matchAlerts}
                onCheckedChange={(v) => updateSetting('matchAlerts', v)}
              />
              
              <Separator />
              
              <CinematicToggle
                label="Weekly Digest"
                description="Receive a summary of new found items weekly"
                checked={settings.weeklyDigest}
                onCheckedChange={(v) => updateSetting('weeklyDigest', v)}
              />
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Protect your account</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CinematicToggle
                label="Two-Factor Authentication"
                description="Add an extra layer of security"
                checked={settings.twoFactorAuth}
                onCheckedChange={(v) => updateSetting('twoFactorAuth', v)}
              />
            </CardContent>
          </Card>

          {/* Contact Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Contact Preferences</CardTitle>
                  <CardDescription>How people can reach you about items</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Email</p>
                    <p className="text-sm text-muted-foreground">student@campus.edu</p>
                  </div>
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Phone</p>
                    <p className="text-sm text-muted-foreground">Not set</p>
                  </div>
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
