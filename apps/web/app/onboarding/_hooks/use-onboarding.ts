'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateProfile, useUser } from '@/hooks/use-user';
import { updateUserProfileSchema, type UpdateUserProfileInput } from '@repo/shared';
import { showToast } from '@/lib/toast';
import { ONBOARDING_STEPS } from '../constants';

export const useOnboarding = () => {
  const router = useRouter();
  const { data: session } = useUser();
  const { mutateAsync: updateProfile } = useUpdateProfile();

  const [currentStep, setCurrentStep] = useState(0);
  const [planType, setPlanType] = useState('monthly');
  const [mealTypes, setMealTypes] = useState<string[]>(['breakfast', 'lunch', 'dinner']);
  const [notificationTimes, setNotificationTimes] = useState(['08:00', '13:00', '20:00']);

  const locationForm = useForm<UpdateUserProfileInput>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      latitude: session?.profile?.latitude ?? 24.8607,
      longitude: session?.profile?.longitude ?? 67.0011,
    },
  });

  // Update location form with session data once it's available
  useEffect(() => {
    if (session?.profile) {
      locationForm.reset({
        latitude: session.profile.latitude ?? 24.8607,
        longitude: session.profile.longitude ?? 67.0011,
      });
    }
  }, [session, locationForm]);

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  const currentStepData = ONBOARDING_STEPS[currentStep];

  const toggleMealType = (type: string) => {
    setMealTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const addNotificationTime = () => setNotificationTimes((prev) => [...prev, '12:00']);

  const removeNotificationTime = (index: number) =>
    setNotificationTimes((prev) => prev.filter((_, i) => i !== index));

  const updateNotificationTime = (index: number, value: string) =>
    setNotificationTimes((prev) => prev.map((t, i) => (i === index ? value : t)));

  const handleContinue = async () => {
    if (currentStep === 0) {
      await new Promise<void>((resolve, reject) => {
        locationForm.handleSubmit(async (data) => {
          try {
            await updateProfile(data);
            setCurrentStep((s) => s + 1);
            resolve();
          } catch (err) {
            showToast.error({
              title: 'Failed to save location',
              description: err instanceof Error ? err.message : 'Something went wrong',
            });
            reject(err);
          }
        })();
      });
      return;
    }
    setCurrentStep((s) => s + 1);
  };

  const handleBack = () => setCurrentStep((s) => s - 1);

  const handleFinish = async () => {
    // TODO: save budget plan + notification times
    showToast.success({ title: 'Setup complete!', description: 'Welcome to BudgetBite.' });
    router.push('/dashboard');
  };

  return {
    currentStep,
    progress,
    currentStepData,
    planType,
    setPlanType,
    mealTypes,
    notificationTimes,
    locationForm,
    toggleMealType,
    addNotificationTime,
    removeNotificationTime,
    updateNotificationTime,
    handleContinue,
    handleBack,
    handleFinish,
    isLastStep: currentStep === ONBOARDING_STEPS.length - 1,
    isSubmitting: locationForm.formState.isSubmitting,
  };
};
