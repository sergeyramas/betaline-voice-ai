# Handoff — BetaLine Voice AI — 2026-07-07

## Status
Лендинг задеплоен и работает (rework v2 «живой»). Прод: https://betaline-voice-ai.vercel.app.
Ждём финальную оценку Серёги; правки — точечно по секциям.

## Read first (in order)
1. `CLAUDE.md` — правила проекта (деплой, claims policy, git, gh-аккаунты)
2. `verify-report.md` — 3 раунда QA, что менялось и почему
3. `../Betaline NEW V1/research/zvonok-voice-ai/10-gap-analysis-v2-pain-driven.md` — GAP-фундамент (боли+цитаты, SB7-структура §6)
4. `../Betaline NEW V1/research/zvonok-voice-ai/08-implementation-ready-landing-spec.md` — канон (H1/CTA/claims)

## In-session decisions
- **Деплой через GitHub Actions, не Vercel-интеграция:** Vercel GitHub App не установлен (нужен клик в браузере, headless нельзя). Секреты VERCEL_TOKEN/ORG_ID/PROJECT_ID в repo secrets, workflow `.github/workflows/deploy.yml`. Push в main → авто-деплой.
- **KPI прототипа отклонены:** «+32% лидов / −45% пропущенных / 24/7» — фейковые метрики, нарушение claims policy. Заменены честными чипами процесса.
- **Своя копия `api/*`:** прод-`master` (betaline-ai.ru) в allowlist `api/lead.js` НЕ содержит `voice-landing`. Лендинг несёт свою копию api → не зависит от прода. Не переключать формы на betaline-ai.ru/api без правки master.
- **gh: два аккаунта на маке** (sergeyramas + volobuevaleksand7-hue), другой агент переключает активный. Для push/secrets всегда `GH_TOKEN=$(gh auth token --user sergeyramas)` или push через `https://x-access-token:$TOKEN@github.com/...`.

## Next step
Дождаться отзыва Серёги на v2. Если правки — точечно по названной секции; если ок — предложить привязку домена zvonok.betaline-ai.ru (только после явного «да»).

## Open (ждёт Серёгу)
Реальные аудио-демо (блокер честной продажи звука) · домен zvonok.betaline-ai.ru · оценка v2.

## First message
```
Продолжаю проект BetaLine Voice AI (голосовой лендинг). Не начинай пока не скажу.

Прочитай в порядке:
1. `/Users/sergeyrama/Documents/betaline-voice-ai/docs/agents/SESSION_HANDOFF_2026-07-07.md`
2. `/Users/sergeyrama/Documents/betaline-voice-ai/CLAUDE.md`
3. `/Users/sergeyrama/Documents/betaline-voice-ai/verify-report.md`

Прод: https://betaline-voice-ai.vercel.app · репо github.com/sergeyramas/betaline-voice-ai.
Стек: чистый HTML/CSS/JS (index.html, styles.css, script.js) + api/ (копия боевого betaline-ai.ru).
Деплой: push в main → GitHub Actions → Vercel (Vercel App не установлен).

Жди мою команду.
```
