# Agent Activity Log — betaline-voice-ai

Координация агентов в этом проекте. Цель: не перетирать работу друг друга.

> Глобальный fleet-ledger (весь парк Mac+VPS) — `~/Documents/agent-fleet/AGENT_ACTIVITY.md`.
> Регламент — `~/Documents/agent-fleet/RULES.md` и `templates/AGENT_ACTIVITY_template.md`.

## Active

- [2026-07-29 05:30 UTC] **claude-mac-opus5** (mac, session-a7be288b, чат «поиск проекта + домен») — topic: `domain-zvonok` — branch: `main` — files: `AGENT_ACTIVITY.md`, `docs/agents/incidents.md`, `.claude/settings.json` (скаффолд) — код лендинга НЕ трогаю
- [2026-07-29 08:40 UTC] **claude-mac-fable5** (mac, session-24079abd, чат «оркестратор-аудит») — topic: `pre-launch-fixes` — branch: `landing/pre-launch-fixes` (локально, НЕ пушится) — files: `index.html`, `styles.css`, `script.js`, `assets/css/saas-tokens.css`, `api/callback.js` (1 строка), `robots.txt`, `sitemap.xml` (новые) — предзапусковая правка перед контекстной рекламой: Метрика-сниппет, CTA-иерархия (Telegram/демо-звонок/форма), тёмная тема, SEO-база, перф шрифтов. Прод/Vercel/DNS не трогаю.

**Разделение прямо сейчас:** аудит-сессия владеет кодом лендинга, доменная сессия — инфраструктурой (Vercel/DNS) и координацией. Пересечений по файлам нет.

## Recently Completed

- [2026-07-29 05:25 UTC] **claude-mac-opus5** (mac) — topic: `domain-zvonok`, часть 1 — DONE (без коммита в репо)
  `zvonok.betaline-ai.ru` добавлен в Vercel-проект `betaline-voice-ai` (`vercel domains add`, scope `sergeyramas-projects`).
  Vercel требует DNS-запись: **`A zvonok 76.76.21.21`** (или CNAME `cname.vercel-dns.com`). NS домена — Beget (Петербург), панель у Серёги, доступа к API у агентов нет.
  Пока записи нет — домен в Vercel числится `not configured`, сайт по нему не открывается. Апекс `betaline-ai.ru` живёт в другом Vercel-проекте (`tildastorybrandblocks`) — его не трогать.

---

## Регламент (короткая версия)

1. Перед правками — прочитать `## Active`, при пересечении файлов остановиться и написать оператору.
2. Свою заявку добавлять в `## Active` ДО правки, расширил scope — обновить заявку.
3. После завершения — перенести в `Recently Completed` с SHA и разбором, записи старше 7 дней удалять.
4. Требует записи: правки кода/доков/конфигов, деплой. Не требует: чтение, grep, логи.
5. ⚠️ push в `main` = авто-деплой на прод через GitHub Actions. Коммит без готовности деплоить — держать локально.
