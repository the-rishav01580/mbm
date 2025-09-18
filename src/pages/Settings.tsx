import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  Database, 
  Bell, 
  User, 
  Shield,
  Save,
  AlertTriangle
} from "lucide-react";

const Settings = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your mess management system configuration
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Configuration */}
        <Card className="shadow-card bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              System Configuration
            </CardTitle>
            <CardDescription>
              Basic system settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="messName">Mess Name</Label>
              <Input id="messName" placeholder="Enter mess name" defaultValue="College Mess" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="monthlyFee">Monthly Fee Amount</Label>
              <Input id="monthlyFee" placeholder="Enter amount" defaultValue="2500" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Monthly Due Date</Label>
              <Input id="dueDate" type="number" placeholder="Day of month" defaultValue="5" min="1" max="31" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically send fee reminders
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="shadow-card bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure when and how to send reminders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications via email
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>WhatsApp Integration</Label>
                <p className="text-sm text-muted-foreground">
                  Enable WhatsApp reminders
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminderDays">Reminder Days Before Due</Label>
              <Input id="reminderDays" type="number" placeholder="Number of days" defaultValue="3" min="1" max="30" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="overdueReminder">Overdue Reminder Frequency</Label>
              <Input id="overdueReminder" type="number" placeholder="Days between reminders" defaultValue="2" min="1" max="10" />
            </div>
          </CardContent>
        </Card>

        {/* Admin Settings */}
        <Card className="shadow-card bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Admin Profile
            </CardTitle>
            <CardDescription>
              Manage administrator account settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminName">Admin Name</Label>
              <Input id="adminName" placeholder="Enter admin name" defaultValue="Admin User" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input id="adminEmail" type="email" placeholder="admin@example.com" defaultValue="admin@messmanager.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPhone">Admin Phone</Label>
              <Input id="adminPhone" placeholder="+91 98765 43210" defaultValue="+91 98765 43210" />
            </div>

            <Button variant="outline" className="w-full">
              <Shield className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Database & Backup */}
        <Card className="shadow-card bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database & Backup
            </CardTitle>
            <CardDescription>
              Database management and backup options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Supabase Integration</p>
                  <p className="text-sm text-blue-700">
                    Connect to enable backend functionality
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                Not Connected
              </Badge>
            </div>

            <div className="space-y-3">
              <Button variant="outline" className="w-full" disabled>
                <Database className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" className="w-full" disabled>
                <Database className="w-4 h-4 mr-2" />
                Import Data
              </Button>
              <Button variant="outline" className="w-full" disabled>
                <Database className="w-4 h-4 mr-2" />
                Create Backup
              </Button>
            </div>

            <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  Database features require Supabase
                </p>
                <p className="text-xs text-yellow-700">
                  Connect Supabase to enable data storage and backup features
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <Card className="shadow-card bg-gradient-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Save Changes</h3>
              <p className="text-sm text-muted-foreground">
                Remember to save your configuration changes
              </p>
            </div>
            <Button size="lg">
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;