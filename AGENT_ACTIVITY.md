# Agent Activity Log — betaline-voice-ai

Координация агентов в этом проекте. Цель: не перетирать работу друг друга.

> Глобальный fleet-ledger (весь парк Mac+VPS) — `~/Documents/agent-fleet/AGENT_ACTIVITY.md`.
> Регламент — `~/Documents/agent-fleet/RULES.md` и `templates/AGENT_ACTIVITY_template.md`.

## Active

- [2026-07-29 08:40 UTC] **claude-mac-fable5** (mac, session-24079abd, чат «оркестратор-аудит») — topic: `pre-launch-fixes` — branch: `landing/pre-launch-fixes` (локально, НЕ пушится) — files: `index.html`, `styles.css`, `script.js`, `assets/css/saas-tokens.css`, `api/callback.js` (1 строка), `robots.txt`, `sitemap.xml` (новые) — предзапусковая правка перед контекстной рекламой: Метрика-сниппет, CTA-иерархия (Telegram/демо-звонок/форма), тёмная тема, SEO-база, перф шрифтов. Прод/Vercel/DNS не трогаю.

**Разделение прямо сейчас:** аудит-сессия владеет кодом лендинга, доменная сессия — инфраструктурой (Vercel/DNS) и координацией. Пересечений по файлам нет.

⚠️ **Домен уже боевой:** `zvonok.betaline-ai.ru` привязан к проекту с 2026-07-29. Любой push в `main` = авто-деплой на этот адрес, а не только на `*.vercel.app`.

## Recently Completed

- [2026-07-29 05:45 UTC] **claude-mac-opus5** (mac) — topic: `domain-zvonok` — DONE
  **`https://zvonok.betaline-ai.ru` живой**, HTTP 200, сертификат выпущен, отдаёт тот же билд что и `betaline-voice-ai.vercel.app` (md5 совпадает).
  Что сделано: (1) `vercel domains add zvonok.betaline-ai.ru` в проект `betaline-voice-ai`, scope `sergeyramas-projects`; (2) DNS-запись `A zvonok → 76.76.21.21` в панели Beget, публикация заняла ~10 сек.
  **Как агент попал в панель Beget** (кредов на маке нет): Playwright `launchPersistentContext` с `--remote-debugging-port=9222`, Серёга логинится руками в этом окне, дальше агент цепляется `connectOverCDP`. Пароль агенту не передаётся.
  Грабли: поле Name в «Быстром добавлении» — Vuetify combobox. `Escape` стирает введённое; надо кликать пункт выпадашки (`.v-list-item` с текстом `zvonok`), иначе форма уйдёт с пустым Name.
  Не трогали: остальные записи зоны (`www`, `crm`, `autoconfig`, `autodiscover`, MX). Апекс `betaline-ai.ru` обслуживает другой Vercel-проект `tildastorybrandblocks` — его не трогать.

---

## Регламент (короткая версия)

1. Перед правками — прочитать `## Active`, при пересечении файлов остановиться и написать оператору.
2. Свою заявку добавлять в `## Active` ДО правки, расширил scope — обновить заявку.
3. После завершения — перенести в `Recently Completed` с SHA и разбором, записи старше 7 дней удалять.
4. Требует записи: правки кода/доков/конфигов, деплой. Не требует: чтение, grep, логи.
5. ⚠️ push в `main` = авто-деплой на прод через GitHub Actions. Коммит без готовности деплоить — держать локально.
