# AI Chat Manual Checklist

Run these scenarios before release:

1. Greeting + ask for help.
2. Exact product query returns exact item.
3. No exact match returns related products.
4. Budget query returns in-budget items.
5. Out-of-stock item returns alternatives.
6. Buy flow: select product -> variant -> quantity.
7. Add-to-cart action from AI response works.
8. Checkout confirmation flow works.
9. Recommendation reason is shown in message.
10. Upsell suggestions are limited (max 1-2 add-ons).
11. Fallback response appears when backend AI fails.
12. Follow-up detail question ("mon do la mon gi", "noi ro hon") stays on selected product and does not bounce to wrong confirmation loop.
13. Detail response includes persuasive but factual wording from product description and a gentle CTA.
14. Action chips after detail/recommendation only point to products in the same response context (no unrelated chips).
15. If backend returns invalid product-bound actions, frontend hides those chips.
16. Long bot messages are split into readable lines/bullets on mobile.
17. Message cards keep comfortable spacing/line-height and do not look cramped.
18. When there are too many action chips, only priority chips show first with "Xem them".
19. Legacy responses without format metadata still render safely and readable.

## Full-flow regression pack (minimum 10)

Use this pack for task-level sign-off (search -> detail -> add-to-cart -> checkout):

1. Exact search -> view detail chip -> detail follow-up -> add-to-cart -> checkout yes.
2. Exact search -> add-to-cart -> checkout no -> continue search.
3. Related recommendations -> pick item -> variant select -> add-to-cart -> checkout.
4. Budget query -> in-budget picks -> detail follow-up -> add-to-cart.
5. Out-of-stock query -> alternatives -> add one -> checkout.
6. Generic recommendation query -> action chips capped -> open "Xem them" -> pick item.
7. English conversation flow end-to-end with checkout confirmation.
8. Legacy response (no recommendationMeta) still readable and action chips still clickable.
9. Wrong product-bound chip payload is filtered out in UI (no irrelevant action shown).
10. Multi-turn context handoff: product A detail -> product B buy -> checkout prompt remains consistent.
