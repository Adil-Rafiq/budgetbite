import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CreatePlanDialog } from '@/app/plans/_components/create-plan/create-plan-dialog';

export function PlansPageHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Budget Plans</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your current and past food budgets.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          New Plan
        </Button>
      </div>

      <CreatePlanDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
