import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Save, Bell, Mail, Shield, Users, Calendar } from 'lucide-react'

export function WeddingSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [publicProfile, setPublicProfile] = useState(false)
  const [autoReminders, setAutoReminders] = useState(true)

  const handleSaveSettings = () => {
    // TODO: Implement settings save
    console.log('Saving settings...')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-2">Manage your wedding portal preferences and account settings.</p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Wedding Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-rose-500" />
              Wedding Information
            </CardTitle>
            <CardDescription>
              Basic details about your wedding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wedding-date">Wedding Date</Label>
                <Input id="wedding-date" type="date" defaultValue="2024-09-15" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input id="venue" placeholder="Enter venue name" defaultValue="The Grand Ballroom" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme">Wedding Theme</Label>
              <Input id="theme" placeholder="e.g., Rustic, Modern, Classic" defaultValue="Classic Elegance" />
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose how you want to receive updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive updates via email</p>
              </div>
              <Switch 
                checked={emailNotifications} 
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">SMS Notifications</Label>
                <p className="text-sm text-gray-500">Receive updates via text message</p>
              </div>
              <Switch 
                checked={smsNotifications} 
                onCheckedChange={setSmsNotifications}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Auto Reminders</Label>
                <p className="text-sm text-gray-500">Automatic timeline reminders</p>
              </div>
              <Switch 
                checked={autoReminders} 
                onCheckedChange={setAutoReminders}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              Privacy & Sharing
            </CardTitle>
            <CardDescription>
              Control who can see your wedding information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Public Profile</Label>
                <p className="text-sm text-gray-500">Allow others to find your wedding</p>
              </div>
              <Switch 
                checked={publicProfile} 
                onCheckedChange={setPublicProfile}
              />
            </div>
            <div className="space-y-2">
              <Label>Invitation Access</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Invite-only</Badge>
                <span className="text-sm text-gray-500">Only invited members can access</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Account Management
            </CardTitle>
            <CardDescription>
              Manage your account and access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary-email">Primary Email</Label>
                <Input id="primary-email" type="email" defaultValue="couple@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" />
              </div>
            </div>
            <Separator />
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline">
                Change Password
              </Button>
              <Button variant="outline">
                Download Data
              </Button>
              <Button variant="destructive">
                Deactivate Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings */}
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  )
}