import {
  db,
  type Exercise,
  type Routine,
  type RoutineExercise,
  type Session,
  type SessionSet,
  type BodyweightLog,
} from "@/db/schema";

interface SeedShape {
  meta?: {
    start_date?: string;
    weight_initial_kg?: number;
    weight_target_kg?: number;
  };
  exercises: Exercise[];
  routines: Routine[];
  routine_exercises: RoutineExercise[];
  sessions: Session[];
  session_sets: SessionSet[];
  bodyweight: BodyweightLog[];
}

const SEED_FLAG_KEY = "seed_loaded_at";
const META_KEY = "program_meta";

/**
 * Load seed.json into Dexie if the DB is empty (first run).
 * Idempotent: if already loaded, no-op. Returns true if seed was loaded.
 */
export async function loadSeedIfEmpty(): Promise<boolean> {
  const existingFlag = await db.settings.get(SEED_FLAG_KEY);
  if (existingFlag) return false;

  const exerciseCount = await db.exercises.count();
  if (exerciseCount > 0) {
    // DB has data but no flag -> mark as loaded to avoid future re-imports
    await db.settings.put({ key: SEED_FLAG_KEY, value: new Date().toISOString() });
    return false;
  }

  // Fetch seed.json from the deployed assets. Path is relative because
  // base="./" in vite.config — works on both localhost and GitHub Pages sub-path.
  const url = `${import.meta.env.BASE_URL}seed.json`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    console.warn("[seed] fetch failed, skipping seed load", err);
    return false;
  }
  if (!res.ok) {
    console.warn("[seed] no seed.json at", url, res.status);
    return false;
  }

  const data = (await res.json()) as SeedShape;

  await db.transaction(
    "rw",
    [
      db.exercises,
      db.routines,
      db.routineExercises,
      db.sessions,
      db.sessionSets,
      db.bodyweight,
      db.settings,
    ],
    async () => {
      await db.exercises.bulkPut(data.exercises);
      await db.routines.bulkPut(data.routines);
      await db.routineExercises.bulkPut(data.routine_exercises);
      await db.sessions.bulkPut(data.sessions);
      await db.sessionSets.bulkPut(data.session_sets);
      await db.bodyweight.bulkPut(data.bodyweight);
      if (data.meta) {
        await db.settings.put({ key: META_KEY, value: data.meta });
      }
      await db.settings.put({ key: SEED_FLAG_KEY, value: new Date().toISOString() });
    }
  );

  return true;
}

export async function getProgramMeta(): Promise<SeedShape["meta"] | null> {
  const row = await db.settings.get(META_KEY);
  return (row?.value as SeedShape["meta"] | undefined) ?? null;
}
