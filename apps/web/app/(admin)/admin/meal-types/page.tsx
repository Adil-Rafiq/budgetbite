'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { can, type MealType } from '@repo/shared';
import { useUser } from '@/hooks/use-user';
import { useAdminMealTypes, useDeleteAdminMealType } from '@/hooks/use-admin-meal-types';
import { MealTypeFormModal } from '../../_components/meal-type-form-modal';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function AdminMealTypesPage() {
  const { data: user } = useUser();
  const canDelete = user ? can(user.role, 'meal-type:delete') : false;
  const canWrite = user ? can(user.role, 'meal-type:write') : false;

  const [form, setForm] = useState<{ open: boolean; mealType?: MealType }>({ open: false });

  const { data, isLoading, isError } = useAdminMealTypes();
  const deleteMealType = useDeleteAdminMealType();

  const rows = [...(data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1
            className="text-vast"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            Meal types
          </h1>
          <p className="mt-1 text-[14px] text-ink">Manage the meal types users can plan around.</p>
        </div>
        {canWrite && (
          <Button size="sm" onClick={() => setForm({ open: true })}>
            <Plus className="size-4" />
            Add meal type
          </Button>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-lumen-dk bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="size-5 text-soft" />
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-[14px] text-soft">
            Could not load meal types. Try again.
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-soft">No meal types yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-right">Order</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Status</TableHead>
                {(canWrite || canDelete) && <TableHead className="w-20" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((mt) => {
                const isDeleting = deleteMealType.isPending && deleteMealType.variables === mt.id;
                return (
                  <TableRow key={mt.id}>
                    <TableCell className="text-right text-soft">{mt.sortOrder}</TableCell>
                    <TableCell>
                      <span
                        className="text-[13px] text-ink"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {mt.key}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-vast">{mt.label}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                          mt.active ? 'bg-fathom/10 text-fathom' : 'bg-lumen-dk/40 text-soft'
                        }`}
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {mt.active ? 'active' : 'inactive'}
                      </span>
                    </TableCell>
                    {(canWrite || canDelete) && (
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {canWrite && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Edit ${mt.label}`}
                              onClick={() => setForm({ open: true, mealType: mt })}
                            >
                              <Pencil className="size-4 text-ink" />
                            </Button>
                          )}
                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Delete ${mt.label}`}
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? (
                                    <Spinner className="size-4" />
                                  ) : (
                                    <Trash2 className="size-4 text-destructive" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete {mt.label}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This can&apos;t be undone. Meal types referenced by an existing
                                    plan can&apos;t be deleted.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-white hover:bg-destructive/90"
                                    onClick={() => deleteMealType.mutate(mt.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {form.open && (
        <MealTypeFormModal
          key={form.mealType?.id ?? 'new'}
          open={form.open}
          mealType={form.mealType}
          onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
        />
      )}
    </div>
  );
}
