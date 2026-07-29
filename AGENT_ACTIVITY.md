# Agent Activity Log — betaline-voice-ai

Координация агентов в этом проекте. Цель: не перетирать работу друг друга.

> Глобальный fleet-ledger (весь парк Mac+VPS) — `~/Documents/agent-fleet/AGENT_ACTIVITY.md`.
> Регламент — `~/Documents/agent-fleet/RULES.md` и `templates/AGENT_ACTIVITY_template.md`.

## Active

⚠️ **Домен уже боевой:** `zvonok.betaline-ai.ru` привязан к проекту с 2026-07-29. Любой push в `main` = авто-деплой на этот адрес, а не только на `*.vercel.app`.

- [2026-07-29] **claude-mac-sonnet5** (mac, session-24079abd, чат «финальная визуальная правка гарантий») — topic: `guar-img-trim-crop` — branch: `main`@284f648 — IN PROGRESS
  Обрезка прозрачных полей вокруг фигуры в `assets/img/guarantees-shield.png` (Pillow `getbbox()` crop) + пересчёт `width`/`height` атрибутов в `index.html` и `max-width` `.zv-guar-img` в `styles.css` (десктоп + мобильный breakpoint). Файлы: `index.html`, `styles.css`, `assets/img/guarantees-shield.png`.

## Recently Completed

- [2026-07-29] **claude-mac-sonnet5** (mac, session-24079abd, чат «увеличить картинку в #safety») — topic: `guar-img-resize` — branch: `main` — DONE
  Картинка `guarantees-shield.png` в секции `#safety` («Четыре правила контроля вместо обещаний») была слишком мелкой (340px на десктопе 1440, много пустоты слева под текстом). Правка одной CSS-строки: `.zv-guar-img { max-width: 340px → 420px; width:100%; height:auto; }` в `styles.css`. Мобильный breakpoint (`max-width:260px` в `@media max-width:900px`) не тронут — уже не ломался и не требовал изменений. Разметка index.html и width/height-атрибуты (1024×571, корректный aspect-ratio) не менялись — не требовалось.
  Верификация: локальный сервер + Playwright, 1440×900 и 375×812, light+dark (переключение через `data-theme="dark"`) — 0 console errors, 0 horizontal overflow на всех 4 комбинациях. Десктоп: картинка теперь 420×234px (было 340×190), служит визуальным якорем левой колонки, тёмная тема — читается хорошо (свечение щита на тёмном фоне даже выигрышнее). Мобайл: 260×145px, без overflow, центрирована — без изменений от базовой линии.
  Деплой руками (Actions сломан, см. заметку выше): `vercel pull/build/deploy --prebuilt --prod --scope sergeyramas-projects` → `dpl_6U471Dk3QiAUiJ5t8dgFWFTFGW2c`, алиас на `zvonok.betaline-ai.ru` сработал. Прод: `curl` 200 OK, `styles.css` отдаёт новое правило (`max-width: 420px`), Playwright-смоук на живом сайте (1440×900) — картинка 420×234px, 0 console errors, 0 overflow.

- [2026-07-29] **claude-mac-sonnet5** (mac, session-24079abd, чат «гарантии на voice-лендинге») — topic: `guarantees-visual-block` — branch: `main`@`48c8fb6` — DONE
  Секция `#safety` («Четыре правила контроля вместо обещаний») переведена с плоской 2×2-сетки на двухколоночный визуальный блок в стиле эталона `Betaline NEW V1/10_guarantees.html` (только чтение референса, не правился): pill-бейдж + двухцветный заголовок + фото слева, 4 карточки-аккордеона (`<details>/<summary>`) справа. Контент не менялся — те же 4 правила, тот же текст, никаких новых обещаний; заголовок/бейдж — уже одобренные формулировки, банившаяся фраза «без мелкого шрифта» не возвращалась.
  Файлы: `index.html`, `styles.css` (новые `.zv-guar-*`, убраны неиспользуемые `.zv-gate/.zv-gates-grid`), `script.js` (аккордеон переиспользует hover/click-паттерн `.zv-faq-item`), `assets/img/guarantees-shield.png` (новый, из эталонного `guarantees_v5.png`, 383КБ → 104КБ через `pngquant`, прозрачность сохранена). Подробности — `verify-report.md` Round 5.
  Верификация: локально (Playwright, 1440×900 + 375×812, light+dark) — 0 console errors, 0 overflow, картинка грузится, аккордеон работает мышью и клавиатурой (`Enter` на `summary`). Деплой руками (Actions сломан, см. заметку от 2026-07-29 выше): `vercel pull/build/deploy --prebuilt --prod --scope sergeyramas-projects` → `dpl_3TCfyaV5zdig7hzE7D9f2VEqxYqa`, алиас на `zvonok.betaline-ai.ru` сработал. Повторная Playwright-проверка на живом проде (те же 4 комбинации viewport×тема) — тот же результат: 0 errors, 0 overflow, картинка и все 4 карточки на месте.

- [2026-07-29 12:xx UTC] **claude-mac-fable5** (mac, session-24079abd, чат «выкат в прод») — topic: `prod-deploy-pre-launch-fixes` — branch: `main`@`126c302` (merge `landing/pre-launch-fixes`, ff) — DONE
  **Прод обновлён.** `main` смёржен с `landing/pre-launch-fixes` (9 коммитов, fast-forward, без конфликтов) и запушен в `origin/main` (`0727e5f..126c302`). Авто-деплой через GitHub Actions (`.github/workflows/deploy.yml`, ран `30450115626`) **упал** на шаге `vercel pull` — `Error: The token provided via --token argument is not valid` (секрет `VERCEL_TOKEN` в GitHub Secrets невалиден/истёк). По правилу «повтор только при транзиентной ошибке» — не ретраил, секрет не трогал (зона инфра-сессии).
  Обошёл разовым ручным деплоем с локального Vercel CLI (уже был авторизован как `sergeyramas`): `vercel pull --yes --environment=production` → `vercel build --prod` → `vercel deploy --prebuilt --prod --scope sergeyramas-projects`, `.vercel/project.json` совпал с ожидаемым (`prj_IHpjSserMKKNoahuvqUfaXoAlIu8` / `team_IQe20O57hTH99URRYtc0FvFt`). Деплой `dpl_5F3XJtCi53FrKZoCphTg51kurAmK`, авто-алиас на `zvonok.betaline-ai.ru` сработал.
  Верификация живого сайта: Метрика `111116675` ✓, canonical ✓, светлая тема дефолтом (без `data-theme="dark"` в исходном HTML) ✓, `robots.txt`/`sitemap.xml` → 200/200 ✓, Playwright-смоук на проде (0 console errors, theme-toggle присутствует и переключает light→dark, `.zv-roadmap` скрыт) ✓, старый алиас `betaline-voice-ai.vercel.app` отдаёт идентичный новый HTML (byte-diff чист) ✓.
  **Заметка для инфра-сессии:** `VERCEL_TOKEN` в GitHub Secrets репозитория `sergeyramas/betaline-voice-ai` невалиден — авто-деплой через Actions сломан до замены секрета (ран `30450115626` — единственный провал, до этого 2026-07-07 всё зелёное). Ручной деплой — временный обход, не постоянное решение.

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
