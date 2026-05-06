import { db, type Session, type SessionSet, type Unit, type WeightMode } from "@/db/schema";

export interface RoutineExerciseFull {
  id: string;
  exercise_id: string;
  order_in_routine: number;
  target_sets: number;
  target_reps_min: number;
  target_reps_max: number;
  rest_seconds: number;
  exercise: {
    id: string;
    name_es: string;
    name_en: string;
    equipment: string;
    default_weight_mode: WeightMode;
  };
}

export async function getRoutineExercises(routineId: string): Promise<RoutineExerciseFull[]> {
  const links = await db.routineExercises
    .where("routine_id")
    .equals(routineId)
    .sortBy("order_in_routine");
  const result: RoutineExerciseFull[] = [];
  for (const link of links) {
    const ex = await db.exercises.get(link.exercise_id);
    if (!ex) continue;
    result.push({
      id: link.id,
      exercise_id: link.exercise_id,
      order_in_routine: link.order_in_routine,
      target_sets: link.target_sets,
      target_reps_min: link.target_reps_min,
      target_reps_max: link.target_reps_max,
      rest_seconds: link.rest_seconds,
      exercise: {
        id: ex.id,
        name_es: ex.name_es,
        name_en: ex.name_en,
        equipment: ex.equipment,
        default_weight_mode: ex.default_weight_mode,
      },
    });
  }
  return result;
}

/** Latest set captured for a given exercise across all sessions. */
export async function getLatestSetForExercise(exerciseId: string): Promise<SessionSet | null> {
  const sets = await db.sessionSets.where("exercise_id").equals(exerciseId).toArray();
  if (sets.length === 0) return null;
  // Order by session.started_at desc, then set_number asc -> we want the last touched
  const sessionIds = Array.from(new Set(sets.map((s) => s.session_id)));
  const sessions = await db.sessions.bulkGet(sessionIds);
  const sessionByIdEntries: [string, Session][] = sessions
    .filter((s): s is Session => Boolean(s))
    .map((s) => [s.id, s]);
  const sessionById = new Map<string, Session>(sessionByIdEntries);
  sets.sort((a, b) => {
    const sa = sessionById.get(a.session_id)?.started_at ?? "";
    const sb = sessionById.get(b.session_id)?.started_at ?? "";
    if (sa !== sb) return sb.localeCompare(sa);
    return b.set_number - a.set_number;
  });
  return sets[0];
}

/** All sets for an exercise within a specific session, ordered by set_number. */
export async function getSessionSetsForExercise(
  sessionId: string,
  exerciseId: string
): Promise<SessionSet[]> {
  const sets = await db.sessionSets
    .where("session_id")
    .equals(sessionId)
    .and((s) => s.exercise_id === exerciseId)
    .toArray();
  sets.sort((a, b) => a.set_number - b.set_number);
  return sets;
}

/** Find or create the active session for today + routine. */
export async function getOrCreateTodaySession(
  routineId: string,
  weekNumber: number
): Promise<Session> {
  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const existing = await db.sessions
    .where("routine_id")
    .equals(routineId)
    .and((s) => {
      const t = new Date(s.started_at).getTime();
      return t >= todayStart.getTime() && t <= todayEnd.getTime();
    })
    .first();
  if (existing) return existing;

  const session: Session = {
    id: crypto.randomUUID(),
    routine_id: routineId,
    started_at: today.toISOString(),
    week_number: weekNumber,
    location: "home",
  };
  await db.sessions.put(session);
  return session;
}

export async function upsertSet(set: SessionSet): Promise<void> {
  await db.sessionSets.put(set);
}

export async function deleteSet(setId: string): Promise<void> {
  await db.sessionSets.delete(setId);
}

/** Track a weight as available at a location (for progression suggestions). */
export async function rememberAvailableWeight(opts: {
  location: string;
  equipment: string;
  value: number;
  unit: Unit;
}): Promise<void> {
  const id = `${opts.location}|${opts.equipment}|${opts.unit}|${opts.value}`;
  await db.availableWeights.put({
    id,
    location: opts.location as never,
    equipment: opts.equipment as never,
    value: opts.value,
    unit: opts.unit,
  });
}
