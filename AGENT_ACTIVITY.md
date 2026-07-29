# Agent Activity Log — betaline-voice-ai

Координация агентов в этом проекте. Цель: не перетирать работу друг друга.

> Глобальный fleet-ledger (весь парк Mac+VPS) — `~/Documents/agent-fleet/AGENT_ACTIVITY.md`.
> Регламент — `~/Documents/agent-fleet/RULES.md` и `templates/AGENT_ACTIVITY_template.md`.

## Active

⚠️ **Домен уже боевой:** `zvonok.betaline-ai.ru` привязан к проекту с 2026-07-29. Любой push в `main` = авто-деплой на этот адрес, а не только на `*.vercel.app`.

## Recently Completed

- [2026-07-29] **claude-mac-fable5** (mac, session-24079abd, чат «независимый ревьюер pre-launch») — topic: `pre-launch-fixes-review` — branch: `landing/pre-launch-fixes` (локально, НЕ пушена) — DONE
  Враждебный финальный ревью диффа `landing/pre-launch-fixes` vs `main`@6ffeede перед доменом (не доверял работе автора ветки). Проверено: api/lead.js SKIPPED-логика (8 локальных сценариев без реальных токенов — ни одного случая, где рабочий Telegram даёт 502), script.js (счётчик 108480715→111116675 grep-чисто везде, `@`-валидация 8/8), тёмная тема (Playwright 1440/375, обе темы, светлая — дефолт подтверждён, FOUC не найден), claims-policy (грязных находок нет), sitemap.xml/JSON-LD парсятся, FAQPage JSON-LD совпадает с видимым контентом 8/8, все Telegram/tel: ссылки живые, roadmap-блок скрыт и без висячих ссылок, sticky-CTA корректно скрывается при открытом мобильном меню (`body.zv-menu-open .zv-sticky-cta`).
  **Один баг найден и исправлен:** `d2375c1` — чат-виджет (`#bl-widget-chat-input`, `#bl-cb-name`, `#bl-cb-phone`) не был ретокенизирован для тёмной темы (белый фон/чёрный текст поверх тёмной панели) — единственный пропуск в остальном полной ретокенизации. Добавлены `background:var(--bg-card); color:var(--text-ink)`, светлая тема не тронута (проверено).
  Не трогал: push, деплой, DNS. Полный отчёт — в чате (вердикт и разбор по пунктам 1–6).

- [2026-07-29 09:20 UTC] **claude-mac-fable5** (mac, session-24079abd, чат «оркестратор-аудит») — topic: `pre-launch-fixes` — branch: `landing/pre-launch-fixes` (локально, НЕ пушена, база — `main`@6ffeede) — DONE
  Предзапусковая правка перед контекстной рекламой. Коммиты (все локальные, top→bottom):
  `f2af388` claims-policy копирайт (гарантии/стоп-лист/«естественно»/«меньше неявок»/«послушайте бота») + фикс регрессии переполнения hero-грида на мобиле · `2ef6367` api/lead.js: честный учёт доставки лида (SKIPPED-санитайзер вместо ложного 200) + строгая валидация Telegram-контакта в script.js · `a338cc1` CTA-иерархия Telegram(#1)+форма(#2) везде, тёмная тема (светлая — дефолт), SEO/JSON-LD/og/twitter, перф шрифтов, скрыт незаконченный блок «Позвонить AI-боту» · `5b2e90e` callback.js source→voice-landing · `7facb88` robots.txt/sitemap.xml · `aff7329` Yandex.Metrika 111116675.
  Файлы: `index.html`, `styles.css`, `script.js`, `assets/css/saas-tokens.css`, `api/lead.js`, `api/callback.js`, `robots.txt`, `sitemap.xml` (новые). Прод/Vercel/DNS не трогал.
  Верификация: Playwright 1440×900 + 375×812, светлая+тёмная — 0 console errors, 0 layout-overflow (в т.ч. после регрессии, которую сам нашёл и починил), callback-виджет и theme-toggle работают и персистятся. Подробности — `verify-report.md`.

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
