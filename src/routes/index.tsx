import { createFileRoute } from '@tanstack/react-router'
import {
  AuthError,
  login,
  signup,
} from '@netlify/identity'
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  Crown,
  Flame,
  LogIn,
  LogOut,
  Medal,
  Moon,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  UserPlus,
  Users,
  X,
  Zap,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react'
import { useIdentity } from '../lib/identity-context'
import type { DashboardView, HabitView } from '../lib/types'
import {
  addFriend,
  createHabit,
  getDashboard,
  saveSleepEntry,
  toggleCheckin,
} from '../server/habits.functions'

export const Route = createFileRoute('/')({
  component: Home,
})

const colors = ['#ff6b35', '#7267f0', '#00a878', '#f7b801', '#f04478']
const icons = ['⚡', '📚', '💧', '🌿', '🎨', '🧘']

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function recentDays(total = 7) {
  return Array.from({ length: total }, (_, index) => {
    const date = new Date()
    date.setHours(12, 0, 0, 0)
    date.setDate(date.getDate() - (total - index - 1))
    return {
      key: toDateKey(date),
      day: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date),
      number: date.getDate(),
      isToday: index === total - 1,
    }
  })
}

function seededDates(pattern: number[]) {
  const days = recentDays(14)
  return pattern.map((offset) => days[days.length - 1 - offset]?.key).filter(Boolean) as string[]
}

function makeDemoData(): DashboardView {
  const sleepDays = recentDays()
  return {
    profile: {
      displayName: 'Maya',
      handle: 'mayamoves',
      friendCode: 'PLAY2026',
      avatarHue: 18,
      xp: 340,
    },
    habits: [
      {
        id: 'move',
        name: 'Morning movement',
        icon: '⚡',
        color: colors[0],
        targetPerWeek: 5,
        completedDates: seededDates([1, 2, 3, 4, 5, 6, 7]),
      },
      {
        id: 'read',
        name: 'Read 20 minutes',
        icon: '📚',
        color: colors[1],
        targetPerWeek: 7,
        completedDates: seededDates([0, 1, 2, 4, 5, 6]),
      },
      {
        id: 'water',
        name: 'Drink 8 glasses',
        icon: '💧',
        color: colors[2],
        targetPerWeek: 7,
        completedDates: seededDates([0, 1, 2, 3, 4]),
      },
    ],
    sleepEntries: [7.5, 6.75, 8, 7.25, 8.5, 7, 7.75].map((hours, index) => ({
      date: sleepDays[index]?.key || toDateKey(new Date()),
      durationMinutes: Math.round(hours * 60),
      quality: [4, 3, 5, 4, 5, 3, 4][index] || 4,
    })),
    friends: [
      {
        id: 'friend-1',
        displayName: 'Jon Bell',
        handle: 'jonbuilds',
        avatarHue: 210,
        completedToday: 4,
        totalHabits: 4,
        streak: 12,
      },
      {
        id: 'friend-2',
        displayName: 'Priya S.',
        handle: 'priyapowers',
        avatarHue: 322,
        completedToday: 3,
        totalHabits: 4,
        streak: 9,
      },
      {
        id: 'friend-3',
        displayName: 'Maya',
        handle: 'mayamoves',
        avatarHue: 18,
        completedToday: 2,
        totalHabits: 3,
        streak: 8,
      },
    ],
  }
}

function calculateStreak(dates: string[]) {
  const completed = new Set(dates)
  const cursor = new Date()
  cursor.setHours(12, 0, 0, 0)
  let streak = 0

  for (let offset = 0; offset < 365; offset += 1) {
    const date = new Date(cursor)
    date.setDate(cursor.getDate() - offset)
    if (!completed.has(toDateKey(date))) break
    streak += 1
  }

  return streak
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining === 0 ? `${hours}h` : `${hours}h ${remaining}m`
}

function Avatar({ name, hue, size = 'medium' }: { name: string; hue: number; size?: 'small' | 'medium' | 'large' }) {
  return (
    <span
      className={`avatar avatar-${size}`}
      style={{ '--avatar-hue': hue } as CSSProperties}
      aria-hidden="true"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  )
}

