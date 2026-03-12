# Jacq — Test Plan

**Version:** 1.0  
**Date:** 11 March 2026  
**Based on:** Functional Spec v1.0 + Addendum v1.1

---

## Contents

1. [Testing Philosophy](#1-testing-philosophy)
2. [Test Environment](#2-test-environment)
3. [Unit Tests](#3-unit-tests)
4. [Integration Tests](#4-integration-tests)
5. [End-to-End Tests](#5-end-to-end-tests)
6. [Critical Path Tests](#6-critical-path-tests)
7. [Edge Cases & Error States](#7-edge-cases--error-states)
8. [Performance Tests](#8-performance-tests)
9. [Security Tests](#9-security-tests)
10. [Accessibility Tests](#10-accessibility-tests)

---

## 1. Testing Philosophy

### Priority Tiers

| Tier | Description | Coverage Target |
|------|-------------|-----------------|
| **P0** | Core extraction pipeline, context persistence, auth | 100% |
| **P1** | Main user flows, tool execution, data mutations | 90% |
| **P2** | UI components, styling, animations | 80% |
| **P3** | Edge cases, error states, empty states | 70% |

### The "Never Forget" Principle

The spec states: *"If [the extraction pipeline] fails, the product fails — Jacq appears to 'forget' things, which is the single most damaging behaviour possible."*

This means the chat-to-memory extraction pipeline (§C of Addendum) requires the highest test coverage and most rigorous edge case handling.

### Testing Stack

```
Unit:        Vitest + React Testing Library
Integration: Vitest + MSW (API mocking) + Supabase local
E2E:         Playwright
LLM Mocking: Deterministic test fixtures + recorded responses
```

---

## 2. Test Environment

### Local Development
```bash
# Supabase local instance
supabase start

# Run unit tests
pnpm test

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e
```

### CI Pipeline
- **PR checks:** Unit + Integration tests
- **Merge to main:** Full E2E suite
- **Nightly:** Performance + security scans

### Test Database Seeding

```typescript
// test/fixtures/seed.ts
export const testUser = {
  id: 'test-user-uuid',
  email: 'test@example.com',
  name: 'Test User',
  onboarding_complete: true,
  preferences: {
    dark_mode: false,
    autonomy_level: 'balanced',
    quiet_hours: { start: '22:00', end: '08:00', weekends: 'emergencies_only' },
    llm_config: { provider: 'jacq', fallback_to_jacq: true }
  }
}

export const testUnderstandingEntries = [
  { section: 'about_me', label: 'Role', value: 'Product designer at Acme', source: 'told' },
  { section: 'communication', label: 'Tone preference', value: 'Direct, no filler', source: 'told' },
  { section: 'calendar_time', label: 'Working hours', value: '9am–6pm weekdays', source: 'inferred', confidence: 0.8 }
]
```

---

## 3. Unit Tests

### 3.1 Design System Components

| Component | Test File | Cases |
|-----------|-----------|-------|
| `JacqLogo` | `jacq-logo.test.tsx` | Default render, custom size, custom colour |
| `SectionLabel` | `section-label.test.tsx` | Renders children, correct typography |
| `DataRow` | `data-row.test.tsx` | Told state, inferred state (amber border), confirm tap, JBubble tap |
| `JBubble` | `jbubble.test.tsx` | Default, add variant, context passing, hover state |
| `TopNav` | `top-nav.test.tsx` | Title/sub, back button, action button, burger |
| `BottomNav` | `bottom-nav.test.tsx` | Active state, tap navigation |
| `Tag` | `tag.test.tsx` | Colour variants, text rendering |
| `Hr` | `hr.test.tsx` | Default margins, custom margins |

#### DataRow Test Cases (Critical)

```typescript
// components/__tests__/data-row.test.tsx
describe('DataRow', () => {
  it('renders told entry with full opacity value', () => {
    render(<DataRow label="Role" value="Designer" inferred={false} />)
    expect(screen.getByText('Designer')).toHaveClass('text-t1')
  })

  it('renders inferred entry with amber border and confirm affordance', () => {
    render(<DataRow label="Hours" value="9-5" inferred={true} onConfirm={vi.fn()} />)
    expect(screen.getByTestId('data-row')).toHaveClass('border-l-amber')
    expect(screen.getByText('Confirm?')).toBeInTheDocument()
  })

  it('calls onConfirm when Confirm? is tapped', async () => {
    const onConfirm = vi.fn()
    render(<DataRow label="Hours" value="9-5" inferred={true} onConfirm={onConfirm} />)
    await userEvent.click(screen.getByText('Confirm?'))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('opens chat panel with correct context when JBubble tapped', async () => {
    const openChat = vi.fn()
    render(
      <ChatProvider value={{ openChat }}>
        <DataRow 
          label="Role" 
          value="Designer" 
          context={{ screen: 'understanding', section: 'about_me', itemId: '123' }}
        />
      </ChatProvider>
    )
    await userEvent.click(screen.getByTestId('jbubble'))
    expect(openChat).toHaveBeenCalledWith({
      screen: 'understanding',
      section: 'about_me',
      itemId: '123'
    })
  })
})
```

### 3.2 Design Tokens

```typescript
// styles/__tests__/tokens.test.ts
describe('Design Tokens', () => {
  it('light mode tokens are correctly defined', () => {
    const root = document.documentElement
    expect(getComputedStyle(root).getPropertyValue('--bg')).toBe('#F5F2EC')
    expect(getComputedStyle(root).getPropertyValue('--gold')).toBe('#B8935A')
  })

  it('dark mode tokens override correctly', () => {
    document.documentElement.setAttribute('data-theme', 'dark')
    const root = document.documentElement
    expect(getComputedStyle(root).getPropertyValue('--bg')).toBe('#131108')
  })
})
```

### 3.3 Zustand Store

```typescript
// store/__tests__/app-store.test.ts
describe('AppStore', () => {
  beforeEach(() => {
    useAppStore.setState({ user: null, darkMode: false, isChatPanelOpen: false })
  })

  it('toggleDarkMode flips the state', () => {
    const { toggleDarkMode } = useAppStore.getState()
    toggleDarkMode()
    expect(useAppStore.getState().darkMode).toBe(true)
  })

  it('openChat sets context and opens panel', () => {
    const { openChat } = useAppStore.getState()
    const context = { screen: 'tasks', itemId: '456' }
    openChat(context)
    expect(useAppStore.getState().isChatPanelOpen).toBe(true)
    expect(useAppStore.getState().activeChatContext).toEqual(context)
  })

  it('closeChat clears context and closes panel', () => {
    useAppStore.setState({ isChatPanelOpen: true, activeChatContext: { screen: 'tasks' } })
    const { closeChat } = useAppStore.getState()
    closeChat()
    expect(useAppStore.getState().isChatPanelOpen).toBe(false)
    expect(useAppStore.getState().activeChatContext).toBeNull()
  })
})
```

### 3.4 Validation Functions

```typescript
// services/__tests__/validation.test.ts
describe('validateUnderstandingEntry', () => {
  it('rejects label shorter than 2 chars', () => {
    const result = validateUnderstandingEntry({ label: 'A', value: 'test', section: 'about_me' })
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('label')
  })

  it('rejects invalid section', () => {
    const result = validateUnderstandingEntry({ label: 'Test', value: 'test', section: 'invalid' })
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('section')
  })

  it('rejects confidence outside 0-1 range', () => {
    const result = validateUnderstandingEntry({ 
      label: 'Test', value: 'test', section: 'about_me', confidence: 1.5 
    })
    expect(result.valid).toBe(false)
  })

  it('accepts valid entry', () => {
    const result = validateUnderstandingEntry({
      label: 'Role', value: 'Designer', section: 'about_me', confidence: 1.0
    })
    expect(result.valid).toBe(true)
  })
})
```

---

## 4. Integration Tests

### 4.1 Chat-to-Memory Extraction Pipeline (P0 – Critical)

This is the most important integration test suite. Per Addendum §C, the pipeline is:

```
Message → Context Assembly → LLM Response + Tool Calls → Tool Execution → Persistence → UI Notification
```

```typescript
// services/__tests__/extraction-pipeline.test.ts
describe('Chat-to-Memory Extraction Pipeline', () => {
  let supabase: SupabaseClient

  beforeAll(async () => {
    supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
    await seedTestData(supabase)
  })

  afterEach(async () => {
    // Clean up test entries
    await supabase.from('understanding_entries').delete().eq('user_id', testUser.id)
  })

  describe('extract_understanding tool', () => {
    it('creates new entry when label does not exist', async () => {
      const toolCall = {
        name: 'extract_understanding',
        input: {
          section: 'about_me',
          label: 'Morning person',
          value: 'Most productive 8-11am',
          confidence: 1.0,
          raw_quote: 'I do my best work before lunch'
        }
      }

      await executeToolCall(testUser.id, toolCall)

      const { data } = await supabase
        .from('understanding_entries')
        .select('*')
        .eq('user_id', testUser.id)
        .eq('label', 'Morning person')
        .single()

      expect(data).toBeDefined()
      expect(data.value).toBe('Most productive 8-11am')
      expect(data.source).toBe('told')
      expect(data.raw_quote).toBe('I do my best work before lunch')
    })

    it('updates existing entry when label matches and value differs', async () => {
      // Seed existing entry
      await supabase.from('understanding_entries').insert({
        user_id: testUser.id,
        section: 'about_me',
        label: 'Role',
        value: 'Junior designer',
        source: 'told'
      })

      const toolCall = {
        name: 'extract_understanding',
        input: {
          section: 'about_me',
          label: 'Role',
          value: 'Senior designer',
          confidence: 1.0
        }
      }

      await executeToolCall(testUser.id, toolCall)

      const { data } = await supabase
        .from('understanding_entries')
        .select('*')
        .eq('user_id', testUser.id)
        .eq('label', 'Role')

      expect(data).toHaveLength(1)
      expect(data[0].value).toBe('Senior designer')
    })

    it('supersedes entry when supersedes_label is provided', async () => {
      // Seed entry to be superseded
      const { data: original } = await supabase.from('understanding_entries').insert({
        user_id: testUser.id,
        section: 'calendar_time',
        label: 'Work hours',
        value: '9-5',
        source: 'told'
      }).select().single()

      const toolCall = {
        name: 'extract_understanding',
        input: {
          section: 'calendar_time',
          label: 'Working hours',
          value: '8am-4pm, flexible Fridays',
          confidence: 1.0,
          supersedes_label: 'Work hours'
        }
      }

      await executeToolCall(testUser.id, toolCall)

      const { data } = await supabase
        .from('understanding_entries')
        .select('*')
        .eq('user_id', testUser.id)
        .eq('id', original.id)
        .single()

      expect(data.label).toBe('Working hours')
      expect(data.value).toBe('8am-4pm, flexible Fridays')
    })

    it('does not duplicate when same label and value', async () => {
      await supabase.from('understanding_entries').insert({
        user_id: testUser.id,
        section: 'about_me',
        label: 'Name',
        value: 'Alex Smith',
        source: 'told'
      })

      const toolCall = {
        name: 'extract_understanding',
        input: { section: 'about_me', label: 'Name', value: 'Alex Smith', confidence: 1.0 }
      }

      await executeToolCall(testUser.id, toolCall)

      const { data } = await supabase
        .from('understanding_entries')
        .select('*')
        .eq('user_id', testUser.id)
        .eq('label', 'Name')

      expect(data).toHaveLength(1)
    })
  })

  describe('extract_contact tool', () => {
    it('creates contact with VIP flag', async () => {
      const toolCall = {
        name: 'extract_contact',
        input: {
          name: 'Sarah Chen',
          role: 'CEO',
          organisation: 'Acme Corp',
          is_vip: true,
          jacq_context: 'Reports directly to her. Weekly 1:1s.'
        }
      }

      await executeToolCall(testUser.id, toolCall)

      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', testUser.id)
        .eq('name', 'Sarah Chen')
        .single()

      expect(data.is_vip).toBe(true)
      expect(data.role).toBe('CEO')
      expect(data.jacq_context).toContain('Weekly 1:1s')
    })

    it('updates existing contact by name match', async () => {
      await supabase.from('contacts').insert({
        user_id: testUser.id,
        name: 'Tom Wilson',
        role: 'Engineer'
      })

      const toolCall = {
        name: 'extract_contact',
        input: {
          name: 'Tom Wilson',
          role: 'Lead Engineer',
          is_vip: true
        }
      }

      await executeToolCall(testUser.id, toolCall)

      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', testUser.id)
        .eq('name', 'Tom Wilson')

      expect(data).toHaveLength(1)
      expect(data[0].role).toBe('Lead Engineer')
      expect(data[0].is_vip).toBe(true)
    })
  })

  describe('create_commitment tool', () => {
    it('creates commitment with due date', async () => {
      const dueAt = new Date(Date.now() + 86400000).toISOString() // Tomorrow

      const toolCall = {
        name: 'create_commitment',
        input: {
          description: 'Send project update to Sarah',
          due_at: dueAt,
          source_label: 'From in-app chat, 11 Mar 09:30'
        }
      }

      await executeToolCall(testUser.id, toolCall)

      const { data } = await supabase
        .from('commitments')
        .select('*')
        .eq('user_id', testUser.id)
        .eq('description', 'Send project update to Sarah')
        .single()

      expect(data.status).toBe('pending')
      expect(new Date(data.due_at).toDateString()).toBe(new Date(dueAt).toDateString())
    })
  })

  describe('update_setting tool', () => {
    it('updates nested preference via dot notation', async () => {
      const toolCall = {
        name: 'update_setting',
        input: {
          path: 'quiet_hours.start',
          value: '21:00',
          reason: 'User said they finish earlier on Mondays'
        }
      }

      await executeToolCall(testUser.id, toolCall)

      const { data } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', testUser.id)
        .single()

      expect(data.preferences.quiet_hours.start).toBe('21:00')
    })

    it('creates audit log entry', async () => {
      const toolCall = {
        name: 'update_setting',
        input: {
          path: 'autonomy_level',
          value: 'cautious',
          reason: 'User asked to slow down'
        }
      }

      await executeToolCall(testUser.id, toolCall)

      const { data } = await supabase
        .from('settings_audit_log')
        .select('*')
        .eq('user_id', testUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      expect(data.path).toBe('autonomy_level')
      expect(data.new_value).toBe('cautious')
      expect(data.reason).toBe('User asked to slow down')
    })
  })
})
```

### 4.2 Context Assembly (P0 – Critical)

```typescript
// services/__tests__/context-assembly.test.ts
describe('Context Assembly', () => {
  it('assembles complete context package', async () => {
    const context = await assembleContext(testUser.id)

    expect(context).toMatchObject({
      user: { name: expect.any(String), email: expect.any(String) },
      preferences: expect.any(Object),
      understanding: expect.any(Object),
      vip_contacts: expect.any(Array),
      active_tasks: expect.any(Array),
      active_commitments: expect.any(Array),
      recent_actions: expect.any(Array),
      communication_profile: expect.any(Object),
      assembled_at: expect.any(String)
    })
  })

  it('groups understanding entries by section', async () => {
    const context = await assembleContext(testUser.id)

    expect(context.understanding).toHaveProperty('about_me')
    expect(context.understanding).toHaveProperty('communication')
    expect(context.understanding).toHaveProperty('calendar_time')
    expect(context.understanding).toHaveProperty('working_style')
  })

  it('excludes dismissed understanding entries', async () => {
    await supabase.from('understanding_entries').insert({
      user_id: testUser.id,
      section: 'about_me',
      label: 'Dismissed entry',
      value: 'Should not appear',
      source: 'dismissed'
    })

    const context = await assembleContext(testUser.id)

    const allLabels = Object.values(context.understanding)
      .flat()
      .map((e: any) => e.label)

    expect(allLabels).not.toContain('Dismissed entry')
  })

  it('includes only active tasks', async () => {
    await supabase.from('tasks').insert([
      { user_id: testUser.id, title: 'Active task', status: 'todo' },
      { user_id: testUser.id, title: 'Done task', status: 'done' }
    ])

    const context = await assembleContext(testUser.id)

    const taskTitles = context.active_tasks.map((t: any) => t.title)
    expect(taskTitles).toContain('Active task')
    expect(taskTitles).not.toContain('Done task')
  })

  it('limits VIP contacts to 10', async () => {
    // Insert 15 VIP contacts
    const vips = Array.from({ length: 15 }, (_, i) => ({
      user_id: testUser.id,
      name: `VIP ${i}`,
      is_vip: true
    }))
    await supabase.from('contacts').insert(vips)

    const context = await assembleContext(testUser.id)

    expect(context.vip_contacts.length).toBeLessThanOrEqual(10)
  })
})
```

### 4.3 Session Compression

```typescript
// services/__tests__/session-compression.test.ts
describe('Session Compression', () => {
  it('keeps last 20 messages verbatim', async () => {
    const session = await createSessionWithMessages(50)

    await compressSession(session.id)

    const { data } = await supabase
      .from('chat_sessions')
      .select('messages, summary')
      .eq('id', session.id)
      .single()

    expect(data.messages).toHaveLength(20)
    expect(data.summary).toBeDefined()
    expect(data.summary.length).toBeGreaterThan(0)
  })

  it('appends to existing summary on multiple compressions', async () => {
    const session = await createSessionWithMessages(50)
    await compressSession(session.id)

    // Add more messages
    await addMessagesToSession(session.id, 30)
    await compressSession(session.id)

    const { data } = await supabase
      .from('chat_sessions')
      .select('summary')
      .eq('id', session.id)
      .single()

    // Summary should contain multiple compression blocks
    expect(data.summary.split('\n\n').length).toBeGreaterThan(1)
  })
})
```

### 4.4 Authentication Flow

```typescript
// auth/__tests__/auth-flow.test.ts
describe('Authentication Flow', () => {
  it('redirects unauthenticated user to /signin', async () => {
    const response = await fetch('/understanding', { redirect: 'manual' })
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/signin')
  })

  it('redirects new user to /onboarding/welcome', async () => {
    const user = await createTestUser({ onboarding_complete: false })
    const session = await signInAsUser(user)

    const response = await fetch('/understanding', {
      headers: { Cookie: `sb-access-token=${session.access_token}` },
      redirect: 'manual'
    })

    expect(response.headers.get('location')).toContain('/onboarding')
  })

  it('allows authenticated user with complete onboarding to access app', async () => {
    const user = await createTestUser({ onboarding_complete: true })
    const session = await signInAsUser(user)

    const response = await fetch('/understanding', {
      headers: { Cookie: `sb-access-token=${session.access_token}` }
    })

    expect(response.status).toBe(200)
  })
})
```

### 4.5 API Endpoint Tests

```typescript
// api/__tests__/understanding.test.ts
describe('GET /api/understanding', () => {
  it('returns entries grouped by section', async () => {
    const response = await authenticatedFetch('/api/understanding')
    const data = await response.json()

    expect(data).toHaveProperty('about_me')
    expect(data).toHaveProperty('communication')
    expect(Array.isArray(data.about_me)).toBe(true)
  })

  it('filters by source when query param provided', async () => {
    const response = await authenticatedFetch('/api/understanding?source=inferred')
    const data = await response.json()

    const allSources = Object.values(data).flat().map((e: any) => e.source)
    expect(allSources.every(s => s === 'inferred')).toBe(true)
  })
})

describe('PATCH /api/understanding/:id', () => {
  it('updates entry value', async () => {
    const entry = await createTestEntry()

    const response = await authenticatedFetch(`/api/understanding/${entry.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ value: 'Updated value' })
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.value).toBe('Updated value')
  })

  it('confirms inferred entry', async () => {
    const entry = await createTestEntry({ source: 'inferred' })

    const response = await authenticatedFetch(`/api/understanding/${entry.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ source: 'confirmed' })
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.source).toBe('confirmed')
  })

  it('returns 404 for non-existent entry', async () => {
    const response = await authenticatedFetch('/api/understanding/nonexistent-uuid', {
      method: 'PATCH',
      body: JSON.stringify({ value: 'test' })
    })

    expect(response.status).toBe(404)
  })

  it('returns 403 for entry belonging to different user', async () => {
    const otherUserEntry = await createTestEntry({ user_id: 'other-user-id' })

    const response = await authenticatedFetch(`/api/understanding/${otherUserEntry.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ value: 'Hacked!' })
    })

    expect(response.status).toBe(403)
  })
})

describe('DELETE /api/understanding/:id', () => {
  it('soft deletes entry by setting source to dismissed', async () => {
    const entry = await createTestEntry()

    const response = await authenticatedFetch(`/api/understanding/${entry.id}`, {
      method: 'DELETE'
    })

    expect(response.status).toBe(200)

    const { data } = await supabase
      .from('understanding_entries')
      .select('source')
      .eq('id', entry.id)
      .single()

    expect(data.source).toBe('dismissed')
  })
})
```

---

## 5. End-to-End Tests

### 5.1 Onboarding Flow (P0)

```typescript
// e2e/onboarding.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Onboarding Flow', () => {
  test('complete onboarding journey', async ({ page }) => {
    // Sign in
    await page.goto('/signin')
    await page.click('button:has-text("Sign in with Google")')
    await mockGoogleOAuth(page)

    // Cutscene
    await expect(page).toHaveURL('/onboarding/welcome')
    await expect(page.locator('text=I\'m Jacq')).toBeVisible()
    await page.click('text=Let\'s get started')

    // LLM Setup (new in v1.1)
    await expect(page).toHaveURL('/onboarding/llm')
    await expect(page.locator('text=Before we talk')).toBeVisible()
    // Select Jacq's AI (default)
    await expect(page.locator('[data-testid="llm-option-jacq"]')).toHaveClass(/selected/)
    await page.click('button:has-text("Continue")')

    // Conversation
    await expect(page).toHaveURL('/onboarding/conversation')
    
    // Wait for Jacq's first message
    await expect(page.locator('[data-testid="jmsg"]').first()).toBeVisible()

    // Type response
    await page.fill('[data-testid="chat-input"]', 'I\'m Alex, I run a small design studio')
    await page.click('[data-testid="send-button"]')

    // Wait for "Saved to understanding" panel
    await expect(page.locator('text=Saved to understanding')).toBeVisible({ timeout: 10000 })

    // Continue conversation until completion
    await completeOnboardingConversation(page)

    // Connect accounts
    await expect(page).toHaveURL('/onboarding/connect')
    await page.click('button:has-text("Connect Google")')
    await mockGoogleWorkspaceOAuth(page)

    // Arrive at Understanding screen
    await expect(page).toHaveURL('/understanding')
    await expect(page.locator('text=Jacq\'s picture of you')).toBeVisible()
  })

  test('resume interrupted onboarding', async ({ page }) => {
    // Start onboarding
    await signInNewUser(page)
    await page.goto('/onboarding/conversation')
    
    // Send a message
    await page.fill('[data-testid="chat-input"]', 'I work in finance')
    await page.click('[data-testid="send-button"]')
    await expect(page.locator('text=Saved to understanding')).toBeVisible()

    // Close browser (simulate interruption)
    const sessionStorage = await page.evaluate(() => sessionStorage.getItem('onboarding-session'))

    // Return later
    await page.goto('/onboarding/conversation')

    // Previous messages should be visible
    await expect(page.locator('text=I work in finance')).toBeVisible()
    
    // Jacq should continue naturally
    await expect(page.locator('[data-testid="jmsg"]').last()).not.toContainText('What do you do')
  })

  test('skip onboarding via Done for now', async ({ page }) => {
    await signInNewUser(page)
    await page.goto('/onboarding/conversation')
    
    await page.click('text=Done for now')
    
    await expect(page).toHaveURL('/onboarding/connect')
  })
})
```

### 5.2 Understanding Screen (P1)

```typescript
// e2e/understanding.spec.ts
test.describe('Understanding Screen', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await page.goto('/understanding')
  })

  test('displays entries grouped by section', async ({ page }) => {
    await expect(page.locator('text=About me')).toBeVisible()
    await expect(page.locator('text=Communication')).toBeVisible()
    await expect(page.locator('text=Calendar & time')).toBeVisible()
    await expect(page.locator('text=Working style')).toBeVisible()
  })

  test('confirm inferred entry', async ({ page }) => {
    // Find an inferred entry
    const inferredRow = page.locator('[data-testid="data-row"][data-inferred="true"]').first()
    
    await expect(inferredRow).toHaveClass(/border-l-amber/)
    await inferredRow.locator('text=Confirm?').click()

    // Should immediately update styling
    await expect(inferredRow).not.toHaveClass(/border-l-amber/)
  })

  test('edit entry via chat panel', async ({ page }) => {
    const roleRow = page.locator('[data-testid="data-row"]:has-text("Role")')
    await roleRow.locator('[data-testid="jbubble"]').click()

    // Chat panel opens
    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible()
    await expect(page.locator('[data-testid="chat-context"]')).toContainText('Understanding')

    // Edit via chat
    await page.fill('[data-testid="chat-input"]', 'Actually I\'m now a Senior Designer')
    await page.click('[data-testid="send-button"]')

    // Wait for update
    await expect(page.locator('text=Saved to understanding')).toBeVisible()
    
    // Close panel and verify
    await page.click('[data-testid="chat-panel-close"]')
    await expect(roleRow).toContainText('Senior Designer')
  })

  test('search filters entries', async ({ page }) => {
    await page.fill('[data-testid="search-input"]', 'morning')

    const visibleRows = await page.locator('[data-testid="data-row"]:visible').count()
    const allRows = await page.locator('[data-testid="data-row"]').count()

    expect(visibleRows).toBeLessThan(allRows)
  })

  test('add new entry via chat', async ({ page }) => {
    await page.click('text=Teach Jacq something new')

    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible()

    await page.fill('[data-testid="chat-input"]', 'I hate phone calls, always prefer async')
    await page.click('[data-testid="send-button"]')

    await expect(page.locator('text=Saved to understanding')).toBeVisible()
  })
})
```

### 5.3 Tasks Kanban (P1)

```typescript
// e2e/tasks.spec.ts
test.describe('Tasks Screen', () => {
  test('displays tasks in columns', async ({ page }) => {
    await signInAsTestUser(page)
    await page.goto('/tasks')

    await expect(page.locator('text=To Do')).toBeVisible()
    await expect(page.locator('text=Jacq Acting')).toBeVisible()
    await expect(page.locator('text=Waiting')).toBeVisible()
    await expect(page.locator('text=Done')).toBeVisible()
  })

  test('navigate to task detail', async ({ page }) => {
    await signInAsTestUser(page)
    await seedTestTask({ title: 'Review proposal' })
    await page.goto('/tasks')

    await page.click('[data-testid="task-card"]:has-text("Review proposal")')

    await expect(page).toHaveURL(/\/tasks\/[a-z0-9-]+/)
    await expect(page.locator('text=Review proposal')).toBeVisible()
  })

  test('add task via TopNav', async ({ page }) => {
    await signInAsTestUser(page)
    await page.goto('/tasks')

    await page.click('text=+ Add')
    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible()

    await page.fill('[data-testid="chat-input"]', 'Book flights for next week')
    await page.click('[data-testid="send-button"]')

    await expect(page.locator('text=Task created')).toBeVisible()
  })

  test('real-time update when Jacq moves task', async ({ page }) => {
    await signInAsTestUser(page)
    const task = await seedTestTask({ status: 'todo' })
    await page.goto('/tasks')

    // Verify in To Do
    await expect(page.locator('[data-testid="column-todo"]')).toContainText(task.title)

    // Simulate Jacq moving the task (via API)
    await updateTaskStatus(task.id, 'jacq_acting')

    // Should update in real-time
    await expect(page.locator('[data-testid="column-jacq-acting"]')).toContainText(task.title)
  })
})
```

### 5.4 Activity Screen (P1)

```typescript
// e2e/activity.spec.ts
test.describe('Activity Screen', () => {
  test('displays commitment completion rate', async ({ page }) => {
    await signInAsTestUser(page)
    await seedCommitments({ completed: 8, pending: 2 })
    await page.goto('/activity')

    await expect(page.locator('[data-testid="completion-rate"]')).toContainText('80%')
  })

  test('displays actions taken today', async ({ page }) => {
    await signInAsTestUser(page)
    await seedActivityLog([
      { description: 'Sent reply to Sarah', action_type: 'email' },
      { description: 'Added meeting to calendar', action_type: 'calendar' }
    ])
    await page.goto('/activity')

    await expect(page.locator('text=Sent reply to Sarah')).toBeVisible()
    await expect(page.locator('text=Added meeting to calendar')).toBeVisible()
  })

  test('pause autonomous actions', async ({ page }) => {
    await signInAsTestUser(page)
    await page.goto('/activity')

    await page.click('text=Pause all autonomous actions')

    // Confirmation modal
    await expect(page.locator('text=Pause Jacq?')).toBeVisible()
    await page.click('button:has-text("Pause now")')

    // Button should change
    await expect(page.locator('text=Resume autonomous actions')).toBeVisible()
  })

  test('undo recent action', async ({ page }) => {
    await signInAsTestUser(page)
    const action = await seedRecentAction({ 
      description: 'Sent email to Tom',
      created_at: new Date() // Within 30 min window
    })
    await page.goto('/activity')

    await page.locator(`[data-testid="action-${action.id}"]`).locator('[data-testid="jbubble"]').click()

    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible()
    await page.fill('[data-testid="chat-input"]', 'Undo that')
    await page.click('[data-testid="send-button"]')

    await expect(page.locator('text=Action undone')).toBeVisible()
  })
})
```

### 5.5 Chat Panel (P0)

```typescript
// e2e/chat-panel.spec.ts
test.describe('In-App Chat Panel', () => {
  test('opens with correct context', async ({ page }) => {
    await signInAsTestUser(page)
    await page.goto('/understanding')

    const roleRow = page.locator('[data-testid="data-row"]:has-text("Role")')
    await roleRow.locator('[data-testid="jbubble"]').click()

    await expect(page.locator('[data-testid="chat-context"]')).toContainText('Understanding')
    await expect(page.locator('[data-testid="chat-context"]')).toContainText('About me')
  })

  test('streams response tokens', async ({ page }) => {
    await signInAsTestUser(page)
    await page.goto('/understanding')
    await page.click('text=Teach Jacq something new')

    await page.fill('[data-testid="chat-input"]', 'I prefer working from home')
    await page.click('[data-testid="send-button"]')

    // Should see partial response before completion
    const jmsg = page.locator('[data-testid="jmsg"]').last()
    await expect(jmsg).toBeVisible()
    
    // Wait for streaming to complete
    await page.waitForFunction(() => {
      const msg = document.querySelector('[data-testid="jmsg"]:last-child')
      return msg && msg.textContent && msg.textContent.length > 20
    })
  })

  test('shows Saved panel inline when extraction happens', async ({ page }) => {
    await signInAsTestUser(page)
    await page.goto('/understanding')
    await page.click('text=Teach Jacq something new')

    await page.fill('[data-testid="chat-input"]', 'I always start work at 7am')
    await page.click('[data-testid="send-button"]')

    // Saved panel should appear in chat flow, not as toast
    const savedPanel = page.locator('[data-testid="saved-panel"]')
    await expect(savedPanel).toBeVisible()
    await expect(savedPanel).toContainText('Saved to understanding')

    // Should be between messages, not floating
    const chatFlow = page.locator('[data-testid="chat-messages"]')
    await expect(chatFlow).toContainText('Saved to understanding')
  })

  test('closes on X button', async ({ page }) => {
    await signInAsTestUser(page)
    await page.goto('/understanding')
    await page.click('text=Teach Jacq something new')

    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible()

    await page.click('[data-testid="chat-panel-close"]')

    await expect(page.locator('[data-testid="chat-panel"]')).not.toBeVisible()
  })

  test('closes on swipe down', async ({ page }) => {
    await signInAsTestUser(page)
    await page.goto('/understanding')
    await page.click('text=Teach Jacq something new')

    const panel = page.locator('[data-testid="chat-panel"]')
    const handle = panel.locator('[data-testid="panel-handle"]')

    await handle.dragTo(page.locator('body'), { targetPosition: { x: 200, y: 600 } })

    await expect(panel).not.toBeVisible()
  })
})
```

### 5.6 Dark Mode (P2)

```typescript
// e2e/dark-mode.spec.ts
test.describe('Dark Mode', () => {
  test('toggles via burger nav', async ({ page }) => {
    await signInAsTestUser(page)
    await page.goto('/understanding')

    // Open burger
    await page.click('[data-testid="burger-button"]')
    await expect(page.locator('[data-testid="burger-overlay"]')).toBeVisible()

    // Toggle dark mode
    await page.click('[data-testid="dark-mode-toggle"]')

    // Verify theme applied
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    
    // Background should be dark
    const bg = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--bg')
    })
    expect(bg.trim()).toBe('#131108')
  })

  test('persists across sessions', async ({ page }) => {
    await signInAsTestUser(page)
    await page.goto('/understanding')

    // Enable dark mode
    await page.click('[data-testid="burger-button"]')
    await page.click('[data-testid="dark-mode-toggle"]')
    
    // Navigate away and back
    await page.goto('/tasks')
    await page.goto('/understanding')

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })
})
```

---

## 6. Critical Path Tests

These tests verify the most important user journeys. If any fail, deployment should be blocked.

### 6.1 Memory Persistence Journey

```typescript
// e2e/critical/memory-persistence.spec.ts
test('user info persists across sessions', async ({ browser }) => {
  // Session 1: Tell Jacq something
  const context1 = await browser.newContext()
  const page1 = await context1.newPage()
  
  await signInAsNewUser(page1)
  await completeOnboarding(page1)
  
  // Tell Jacq something specific
  await page1.goto('/understanding')
  await page1.click('text=Teach Jacq something new')
  await page1.fill('[data-testid="chat-input"]', 'I have a standing 9am Monday meeting with the board')
  await page1.click('[data-testid="send-button"]')
  await expect(page1.locator('text=Saved to understanding')).toBeVisible()
  
  await context1.close()

  // Session 2: Verify Jacq remembers
  const context2 = await browser.newContext()
  const page2 = await context2.newPage()
  
  await signInAsExistingUser(page2, testUser.email)
  await page2.goto('/understanding')
  
  // Should see the entry
  await expect(page2.locator('text=Monday meeting')).toBeVisible()
  
  // Ask Jacq about it
  await page2.click('[data-testid="jbubble-add"]')
  await page2.fill('[data-testid="chat-input"]', 'When is my board meeting?')
  await page2.click('[data-testid="send-button"]')
  
  // Jacq should reference the saved info
  await expect(page2.locator('[data-testid="jmsg"]').last()).toContainText(/Monday|9.*am|board/i)
  
  await context2.close()
})
```

### 6.2 Commitment Tracking Journey

```typescript
// e2e/critical/commitments.spec.ts
test('commitment is tracked from creation to completion', async ({ page }) => {
  await signInAsTestUser(page)

  // Create commitment via chat
  await page.goto('/tasks')
  await page.click('text=+ Add')
  await page.fill('[data-testid="chat-input"]', 'Remind me to send the report to Sarah by tomorrow')
  await page.click('[data-testid="send-button"]')

  // Should create both task and commitment
  await expect(page.locator('text=Task created')).toBeVisible()

  // Check Activity screen
  await page.click('[data-testid="tab-activity"]')
  await expect(page.locator('[data-testid="commitment-card"]:has-text("report")')).toBeVisible()
  await expect(page.locator('[data-testid="commitment-due"]')).toContainText(/tomorrow|24h/i)

  // Mark as done
  await page.locator('[data-testid="commitment-card"]:has-text("report")').locator('[data-testid="jbubble"]').click()
  await page.fill('[data-testid="chat-input"]', 'Done, I sent it')
  await page.click('[data-testid="send-button"]')

  // Should move to completed
  await page.click('[data-testid="chat-panel-close"]')
  await page.click('text=Completed this week')
  await expect(page.locator('text=report')).toBeVisible()
})
```

### 6.3 Cross-Channel Context

```typescript
// e2e/critical/cross-channel.spec.ts
test('telegram conversation context available in app', async ({ page }) => {
  await signInAsTestUser(page)

  // Simulate Telegram message (via API)
  await simulateTelegramMessage(testUser.id, 'My assistant\'s name is Maria')

  // Open app and ask related question
  await page.goto('/understanding')
  await page.click('text=Teach Jacq something new')
  await page.fill('[data-testid="chat-input"]', 'What was my assistant\'s name again?')
  await page.click('[data-testid="send-button"]')

  // Jacq should know from Telegram context
  await expect(page.locator('[data-testid="jmsg"]').last()).toContainText('Maria')
})
```

---

## 7. Edge Cases & Error States

### 7.1 Network Errors

```typescript
// e2e/errors/network.spec.ts
test('shows error toast on network failure', async ({ page }) => {
  await signInAsTestUser(page)
  await page.goto('/understanding')

  // Intercept and fail network request
  await page.route('/api/understanding/*', route => route.abort())

  // Try to confirm an entry
  await page.locator('[data-testid="data-row"][data-inferred="true"]').first()
    .locator('text=Confirm?').click()

  await expect(page.locator('[data-testid="error-toast"]')).toBeVisible()
  await expect(page.locator('[data-testid="error-toast"]')).toContainText('Couldn\'t save')
})

