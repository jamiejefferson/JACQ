# JACQ LLM Evaluations

Behavior tests for JACQ using [Promptfoo](https://promptfoo.dev).

## Setup

```bash
# Install promptfoo
npm install -g promptfoo

# Run all evaluations
cd tests/evals
promptfoo eval

# View results in browser
promptfoo view
```

## Test Suites

| File | Tests | Purpose |
|------|-------|---------|
| `calendar-evals.yaml` | 7 | Calendar queries, creation, conflicts |
| `email-evals.yaml` | 7 | Drafting, summarizing, triage |
| `memory-evals.yaml` | 9 | Recall, storage, search, disambiguation |
| `proactive-evals.yaml` | 8 | Briefings, suggestions, follow-ups |
| `personality-evals.yaml` | 12 | Tone, empathy, anti-patterns |

**Total: 43 behavior tests**

## Running Specific Suites

```bash
# Single suite
promptfoo eval -c calendar-evals.yaml

# Multiple suites
promptfoo eval -c calendar-evals.yaml -c email-evals.yaml
```

## Adding New Tests

1. Add test cases to the relevant `*-evals.yaml` file
2. Use assertion types:
   - `contains` / `not-contains` — keyword checks
   - `llm-rubric` — AI-judged behavior
   - `contains-any` — one of several keywords
3. Run and verify

## Test Structure

```yaml
- description: "Human-readable test name"
  vars:
    input: "User message"
    context: "Optional memory/context"
    calendar: "Optional calendar data"
  assert:
    - type: contains
      value: "expected keyword"
    - type: llm-rubric
      value: "Description of expected behavior for AI judge"
    - type: not-contains
      value: "unwanted phrase"
```

## CI Integration

Add to your CI pipeline:

```yaml
- name: Run LLM Evals
  run: |
    npm install -g promptfoo
    cd tests/evals
    promptfoo eval --output results.json
    # Fail if pass rate < 90%
    node -e "const r=require('./results.json'); process.exit(r.stats.passRate < 0.9 ? 1 : 0)"
```

## Metrics to Track

| Metric | Target |
|--------|--------|
| Overall pass rate | > 90% |
| Calendar suite | > 95% |
| Personality suite | > 85% |
| No regressions | Week-over-week |
