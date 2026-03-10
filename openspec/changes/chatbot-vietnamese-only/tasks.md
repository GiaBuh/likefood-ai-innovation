## 1. useChatAi – Remove language switching

- [x] 1.1 Remove `chatLanguage` and `setChatLanguage` from `UseChatAiParams`; remove `activeLang` and `t()` helper; replace all `t(viText, enText)` calls with `viText` only
- [x] 1.2 Always pass `'vi'` as `requestLanguage` in `handleAiConversation` and `sendAiMessage`; stop calling `setChatLanguage(aiResponse.language)` from API response
- [x] 1.3 Stop exporting or using `detectLanguage` in the AI chat flow; remove it from return object of `useChatAi` if it is only used for language selection
- [x] 1.4 Update `handleActionClick` and any callback that passes `activeLang` to use `'vi'` instead

## 2. ChatWidget – Simplify state

- [x] 2.1 Remove `chatLanguage` and `setChatLanguage` state
- [x] 2.2 Remove `detectLanguage` from `handleSendMessage`; always call `sendAiMessage(..., 'vi')` (or equivalent)
- [x] 2.3 Update `useChatAi` call: remove `chatLanguage`, `setChatLanguage`; remove `detectLanguage` from destructured return
- [x] 2.4 Update chat persistence/hydration: remove or always set `chatLanguage` to `'vi'` if stored

## 3. API and types

- [x] 3.1 In `askAiAssistant` calls, always pass `preferredLanguage: 'vi'` (or hardcode in the API layer)
- [x] 3.2 Simplify or remove `AiChatLanguage` usage in frontend state; keep type only if needed for API compatibility

## 4. chatUtils and cleanup

- [x] 4.1 Remove `detectLanguage` export if no longer used, or mark deprecated and ensure no callers depend on it for response language
- [x] 4.2 Grep for `chatLanguage`, `setChatLanguage`, `detectLanguage`, `activeLang`, `t(` and fix any remaining references
- [x] 4.3 Run `npm run build` in frontend; verify no build errors