function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '')
    const password = String(form.get('password') || '')
    const name = String(form.get('name') || '')

    try {
      if (mode === 'login') {
        await login(email, password)
        onClose()
      } else {
        const user = await signup(email, password, { full_name: name })
        if (user.confirmedAt) {
          onClose()
        } else {
          setMessage('Quest accepted! Check your email to confirm your account.')
        }
      }
    } catch (error) {
      setMessage(error instanceof AuthError ? error.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-card auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close sign in">
          <X size={20} />
        </button>
        <div className="auth-badge"><ShieldCheck size={18} /> Player account</div>
        <h2 id="auth-title">{mode === 'signup' ? 'Start your streak' : 'Welcome back, player'}</h2>
        <p>Save progress, earn XP, and compare daily wins with your crew.</p>
        <form onSubmit={submit} className="modal-form">
          {mode === 'signup' && (
            <label>
              Display name
              <input name="name" placeholder="Maya Chen" required maxLength={40} />
            </label>
          )}
          <label>
            Email
            <input name="email" type="email" placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <input name="password" type="password" minLength={8} placeholder="8+ characters" required />
          </label>
          {message && <p className="form-message">{message}</p>}
          <button className="primary-button full-button" disabled={busy}>
            {busy ? 'Loading…' : mode === 'signup' ? 'Create my player' : 'Continue my quest'}
            {!busy && <ChevronRight size={18} />}
          </button>
        </form>
        <button className="text-button" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setMessage('') }}>
          {mode === 'signup' ? 'Already playing? Sign in' : 'New here? Create an account'}
        </button>
      </section>
    </div>
  )
}

