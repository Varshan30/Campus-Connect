import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CinematicToggle } from "@/components/CinematicToggle";
import { Bell, Moon, Sparkles, Mail } from "lucide-react";

export default function Settings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    matchAlerts: true,
    darkMode: false,
    weeklyDigest: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your notification preferences</p>
          </div>

          <Card className="animate-fade-in border-border/50" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: "emailNotifications" as const, icon: Mail, label: "Email Notifications", desc: "Receive updates via email" },
                { key: "matchAlerts" as const, icon: Sparkles, label: "Match Alerts", desc: "Get notified when items match your report" },
                { key: "weeklyDigest" as const, icon: Bell, label: "Weekly Digest", desc: "Summary of new found items" },
                { key: "darkMode" as const, icon: Moon, label: "Dark Mode", desc: "Switch to dark theme" },
              ].map(({ key, icon: Icon, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{label}</p>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                  <CinematicToggle checked={settings[key]} onChange={() => toggleSetting(key)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
