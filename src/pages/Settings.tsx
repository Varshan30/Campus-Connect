import { useState } from 'react';
import { Moon, Sun, Bell, Mail, Smartphone, Shield, Settings as SettingsIcon } from 'lucide-react';
import Layout from '@/components/Layout';
import CinematicToggle from '@/components/CinematicToggle';
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
    
    if (key === 'darkMode') {
      document.documentElement.classList.toggle('dark', value);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 py-12 max-w-xl">
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

            {/* Notifications Section */}
            <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
              <div className="px-4 py-3 bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notifications</p>
              </div>
              <div className="divide-y divide-border/50">
                <div className="p-4">
                  <SettingRow
                    icon={<Mail className="h-5 w-5" />}
                    label="Email"
                    description="Receive via email"
                    checked={settings.emailNotifications}
                    onChange={(v) => updateSetting('emailNotifications', v)}
                  />
                </div>
                <div className="p-4">
                  <SettingRow
                    icon={<Bell className="h-5 w-5" />}
                    label="Push"
                    description="Device notifications"
                    checked={settings.pushNotifications}
                    onChange={(v) => updateSetting('pushNotifications', v)}
                  />
                </div>
                <div className="p-4">
                  <SettingRow
                    icon={<Bell className="h-5 w-5" />}
                    label="Match Alerts"
                    description="When item found"
                    checked={settings.matchAlerts}
                    onChange={(v) => updateSetting('matchAlerts', v)}
                  />
                </div>
                <div className="p-4">
                  <SettingRow
                    icon={<Mail className="h-5 w-5" />}
                    label="Weekly Digest"
                    description="Summary of items"
                    checked={settings.weeklyDigest}
                    onChange={(v) => updateSetting('weeklyDigest', v)}
                  />
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
              <div className="px-4 py-3 bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Security</p>
              </div>
              <div className="p-4">
                <SettingRow
                  icon={<Shield className="h-5 w-5" />}
                  label="Two-Factor Auth"
                  description="Extra security"
                  checked={settings.twoFactorAuth}
                  onChange={(v) => updateSetting('twoFactorAuth', v)}
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
              <div className="px-4 py-3 bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</p>
              </div>
              <div className="divide-y divide-border/50">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Email</p>
                      <p className="text-xs text-muted-foreground">student@campus.edu</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Phone</p>
                      <p className="text-xs text-muted-foreground">Not set</p>
                    </div>
                  </div>
                </div>
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
