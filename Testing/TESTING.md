# TESTING.md — AI App Testing Framework

A practical testing strategy for AI-powered applications.

---

## The Testing Stack

```
┌─────────────────────────────────────────────────────┐
│  Manual / Dogfooding                                │  ← Use it yourself daily
├─────────────────────────────────────────────────────┤
│  E2E Tests                                          │  ← Full user flows
├─────────────────────────────────────────────────────┤
│  LLM Evals                                          │  ← AI behavior tests
├─────────────────────────────────────────────────────┤
│  Integration Tests                                  │  ← API + tool calls
├─────────────────────────────────────────────────────┤
│  Unit Tests                                         │  ← Pure functions
└─────────────────────────────────────────────────────┘
```

Each layer catches different types of bugs. Start from the bottom; add layers as complexity grows.

---

## 1. Unit Tests

### What to Test
- Pure functions (no side effects)
- Data transformations
- Business logic
- Utility functions

### Examples
- Date parsing ("next Tuesday" → correct date)
- Input validation
- State calculations
- Format conversions

### Framework
- **JavaScript/TypeScript:** Jest, Vitest
- **Python:** pytest
- **Go:** built-in testing

### Pattern

```typescript
// Good: deterministic, isolated
test('parseRelativeDate handles "next Friday"', () => {
  const result = parseRelativeDate('next Friday', new Date('2026-03-10'));
  expect(result).toEqual(new Date('2026-03-13'));
});

// Good: edge cases
test('parseRelativeDate handles invalid input', () => {
  expect(() => parseRelativeDate('banana')).toThrow();
});
```

### Rules
- ✅ Test deterministic logic
- ✅ Test edge cases and error states
- ❌ Don't test library code
- ❌ Don't test trivial getters/setters

---

## 2. Integration Tests

### What to Test
- API endpoints
- Database operations
- Service interactions
- Tool execution (with mocked externals)

### Examples
- Endpoint receives request → processes → returns response
- Tool calls external API → handles response correctly
- Database write → read → data intact

### Pattern

```typescript
// Mock external dependencies
jest.mock('./googleCalendar');

test('calendar tool returns formatted events', async () => {
  mockGoogleCalendar.listEvents.mockResolvedValue([
    { summary: 'Meeting', start: '2026-03-11T10:00:00' }
  ]);
  
  const result = await calendarTool.execute({ date: '2026-03-11' });
  
  expect(result).toContain('Meeting');
  expect(result).toContain('10:00');
});
```

### Rules
- ✅ Mock external services (APIs, LLMs)
- ✅ Test your logic, not third-party code
- ✅ Test error handling paths
- ❌ Don't make real network calls

---

## 3. LLM Evals

### The Challenge
LLM outputs are non-deterministic. You can't test exact strings.

### Solution
Test **behaviors**, not outputs.

### Tool: Promptfoo

```bash
npm install -g promptfoo
promptfoo init
```

### Configuration

```yaml
# promptfoo.yaml
prompts:
  - file://prompts/system.txt

providers:
  - anthropic:claude-3-sonnet
  # or: openai:gpt-4, local provider, etc.

tests:
  - vars:
      input: "What's on my calendar today?"
    assert:
      - type: contains
        value: "calendar"
      - type: llm-rubric
        value: "Response mentions specific events or indicates empty calendar"
      
  - vars:
      input: "I'm feeling stressed"
    assert:
      - type: llm-rubric
        value: "Response is empathetic and offers support"
      - type: not-contains
        value: "I cannot"
```

### Assertion Types

| Type | Description | Use For |
|------|-------------|---------|
| `contains` | Output includes string | Keywords, tool names |
| `not-contains` | Output excludes string | Unwanted phrases |
| `is-json` | Output is valid JSON | Tool calls |
| `is-valid-json-schema` | Matches JSON schema | Structured outputs |
| `llm-rubric` | AI judges the output | Behavior assessment |
| `similar` | Semantically similar | Meaning, not wording |
| `cost` | Below token/cost threshold | Budget control |
| `latency` | Below time threshold | Performance |

### Golden Test Sets

Create a file of expected behaviors:

```yaml
# tests/golden.yaml
- input: "Schedule meeting with Tom tomorrow 2pm"
  expected_behavior: "Creates calendar event or asks clarifying questions"
  expected_tool: "calendar.create"
  must_contain: ["Tom", "tomorrow"]
  must_not_contain: ["I can't", "I'm unable"]

- input: "What did Sarah say about the budget?"
  expected_behavior: "Searches memory for Sarah + budget context"
  expected_tool: "memory.search"

- input: "I'm overwhelmed with work"
  expected_behavior: "Responds empathetically before offering solutions"
  must_not_contain: ["Here are 5 things"]
```

### Running Evals

```bash
# Run all evals
promptfoo eval

# Run specific test file
promptfoo eval -c tests/calendar-evals.yaml

# View results in browser
promptfoo view
```

