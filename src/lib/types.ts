export interface HabitView {
  id: string
  name: string
  icon: string
  color: string
  targetPerWeek: number
  completedDates: string[]
}

export interface FriendView {
  id: string
  displayName: string
  handle: string
  avatarHue: number
  completedToday: number
  totalHabits: number
  streak: number
}

export interface SleepEntryView {
  date: string
  durationMinutes: number
  quality: number
}

export interface DashboardView {
  profile: {
    displayName: string
    handle: string
    friendCode: string
    avatarHue: number
    xp: number
  }
  habits: HabitView[]
  sleepEntries: SleepEntryView[]
  friends: FriendView[]
}
