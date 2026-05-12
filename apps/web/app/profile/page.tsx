'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogOut, Lock, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useUpdateProfile, useUser } from '@/hooks/use-user';
import { authClient } from '@/lib/auth-client';
import { showToast } from '@/lib/toast';
import { getErrorMessage } from '@/lib/api/errors';
import { NotificationTimesCard } from '@/app/profile/_components/notification-times-card';

// ─── Wispr palette ───────────────────────────────────────────────────────────

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const PULSE = '#7f1c34';
const AMBER = '#b8741a';
const WHITE = '#ffffff';
const MUTED = '#71716a';
const SOFT = '#a6a691';

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

// ─── Reusable bits ───────────────────────────────────────────────────────────

function Panel({
  code,
  title,
  description,
  tint,
  Icon,
  children,
}: {
  code: string;
  title: string;
  description: string;
  tint: string;
  Icon: typeof MapPin;
  children: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        background: WHITE,
        border: `1px solid ${LUMEN_DK}`,
        boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
      }}
    >
      <div
        className="flex items-center justify-between gap-3 border-b px-5 py-4"
        style={{ borderColor: LUMEN_DK, background: LUMEN }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: `${tint}14`, color: tint }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span
              className="text-[10px] uppercase"
              style={{ fontFamily: 'var(--font-mono)', color: SOFT, letterSpacing: '0.22em' }}
            >
              {code}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                fontWeight: 600,
                color: VAST,
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </span>
          </div>
        </div>
        <p className="hidden text-right text-[12px] sm:block" style={{ color: MUTED, maxWidth: 280 }}>
          {description}
        </p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="inline-flex items-center gap-2 self-start rounded-full px-5 py-2.5 text-[13px] font-medium transition disabled:opacity-40"
      style={{ background: VAST, color: LUMEN }}
    >
      {children}
    </button>
  );
}

function OutlineButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-[13px] transition disabled:opacity-40"
      style={{ border: `1px solid ${LUMEN_DK}`, background: WHITE, color: VAST }}
    >
      {children}
    </button>
  );
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
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="h-10 w-40 animate-pulse rounded" style={{ background: LUMEN_DK }} />
        <div className="h-48 w-full animate-pulse rounded-2xl" style={{ background: LUMEN_DK }} />
        <div className="h-40 w-full animate-pulse rounded-2xl" style={{ background: LUMEN_DK }} />
        <div className="h-56 w-full animate-pulse rounded-2xl" style={{ background: LUMEN_DK }} />
      </div>
    );
  }

  const { firstName, lastName } = splitName(user.name);
  const inputStyle = { background: LUMEN, borderColor: LUMEN_DK, color: VAST };
  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    color: SOFT,
    letterSpacing: '0.18em',
  };
  const errStyle: React.CSSProperties = { color: PULSE, fontFamily: 'var(--font-mono)' };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div
            className="text-[10px] uppercase"
            style={{ fontFamily: 'var(--font-mono)', color: FATHOM, letterSpacing: '0.22em' }}
          >
            account · /profile
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 3.6vw, 40px)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              color: VAST,
            }}
          >
            Profile.
          </h1>
          <p className="text-[14px]" style={{ color: MUTED }}>
            Account, location, reminders.
          </p>
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] transition disabled:opacity-40"
          style={{ border: `1px solid ${LUMEN_DK}`, background: WHITE, color: VAST }}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </header>

      {/* Profile info */}
      <Panel
        code="01"
        title={user.name || '—'}
        description={user.email}
        tint={FATHOM}
        Icon={MapPin}
      >
        <div className="flex items-center gap-4 pb-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-[18px] font-semibold"
            style={{ background: FATHOM, color: LUMEN, fontFamily: 'var(--font-display)' }}
          >
            {initials(firstName, lastName)}
          </div>
          <div>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 600,
                color: VAST,
              }}
            >
              {user.name || '—'}
            </p>
            <p className="text-[13px]" style={{ color: MUTED }}>
              {user.email}
            </p>
          </div>
        </div>

        <form
          className="flex flex-col gap-4"
          onSubmit={accountForm.handleSubmit(onSaveAccount)}
          noValidate
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName" className="text-[10px] uppercase" style={labelStyle}>
                First name
              </Label>
              <Input id="firstName" {...accountForm.register('firstName')} style={inputStyle} />
              {accountForm.formState.errors.firstName && (
                <p className="text-[11px]" style={errStyle}>
                  {accountForm.formState.errors.firstName.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName" className="text-[10px] uppercase" style={labelStyle}>
                Last name
              </Label>
              <Input id="lastName" {...accountForm.register('lastName')} style={inputStyle} />
              {accountForm.formState.errors.lastName && (
                <p className="text-[11px]" style={errStyle}>
                  {accountForm.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-[10px] uppercase" style={labelStyle}>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              {...accountForm.register('email')}
              disabled
              style={inputStyle}
            />
            <p className="text-[11px]" style={{ color: SOFT, fontFamily: 'var(--font-mono)' }}>
              email changes aren&apos;t supported yet.
            </p>
          </div>
          <PrimaryButton
            type="submit"
            disabled={accountForm.formState.isSubmitting || !accountForm.formState.isDirty}
          >
            {accountForm.formState.isSubmitting ? 'Saving…' : 'Save changes'}
            <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>↵</span>
          </PrimaryButton>
        </form>
      </Panel>

      {/* Location */}
      <Panel
        code="02"
        title="Location"
        description="Powers nearby restaurant suggestions."
        tint={AMBER}
        Icon={MapPin}
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={locationForm.handleSubmit(onSaveLocation)}
          noValidate
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="lat" className="text-[10px] uppercase" style={labelStyle}>
                Latitude
              </Label>
              <Input
                id="lat"
                type="number"
                step="0.0001"
                {...locationForm.register('latitude', { valueAsNumber: true })}
                style={inputStyle}
              />
              {locationForm.formState.errors.latitude && (
                <p className="text-[11px]" style={errStyle}>
                  {locationForm.formState.errors.latitude.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lng" className="text-[10px] uppercase" style={labelStyle}>
                Longitude
              </Label>
              <Input
                id="lng"
                type="number"
                step="0.0001"
                {...locationForm.register('longitude', { valueAsNumber: true })}
                style={inputStyle}
              />
              {locationForm.formState.errors.longitude && (
                <p className="text-[11px]" style={errStyle}>
                  {locationForm.formState.errors.longitude.message}
                </p>
              )}
            </div>
          </div>
          <OutlineButton
            type="submit"
            disabled={locationForm.formState.isSubmitting || !locationForm.formState.isDirty}
          >
            {locationForm.formState.isSubmitting ? 'Updating…' : 'Update location'}
          </OutlineButton>
        </form>
      </Panel>

      {/* Notification times — active plan */}
      <NotificationTimesCard />

      {/* Change password */}
      <Panel
        code="03"
        title="Change password"
        description="Keep your account secure."
        tint={PULSE}
        Icon={Lock}
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={passwordForm.handleSubmit(onChangePassword)}
          noValidate
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="currentPassword" className="text-[10px] uppercase" style={labelStyle}>
              Current password
            </Label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="Enter current password"
              {...passwordForm.register('currentPassword')}
              style={inputStyle}
            />
            {passwordForm.formState.errors.currentPassword && (
              <p className="text-[11px]" style={errStyle}>
                {passwordForm.formState.errors.currentPassword.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="newPassword" className="text-[10px] uppercase" style={labelStyle}>
              New password
            </Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Enter new password"
              {...passwordForm.register('newPassword')}
              style={inputStyle}
            />
            {passwordForm.formState.errors.newPassword && (
              <p className="text-[11px]" style={errStyle}>
                {passwordForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword" className="text-[10px] uppercase" style={labelStyle}>
              Confirm new password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              {...passwordForm.register('confirmPassword')}
              style={inputStyle}
            />
            {passwordForm.formState.errors.confirmPassword && (
              <p className="text-[11px]" style={errStyle}>
                {passwordForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
          <OutlineButton type="submit" disabled={passwordForm.formState.isSubmitting}>
            {passwordForm.formState.isSubmitting ? 'Changing…' : 'Change password'}
          </OutlineButton>
        </form>
      </Panel>
    </div>
  );
}
