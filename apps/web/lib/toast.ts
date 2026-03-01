import { toast } from 'sonner';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const showToast = ({ title, description, variant = 'info', action }: ToastOptions) => {
  toast[variant](title, { description, action });
};

showToast.success = (options: Omit<ToastOptions, 'variant'>) =>
  showToast({ ...options, variant: 'success' });

showToast.error = (options: Omit<ToastOptions, 'variant'>) =>
  showToast({ ...options, variant: 'error' });

showToast.warning = (options: Omit<ToastOptions, 'variant'>) =>
  showToast({ ...options, variant: 'warning' });

showToast.info = (options: Omit<ToastOptions, 'variant'>) =>
  showToast({ ...options, variant: 'info' });