### Eval Metrics to Track

| Metric | Target | Notes |
|--------|--------|-------|
| Pass rate | > 90% | Overall test pass rate |
| Tool accuracy | > 95% | Correct tool selected |
| Rubric scores | > 4/5 | LLM-judged quality |
| Latency p95 | < 3s | Response time |
| Cost per eval | Track | Monitor spend |

---

## 4. E2E Tests

### What to Test
- Critical user journeys
- Happy paths
- Key failure scenarios

### Framework
- **React Native:** Detox, Maestro
- **Web:** Playwright, Cypress
- **Mobile:** Appium

### Pattern

```typescript
// Detox example
describe('Chat flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should send message and receive response', async () => {
    await element(by.id('chat-input')).typeText('Hello');
    await element(by.id('send-button')).tap();
    
    await waitFor(element(by.id('user-message')))
      .toBeVisible()
      .withTimeout(2000);
    
    await waitFor(element(by.id('assistant-message')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
```

### Rules
- ✅ Test critical paths only (sign in, core actions)
- ✅ Keep tests independent
- ❌ Don't test every edge case (too slow/flaky)
- ❌ Don't test UI styling

### When to Add E2E
- After core features stable
- Before major releases
- For regression prevention

---

## 5. Dogfooding

### Why It Matters
Automated tests catch bugs. Dogfooding catches UX issues, missing features, and "why does it do THAT?" moments.

### Practice
- Use your app daily for real tasks
- Keep a log of issues and ideas
- Fix paper cuts immediately

### Dogfood Log Template

```markdown
# DOGFOOD.md

## 2026-03-11
### Bugs
- [ ] Timezone wrong on calendar events

### Friction
- [ ] Too many taps to get to settings

### Ideas
- [ ] Add quick-reply buttons

### Delights
- Loved the proactive reminder!
```

### Weekly Review
1. Review dogfood log
2. Triage: bug vs feature vs wontfix
3. Add critical items to backlog
4. Update test cases from bugs found

---

## Testing Workflow

### During Development

```
1. Write/change code
2. Run unit tests (fast feedback)
3. Run affected integration tests
4. Manual test the change
5. Commit when green
```

### Daily

```
1. Full unit + integration suite (CI)
2. Dogfood the app
3. Log issues
```

### Weekly

```
1. Run full LLM eval suite
2. Review eval scores — improving?
3. Add new eval cases from bugs
4. Review dogfood log
```

### Pre-Release

```
1. Full test suite (all layers)
2. Full LLM eval suite
3. E2E critical paths
4. 24-48 hours dogfooding
5. Go/no-go decision
```

---

## Test File Structure

```
project/
├── src/
│   └── ...
├── tests/
│   ├── unit/
│   │   ├── dateParser.test.ts
│   │   └── trustCalculator.test.ts
│   ├── integration/
│   │   ├── chatEndpoint.test.ts
│   │   └── calendarTool.test.ts
│   ├── e2e/
│   │   ├── chatFlow.test.ts
│   │   └── onboarding.test.ts
│   └── evals/
│       ├── promptfoo.yaml
│       ├── calendar-evals.yaml
│       └── memory-evals.yaml
├── DOGFOOD.md
└── jest.config.js
```

---

## Quick Reference

| Layer | Tool | Speed | Frequency |
|-------|------|-------|-----------|
| Unit | Jest/Vitest | Fast | Every commit |
| Integration | Jest + mocks | Medium | Every commit |
| LLM Evals | Promptfoo | Slow | Daily/weekly |
| E2E | Detox/Playwright | Slow | Pre-release |
| Dogfooding | You | N/A | Daily |

---

## Anti-Patterns

❌ **Testing LLM exact outputs** — They vary. Test behaviors.

❌ **100% coverage obsession** — Diminishing returns. Cover critical paths.

❌ **Flaky E2E tests** — Delete or fix. Flaky tests erode trust.

❌ **No tests** — Slows you down long-term. Start with unit tests.

❌ **Only happy paths** — Bugs hide in error cases. Test failures too.

❌ **Testing in production** — Have a staging/test environment.

---

## Getting Started

### Minimal Setup (Day 1)

```bash
# 1. Unit tests (usually included with framework)
npm test

# 2. Start dogfood log
touch DOGFOOD.md
```

### Standard Setup (Week 1)

```bash
# Add LLM evals
npm install -g promptfoo
promptfoo init

# Add integration test structure
mkdir -p tests/{unit,integration,evals}
```

### Full Setup (Month 1)

```bash
# Add E2E
npm install -D detox
detox init

# CI pipeline
# - Unit + integration on every push
# - Evals on daily schedule
# - E2E on release branches
```

---

*Test behaviors, not strings. Automate the boring stuff. Dogfood daily.*
