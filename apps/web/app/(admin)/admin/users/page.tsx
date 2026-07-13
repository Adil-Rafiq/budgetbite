'use client';

import { useEffect, useState } from 'react';
import { can } from '@repo/shared';
import { useUser } from '@/hooks/use-user';
import { useAdminUsers, useUpdateAdminUserRole } from '@/hooks/use-admin-users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const { data: currentUser } = useUser();
  const canWrite = currentUser ? can(currentUser.role, 'user:write') : false;

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setOffset(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError } = useAdminUsers({
    limit: PAGE_SIZE,
    offset,
    q: debouncedSearch || undefined,
    role: roleFilter === 'all' ? undefined : (roleFilter as 'user' | 'admin'),
  });

  const updateRole = useUpdateAdminUserRole();

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-[26px] font-semibold tracking-tight text-charcoal">Users</h1>
      <p className="mt-1 text-[14px] text-slate">Manage accounts and admin access.</p>

      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="max-w-xs bg-white"
          />
          <Select
            value={roleFilter}
            onValueChange={(v) => {
              setRoleFilter(v);
              setOffset(0);
            }}
          >
            <SelectTrigger className="w-36 bg-white">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {total > 0 && <span className="font-mono text-[12px] text-slate/60">{total} total</span>}
      </div>

      <div className="mt-4 rounded-xl border border-sage bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="size-5 text-slate/60" />
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-[14px] text-slate/60">
            Could not load users. Try again.
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-slate/60">No users match.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                {canWrite && <TableHead className="w-32" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => {
                const isSelf = currentUser?.id === u.id;
                const nextRole = u.role === 'admin' ? 'user' : 'admin';
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-charcoal">{u.name}</TableCell>
                    <TableCell className="text-slate">{u.email}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[11px] ${
                          u.role === 'admin'
                            ? 'bg-green/15 text-dark-green'
                            : 'bg-sage/50 text-slate/60'
                        }`}
                      >
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate/60">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    {canWrite && (
                      <TableCell>
                        {isSelf ? (
                          <span className="text-[12px] text-slate/60">You</span>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" disabled={updateRole.isPending}>
                                {nextRole === 'admin' ? 'Make admin' : 'Make user'}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {nextRole === 'admin'
                                    ? `Grant admin to ${u.name}?`
                                    : `Remove admin from ${u.name}?`}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {nextRole === 'admin'
                                    ? 'They will be able to manage all admin resources.'
                                    : 'They will lose access to the admin area.'}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    updateRole.mutate({ id: u.id, input: { role: nextRole } })
                                  }
                                >
                                  Confirm
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-[12px] text-slate/60">
            Page {page} of {pageCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pageCount}
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