test('optimistic update rolls back on failure', async ({ page }) => {
  await signInAsTestUser(page)
  await page.goto('/understanding')

  const inferredRow = page.locator('[data-testid="data-row"][data-inferred="true"]').first()
  const originalClasses = await inferredRow.getAttribute('class')

  // Intercept and fail the request
  await page.route('/api/understanding/*', route => route.abort())

  await inferredRow.locator('text=Confirm?').click()

  // Wait for rollback
  await page.waitForTimeout(2000)

  // Should be back to inferred state
  await expect(inferredRow).toHaveAttribute('class', originalClasses)
})
```

### 7.2 LLM Errors

```typescript
// e2e/errors/llm.spec.ts
test('shows retry option on LLM failure', async ({ page }) => {
  await signInAsTestUser(page)
  await page.goto('/understanding')
  await page.click('text=Teach Jacq something new')

  // Mock LLM failure
  await page.route('/api/chat', route => route.fulfill({ status: 500 }))

  await page.fill('[data-testid="chat-input"]', 'Test message')
  await page.click('[data-testid="send-button"]')

  await expect(page.locator('text=Something went wrong')).toBeVisible()
  await expect(page.locator('text=Tap to retry')).toBeVisible()
})
```

### 7.3 Session Expiry

```typescript
// e2e/errors/session.spec.ts
test('shows sign-in overlay on session expiry', async ({ page }) => {
  await signInAsTestUser(page)
  await page.goto('/understanding')

  // Expire the session
  await expireUserSession(testUser.id)

  // Try to make an authenticated request
  await page.click('text=Teach Jacq something new')
  await page.fill('[data-testid="chat-input"]', 'Test')
  await page.click('[data-testid="send-button"]')

  await expect(page.locator('text=Your session expired')).toBeVisible()
  await expect(page.locator('button:has-text("Sign in")')).toBeVisible()
})
```

### 7.4 Empty States

```typescript
// e2e/empty-states.spec.ts
test.describe('Empty States', () => {
  test('understanding shows placeholder for new user', async ({ page }) => {
    await signInAsNewUser(page)
    await completeOnboardingMinimal(page) // Skip most of conversation

    await page.goto('/understanding')

    await expect(page.locator('text=Nothing here yet')).toBeVisible()
    await expect(page.locator('text=I\'ll fill this in as I get to know you')).toBeVisible()
  })

  test('tasks shows hero empty state', async ({ page }) => {
    await signInAsTestUser(page)
    await clearAllTasks(testUser.id)
    await page.goto('/tasks')

    await expect(page.locator('text=No tasks yet')).toBeVisible()
    await expect(page.locator('text=Add task via Jacq')).toBeVisible()
  })

  test('activity shows appropriate empty messages', async ({ page }) => {
    await signInAsTestUser(page)
    await clearAllActivity(testUser.id)
    await page.goto('/activity')

    await expect(page.locator('text=No active commitments')).toBeVisible()
    await expect(page.locator('text=Nothing yet today')).toBeVisible()
    await expect(page.locator('text=Usually takes a week or two')).toBeVisible()
  })
})
```

### 7.5 Conflict Resolution

```typescript
// e2e/conflicts/understanding-conflict.spec.ts
test('shows conflict resolution when entry updated simultaneously', async ({ page }) => {
  await signInAsTestUser(page)
  
  // Create an entry
  const entry = await createTestEntry({ label: 'Hours', value: '9-5' })
  
  await page.goto('/understanding')

  // Start editing via chat
  await page.locator(`[data-testid="data-row"]:has-text("Hours")`).locator('[data-testid="jbubble"]').click()
  await page.fill('[data-testid="chat-input"]', 'Actually I work 8-4')
  
  // Simultaneously update via API (simulating Telegram)
  await updateEntry(entry.id, { value: '7-3' })
  
  await page.click('[data-testid="send-button"]')

  // Should show conflict UI
  await expect(page.locator('text=Jacq just updated this entry')).toBeVisible()
  await expect(page.locator('text=8-4')).toBeVisible()
  await expect(page.locator('text=7-3')).toBeVisible()
})
```

---

## 8. Performance Tests

### 8.1 Context Assembly

```typescript
// perf/context-assembly.perf.ts
describe('Context Assembly Performance', () => {
  it('assembles context in under 200ms', async () => {
    const start = performance.now()
    await assembleContext(testUser.id)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(200)
  })

  it('handles user with 500+ understanding entries', async () => {
    await seedManyEntries(testUser.id, 500)

    const start = performance.now()
    const context = await assembleContext(testUser.id)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(500)
    expect(context.understanding).toBeDefined()
  })
})
```

### 8.2 Chat Streaming

```typescript
// perf/chat-streaming.perf.ts
test('time to first token under 500ms', async ({ page }) => {
  await signInAsTestUser(page)
  await page.goto('/understanding')
  await page.click('text=Teach Jacq something new')

  const startTime = Date.now()
  await page.fill('[data-testid="chat-input"]', 'Hello')
  await page.click('[data-testid="send-button"]')

  await page.waitForSelector('[data-testid="jmsg"]:last-child:not(:empty)')
  const ttft = Date.now() - startTime

  expect(ttft).toBeLessThan(500)
})
```

### 8.3 Page Load

```typescript
// perf/page-load.perf.ts
const LOAD_TIME_BUDGET = 2000 // 2 seconds

