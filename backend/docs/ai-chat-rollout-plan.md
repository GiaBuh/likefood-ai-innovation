# AI Chat Rollout Plan

## Feature Flag

- Flag: `AI_CHAT_RULE_FIRST_PIPELINE_ENABLED`
- Default: `true`
- Config path: `likefood.ai.chat.pipeline.rule-first-enabled`

## Rollout Steps

1. Internal test environment with full traffic.
2. Production canary 10% traffic for at least 24 hours.
3. Increase to 50% if KPIs are stable.
4. Increase to 100% and monitor for 48 hours.

## Validation Checklist

- No critical errors in chatbot endpoint.
- p95 latency does not regress over baseline by >20%.
- no-match and SAFE fallback rates improve or remain stable.
- Add-to-cart from chat does not regress.
- action mismatch metric remains 0 (or near 0 for transient events).
- chip CTR proxy (`recommendation.conversion` / `recommendation.exposure`) does not drop >15% vs baseline.

## Rollout Gates by KPI

- 10% -> 50% only when all of: p95 latency < 2.5s, SAFE fallback < 20%, action mismatch = 0.
- 50% -> 100% only when all of: p95 latency < 2.0s, SAFE fallback < 10%, conversion trend non-negative.
- Hold current step for at least 24h when any KPI is borderline instead of progressing immediately.
