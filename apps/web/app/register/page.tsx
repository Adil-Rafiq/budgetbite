'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UtensilsCrossed } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { registerSchema, type RegisterInput } from '@repo/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast, type Toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    const { error } = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
    });

    if (error) {
      const toastOptions: Toast = {
        title: 'Registration failed',
        description: error.message,
        variant: 'destructive',
      };

      if (error.status === 422) {
        toastOptions.action = (
          <ToastAction altText="Go to login" onClick={() => router.push('/login')}>
            Login
          </ToastAction>
        );
      }

      toast(toastOptions);

      console.error(error.message);
      return;
    }

    toast({
      title: 'Registration successful',
      description: 'Your account has been created. Redirecting to onboarding...',
    });
    router.push('/onboarding');
  };

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({ provider: 'google' });
  };

  const handleGithubSignIn = async () => {
    await authClient.signIn.social({ provider: 'github' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
              <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-muted-foreground text-sm mt-1">Start planning your meals today</p>
        </div>

        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-card-foreground">Sign up</CardTitle>
            <CardDescription>Fill in your details to get started</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" placeholder="Ahmed" {...register('firstName')} />
                  {errors.firstName && (
                    <p className="text-destructive text-xs">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" placeholder="Khan" {...register('lastName')} />
                  {errors.lastName && (
                    <p className="text-destructive text-xs">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ahmed@example.com"
                  {...register('email')}
                />
                {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-destructive text-xs">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <div className="relative my-2">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                or continue with
              </span>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleGoogleSignIn}>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleGithubSignIn}>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
