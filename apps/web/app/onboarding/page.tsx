'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  UtensilsCrossed,
  MapPin,
  Wallet,
  Bell,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useUpdateProfile } from '@/hooks/use-user';
import { updateUserProfileSchema, type UpdateUserProfileInput } from '@repo/shared';
import { showToast } from '@/lib/toast';

const steps = [
  {
    icon: MapPin,
    title: 'Set your location',
    description: 'We use this to find nearby restaurants',
  },
  { icon: Wallet, title: 'Create your budget plan', description: 'Set up your first meal budget' },
  { icon: Bell, title: 'Notification times', description: 'When should we remind you to order?' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { mutateAsync: updateProfile } = useUpdateProfile();

  const [currentStep, setCurrentStep] = useState(0);
  const [planType, setPlanType] = useState('monthly');
  const [mealTypes, setMealTypes] = useState<string[]>(['breakfast', 'lunch', 'dinner']);
  const [notificationTimes, setNotificationTimes] = useState(['08:00', '13:00', '20:00']);

  const locationForm = useForm<UpdateUserProfileInput>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      latitude: 24.8607,
      longitude: 67.0011,
    },
  });

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];
  if (!currentStepData) return null;
  const StepIcon = currentStepData.icon;

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

  // called when user clicks Continue on step 0 (location)
  const handleLocationContinue = locationForm.handleSubmit(async (data) => {
    await updateProfile(data, {
      onError: (err) => {
        showToast.error({
          title: 'Failed to save location',
          description: err.message,
        });
      },
    });
    setCurrentStep((s) => s + 1);
  });

  const handleContinue = async () => {
    if (currentStep === 0) {
      await handleLocationContinue();
      return;
    }
    setCurrentStep((s) => s + 1);
  };

  const handleFinish = async () => {
    // TODO: save budget plan + notification times to API
    // For now just navigate
    showToast.success({
      title: 'Setup complete!',
      description: 'Welcome to BudgetBite.',
    });
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary mb-4">
            <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Set up BudgetBite</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Step {currentStep + 1} of {steps.length}
          </p>
          <Progress value={progress} className="w-full max-w-xs mt-4 h-2" />
        </div>

        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <StepIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg text-card-foreground">
                  {currentStepData.title}
                </CardTitle>
                <CardDescription>{currentStepData.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {currentStep === 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.0001"
                    placeholder="24.8607"
                    {...locationForm.register('latitude', { valueAsNumber: true })}
                  />
                  {locationForm.formState.errors.latitude && (
                    <p className="text-destructive text-xs">
                      {locationForm.formState.errors.latitude.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.0001"
                    placeholder="67.0011"
                    {...locationForm.register('longitude', { valueAsNumber: true })}
                  />
                  {locationForm.formState.errors.longitude && (
                    <p className="text-destructive text-xs">
                      {locationForm.formState.errors.longitude.message}
                    </p>
                  )}
                </div>
                <div className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Default: Karachi, Pakistan. Adjust if needed.
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Plan type</Label>
                  <Select value={planType} onValueChange={setPlanType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="budget">Total budget (PKR)</Label>
                  <Input id="budget" type="number" placeholder="45000" defaultValue="45000" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="mealsPerDay">Meals per day (1-5)</Label>
                  <Input id="mealsPerDay" type="number" min={1} max={5} defaultValue={3} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Meal types</Label>
                  <div className="flex flex-wrap gap-3">
                    {['breakfast', 'lunch', 'dinner'].map((type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={mealTypes.includes(type)}
                          onCheckedChange={() => toggleMealType(type)}
                        />
                        <span className="text-sm capitalize text-foreground">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="flex flex-col gap-4">
                {notificationTimes.map((time, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => updateNotificationTime(index, e.target.value)}
                      className="flex-1"
                    />
                    {notificationTimes.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeNotificationTime(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                        <span className="sr-only">Remove time</span>
                      </Button>
                    )}
                  </div>
                ))}
                {notificationTimes.length < 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addNotificationTime}
                    className="self-start"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add time
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleContinue} disabled={locationForm.formState.isSubmitting}>
              {locationForm.formState.isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 ml-1" />
              )}
              Continue
            </Button>
          ) : (
            <Button onClick={handleFinish}>
              Finish setup
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
