# Visual QA Report — BetaLine Voice AI — 2026-07-07 (v1, round 1)

**Target:** https://betaline-voice-ai.vercel.app
**Spec:** `tests/verify-v1.spec.ts`
**Run:** 30s · 3 viewports (desktop 1280, mobile 360, mobile 390) · 3/3 passed

## Summary
- Скриншотов: 18 PNG + 3 JSON + full-page
- Critical: 0 · Important: 1 (исправлено) · Minor: 3 (2 исправлено)
- Console errors: 0 · Page errors: 0 · Network 4xx/5xx: 0
- Горизонтальный overflow: нет (все 3 viewport)
- Битые картинки: нет (пустые панели в jump-scroll скриншотах = lazy-load во время программного скролла; на full-page с плавным скроллом все изображения загружены)
- **Verdict: PASS**

## Issues

### Important — исправлено (commit 60c8a1a)
1. **Mobile ≤640: чат-кнопка перекрывала hero primary CTA** на первом экране (360×740). Фикс: FAB получает класс `zv-fab-wait` (opacity 0, pointer-events none) до scrollY > 300; при видимом sticky-CTA чат поднимается на 78px.

### Minor
2. Бургер 38×32 < 44px tap-target — исправлено (padding 14px/11px). (60c8a1a)
3. Placeholder ниши обрезался на 360px — сокращён. (60c8a1a)
4. Текстовые ссылки футера ~17px высотой — стандарт для футера, оставлено by design.

## Функциональные проверки (Playwright live probe)
- Sticky mobile CTA: появляется после hero (class `on`, display flex) ✓
- Бургер-меню открывается/закрывается ✓
- FAQ-аккордеон открывается ✓
- Форма: POST /api/lead → `{"ok":true,"lead_id":"Lmraslgw76d2f36"}` (source=voice-landing принят; Telegram-карточка и Sheets-строка ушли) ✓
- Auto-deploy: push → GitHub Actions → Vercel prod, 2 зелёных прогона ✓

## Acceptance checklist (спек 08 §13) — выборочно
- Основной сайт betaline-ai.ru не тронут ✓ (отдельный репозиторий/проект)
- Токены/шрифты/палитра из saas-tokens.css ✓
- Cold base не в hero-обещании ✓
- CTA сведены к 3 интентам ✓
- Mock-элементы промаркированы («демо-макет», «пример сценария», «пример отчёта пилота») ✓
- FAQ: cold base, AI disclosure, стоп-лист, незнакомые вопросы ✓
- Primary CTA без «послушать демо» (аудио нет) ✓
- Success/error states формы ✓ · hidden fields (source/intent/utm) ✓
- Mobile 360/390 ✓

---

## Round 2 — Codex visual review (2026-07-07)

Codex-ревью (визуальное качество/консистентность/claims): **PASS**, критических блокеров нет. Findings и фиксы:

| # | Severity | Finding | Fix (commit round 2) |
|---|---|---|---|
| 1 | Important | step-2/step-3 выбивались из визуальной семьи (англ. текст «Alex Chen…», ракета-метафора) | Перегенерированы в стиле сценарных карточек (gpt-image-1, greeked-текст) |
| 2 | Important | step-2 содержал читаемый нерелевантный англ. UI-текст | Устранено перегенерацией |
| 3 | Important | Чат-виджет: холодные slate-серые (#f1f5f9, #475569…) | Ретокенизация в тёплую палитру (bg-warm/orange-soft), логика 1:1 сохранена |
| 4 | Important | FAB теснит конверсионный путь на мобиле у формы | На ≤640px FAB скрыт при видимой форме (body.zv-form-visible) |
| 5 | Minor | step-1 (фотореал-наушники) стал выбиваться после фикса 1 | Перегенерирован в единый стиль карточек |
| 7 | Minor | Claims policy — pass, нарушений нет | — |
| 8 | Minor | Hero 5-second grunt test — pass | — |

**Итог: PASS. Визуальная семья единая, claims чистые, конверсионный путь не перекрыт.**
