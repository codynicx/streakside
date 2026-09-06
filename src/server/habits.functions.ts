import type { User } from '@netlify/identity'
import { createServerFn } from '@tanstack/react-start'
import { and, eq, inArray, or } from 'drizzle-orm'
import { db } from '../../db/index.js'
import {
  checkins,
  friendships,
  habits,
  profiles,
  sleepEntries,
} from '../../db/schema.js'
import { requireAuthMiddleware } from '../middleware/identity.js'
import type { DashboardView, FriendView } from '../lib/types.js'

const palette = ['#ff6b35', '#7267f0', '#00a878', '#f7b801', '#f04478']

function makeHandle(user: User) {
  const base = (user.name || user.email?.split('@')[0] || 'player')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 16)
  return `${base || 'player'}${user.id.replace(/[^a-z0-9]/gi, '').slice(-4)}`
}

function makeFriendCode(userId: string) {
  return userId.replace(/[^a-z0-9]/gi, '').slice(-8).toUpperCase()
}

async function ensureProfile(user: User) {
  const [existing] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1)

  if (existing) return existing

  const [created] = await db
    .insert(profiles)
    .values({
      id: user.id,
      email: user.email || `${user.id}@identity.local`,
      displayName: user.name || user.email?.split('@')[0] || 'New Player',
      handle: makeHandle(user),
      friendCode: makeFriendCode(user.id),
      avatarHue: Array.from(user.id).reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % 360,
    })
    .returning()

  if (!created) throw new Error('Could not create player profile')

  await db.insert(habits).values([
    {
      id: crypto.randomUUID(),
      ownerId: user.id,
      name: 'Move your body',
      icon: '⚡',
      color: palette[0],
      targetPerWeek: 5,
    },
    {
      id: crypto.randomUUID(),
      ownerId: user.id,
      name: 'Read 20 minutes',
      icon: '📚',
      color: palette[1],
      targetPerWeek: 7,
    },
    {
      id: crypto.randomUUID(),
      ownerId: user.id,
      name: 'Drink 8 glasses',
      icon: '💧',
      color: palette[2],
      targetPerWeek: 7,
    },
  ])

  return created
}

function streakFromDates(dates: string[]) {
  const completed = new Set(dates)
  const cursor = new Date()
  let streak = 0

  for (let offset = 0; offset < 366; offset += 1) {
    const date = new Date(cursor)
    date.setUTCDate(cursor.getUTCDate() - offset)
    const key = date.toISOString().slice(0, 10)
    if (!completed.has(key)) break
    streak += 1
  }

  return streak
}

async function loadDashboard(user: User): Promise<DashboardView> {
  const profile = await ensureProfile(user)
  const userHabits = await db
    .select()
    .from(habits)
    .where(eq(habits.ownerId, user.id))
  const userCheckins = await db
    .select()
    .from(checkins)
    .where(eq(checkins.ownerId, user.id))
  const userSleepEntries = await db
    .select()
    .from(sleepEntries)
    .where(eq(sleepEntries.ownerId, user.id))

  const connections = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.status, 'accepted'),
        or(
          eq(friendships.requesterId, user.id),
          eq(friendships.addresseeId, user.id),
        ),
      ),
    )

  const friendIds = connections.map((connection) =>
    connection.requesterId === user.id
      ? connection.addresseeId
      : connection.requesterId,
  )
  let friends: FriendView[] = []

  if (friendIds.length > 0) {
    const friendProfiles = await db
      .select()
      .from(profiles)
      .where(inArray(profiles.id, friendIds))
    const friendHabits = await db
      .select()
      .from(habits)
      .where(inArray(habits.ownerId, friendIds))
    const friendCheckins = await db
      .select()
      .from(checkins)
      .where(inArray(checkins.ownerId, friendIds))
    const today = new Date().toISOString().slice(0, 10)

    friends = friendProfiles.map((friend) => {
      const habitsForFriend = friendHabits.filter(
        (habit) => habit.ownerId === friend.id,
      )
      const dates = friendCheckins
        .filter((checkin) => checkin.ownerId === friend.id)
        .map((checkin) => checkin.checkinDate)
      return {
        id: friend.id,
        displayName: friend.displayName,
        handle: friend.handle,
        avatarHue: friend.avatarHue,
        completedToday: friendCheckins.filter(
          (checkin) =>
            checkin.ownerId === friend.id && checkin.checkinDate === today,
        ).length,
        totalHabits: habitsForFriend.length,
        streak: streakFromDates(dates),
      }
    })
  }

  return {
    profile: {
      displayName: profile.displayName,
      handle: profile.handle,
      friendCode: profile.friendCode,
      avatarHue: profile.avatarHue,
      xp: profile.xp,
    },
    habits: userHabits.map((habit) => ({
      id: habit.id,
      name: habit.name,
      icon: habit.icon,
      color: habit.color,
      targetPerWeek: habit.targetPerWeek,
      completedDates: userCheckins
        .filter((checkin) => checkin.habitId === habit.id)
        .map((checkin) => checkin.checkinDate),
    })),
    sleepEntries: userSleepEntries.map((entry) => ({
      date: entry.sleepDate,
      durationMinutes: entry.durationMinutes,
      quality: entry.quality,
    })),
    friends,
  }
}