test.describe('Page Load Performance', () => {
  for (const route of ['/understanding', '/tasks', '/activity', '/settings']) {
    test(`${route} loads under ${LOAD_TIME_BUDGET}ms`, async ({ page }) => {
      await signInAsTestUser(page)

      const start = Date.now()
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - start

      expect(loadTime).toBeLessThan(LOAD_TIME_BUDGET)
    })
  }
})
```

---

## 9. Security Tests

### 9.1 Authorization

```typescript
// security/authorization.test.ts
describe('Authorization', () => {
  it('cannot access another user\'s understanding entries', async () => {
    const otherUser = await createTestUser()
    const otherEntry = await createTestEntry({ user_id: otherUser.id })

    const response = await authenticatedFetch(`/api/understanding/${otherEntry.id}`)

    expect(response.status).toBe(403)
  })

  it('cannot access another user\'s tasks', async () => {
    const otherUser = await createTestUser()
    const otherTask = await createTestTask({ user_id: otherUser.id })

    const response = await authenticatedFetch(`/api/tasks/${otherTask.id}`)

    expect(response.status).toBe(403)
  })

  it('cannot access another user\'s contacts', async () => {
    const otherUser = await createTestUser()
    const otherContact = await createTestContact({ user_id: otherUser.id })

    const response = await authenticatedFetch(`/api/contacts/${otherContact.id}`)

    expect(response.status).toBe(403)
  })
})
```

### 9.2 API Key Storage

```typescript
// security/api-keys.test.ts
describe('API Key Security', () => {
  it('API key is encrypted at rest', async () => {
    await saveUserApiKey(testUser.id, 'sk-test-key-12345')

    const { data } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', testUser.id)
      .eq('provider', 'llm_key')
      .single()

    // Should not contain plaintext key
    expect(data.access_token).not.toContain('sk-test')
    expect(data.access_token).not.toBe('sk-test-key-12345')
  })

  it('API key is never logged', async () => {
    const consoleSpy = vi.spyOn(console, 'log')
    const consoleErrorSpy = vi.spyOn(console, 'error')

    await saveUserApiKey(testUser.id, 'sk-test-key-12345')
    await loadUserApiKey(testUser.id)

    const allLogs = [...consoleSpy.mock.calls, ...consoleErrorSpy.mock.calls]
      .flat()
      .join(' ')

    expect(allLogs).not.toContain('sk-test')
  })
})
```

### 9.3 Data Deletion

```typescript
// security/data-deletion.test.ts
describe('Data Deletion', () => {
  it('DELETE /api/users/me removes all user data', async () => {
    const user = await createTestUser()
    await createTestEntry({ user_id: user.id })
    await createTestTask({ user_id: user.id })
    await createTestContact({ user_id: user.id })

    await authenticatedFetch('/api/users/me', { method: 'DELETE' }, user)

    // Verify all data removed
    const { data: entries } = await supabase.from('understanding_entries').select('*').eq('user_id', user.id)
    const { data: tasks } = await supabase.from('tasks').select('*').eq('user_id', user.id)
    const { data: contacts } = await supabase.from('contacts').select('*').eq('user_id', user.id)

    expect(entries).toHaveLength(0)
    expect(tasks).toHaveLength(0)
    expect(contacts).toHaveLength(0)
  })
})
```

---

## 10. Accessibility Tests

### 10.1 Screen Reader

```typescript
// a11y/screen-reader.spec.ts
test.describe('Screen Reader Accessibility', () => {
  test('understanding screen has proper landmarks', async ({ page }) => {
    await signInAsTestUser(page)
    await page.goto('/understanding')

    // Check landmarks
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
  })

  test('data rows have accessible labels', async ({ page }) => {
    await signInAsTestUser(page)
    await page.goto('/understanding')

    const firstRow = page.locator('[data-testid="data-row"]').first()
    await expect(firstRow).toHaveAttribute('aria-label', /.+/)
  })

  test('chat panel is announced when opened', async ({ page }) => {
    await signInAsTestUser(page)
    await page.goto('/understanding')

    await page.click('[data-testid="jbubble"]')

    const panel = page.locator('[data-testid="chat-panel"]')
    await expect(panel).toHaveAttribute('role', 'dialog')
    await expect(panel).toHaveAttribute('aria-label', /chat/i)
  })
})
```

### 10.2 Keyboard Navigation

```typescript
// a11y/keyboard.spec.ts
test.describe('Keyboard Navigation', () => {
  test('can navigate understanding screen with keyboard only', async ({ page }) => {
    await signInAsTestUser(page)
    await page.goto('/understanding')

    // Tab to first interactive element
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()

    // Tab through all interactive elements
    let focusableCount = 0
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press('Tab')
      const focused = await page.locator(':focus').count()
      if (focused > 0) focusableCount++
    }

    expect(focusableCount).toBeGreaterThan(5)
  })

  test('can open and close chat panel with keyboard', async ({ page }) => {
    await signInAsTestUser(page)
    await page.goto('/understanding')

    // Tab to JBubble and activate
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')

    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible()

    // Close with Escape
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid="chat-panel"]')).not.toBeVisible()
  })
})
```

### 10.3 Colour Contrast

```typescript
// a11y/contrast.spec.ts
import AxeBuilder from '@axe-core/playwright'

