'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogOut, Lock, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { useUpdateProfile, useUser } from '@/hooks/use-user';
import { authClient } from '@/lib/auth-client';
import { showToast } from '@/lib/toast';
import { getErrorMessage } from '@/lib/api/errors';
import { NotificationTimesCard } from '@/app/profile/_components/notification-times-card';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const accountSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.email(),
});

const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8, 'Enter your current password'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type AccountInput = z.infer<typeof accountSchema>;
type LocationInput = z.infer<typeof locationSchema>;
type PasswordInput = z.infer<typeof passwordSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function splitName(fullName: string | undefined | null): { firstName: string; lastName: string } {
  if (!fullName) return { firstName: '', lastName: '' };
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] ?? '';
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}

function initials(firstName: string, lastName: string): string {
  const a = firstName.charAt(0).toUpperCase();
  const b = lastName.charAt(0).toUpperCase();
  return `${a}${b}` || '•';
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useUser();
  const { mutateAsync: updateLocation } = useUpdateProfile();

  const initialAccount = useMemo<AccountInput>(
    () => ({
      ...splitName(user?.name),
      email: user?.email ?? '',
    }),
    [user],
  );

  const initialLocation = useMemo<LocationInput>(
    () => ({
      latitude: user?.profile?.latitude ?? 0,
      longitude: user?.profile?.longitude ?? 0,
    }),
    [user],
  );

  const accountForm = useForm<AccountInput>({
    resolver: zodResolver(accountSchema),
    defaultValues: initialAccount,
  });
  const locationForm = useForm<LocationInput>({
    resolver: zodResolver(locationSchema),
    defaultValues: initialLocation,
  });
  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  // Reset forms when user arrives / changes.
  useEffect(() => {
    if (user) {
      accountForm.reset(initialAccount);
      locationForm.reset(initialLocation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const [signingOut, setSigningOut] = useState(false);

  const onSaveAccount = async (values: AccountInput) => {
    const fullName = `${values.firstName} ${values.lastName}`.trim();
    const { error } = await authClient.updateUser({ name: fullName });
    if (error) {
      showToast.error({
        title: 'Could not save profile',
        description: getErrorMessage(error, 'Something went wrong.'),
      });
      return;
    }
    // Better-auth's email updates require verification and are provider-scoped — skip for now.
    queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    showToast.success({ title: 'Profile updated' });
  };

  const onSaveLocation = async (values: LocationInput) => {
    try {
      await updateLocation(values);
      showToast.success({ title: 'Location updated' });
    } catch (err) {
      showToast.error({
        title: 'Could not update location',
        description: getErrorMessage(err),
      });
    }
  };

  const onChangePassword = async (values: PasswordInput) => {
    const { error } = await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
    if (error) {
      showToast.error({
        title: 'Could not change password',
        description: getErrorMessage(error, 'Check your current password.'),
      });
      return;
    }
    passwordForm.reset();
    showToast.success({ title: 'Password changed' });
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut();
      router.push('/login');
    } finally {
      setSigningOut(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  const { firstName, lastName } = splitName(user.name);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your account settings.</p>
        </div>
        <Button
          variant="outline"
          onClick={handleSignOut}
          disabled={signingOut}
          className="shrink-0"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>

      {/* Profile info */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                {initials(firstName, lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg text-card-foreground">{user.name || '—'}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={accountForm.handleSubmit(onSaveAccount)}
            noValidate
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" {...accountForm.register('firstName')} />
                {accountForm.formState.errors.firstName && (
                  <p className="text-xs text-destructive">
                    {accountForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" {...accountForm.register('lastName')} />
                {accountForm.formState.errors.lastName && (
                  <p className="text-xs text-destructive">
                    {accountForm.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...accountForm.register('email')} disabled />
              <p className="text-xs text-muted-foreground">
                Email changes aren{"'"}t supported yet — contact support if you need to switch.
              </p>
            </div>
            <Button
              type="submit"
              className="self-start"
              disabled={accountForm.formState.isSubmitting || !accountForm.formState.isDirty}
            >
              {accountForm.formState.isSubmitting ? 'Saving...' : 'Save changes'}
            </Button>
          </form>
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
              <CardDescription>
                Update your location for better restaurant suggestions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={locationForm.handleSubmit(onSaveLocation)}
            noValidate
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  type="number"
                  step="0.0001"
                  {...locationForm.register('latitude', { valueAsNumber: true })}
                />
                {locationForm.formState.errors.latitude && (
                  <p className="text-xs text-destructive">
                    {locationForm.formState.errors.latitude.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  id="lng"
                  type="number"
                  step="0.0001"
                  {...locationForm.register('longitude', { valueAsNumber: true })}
                />
                {locationForm.formState.errors.longitude && (
                  <p className="text-xs text-destructive">
                    {locationForm.formState.errors.longitude.message}
                  </p>
                )}
              </div>
            </div>
            <Button
              type="submit"
              variant="outline"
              className="self-start"
              disabled={locationForm.formState.isSubmitting || !locationForm.formState.isDirty}
            >
              {locationForm.formState.isSubmitting ? 'Updating...' : 'Update location'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notification times — active plan */}
      <NotificationTimesCard />

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
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={passwordForm.handleSubmit(onChangePassword)}
            noValidate
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Enter current password"
                {...passwordForm.register('currentPassword')}
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-xs text-destructive">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                {...passwordForm.register('newPassword')}
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-destructive">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                {...passwordForm.register('confirmPassword')}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              variant="outline"
              className="self-start"
              disabled={passwordForm.formState.isSubmitting}
            >
              {passwordForm.formState.isSubmitting ? 'Changing...' : 'Change password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
