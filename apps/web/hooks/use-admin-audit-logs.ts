import { useQuery } from '@tanstack/react-query';
import type { ListAuditLogsQuery } from '@repo/shared';

import { adminApi } from '@/lib/api/endpoints/admin';

const ADMIN_AUDIT_LOGS_KEY = ['admin', 'audit-logs'] as const;

export const useAdminAuditLogs = (query: Partial<ListAuditLogsQuery>) =>
  useQuery({
    queryKey: [...ADMIN_AUDIT_LOGS_KEY, query] as const,
    queryFn: () => adminApi.listAuditLogs(query),
  });