test.describe('Colour Contrast', () => {
  for (const theme of ['light', 'dark']) {
    test(`${theme} mode passes WCAG AA contrast`, async ({ page }) => {
      await signInAsTestUser(page)
      
      if (theme === 'dark') {
        await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'))
      }
      
      await page.goto('/understanding')

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .analyze()

      expect(results.violations.filter(v => v.id === 'color-contrast')).toHaveLength(0)
    })
  }
})
```

---

## Test Execution Summary

### CI Pipeline Commands

```bash
# Unit tests (fast, run on every commit)
pnpm test:unit

# Integration tests (medium, run on PR)
pnpm test:integration

# E2E tests (slow, run on merge to main)
pnpm test:e2e

# Critical path only (for quick validation)
pnpm test:e2e --grep @critical

# Full suite including perf and a11y
pnpm test:all

# Generate coverage report
pnpm test:coverage
```

### Coverage Targets

| Area | Target | Rationale |
|------|--------|-----------|
| Extraction Pipeline | 100% | Core product promise |
| Context Assembly | 100% | "Never forget" guarantee |
| API Endpoints | 90% | Data integrity |
| UI Components | 80% | User experience |
| Error States | 70% | Graceful degradation |

### Test Data Management

```typescript
// test/setup.ts
beforeAll(async () => {
  await supabase.rpc('reset_test_database')
  await seedBaseTestData()
})

afterEach(async () => {
  await cleanupTestData()
})

afterAll(async () => {
  await supabase.rpc('reset_test_database')
})
```

---

## Appendix: LLM Response Fixtures

For deterministic testing of LLM-dependent flows, we use recorded fixtures:

```typescript
// test/fixtures/llm-responses.ts
export const onboardingResponses = {
  greeting: `Great to meet you! Before we dive in, I'd love to understand how you work best. What do you do, and what does a typical week look like for you?`,
  
  afterRoleDisclosure: `Got it — [role] sounds like a lot of plate-spinning. What's the thing that most often slips through the cracks?`,
  
  completionSignal: `I think I have a good picture of how you work. Shall we get your accounts connected so I can actually start?`
}

export const extractionToolCalls = {
  role: {
    name: 'extract_understanding',
    input: {
      section: 'about_me',
      label: 'Role',
      value: '{{extracted_role}}',
      confidence: 1.0,
      raw_quote: '{{user_message}}'
    }
  }
}
```

---

*End of Test Plan*
