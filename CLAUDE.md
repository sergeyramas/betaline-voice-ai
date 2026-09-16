# CLAUDE.md — betaline-voice-ai

Лендинг голосового AI-бота BetaLine. Прод: https://betaline-voice-ai.vercel.app

## Правила

- **Деплой:** push в `main` → GitHub Actions → Vercel prod. 🔴 CI падает с июля 2026 (`VERCEL_TOKEN` отклонён — токен отключённой команды); пока секрет не обновлён — руками `vercel deploy --prod --yes --scope npz-avod` из корня (проект `betaline-voice-ai` в npz-avod, перелинкован 16.09).
- **`ecosystem.js`** — копия из `~/Documents/betaline-ai-2/` (источник, не править здесь): полоска продуктов + кнопка «вернуться». Сдвиги: `.zv-navbar{top:var(--eco-h)}`, `--eco-back-bottom` в мобильной media.
- **Git:** user.email `fantroms@gmail.com`, user.name `sergeyramas` (иначе проблемы с Vercel). На маке два gh-аккаунта — для push/secrets использовать `GH_TOKEN=$(gh auth token --user sergeyramas)`.
- **API:** `api/` — своя копия боевого кода betaline-ai.ru (lead/callback/chat-ai). Лиды: `source=voice-landing`, `intent=demo-call`. Env vars — в Vercel-проекте `betaline-voice-ai` (скопированы с `tildastorybrandblocks`).
- **Дизайн:** только токены `assets/css/saas-tokens.css` (палитра/шрифты betaline-ai.ru). Никаких новых палитр и шрифтов.
- **Claims policy (жёстко):** нельзя «не отличим от человека», «заменит менеджеров», «окупится за N дней», гарантии лидов/ROI, фейковые кейсы/лого/метрики. Все mock-картинки UI маркируются «демо-макет»/«пример». Канон: `Betaline NEW V1/research/zvonok-voice-ai/08-implementation-ready-landing-spec.md`.
- **Исследование-фундамент:** `Betaline NEW V1/research/zvonok-voice-ai/10-gap-analysis-v2-pain-driven.md` (боли с реальными цитатами + StoryBrand-структура §6).
- **Картинки:** генерация `node scripts/gen-voice-images.mjs` (gpt-image-1, ключ из .env.local основного репо). Стиль: тёплый cream/orange, greeked-текст, без читаемых надписей.
- Домен `zvonok.betaline-ai.ru` подключать только после явного «да» от Серёги.
- QA перед показом: `npx playwright test tests/verify-v1.spec.ts` + обновить `verify-report.md`.
