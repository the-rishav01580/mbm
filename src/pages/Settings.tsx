import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Database, Bell, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// FIX: Settings ke liye ek type define kiya gaya hai
interface AppSettings {
  messName: string;
  monthlyFee: string;
  dueDayOfMonth: string;
  autoReminders: boolean;
  emailNotifications: boolean;
  whatsappIntegration: boolean;
}

const Settings = () => {
  const [settings, setSettings] = useState<AppSettings>({
    messName: "",
    monthlyFee: "",
    dueDayOfMonth: "",
    autoReminders: true,
    emailNotifications: true,
    whatsappIntegration: false,
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // FIX: Supabase se settings fetch karne ka function
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('system_settings').select('key, value');
    
    if (error) {
      toast.error("Failed to load settings: " + error.message);
    } else if (data) {
      // Database se aaye key-value pairs ko ek settings object me badlein
      const loadedSettings = data.reduce((acc, { key, value }) => {
        if (key === 'autoReminders' || key === 'emailNotifications' || key === 'whatsappIntegration') {
          acc[key as keyof AppSettings] = value === 'true';
        } else {
          acc[key as keyof AppSettings] = value;
        }
        return acc;
      }, {} as Partial<AppSettings>);
      
      setSettings(prev => ({ ...prev, ...loadedSettings }));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // FIX: Form me koi bhi change handle karne ka function
  const handleInputChange = (key: keyof AppSettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // FIX: Settings ko Supabase me save karne ka function
  const handleSaveSettings = async () => {
    setIsSaving(true);

    const settingsToSave = Object.entries(settings).map(([key, value]) => ({
      key,
      value: String(value), // Sab kuch string me convert karke save karein
    }));
    
    // Upsert ka istemal: agar key hai to update, nahi to insert
    const { error } = await supabase.from('system_settings').upsert(settingsToSave, { onConflict: 'key' });

    setIsSaving(false);
    if (error) {
      toast.error("Failed to save settings: " + error.message);
    } else {
      toast.success("Settings saved successfully!");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your mess management system configuration</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Configuration */}
        <Card className="shadow-card bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><SettingsIcon className="w-5 h-5" /> System Configuration</CardTitle>
            <CardDescription>Basic system settings and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="messName">Mess Name</Label>
              <Input id="messName" placeholder="e.g., College Mess" value={settings.messName} onChange={(e) => handleInputChange('messName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyFee">Monthly Fee Amount (INR)</Label>
              <Input id="monthlyFee" type="number" placeholder="e.g., 2500" value={settings.monthlyFee} onChange={(e) => handleInputChange('monthlyFee', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Monthly Due Day</Label>
              <Input id="dueDate" type="number" placeholder="Day of month (1-28)" value={settings.dueDayOfMonth} onChange={(e) => handleInputChange('dueDayOfMonth', e.target.value)} min="1" max="28" />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="shadow-card bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" /> Notification Settings</CardTitle>
            <CardDescription>Configure reminders (feature coming soon)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="space-y-1"><Label>Auto Reminders</Label><p className="text-sm text-muted-foreground">Automatically send fee reminders</p></div>
              <Switch checked={settings.autoReminders} onCheckedChange={(checked) => handleInputChange('autoReminders', checked)} />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="space-y-1"><Label>Email Notifications</Label><p className="text-sm text-muted-foreground">Send notifications via email</p></div>
              <Switch checked={settings.emailNotifications} onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)} />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="space-y-1"><Label>WhatsApp Integration</Label><p className="text-sm text-muted-foreground">Enable WhatsApp reminders</p></div>
              <Switch checked={settings.whatsappIntegration} onCheckedChange={(checked) => handleInputChange('whatsappIntegration', checked)} disabled />
            </div>
          </CardContent>
        </Card>
        
        {/* SIMPLIFIED: Database & Backup card ko simplify kiya gaya hai */}
        <Card className="lg:col-span-2 shadow-card bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="w-5 h-5" /> System Status</CardTitle>
            <CardDescription>Backend and database connection status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Supabase Integration</p>
                  <p className="text-sm text-green-700">All data is being saved securely in the cloud.</p>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600 bg-white">Connected</Badge>
            </div>
          </CardContent>
        </Card>

        {/* REMOVED: Admin Profile card hata diya gaya hai */}

      </div>

      <Card className="shadow-card bg-gradient-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Save Changes</h3>
              <p className="text-sm text-muted-foreground">Remember to save your new configuration.</p>
            </div>
            <Button size="lg" onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? "Saving..." : "Save All Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;