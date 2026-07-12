'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BadgeCheck, Lock, LogOut, MapPin, Salad, ShieldCheck, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useUpdateProfile, useUser } from '@/hooks/use-user';
import { useDetectLocation } from '@/hooks/use-detect-location';
import { authClient } from '@/lib/auth-client';
import { showToast } from '@/lib/toast';
import { getErrorMessage } from '@/lib/api/errors';
import {
  ALLERGEN_OPTIONS,
  DEFAULT_COORDINATES,
  DIETARY_PREFERENCE_OPTIONS,
} from '@/app/onboarding/constants';
import { useDietaryStep } from '@/app/onboarding/_hooks/use-dietary-step';
import { DietaryTagPicker } from '@/components/dietary-tag-picker';
import { NotificationTimesCard } from '@/app/profile/_components/notification-times-card';
import { FoodPreferencesCard } from '@/app/profile/_components/food-preferences-card';
import { Section } from '@/app/profile/_components/section';

const LocationMap = dynamic(() => import('@/components/location-map').then((m) => m.LocationMap), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-2">
      <div className="h-[44px] w-full animate-pulse rounded-[10px] border border-sage bg-sage" />
      <div className="h-[280px] w-full animate-pulse rounded-[14px] border border-sage bg-sage" />
    </div>
  ),
});

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

