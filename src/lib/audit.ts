import 'server-only'
import type { Sql } from './db'
import { db } from './db'

type AuditEntry = {
  entityType: string
  entityId?: string | null
  action: string
  actorId?: string | null
  reason?: string | null
  details?: Record<string, unknown>
}

export async function audit(entry: AuditEntry, tx?: Sql) {
  const q = tx ?? (db() as unknown as Sql)
  await q`insert into audit_events (entity_type, entity_id, action, actor_id, reason, details)
    values (${entry.entityType}, ${entry.entityId ?? null}, ${entry.action}, ${entry.actorId ?? null}, ${entry.reason ?? null},
      ${q.json((entry.details ?? {}) as never)})`
}
