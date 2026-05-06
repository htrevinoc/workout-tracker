import Dexie, { type Table } from "dexie";

export type Unit = "kg" | "lb";
export type WeightMode = "per_side" | "pair_total" | "barbell" | "bodyweight";
export type MuscleGroup =
  | "chest" | "back" | "shoulders" | "biceps" | "triceps"
  | "quads" | "hamstrings" | "glutes" | "calves" | "core" | "cardio" | "other";
export type Equipment = "barbell" | "dumbbell" | "machine" | "bodyweight" | "cable" | "band" | "tread" | "rower" | "other";
export type Location = "home" | "otf" | "gym" | "other";

export interface Exercise {
  id: string;
  name_es: string;
  name_en: string;
  muscle_groups: MuscleGroup[];
  equipment: Equipment;
  default_weight_mode: WeightMode;
  default_target_reps_min?: number;
  default_target_reps_max?: number;
  default_rest_seconds?: number;
  archived?: boolean;
  is_otf?: boolean;
}

export interface Routine {
  id: string;
  name_es: string;
  name_en: string;
  color?: string;
  archived?: boolean;
}

export interface RoutineExercise {
  id: string;
  routine_id: string;
  exercise_id: string;
  order_in_routine: number;
  target_sets: number;
  target_reps_min: number;
  target_reps_max: number;
  rest_seconds: number;
  notes?: string;
}

export interface Session {
  id: string;
  routine_id: string;
  started_at: string; // ISO
  ended_at?: string;
  week_number?: number;
  session_rpe?: number;
  notes?: string;
  location?: Location;
}

export interface SessionSet {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight_value?: number;
  weight_unit?: Unit;
  weight_mode?: WeightMode;
  reps?: number;
  rpe?: number;
  completed_at?: string;
  is_warmup?: boolean;
}

export interface AvailableWeight {
  id: string;
  location: Location;
  equipment: Equipment;
  value: number;
  unit: Unit;
}

export interface BodyweightLog {
  id: string;
  date: string; // YYYY-MM-DD
  weight_value: number;
  weight_unit: Unit;
  notes?: string;
}

export interface Setting {
  key: string;
  value: unknown;
}

class WorkoutDB extends Dexie {
  exercises!: Table<Exercise, string>;
  routines!: Table<Routine, string>;
  routineExercises!: Table<RoutineExercise, string>;
  sessions!: Table<Session, string>;
  sessionSets!: Table<SessionSet, string>;
  availableWeights!: Table<AvailableWeight, string>;
  bodyweight!: Table<BodyweightLog, string>;
  settings!: Table<Setting, string>;

  constructor() {
    super("workout_tracker");
    this.version(1).stores({
      exercises: "id, name_es, name_en, equipment, is_otf, archived",
      routines: "id, name_es, archived",
      routineExercises: "id, routine_id, exercise_id, order_in_routine",
      sessions: "id, routine_id, started_at, week_number",
      sessionSets: "id, session_id, exercise_id, set_number, completed_at",
      availableWeights: "id, [location+equipment], value",
      bodyweight: "id, date",
      settings: "key",
    });
  }
}

export const db = new WorkoutDB();