const inputClass = 'bg-canvas border-sage text-charcoal';
const labelClass = 'text-[10px] font-semibold uppercase tracking-[0.18em] text-slate/60';
const primaryBtn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-green px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-dark-green disabled:pointer-events-none disabled:opacity-50';
const ghostBtn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-sage bg-white px-4 py-2 text-[13px] font-medium text-slate transition-colors hover:bg-canvas disabled:pointer-events-none disabled:opacity-50';

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useUser();
  const { mutateAsync: updateProfile } = useUpdateProfile();
  const dietary = useDietaryStep(user?.profile);

  const initialAccount = useMemo<AccountInput>(
    () => ({
      ...splitName(user?.name),
      email: user?.email ?? '',
    }),
    [user],
  );

  const initialLocation = useMemo<LocationInput>(
    () => ({
      latitude: user?.profile?.latitude ?? DEFAULT_COORDINATES.latitude,
      longitude: user?.profile?.longitude ?? DEFAULT_COORDINATES.longitude,
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

  useEffect(() => {
    if (user) {
      accountForm.reset(initialAccount);
      locationForm.reset(initialLocation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const [signingOut, setSigningOut] = useState(false);

  const setLocationCoordinates = (latitude: number, longitude: number) => {
    locationForm.setValue('latitude', latitude, { shouldDirty: true, shouldValidate: true });
    locationForm.setValue('longitude', longitude, { shouldDirty: true, shouldValidate: true });
  };

  const { detect: detectLocation, isDetecting: isDetectingLocation } = useDetectLocation({
    onSuccess: setLocationCoordinates,
  });

  const mapLatitude = locationForm.watch('latitude') ?? DEFAULT_COORDINATES.latitude;
  const mapLongitude = locationForm.watch('longitude') ?? DEFAULT_COORDINATES.longitude;

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
    queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    showToast.success({ title: 'Profile updated' });
  };

  const onSaveLocation = async (values: LocationInput) => {
    try {
      await updateProfile(values);
      showToast.success({ title: 'Location updated' });
    } catch (err) {
      showToast.error({
        title: 'Could not update location',
        description: getErrorMessage(err),
      });
    }
  };

  const onSaveDietary = dietary.handleSubmit(async (values) => {
    try {
      await updateProfile(values);
      showToast.success({ title: 'Dietary settings updated' });
    } catch (err) {
      showToast.error({
        title: 'Could not update dietary settings',
        description: getErrorMessage(err),
      });
    }
  });

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
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-32 animate-pulse rounded bg-sage" />
          <div className="h-9 w-40 animate-pulse rounded bg-sage" />
          <div className="h-4 w-56 animate-pulse rounded bg-sage" />
        </div>
        <div className="h-24 w-full animate-pulse rounded-2xl bg-sage" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="h-64 w-full animate-pulse rounded-2xl bg-sage" />
          <div className="h-64 w-full animate-pulse rounded-2xl bg-sage" />
          <div className="h-64 w-full animate-pulse rounded-2xl bg-sage" />
          <div className="h-64 w-full animate-pulse rounded-2xl bg-sage" />
        </div>
      </div>
    );
  }

  const { firstName, lastName } = splitName(user.name);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      {/* Page header — matches the rest of the app */}
      <header className="flex flex-col gap-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-green">
          Account · Profile
        </div>
        <h1 className="font-display text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.05] tracking-tight text-charcoal">
          Profile.
        </h1>
        <p className="text-[14px] text-slate">Account, location, reminders.</p>
      </header>

      {/* Identity card */}
      <section className="rounded-2xl border border-sage bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green font-display text-[18px] font-semibold text-white">
            {initials(firstName, lastName)}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate font-display text-[18px] font-semibold tracking-tight text-charcoal">
              {user.name || '—'}
            </span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate">
              <span className="truncate">{user.email}</span>
              {user.emailVerified && (
                <span className="inline-flex items-center gap-1 text-dark-green">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium">Verified</span>
                </span>
              )}
              {user.role === 'admin' && (
                <span className="inline-flex items-center gap-1 rounded-full border border-green/30 bg-green/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-dark-green">
                  <ShieldCheck className="h-3 w-3" />
                  Admin
                </span>
              )}
              {user.createdAt && (
                <span className="text-[11px] text-slate/60">
                  Member since {format(new Date(user.createdAt), 'MMM yyyy')}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className={`${ghostBtn} shrink-0`}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </section>

      {/* Settings grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section icon={User} title="Personal" hint="Your name and email.">
          <form
            className="flex flex-col gap-4"
            onSubmit={accountForm.handleSubmit(onSaveAccount)}
            noValidate
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="firstName" className={labelClass}>
                  First name
                </Label>
                <Input
                  id="firstName"
                  {...accountForm.register('firstName')}
                  className={inputClass}
                />
                {accountForm.formState.errors.firstName && (
                  <p className="text-[11px] text-tomato">
                    {accountForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lastName" className={labelClass}>
                  Last name
                </Label>
                <Input id="lastName" {...accountForm.register('lastName')} className={inputClass} />
                {accountForm.formState.errors.lastName && (
                  <p className="text-[11px] text-tomato">
                    {accountForm.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className={labelClass}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                {...accountForm.register('email')}
                disabled
                className={inputClass}
              />
              <p className="text-[11px] text-slate/60">Email changes aren&apos;t supported yet.</p>
            </div>
            <button
              type="submit"
              className={`${primaryBtn} self-start`}
              disabled={accountForm.formState.isSubmitting || !accountForm.formState.isDirty}
            >
              {accountForm.formState.isSubmitting ? 'Saving…' : 'Save changes'}
              <span className="opacity-70">↵</span>
            </button>
          </form>
        </Section>

        <Section icon={MapPin} title="Location" hint="Powers nearby restaurant suggestions.">
          <form
            className="flex flex-col gap-4"
            onSubmit={locationForm.handleSubmit(onSaveLocation)}
            noValidate
          >
            <button
              type="button"
              className={`${primaryBtn} self-start`}
              onClick={detectLocation}
              disabled={isDetectingLocation}
            >
              {isDetectingLocation ? (
                <>
                  <span
                    className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white"
                    style={{ borderTopColor: 'transparent' }}
                  />
                  Detecting…
                </>
              ) : (
                <>
                  <span>◉</span>
                  Use my current location
                </>
              )}
            </button>

            <LocationMap
              latitude={mapLatitude}
              longitude={mapLongitude}
              onCoordinatesChange={setLocationCoordinates}
            />

            <button
              type="submit"
              className={`${ghostBtn} self-start`}
              disabled={locationForm.formState.isSubmitting || !locationForm.formState.isDirty}
            >
              {locationForm.formState.isSubmitting ? 'Updating…' : 'Update location'}
            </button>
          </form>
        </Section>

        <Section icon={Salad} title="Dietary" hint="Preferences and allergens the AI must respect.">
          <form className="flex flex-col gap-5" onSubmit={onSaveDietary} noValidate>
            <DietaryTagPicker
              label="Dietary preferences"
              hint="The AI plans meals around these."
              quickOptions={DIETARY_PREFERENCE_OPTIONS}
              selected={dietary.values.dietaryPreferences}
              error={dietary.errors.dietaryPreferences}
              onToggle={(tag) => dietary.actions.toggleTag('dietaryPreferences', tag)}
              onAdd={(tag) => dietary.actions.addTag('dietaryPreferences', tag)}
            />
            <DietaryTagPicker
              label="Allergens"
              hint="Hard limits — suggested meals will never include these."
              quickOptions={ALLERGEN_OPTIONS}
              selected={dietary.values.allergens}
              error={dietary.errors.allergens}
              onToggle={(tag) => dietary.actions.toggleTag('allergens', tag)}
              onAdd={(tag) => dietary.actions.addTag('allergens', tag)}
            />
            <button
              type="submit"
              className={`${ghostBtn} self-start`}
              disabled={dietary.isSubmitting || !dietary.isDirty}
            >
              {dietary.isSubmitting ? 'Saving…' : 'Save dietary settings'}
            </button>
          </form>
        </Section>

        <NotificationTimesCard />

        <FoodPreferencesCard />

        <Section icon={Lock} title="Password" hint="Keep your account secure.">
          <form
            className="flex flex-col gap-4"
            onSubmit={passwordForm.handleSubmit(onChangePassword)}
            noValidate
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="currentPassword" className={labelClass}>
                Current password
              </Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Enter current password"
                {...passwordForm.register('currentPassword')}
                className={inputClass}
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-[11px] text-tomato">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="newPassword" className={labelClass}>
                New password
              </Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                {...passwordForm.register('newPassword')}
                className={inputClass}
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-[11px] text-tomato">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword" className={labelClass}>
                Confirm new password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                {...passwordForm.register('confirmPassword')}
                className={inputClass}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-[11px] text-tomato">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              className={`${ghostBtn} self-start`}
              disabled={passwordForm.formState.isSubmitting}
            >
              {passwordForm.formState.isSubmitting ? 'Changing…' : 'Change password'}
            </button>
          </form>
        </Section>
      </div>
    </div>
  );
}
