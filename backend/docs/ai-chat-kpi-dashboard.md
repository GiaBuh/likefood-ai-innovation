# AI Chat KPI Dashboard

This dashboard is the minimum baseline for monitoring chatbot quality after enabling the new pipeline.

## Core Metrics

- `likefood.ai.chat.requests`  
  Tags: `intent`, `fallback_level`, `no_match`
- `likefood.ai.chat.latency`  
  Tags: `intent`, `fallback_level`, `no_match`, `refusal`
- `likefood.ai.chat.recommendation.exposure`  
  Tags: `offer_type`, `reason`
- `likefood.ai.chat.recommendation.conversion`  
  Tags: `action_type`, `offer_type`
- `likefood.ai.chat.chip.ctr` (derived)  
  Formula: `recommendation.conversion / recommendation.exposure` by `offer_type`
- `likefood.ai.chat.action.mismatch`  
  Tags: `action_type`
- `likefood.ai.chat.recommendation.exposure` vs `conversion`  
  Use as proxy CTR for chip presentation quality

## Suggested Alerts

- p95 latency > 2500ms for 10 minutes
- no-match rate > 25% for 15 minutes
- fallback level SAFE > 20% for 15 minutes
- conversion drop > 30% day-over-day
- action mismatch > 0 for 5 minutes

## KPI Targets (Phase 1)

- no-match rate: < 15%
- fallback SAFE rate: < 10%
- recommendation conversion: > 8%
- p95 latency: < 2s
- action mismatch: 0 in steady state
- maintain non-negative user readability feedback trend (support tickets/comments)