function AddHabitModal({ onClose, onSave }: { onClose: () => void; onSave: (habit: Omit<HabitView, 'id' | 'completedDates'>) => Promise<void> }) {
  const [icon, setIcon] = useState(icons[0])
  const [color, setColor] = useState(colors[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      await onSave({
        name: String(form.get('name') || ''),
        icon,
        color,
        targetPerWeek: Number(form.get('target') || 7),
      })
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create habit')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="habit-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close habit form"><X size={20} /></button>
        <div className="auth-badge"><Sparkles size={18} /> New side quest</div>
        <h2 id="habit-title">Choose your next win</h2>
        <form onSubmit={submit} className="modal-form">
          <label>
            Habit name
            <input name="name" placeholder="Stretch for 10 minutes" required maxLength={48} autoFocus />
          </label>
          <fieldset>
            <legend>Pick an icon</legend>
            <div className="choice-row">
              {icons.map((choice) => (
                <button type="button" key={choice} className={`choice-button ${icon === choice ? 'selected' : ''}`} onClick={() => setIcon(choice)}>{choice}</button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Pick a color</legend>
            <div className="choice-row">
              {colors.map((choice) => (
                <button type="button" key={choice} className={`color-choice ${color === choice ? 'selected' : ''}`} style={{ backgroundColor: choice }} onClick={() => setColor(choice)} aria-label={`Use color ${choice}`} />
              ))}
            </div>
          </fieldset>
          <label>
            Weekly goal
            <select name="target" defaultValue="7">
              {[3, 4, 5, 6, 7].map((target) => <option key={target} value={target}>{target} days each week</option>)}
            </select>
          </label>
          {error && <p className="form-message">{error}</p>}
          <button className="primary-button full-button" disabled={busy}>{busy ? 'Creating…' : 'Add to my quests'}<Plus size={18} /></button>
        </form>
      </section>
    </div>
  )
}

function Home() {
  const { user, ready, logout } = useIdentity()
  const [data, setData] = useState<DashboardView>(() => makeDemoData())
  const [loading, setLoading] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [habitOpen, setHabitOpen] = useState(false)
  const [friendCode, setFriendCode] = useState('')
  const [savingSleep, setSavingSleep] = useState(false)
  const [notice, setNotice] = useState('')
  const [reward, setReward] = useState('')
  const week = useMemo(() => recentDays(), [])
  const today = week[week.length - 1]?.key || toDateKey(new Date())

  useEffect(() => {
    if (!ready) return
    if (!user) {
      setData(makeDemoData())
      return
    }
    setLoading(true)
    getDashboard()
      .then(setData)
      .catch(() => setNotice('Could not load your quest log. Refresh to try again.'))
      .finally(() => setLoading(false))
  }, [ready, user])

  const todaysCompleted = data.habits.filter((habit) => habit.completedDates.includes(today)).length
  const allDates = Array.from(new Set(data.habits.flatMap((habit) => habit.completedDates)))
  const overallStreak = Math.max(0, calculateStreak(allDates))
  const level = Math.floor(data.profile.xp / 100) + 1
  const levelProgress = data.profile.xp % 100
  const weeklySleep = week.map((day) => ({
    ...day,
    entry: data.sleepEntries.find((entry) => entry.date === day.key),
  }))
  const loggedSleep = weeklySleep.flatMap((day) => day.entry ? [day.entry] : [])
  const averageSleepMinutes = loggedSleep.length
    ? Math.round(loggedSleep.reduce((sum, entry) => sum + entry.durationMinutes, 0) / loggedSleep.length)
    : 0
  const averageSleepQuality = loggedSleep.length
    ? loggedSleep.reduce((sum, entry) => sum + entry.quality, 0) / loggedSleep.length
    : 0
  const sleepStreak = calculateStreak(data.sleepEntries.map((entry) => entry.date))

  async function checkIn(habitId: string) {
    const habit = data.habits.find((item) => item.id === habitId)
    if (!habit) return
    const wasDone = habit.completedDates.includes(today)

    if (!user) {
      setData((current) => ({
        ...current,
        profile: { ...current.profile, xp: Math.max(0, current.profile.xp + (wasDone ? -10 : 10)) },
        habits: current.habits.map((item) => item.id === habitId ? {
          ...item,
          completedDates: wasDone ? item.completedDates.filter((date) => date !== today) : [...item.completedDates, today],
        } : item),
      }))
    } else {
      try {
        setData(await toggleCheckin({ data: { habitId, date: today } }))
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Check-in failed')
        return
      }
    }

    if (!wasDone) {
      setReward(`+10 XP · ${habit.name}`)
      window.setTimeout(() => setReward(''), 2200)
    }
  }

  async function saveHabit(input: Omit<HabitView, 'id' | 'completedDates'>) {
    if (!user) {
      setData((current) => ({
        ...current,
        habits: [...current.habits, { ...input, id: crypto.randomUUID(), completedDates: [] }],
      }))
      return
    }
    setData(await createHabit({ data: input }))
  }

  async function logSleep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const date = String(form.get('date') || today)
    const durationMinutes = Math.round(Number(form.get('hours') || 0) * 60)
    const quality = Number(form.get('quality') || 3)
    setSavingSleep(true)

    try {
      if (!user) {
        setData((current) => ({
          ...current,
          sleepEntries: [
            ...current.sleepEntries.filter((entry) => entry.date !== date),
            { date, durationMinutes, quality },
          ],
        }))
      } else {
        setData(await saveSleepEntry({ data: { date, durationMinutes, quality } }))
      }
      setNotice(user ? 'Sleep log saved.' : 'Demo sleep log updated for this visit.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not save sleep log')
    } finally {
      setSavingSleep(false)
    }
  }

  async function connectFriend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) {
      setAuthOpen(true)
      return
    }
    try {
      setData(await addFriend({ data: { friendCode } }))
      setFriendCode('')
      setNotice('Friend added to your party!')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not add friend')
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(data.profile.friendCode)
      setNotice('Invite code copied!')
    } catch {
      setNotice(`Your invite code is ${data.profile.friendCode}`)
    }
  }

  return (
    <main className="app-shell">
      <div className="confetti confetti-one" />
      <div className="confetti confetti-two" />
      <nav className="topbar">
        <a className="brand" href="#top" aria-label="Streakside home">
          <span className="brand-mark"><Zap size={21} fill="currentColor" /></span>
          <span>streakside</span>
        </a>
        <div className="nav-actions">
          {!user && <span className="preview-badge">Live demo</span>}
          {ready && user ? (
            <>
              <span className="user-chip"><Avatar name={data.profile.displayName} hue={data.profile.avatarHue} size="small" /> @{data.profile.handle}</span>
              <button className="secondary-button compact-button" onClick={() => logout()}><LogOut size={17} /> Log out</button>
            </>
          ) : (
            <button className="primary-button compact-button" onClick={() => setAuthOpen(true)}><LogIn size={17} /> Save my progress</button>
          )}
        </div>
      </nav>

      <section className="hero" id="top">
        <div>
          <div className="eyebrow"><Sparkles size={16} /> Tiny wins. Serious momentum.</div>
          <h1>Make today<br /><span>count.</span></h1>
          <p>Turn daily habits into a friendly game. Check in, protect your streak, and cheer on your crew.</p>
        </div>
        <div className="level-card">
          <div className="level-orbit"><Trophy size={34} /></div>
          <div>
            <span className="micro-label">Current rank</span>
            <strong>Level {level} · Momentum Maker</strong>
            <div className="xp-track"><span style={{ width: `${levelProgress}%` }} /></div>
            <small>{levelProgress} / 100 XP to level {level + 1}</small>
          </div>
        </div>
      </section>

      {notice && <button className="notice" onClick={() => setNotice('')}><span>{notice}</span><X size={16} /></button>}
      {reward && <div className="reward-pop"><Sparkles size={20} /> {reward}</div>}

      <section className="summary-grid" aria-label="Daily summary">
        <article className="summary-card flame-card">
          <div className="summary-icon"><Flame size={27} fill="currentColor" /></div>
          <div><span>Current streak</span><strong>{overallStreak} days</strong></div>
          <small>Personal best: {Math.max(14, overallStreak)}</small>
        </article>
        <article className="summary-card">
          <div className="summary-icon mint"><Target size={27} /></div>
          <div><span>Today's quest</span><strong>{todaysCompleted} / {data.habits.length}</strong></div>
          <small>{todaysCompleted === data.habits.length ? 'Perfect day unlocked!' : `${data.habits.length - todaysCompleted} wins left`}</small>
        </article>
        <article className="summary-card">
          <div className="summary-icon violet"><Crown size={27} /></div>
          <div><span>Total XP</span><strong>{data.profile.xp}</strong></div>
          <small>Top 18% this week</small>
        </article>
      </section>

      <section className="week-strip" aria-label="Recent activity">
        <div className="section-heading compact-heading">
          <div><span className="micro-label">Your rhythm</span><h2>This week</h2></div>
          <span className="week-note"><CalendarDays size={16} /> {todaysCompleted * 10} XP today</span>
        </div>
        <div className="week-days">
          {week.map((day) => {
            const completeCount = data.habits.filter((habit) => habit.completedDates.includes(day.key)).length
            return (
              <div className={`day-cell ${day.isToday ? 'today' : ''}`} key={day.key}>
                <span>{day.day}</span><strong>{day.number}</strong>
                <div className="day-dots">
                  {data.habits.slice(0, 4).map((habit) => <i key={habit.id} style={{ backgroundColor: habit.completedDates.includes(day.key) ? habit.color : 'var(--track)' }} />)}
                </div>
                {completeCount === data.habits.length && data.habits.length > 0 && <Check className="perfect-check" size={14} />}
              </div>
            )
          })}
        </div>
      </section>

      <section className="sleep-tracker" aria-labelledby="sleep-title">
        <div className="sleep-intro">
          <div className="sleep-icon"><Moon size={31} fill="currentColor" /></div>
          <div>
            <span className="micro-label">Recovery quest</span>
            <h2 id="sleep-title">Rest fuels the streak</h2>
            <p>Log last night, spot your rhythm, and protect tomorrow's energy.</p>
          </div>
        </div>

        <div className="sleep-stats" aria-label="Sleep summary">
          <div><Clock3 size={18} /><span>Weekly average</span><strong>{averageSleepMinutes ? formatDuration(averageSleepMinutes) : 'No logs'}</strong></div>
          <div><Star size={18} /><span>Average quality</span><strong>{averageSleepQuality ? `${averageSleepQuality.toFixed(1)} / 5` : '—'}</strong></div>
          <div><Flame size={18} /><span>Logging streak</span><strong>{sleepStreak} nights</strong></div>
        </div>

        <div className="sleep-chart" aria-label="Seven day sleep duration">
          {weeklySleep.map((day) => {
            const hours = (day.entry?.durationMinutes || 0) / 60
            return (
              <div className="sleep-column" key={day.key}>
                <span className="sleep-hours">{day.entry ? `${hours.toFixed(hours % 1 === 0 ? 0 : 1)}h` : '—'}</span>
                <div className="sleep-bar-track">
                  <i style={{ height: `${Math.min(100, (hours / 10) * 100)}%` }} />
                  <b className="sleep-goal" aria-hidden="true" />
                </div>
                <span className={day.isToday ? 'today' : ''}>{day.day.slice(0, 2)}</span>
              </div>
            )
          })}
        </div>

        <form className="sleep-form" onSubmit={logSleep}>
          <label>
            Night ending
            <input name="date" type="date" defaultValue={today} max={today} required />
          </label>
          <label>
            Hours slept
            <input name="hours" type="number" min="1" max="16" step="0.25" defaultValue="8" required />
          </label>
          <label>
            Sleep quality
            <select name="quality" defaultValue="4">
              <option value="1">1 · Rough</option>
              <option value="2">2 · Restless</option>
              <option value="3">3 · Okay</option>
              <option value="4">4 · Rested</option>
              <option value="5">5 · Amazing</option>
            </select>
          </label>
          <button className="sleep-save" disabled={savingSleep}>
            <Moon size={18} /> {savingSleep ? 'Saving…' : 'Log sleep'}
          </button>
        </form>
      </section>

      <div className="content-grid">
        <section className="habits-section">
          <div className="section-heading">
            <div><span className="micro-label">Daily quests</span><h2>Tap in, power up</h2></div>
            <button className="secondary-button" onClick={() => setHabitOpen(true)}><Plus size={18} /> Add habit</button>
          </div>
          {loading ? (
            <div className="habit-list">{[1, 2, 3].map((item) => <div className="habit-skeleton" key={item} />)}</div>
          ) : data.habits.length === 0 ? (
            <button className="empty-state" onClick={() => setHabitOpen(true)}><Sparkles size={30} /><strong>Your quest board is open</strong><span>Add one small habit to begin.</span></button>
          ) : (
            <div className="habit-list">
              {data.habits.map((habit, index) => {
                const done = habit.completedDates.includes(today)
                const streak = calculateStreak(habit.completedDates)
                const weekCount = week.filter((day) => habit.completedDates.includes(day.key)).length
                return (
                  <article className={`habit-card ${done ? 'complete' : ''}`} key={habit.id} style={{ '--habit-color': habit.color, '--delay': `${index * 70}ms` } as CSSProperties}>
                    <div className="habit-icon">{habit.icon}</div>
                    <div className="habit-copy">
                      <h3>{habit.name}</h3>
                      <div className="habit-meta"><span><Flame size={15} fill="currentColor" /> {streak} day streak</span><span>{weekCount}/{habit.targetPerWeek} this week</span></div>
                    </div>
                    <div className="habit-miniweek" aria-hidden="true">
                      {week.map((day) => <i key={day.key} className={habit.completedDates.includes(day.key) ? 'filled' : ''} />)}
                    </div>
                    <button className="checkin-button" onClick={() => checkIn(habit.id)} aria-label={`${done ? 'Undo' : 'Complete'} ${habit.name}`}>
                      {done ? <Check size={25} strokeWidth={3} /> : <span>+10</span>}
                    </button>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <aside className="social-panel">
          <div className="section-heading">
            <div><span className="micro-label">Your party</span><h2>Friendly rivals</h2></div>
            <Users size={22} />
          </div>
          <div className="leaderboard">
            {[...data.friends].sort((a, b) => b.completedToday - a.completedToday).map((friend, index) => (
              <div className="friend-row" key={friend.id}>
                <span className={`rank rank-${index + 1}`}>{index === 0 ? <Crown size={17} /> : index === 1 ? <Medal size={17} /> : index + 1}</span>
                <Avatar name={friend.displayName} hue={friend.avatarHue} />
                <div className="friend-copy"><strong>{friend.displayName}</strong><span><Flame size={13} fill="currentColor" /> {friend.streak} day streak</span></div>
                <div className="friend-score"><strong>{friend.completedToday}/{friend.totalHabits}</strong><span>today</span></div>
              </div>
            ))}
            {data.friends.length === 0 && <div className="friend-empty"><UserPlus size={26} /><strong>Quests are better together</strong><span>Invite a friend with your code.</span></div>}
          </div>
          <div className="invite-card">
            <div><span className="micro-label">Your invite code</span><strong>{data.profile.friendCode}</strong></div>
            <button className="icon-button" onClick={copyCode} aria-label="Copy invite code"><Copy size={18} /></button>
          </div>
          <form className="friend-form" onSubmit={connectFriend}>
            <input value={friendCode} onChange={(event) => setFriendCode(event.target.value)} placeholder="Enter a friend's code" aria-label="Friend code" required />
            <button className="primary-button" aria-label="Add friend"><UserPlus size={18} /></button>
          </form>
          {!user && <p className="demo-note">Sign in to create your real party. Demo check-ins reset when you leave.</p>}
        </aside>
      </div>

      <footer><span>Built for progress, not perfection.</span><span><Zap size={15} fill="currentColor" /> Keep the spark alive.</span></footer>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {habitOpen && <AddHabitModal onClose={() => setHabitOpen(false)} onSave={saveHabit} />}
    </main>
  )
}
