'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { can, type MealType } from '@repo/shared';
import { useUser } from '@/hooks/use-user';
import {
  useAdminMealTypes,
  useDeleteAdminMealType,
  useUpdateAdminMealType,
} from '@/hooks/use-admin-meal-types';
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
  const updateMealType = useUpdateAdminMealType();

  const rows = [...(data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  // Reorder by swapping sortOrder with the adjacent row. Two writes; the list
  // re-sorts on invalidation. No-op at the ends.
  const move = (index: number, dir: -1 | 1) => {
    const a = rows[index];
    const b = rows[index + dir];
    if (!a || !b) return;
    updateMealType.mutate({ id: a.id, input: { sortOrder: b.sortOrder } });
    updateMealType.mutate({ id: b.id, input: { sortOrder: a.sortOrder } });
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-charcoal">
            Meal types
          </h1>
          <p className="mt-1 text-[14px] text-slate">Manage the meal types users can plan around.</p>
        </div>
        {canWrite && (
          <Button size="sm" onClick={() => setForm({ open: true })}>
            <Plus className="size-4" />
            Add meal type
          </Button>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-sage bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="size-5 text-slate/60" />
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-[14px] text-slate/60">
            Could not load meal types. Try again.
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-slate/60">No meal types yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-right">Order</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Status</TableHead>
                {(canWrite || canDelete) && <TableHead className="w-32" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((mt, index) => {
                const isDeleting = deleteMealType.isPending && deleteMealType.variables === mt.id;
                return (
                  <TableRow key={mt.id}>
                    <TableCell className="text-right text-slate/60">{mt.sortOrder}</TableCell>
                    <TableCell>
                      <span
                        className="text-[13px] text-slate"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {mt.key}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-charcoal">{mt.label}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[11px] ${
                          mt.active ? 'bg-green/15 text-dark-green' : 'bg-sage/50 text-slate/60'
                        }`}
                      >
                        {mt.active ? 'active' : 'inactive'}
                      </span>
                    </TableCell>
                    {(canWrite || canDelete) && (
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {canWrite && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Move ${mt.label} up`}
                                disabled={index === 0 || updateMealType.isPending}
                                onClick={() => move(index, -1)}
                              >
                                <ChevronUp className="size-4 text-slate" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Move ${mt.label} down`}
                                disabled={index === rows.length - 1 || updateMealType.isPending}
                                onClick={() => move(index, 1)}
                              >
                                <ChevronDown className="size-4 text-slate" />
                              </Button>
                            </>
                          )}
                          {canWrite && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Edit ${mt.label}`}
                              onClick={() => setForm({ open: true, mealType: mt })}
                            >
                              <Pencil className="size-4 text-slate" />
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
