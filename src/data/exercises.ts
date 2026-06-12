import { Exercise } from "../types/workout";

export const EXERCISES: Exercise[] = [
  {
    key: "Push-ups",
    mode: "reps",
    icon: "pushups",
    fallback: "💪",
  },
  {
    key: "Pull-ups",
    mode: "reps",
    icon: "pullups",
    fallback: "🧗",
  },
  {
    key: "Sit-ups",
    mode: "reps",
    icon: "situps",
    fallback: "🧍",
  },
  {
    key: "Plank",
    mode: "timed_plank",
    icon: "plank",
    fallback: "🧘",
  },
  {
    key: "Superman",
    mode: "timed_superman",
    icon: "superman",
    fallback: "🦸",
  },
  {
    key: "Squats",
    mode: "reps",
    icon: "squats",
    fallback: "🦵",
  },
  {
    key: "Dumbbell Curls",
    mode: "reps",
    icon: "dumbbellcurls",
    fallback: "💪",
  },
  {
    key: "Mountain Climbers",
    mode: "timed_mountain",
    icon: "mountain",
    fallback: "🏃",
  },
  {
    key: "Bulgarian Squats",
    mode: "bulgarian",
    icon: "bulgarian",
    fallback: "🦵",
  },
  {
    key: "Interval Timer",
    mode: "custom_timer",
    icon: "timer",
    fallback: "⏱️",
  },
];