import { MapPin, Wallet, Bell } from 'lucide-react';

export const ONBOARDING_STEPS = [
  {
    icon: MapPin,
    title: 'Set your location',
    description: 'We use this to find nearby restaurants',
  },
  { icon: Wallet, title: 'Create your budget plan', description: 'Set up your first meal budget' },
  { icon: Bell, title: 'Notification times', description: 'When should we remind you to order?' },
] as const;
