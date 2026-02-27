'use client';

import { authClient } from '@/lib/auth-client';
import { useState } from 'react';

export default function SignUp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitSignupForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name: 'Adil',
        callbackURL: '/dashboard',
      });

      if (error) {
        setError(error.message as string);
      } else {
        console.log('Signup successful', data);
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <section>
        <h1>Sign up Using Email and Password</h1>

        <form
          onSubmit={submitSignupForm}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            justifyContent: 'center',
            alignItems: 'flex-start',
            marginTop: '2rem',
          }}
        >
          <input type="email" name="email" id="email" required />
          <input type="password" name="password" id="password" required />

          <button type="submit" disabled={loading}>
            {loading ? 'Signing up...' : 'Sign up'}
          </button>

          {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
      </section>
    </main>
  );
}
