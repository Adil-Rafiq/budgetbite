import { aiCallLogRepository, type NewAiCallLog } from '@repo/database';

export type AICallLogEntry = Omit<NewAiCallLog, 'id' | 'createdAt'>;

/**
 * Write one ai_call_log row, fire-and-forget. Observability must never fail
 * or slow the request path, so the insert is detached and errors are logged
 * instead of thrown.
 */
export function logAICall(entry: AICallLogEntry): void {
  void aiCallLogRepository.create(entry).catch((err) => {
    console.error('[aiCallLog] failed to write ai_call_log row', err);
  });
}
