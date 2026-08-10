'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SignUpForm from '@/components/auth/signup-form';
import LeftPanel from '@/components/auth/left-panel';

export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
      router.push('/dashboard');
    }
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
    >
      <div className="relative flex w-full max-w-6xl min-h-[500px] sm:min-h-[600px] rounded-2xl overflow-hidden shadow-lg border-2 border-white">
        <LeftPanel type="signup" />
        
        <SignUpForm />
      </div>
    </div>
  );
}
