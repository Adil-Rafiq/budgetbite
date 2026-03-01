"use client"

import { User, MapPin, Lock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { currentUser } from "@/lib/mock-data"

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account settings.</p>
      </div>

      {/* Profile info */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                {currentUser.avatarFallback}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg text-card-foreground">
                {currentUser.firstName} {currentUser.lastName}
              </CardTitle>
              <CardDescription>{currentUser.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" defaultValue={currentUser.firstName} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" defaultValue={currentUser.lastName} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={currentUser.email} />
          </div>
          <Button className="self-start">Save changes</Button>
        </CardContent>
      </Card>

      {/* Location */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10">
              <MapPin className="w-4 h-4 text-accent" />
            </div>
            <div>
              <CardTitle className="text-base text-card-foreground">Location</CardTitle>
              <CardDescription>Update your location for better restaurant suggestions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="lat">Latitude</Label>
              <Input id="lat" type="number" defaultValue={currentUser.location.lat} step="0.0001" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lng">Longitude</Label>
              <Input id="lng" type="number" defaultValue={currentUser.location.lng} step="0.0001" />
            </div>
          </div>
          <Button variant="outline" className="self-start">Update location</Button>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-chart-3/10">
              <Lock className="w-4 h-4 text-chart-3" />
            </div>
            <div>
              <CardTitle className="text-base text-card-foreground">Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input id="currentPassword" type="password" placeholder="Enter current password" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input id="newPassword" type="password" placeholder="Enter new password" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input id="confirmPassword" type="password" placeholder="Confirm new password" />
          </div>
          <Button variant="outline" className="self-start">Change password</Button>
        </CardContent>
      </Card>
    </div>
  )
}