export const getDashboard = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => loadDashboard(context.user))

export const toggleCheckin = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator((input: { habitId: string; date: string }) => {
    if (!input.habitId || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
      throw new Error('Invalid check-in')
    }
    return input
  })
  .handler(async ({ context, data }) => {
    const [habit] = await db
      .select()
      .from(habits)
      .where(and(eq(habits.id, data.habitId), eq(habits.ownerId, context.user.id)))
      .limit(1)
    if (!habit) throw new Error('Habit not found')

    const [existing] = await db
      .select()
      .from(checkins)
      .where(
        and(
          eq(checkins.habitId, data.habitId),
          eq(checkins.checkinDate, data.date),
        ),
      )
      .limit(1)

    if (existing) {
      await db.delete(checkins).where(eq(checkins.id, existing.id))
      await db
        .update(profiles)
        .set({ xp: Math.max(0, (await ensureProfile(context.user)).xp - 10) })
        .where(eq(profiles.id, context.user.id))
    } else {
      await db.insert(checkins).values({
        id: crypto.randomUUID(),
        habitId: data.habitId,
        ownerId: context.user.id,
        checkinDate: data.date,
      })
      const profile = await ensureProfile(context.user)
      await db
        .update(profiles)
        .set({ xp: profile.xp + 10 })
        .where(eq(profiles.id, context.user.id))
    }

    return loadDashboard(context.user)
  })

export const createHabit = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    (input: {
      name: string
      icon: string
      color: string
      targetPerWeek: number
    }) => {
      const name = input.name.trim().slice(0, 48)
      if (!name) throw new Error('Give your habit a name')
      return {
        name,
        icon: input.icon.slice(0, 4) || '✨',
        color: /^#[0-9a-f]{6}$/i.test(input.color) ? input.color : palette[0],
        targetPerWeek: Math.min(7, Math.max(1, input.targetPerWeek)),
      }
    },
  )
  .handler(async ({ context, data }) => {
    await ensureProfile(context.user)
    await db.insert(habits).values({
      id: crypto.randomUUID(),
      ownerId: context.user.id,
      ...data,
    })
    return loadDashboard(context.user)
  })

export const saveSleepEntry = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    (input: { date: string; durationMinutes: number; quality: number }) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
        throw new Error('Choose a valid sleep date')
      }

      const durationMinutes = Math.round(input.durationMinutes)
      const quality = Math.round(input.quality)
      if (durationMinutes < 60 || durationMinutes > 960) {
        throw new Error('Sleep duration must be between 1 and 16 hours')
      }
      if (quality < 1 || quality > 5) {
        throw new Error('Choose a sleep quality from 1 to 5')
      }

      return { date: input.date, durationMinutes, quality }
    },
  )
  .handler(async ({ context, data }) => {
    await ensureProfile(context.user)
    const [existing] = await db
      .select()
      .from(sleepEntries)
      .where(
        and(
          eq(sleepEntries.ownerId, context.user.id),
          eq(sleepEntries.sleepDate, data.date),
        ),
      )
      .limit(1)

    if (existing) {
      await db
        .update(sleepEntries)
        .set({
          durationMinutes: data.durationMinutes,
          quality: data.quality,
        })
        .where(eq(sleepEntries.id, existing.id))
    } else {
      await db.insert(sleepEntries).values({
        id: crypto.randomUUID(),
        ownerId: context.user.id,
        sleepDate: data.date,
        durationMinutes: data.durationMinutes,
        quality: data.quality,
      })
    }

    return loadDashboard(context.user)
  })

export const addFriend = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator((input: { friendCode: string }) => ({
    friendCode: input.friendCode.trim().toUpperCase().slice(0, 16),
  }))
  .handler(async ({ context, data }) => {
    await ensureProfile(context.user)
    const [friend] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.friendCode, data.friendCode))
      .limit(1)
    if (!friend || friend.id === context.user.id) {
      throw new Error('That friend code is not available')
    }

    const [existing] = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(
            eq(friendships.requesterId, context.user.id),
            eq(friendships.addresseeId, friend.id),
          ),
          and(
            eq(friendships.requesterId, friend.id),
            eq(friendships.addresseeId, context.user.id),
          ),
        ),
      )
      .limit(1)

    if (!existing) {
      await db.insert(friendships).values({
        id: crypto.randomUUID(),
        requesterId: context.user.id,
        addresseeId: friend.id,
        status: 'accepted',
      })
    }

    return loadDashboard(context.user)
  })
