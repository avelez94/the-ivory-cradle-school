import 'server-only'
import type { Sql } from './db'
import { db } from './db'
import { VIEWING } from './config'
import { audit } from './audit'

export class NotFoundError extends Error {}

export type CycleState = {
  cycleId: string
  cycleNo: number
  status: 'watching' | 'quiz_open' | 'locked' | 'passed'
  watchedSeconds: number
  lastPosition: number
  durationSeconds: number
  remainingSeconds: number
  viewingComplete: boolean
}

type CycleRow = {
  id: string
  cycle_no: number
  status: CycleState['status']
  watched_seconds: number
  last_position: number
  last_beat_at: Date | null
  duration: number
}

function toState(row: CycleRow): CycleState {
  const duration = Number(row.duration)
  const watched = Math.min(Number(row.watched_seconds), duration)
  return {
    cycleId: row.id,
    cycleNo: row.cycle_no,
    status: row.status,
    watchedSeconds: watched,
    lastPosition: Number(row.last_position),
    durationSeconds: duration,
    remainingSeconds: Math.max(0, duration - watched),
    viewingComplete: row.status !== 'watching',
  }
}

/** Latest viewing cycle for an enrollment, creating cycle 1 the first time. */
export async function currentCycle(enrollmentId: string, tx?: Sql): Promise<CycleState> {
  const q = tx ?? (db() as unknown as Sql)
  const select = () => q`
    select c.id, c.cycle_no, c.status, c.watched_seconds, c.last_position, c.last_beat_at, v.video_duration_seconds as duration
    from viewing_cycles c
    join enrollments e on e.id = c.enrollment_id
    join course_versions v on v.id = e.course_version_id
    where c.enrollment_id = ${enrollmentId}
    order by c.cycle_no desc limit 1`
  let rows = await select()
  if (!rows[0]) {
    await q`insert into viewing_cycles (enrollment_id, cycle_no) values (${enrollmentId}, 1) on conflict do nothing`
    rows = await select()
  }
  return toState(rows[0] as unknown as CycleRow)
}

/**
 * Records a progress report from the player.
 *
 * The server credits viewing only as fast as real time passes: each accepted report may move
 * the furthest watched point forward by no more than the time since the previous accepted
 * report (capped after pauses) plus a small network allowance. Seeking ahead, raising the
 * playback speed, editing the page, or replaying a "video ended" event cannot move it faster.
 */
export async function recordBeat(userId: string, enrollmentId: string, cycleId: string, position: number) {
  if (!Number.isFinite(position)) position = 0
  return db().begin(async (tx) => {
    const rows = await tx`
      select c.id, c.cycle_no, c.status, c.watched_seconds, c.last_position, c.last_beat_at,
             v.video_duration_seconds as duration, e.user_id,
             (select max(cycle_no) from viewing_cycles x where x.enrollment_id = c.enrollment_id) as latest_no
      from viewing_cycles c
      join enrollments e on e.id = c.enrollment_id
      join course_versions v on v.id = e.course_version_id
      where c.id = ${cycleId} and c.enrollment_id = ${enrollmentId}
      for update of c`
    const row = rows[0] as unknown as (CycleRow & { user_id: string; latest_no: number }) | undefined
    if (!row || row.user_id !== userId) throw new NotFoundError()

    const duration = Number(row.duration)
    const pos = Math.min(Math.max(0, position), duration)
    // Reports for an older cycle, or after viewing is complete, only remember the playback position.
    if (row.cycle_no !== row.latest_no || row.status !== 'watching') {
      if (row.cycle_no === row.latest_no) await tx`update viewing_cycles set last_position = ${pos} where id = ${row.id}`
      return { ...toState({ ...row, last_position: pos }), credited: 0, accepted: false }
    }

    const now = Date.now()
    const last = row.last_beat_at ? new Date(row.last_beat_at).getTime() : null
    const elapsed = last === null ? 0 : (now - last) / 1000
    const watched = Number(row.watched_seconds)

    if (last !== null && elapsed < VIEWING.minBeatGapSeconds) {
      await tx`update viewing_cycles set last_position = ${pos} where id = ${row.id}`
      return { ...toState({ ...row, last_position: pos }), credited: 0, accepted: false }
    }

    const allowance = last === null ? VIEWING.toleranceSeconds : Math.min(elapsed, VIEWING.maxCreditGapSeconds) + VIEWING.toleranceSeconds
    let newWatched = Math.max(watched, Math.min(pos, watched + allowance))
    let status: CycleState['status'] = 'watching'
    if (newWatched >= duration - VIEWING.completionToleranceSeconds) {
      newWatched = duration
      status = 'quiz_open'
    }
    const credited = newWatched - watched
    const [updated] = await tx`
      update viewing_cycles
      set watched_seconds = ${newWatched}, last_position = ${pos}, last_beat_at = now(), beats = beats + 1,
          status = ${status},
          viewing_completed_at = case when ${status} = 'quiz_open' then now() else viewing_completed_at end,
          completed_by = case when ${status} = 'quiz_open' then 'viewing' else completed_by end
      where id = ${row.id}
      returning id, cycle_no, status, watched_seconds, last_position, last_beat_at`
    return { ...toState({ ...(updated as unknown as CycleRow), duration }), credited, accepted: true }
  })
}

/** After three failed attempts the student starts a new cycle and must watch again from the beginning. */
export async function startRewatch(userId: string, enrollmentId: string) {
  return db().begin(async (tx) => {
    const [e] = await tx`select id, user_id, status from enrollments where id = ${enrollmentId} for update`
    if (!e || e.user_id !== userId) throw new NotFoundError()
    const cycle = await currentCycle(enrollmentId, tx)
    if (cycle.status === 'watching') return cycle
    if (cycle.status !== 'locked') return cycle
    await tx`insert into viewing_cycles (enrollment_id, cycle_no) values (${enrollmentId}, ${cycle.cycleNo + 1})`
    return currentCycle(enrollmentId, tx)
  })
}

/** Staff can complete required viewing for a student who needs an accessible alternative. */
export async function grantViewingAccommodation(staffId: string, enrollmentId: string, reason: string) {
  return db().begin(async (tx) => {
    await tx`select id from enrollments where id = ${enrollmentId} for update`
    const cycle = await currentCycle(enrollmentId, tx)
    if (cycle.status !== 'watching') return cycle
    await tx`update viewing_cycles
      set status = 'quiz_open', watched_seconds = ${cycle.durationSeconds}, viewing_completed_at = now(), completed_by = 'accommodation'
      where id = ${cycle.cycleId}`
    await audit({ entityType: 'enrollment', entityId: enrollmentId, action: 'viewing_accommodation', actorId: staffId, reason, details: { cycleNo: cycle.cycleNo } }, tx)
    return currentCycle(enrollmentId, tx)
  })
}
