# AI Chat Rollback Runbook

## Trigger Conditions

- Error spike on `/ai-chat/respond`
- p95 latency > 3s sustained for 15 minutes
- no-match or SAFE fallback rate doubles vs baseline
- action mismatch metric spikes above baseline
- chip CTR proxy drops > 25% day-over-day after rollout step-up

## Immediate Rollback

1. Disable rule-first pipeline:
   - set `AI_CHAT_RULE_FIRST_PIPELINE_ENABLED=false`
2. Redeploy backend service.
3. Verify:
   - endpoint health is green
   - request error rate normalizes
   - latency returns to baseline

## Post-Rollback Review

- Capture impact window (start/end time).
- Compare KPI before/after rollback.
- Identify failing intent/fallback pattern.
- Create follow-up fix ticket and test scenario.
