/* ============================================================
   BetaLine Voice AI — landing interactions (rework v2)
   Формы и виджеты наследуют боевой код betaline-ai.ru.
   ============================================================ */

/* ── Analytics helper ── */
function zvTrack(name, params) {
  try {
    if (typeof ym !== 'undefined') ym(108480715, 'reachGoal', name);
    if (window.va) window.va('event', { name: name, data: params || {} });
    if (window.gtag) window.gtag('event', name, params || {});
  } catch (_) { /* best-effort */ }
}

document.addEventListener('DOMContentLoaded', function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── data-track клики ── */
  document.querySelectorAll('[data-track]').forEach(function (el) {
    el.addEventListener('click', function () { zvTrack(el.getAttribute('data-track')); });
  });

  /* ── Navbar scroll shadow ── */
  var navbar = document.getElementById('zv-navbar');
  window.addEventListener('scroll', function () {
    navbar && navbar.classList.toggle('scrolled', window.scrollY > 8);
  }, { passive: true });

  /* ── Burger ── */
  var burger = document.getElementById('zv-burger');
  var mobileMenu = document.getElementById('zv-mobile-menu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── Reveal on scroll ── */
  var revealEls = document.querySelectorAll('.zv-reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ════════ HERO: живая карточка звонка (демо-макет, цикл) ════════ */
  (function () {
    var transcript = document.getElementById('zv-transcript');
    var status = document.getElementById('zv-live-status');
    var eq = document.getElementById('zv-eq');
    var pipeSteps = document.querySelectorAll('.zv-pipe-step');
    if (!transcript || !status) return;

    var SCRIPT = [
      { who: 'bot',    text: 'Добрый день! Меня зовут Анна, компания BetaLine. Удобно сейчас говорить?', pipe: 0 },
      { who: 'client', text: 'Да, слушаю.', pipe: 1 },
      { who: 'bot',    text: 'Мы помогаем автоматизировать первичные звонки по согласованному сценарию. Это может быть интересно?', pipe: 1 },
      { who: 'client', text: 'Да, расскажите подробнее.', pipe: 2 },
      { who: 'bot',    text: 'Отлично! Задам пару вопросов и передам диалог менеджеру.', pipe: 3 },
      { who: 'final',  text: 'Заинтересован → статус и транскрипт переданы в CRM / Telegram', pipe: 4 }
    ];

    function setPipe(idx, done) {
      pipeSteps.forEach(function (s, i) {
        s.classList.toggle('on', i === idx && !done);
        s.classList.toggle('done', i < idx || done);
      });
    }

    function renderStatic() {
      SCRIPT.forEach(function (line) {
        var el = document.createElement('div');
        el.className = 'zv-msg ' + line.who + ' show';
        el.textContent = line.text;
        transcript.appendChild(el);
      });
      setPipe(4, true);
      status.textContent = 'передано менеджеру';
      status.classList.add('done');
      eq && eq.classList.add('idle');
    }

    if (reduced) { renderStatic(); return; }

    var idx = 0;
    var timer = null;

    function step() {
      if (document.hidden) { timer = setTimeout(step, 1200); return; }
      if (idx >= SCRIPT.length) {
        timer = setTimeout(function () {
          transcript.innerHTML = '';
          status.textContent = 'идёт разговор';
          status.classList.remove('done');
          eq && eq.classList.remove('idle');
          setPipe(0, false);
          idx = 0;
          timer = setTimeout(step, 700);
        }, 4200);
        return;
      }
      var line = SCRIPT[idx];
      var el = document.createElement('div');
      el.className = 'zv-msg ' + line.who;
      el.textContent = line.text;
      transcript.appendChild(el);
      requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('show'); }); });
      while (transcript.children.length > 4) transcript.removeChild(transcript.firstChild);

      if (line.who === 'final') {
        setPipe(4, true);
        status.textContent = 'передано менеджеру';
        status.classList.add('done');
        eq && eq.classList.add('idle');
      } else {
        setPipe(line.pipe, false);
      }
      idx += 1;
      timer = setTimeout(step, line.who === 'final' ? 400 : 1900);
    }
    timer = setTimeout(step, 900);
  })();

  /* ════════ Side dot-nav ════════ */
  (function () {
    var nav = document.getElementById('zv-dotnav');
    if (!nav || !('IntersectionObserver' in window)) return;
    var links = Array.from(nav.querySelectorAll('a'));
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('data-section')] = a; });
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (a) { a.classList.remove('active'); });
          var link = map[e.target.id];
          link && link.classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(map).forEach(function (id) {
      var sec = document.getElementById(id);
      sec && sio.observe(sec);
    });
  })();

  /* ════════ Plan scroll-spy (паттерн #sb-plan основного сайта) ════════ */
  (function () {
    var steps = Array.from(document.querySelectorAll('.zv-ps-step'));
    var fill = document.getElementById('zv-ps-fill');
    var track = document.getElementById('zv-ps-track');
    var container = document.getElementById('zv-planspy-steps');
    if (!steps.length || !fill || !container) return;

    function handle() {
      var lastDot = steps[steps.length - 1].querySelector('.zv-ps-dot');
      var cTop = container.getBoundingClientRect().top;
      if (lastDot && track) track.style.height = (lastDot.getBoundingClientRect().top - cTop + 10) + 'px';

      var triggerY = window.innerHeight * (window.innerWidth <= 900 ? 0.7 : 0.5);
      var activeIdx = 0, minDist = Infinity;
      steps.forEach(function (s, i) {
        var r = s.getBoundingClientRect();
        var d = Math.abs(r.top + r.height / 2 - triggerY);
        if (d < minDist) { minDist = d; activeIdx = i; }
      });
      steps.forEach(function (s, i) { s.classList.toggle('is-active', i === activeIdx); });
      for (var i = 1; i <= steps.length; i++) {
        var img = document.getElementById('zv-ps-img-' + i);
        img && img.classList.toggle('is-active', i === activeIdx + 1);
      }
      var dot = steps[activeIdx].querySelector('.zv-ps-dot');
      if (dot) fill.style.height = (dot.getBoundingClientRect().top - cTop + 10) + 'px';
    }
    window.addEventListener('scroll', handle, { passive: true });
    window.addEventListener('resize', handle);
    handle();
  })();

  /* ════════ Tasks: показать ещё ════════ */
  (function () {
    var btn = document.getElementById('zv-tasks-more');
    if (!btn) return;
    btn.addEventListener('click', function () {
      document.querySelectorAll('.zv-task-extra').forEach(function (c) { c.removeAttribute('hidden'); });
      btn.style.display = 'none';
    });
  })();

  /* ════════ Сценарный слайдер: табы диалог + статус (ARIA + клавиатура) ════════ */
  (function () {
    var tabs = Array.from(document.querySelectorAll('.zv-tab'));
    if (!tabs.length) return;
    var panels = Array.from(document.querySelectorAll('.zv-tab-panel'));
    function activate(btn, focus) {
      tabs.forEach(function (t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
      });
      panels.forEach(function (p) { p.classList.remove('is-active'); p.setAttribute('hidden', ''); });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      btn.setAttribute('tabindex', '0');
      var panel = document.querySelector('[data-panel="' + btn.dataset.tab + '"]');
      if (panel) { panel.removeAttribute('hidden'); panel.classList.add('is-active'); }
      if (focus) btn.focus();
    }
    tabs.forEach(function (btn, i) {
      btn.setAttribute('tabindex', btn.classList.contains('is-active') ? '0' : '-1');
      btn.addEventListener('click', function () { activate(btn, false); });
      btn.addEventListener('keydown', function (e) {
        var idx = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') idx = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') idx = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') idx = 0;
        else if (e.key === 'End') idx = tabs.length - 1;
        if (idx !== null) { e.preventDefault(); activate(tabs[idx], true); }
      });
    });
  })();

  /* ════════ FAQ: hover-раскрытие как на основном сайте ════════ */
  (function () {
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine) return; // на тач-устройствах остаётся клик
    document.querySelectorAll('.zv-faq-item').forEach(function (d) {
      d.addEventListener('mouseenter', function () { d.open = true; });
      d.addEventListener('mouseleave', function () { d.open = false; });
    });
  })();
  document.querySelectorAll('.zv-faq-item').forEach(function (d) {
    d.addEventListener('toggle', function () { if (d.open) zvTrack('voice_faq_open'); });
  });

  /* ════════ Result flow: бегущий активный узел ════════ */
  (function () {
    var flow = document.getElementById('zv-result-flow');
    if (!flow || reduced) return;
    var nodes = Array.from(flow.querySelectorAll('.zv-flow-node'));
    var i = 0, started = false;
    function tick() {
      nodes.forEach(function (n, j) { n.classList.toggle('live', j === i); });
      i = (i + 1) % nodes.length;
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !started) { started = true; tick(); setInterval(tick, 1300); }
        });
      }, { threshold: 0.4 }).observe(flow);
    }
  })();

  /* ── Market contrast view event ── */
  var contrast = document.getElementById('approach');
  if (contrast && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { zvTrack('voice_market_contrast_view'); cio.disconnect(); }
      });
    }, { threshold: 0.4 });
    cio.observe(contrast);
  }

  /* ── Chat FAB на мобиле: не перекрывать hero CTA / форму ── */
  var chatFab = document.getElementById('bl-chat-btn');
  function zvFabGate() {
    if (!chatFab) return;
    var isMobile = window.innerWidth <= 640;
    chatFab.classList.toggle('zv-fab-wait', isMobile && window.scrollY < 300);
  }
  zvFabGate();
  window.addEventListener('scroll', zvFabGate, { passive: true });
  window.addEventListener('resize', zvFabGate);

  /* ── Sticky mobile CTA ── */
  var stickyCta = document.getElementById('zv-sticky-cta');
  var hero = document.getElementById('zv-hero');
  var formSection = document.getElementById('lead-form');
  if (stickyCta && hero && 'IntersectionObserver' in window) {
    var heroVisible = true, formVisible = false;
    function updateSticky() {
      var show = !heroVisible && !formVisible;
      stickyCta.classList.toggle('on', show);
      document.body.classList.toggle('zv-sticky-visible', show);
      if (show) stickyCta.removeAttribute('hidden'); else stickyCta.setAttribute('hidden', '');
    }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { heroVisible = e.isIntersecting; });
      updateSticky();
    }, { threshold: 0 }).observe(hero);
    if (formSection) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { formVisible = e.isIntersecting; });
        document.body.classList.toggle('zv-form-visible', formVisible);
        updateSticky();
      }, { threshold: 0.1 }).observe(formSection);
    }
  }

  /* ── Exit-intent ── */
  var exitDialog = document.getElementById('zv-exit-dialog');
  if (exitDialog && typeof exitDialog.showModal === 'function') {
    function closeExit() { exitDialog.close(); }
    var exitClose = exitDialog.querySelector('[data-close-exit]');
    exitClose && exitClose.addEventListener('click', closeExit);
    var exitCta = exitDialog.querySelector('[data-exit-cta]');
    exitCta && exitCta.addEventListener('click', function () {
      closeExit();
      var f = document.getElementById('lead-form');
      f && f.scrollIntoView({ behavior: 'smooth' });
      zvTrack('voice_scenario_review_click');
    });
    exitDialog.addEventListener('click', function (e) { if (e.target === exitDialog) closeExit(); });
    var exitShownKey = 'zvExitShown';
    document.addEventListener('mouseleave', function (e) {
      if (e.clientY >= 10) return;
      if (sessionStorage.getItem(exitShownKey)) return;
      sessionStorage.setItem(exitShownKey, '1');
      exitDialog.showModal();
    });
  }

  /* ── «Обратный звонок» плашка → чат-виджет с формой колбэка ── */
  var cbPill = document.getElementById('zv-callback-pill');
  if (cbPill) {
    cbPill.addEventListener('click', function () {
      if (typeof toggleChat === 'function' && typeof blShowCallback === 'function') {
        var win = document.getElementById('bl-chat-window');
        if (win && !win.classList.contains('open')) toggleChat();
        blShowCallback();
      }
    });
  }

  /* ── UTM ── */
  var utm = (function () {
    var p = new URLSearchParams(location.search);
    return {
      utm_source: p.get('utm_source') || '',
      utm_medium: p.get('utm_medium') || '',
      utm_campaign: p.get('utm_campaign') || '',
      utm_content: p.get('utm_content') || '',
      utm_term: p.get('utm_term') || ''
    };
  })();
  function utmTail() {
    return Object.keys(utm).filter(function (k) { return utm[k]; })
      .map(function (k) { return k + '=' + utm[k]; }).join(' ');
  }

  function sendLead(payload, onOk, onErr, btn) {
    btn.disabled = true;
    var t = btn.textContent;
    btn.textContent = 'Отправляем…';
    Object.assign(payload, utm, { source: 'voice-landing', intent: 'demo-call', page_variant: 'v2' });
    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      onOk();
      zvTrack('voice_form_submit_success');
    }).catch(function () {
      onErr();
      zvTrack('voice_form_submit_error');
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = t;
    });
  }

  function validPhone(v) { return v.replace(/\D/g, '').length >= 7 || v.trim().charAt(0) === '@'; }

  /* ════════ Квиз ════════ */
  (function () {
    var form = document.getElementById('zv-quiz-form');
    if (!form) return;
    var picked = { task: '', result_channel: '', options: [] };

    form.querySelectorAll('.zv-quiz-chips').forEach(function (group) {
      var key = group.getAttribute('data-quiz');
      var multi = group.getAttribute('data-mode') === 'multi';
      group.querySelectorAll('.zv-qchip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          if (multi) {
            chip.classList.toggle('on');
            picked.options = Array.from(group.querySelectorAll('.on')).map(function (c) { return c.textContent; });
          } else {
            group.querySelectorAll('.zv-qchip').forEach(function (c) { c.classList.remove('on'); });
            chip.classList.add('on');
            picked[key] = chip.textContent;
          }
        });
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = document.getElementById('zv-quiz-msg');
      var name = document.getElementById('zv-quiz-name');
      var phone = document.getElementById('zv-quiz-phone');
      msg.className = 'zv-form-msg';
      msg.textContent = '';
      [name, phone].forEach(function (f) { f.classList.remove('zv-invalid'); });
      var ok = true;
      if (!name.value.trim()) { name.classList.add('zv-invalid'); ok = false; }
      if (!phone.value.trim() || !validPhone(phone.value)) { phone.classList.add('zv-invalid'); ok = false; }
      if (!ok) {
        msg.className = 'zv-form-msg error';
        msg.textContent = 'Заполните имя и корректный телефон или Telegram.';
        return;
      }
      var comment = 'Квиз: ' + [
        picked.task && ('задача — ' + picked.task),
        picked.result_channel && ('результат — ' + picked.result_channel),
        picked.options.length && ('важно — ' + picked.options.join(', '))
      ].filter(Boolean).join('; ');
      var tail = utmTail();
      sendLead({
        name: name.value.trim(),
        phone: phone.value.trim(),
        task: picked.task,
        result_channel: picked.result_channel,
        comment: comment + (tail ? ' | ' + tail : '')
      }, function () {
        Array.from(form.children).forEach(function (el) {
          if (el.id !== 'zv-quiz-success') el.style.display = 'none';
        });
        document.getElementById('zv-quiz-success').style.display = 'block';
      }, function () {
        msg.className = 'zv-form-msg error';
        msg.textContent = 'Не удалось отправить. Напишите нам в Telegram или попробуйте ещё раз.';
      }, document.getElementById('zv-quiz-submit'));
    });
  })();

  /* ════════ Простая финальная форма ════════ */
  (function () {
    var leadForm = document.getElementById('zv-lead-form');
    if (!leadForm) return;
    leadForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var formMsg = document.getElementById('zv-form-msg');
      var name = document.getElementById('zv-name');
      var phone = document.getElementById('zv-phone');
      formMsg.className = 'zv-form-msg';
      formMsg.textContent = '';
      [name, phone].forEach(function (f) { f.classList.remove('zv-invalid'); });
      var ok = true;
      if (!name.value.trim()) { name.classList.add('zv-invalid'); ok = false; }
      if (!phone.value.trim() || !validPhone(phone.value)) { phone.classList.add('zv-invalid'); ok = false; }
      if (!ok) {
        formMsg.className = 'zv-form-msg error';
        formMsg.textContent = 'Заполните имя и корректный телефон.';
        return;
      }
      var comment = document.getElementById('zv-comment').value.trim();
      var tail = utmTail();
      sendLead({
        name: name.value.trim(),
        phone: phone.value.trim(),
        comment: comment + (tail ? (comment ? ' | ' : '') + tail : '')
      }, function () {
        leadForm.style.display = 'none';
        document.getElementById('zv-form-success').style.display = 'block';
      }, function () {
        formMsg.className = 'zv-form-msg error';
        formMsg.textContent = 'Не удалось отправить заявку. Напишите нам в Telegram или попробуйте ещё раз.';
      }, document.getElementById('zv-submit'));
    });
  })();
});

/* ============================================================
   BetaLine Chat Widget — JS 1:1 с основного сайта betaline-ai.ru
   ============================================================ */
(function() {
    var chatState = {
        open: false,
        visitorId: localStorage.getItem('bl_visitor_id') || null,
        topicId: localStorage.getItem('bl_topic_id') || null,
        inited: false
    };

    if (!chatState.visitorId) {
        chatState.visitorId = 'v' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
        localStorage.setItem('bl_visitor_id', chatState.visitorId);
    }

    window.toggleChat = function() {
        chatState.open = !chatState.open;
        var win = document.getElementById('bl-chat-window');
        var btn = document.getElementById('bl-chat-btn');
        if (chatState.open) {
            win.classList.add('open');
            btn.style.display = 'none';
            if (!chatState.inited) {
                chatState.inited = true;
                blAddMsg('bot', 'Привет! Я ассистент BetaLine AI. Могу рассказать про голосового AI-бота и пилот.');
                setTimeout(function() {
                    blAddMsg('bot', 'Можете задать любой вопрос, или выберите действие ниже.');
                }, 800);
            }
            document.getElementById('bl-widget-chat-input').focus();
        } else {
            win.classList.remove('open');
            btn.style.display = 'flex';
        }
    };

    function stripMarkdown(s) {
        if (typeof s !== 'string') return s;
        return s
            .replace(/\*\*(.+?)\*\*/g, '$1')
            .replace(/__(.+?)__/g, '$1')
            .replace(/(^|[\s(])\*(?!\s)([^*\n]+?)\*(?=[\s).,!?;:]|$)/g, '$1$2')
            .replace(/(^|[\s(])_(?!\s)([^_\n]+?)_(?=[\s).,!?;:]|$)/g, '$1$2')
            .replace(/`([^`]+?)`/g, '$1')
            .replace(/^#{1,6}\s+/gm, '')
            .replace(/^\s*[-*+]\s+/gm, '• ')
            .replace(/\n{3,}/g, '\n\n');
    }

    window.blAddMsg = function(type, text) {
        var msgs = document.getElementById('bl-chat-messages');
        var div = document.createElement('div');
        div.className = 'bl-msg ' + type;
        div.textContent = type === 'bot' ? stripMarkdown(text) : text;
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;
    };

    var _utmParams = (function() {
        var p = new URLSearchParams(location.search);
        return {
            source: p.get('utm_source') || '',
            medium: p.get('utm_medium') || '',
            campaign: p.get('utm_campaign') || '',
            term: p.get('utm_term') || '',
            content: p.get('utm_content') || ''
        };
    })();

    chatState.history = JSON.parse(localStorage.getItem('bl_chat_history') || '[]');

    function blOpenBotBubble() {
        var msgs = document.getElementById('bl-chat-messages');
        var div = document.createElement('div');
        div.className = 'bl-msg bot';
        div.textContent = '';
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;
        return div;
    }

    function blTypingBubble() {
        var msgs = document.getElementById('bl-chat-messages');
        var div = document.createElement('div');
        div.className = 'bl-msg bot bl-typing';
        div.textContent = '•••';
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;
        return div;
    }

    window.blSend = function() {
        var input = document.getElementById('bl-widget-chat-input');
        var msg = input.value.trim();
        if (!msg) return;
        input.value = '';
        blAddMsg('user', msg);

        var qa = document.getElementById('bl-quick-actions');
        if (qa) qa.style.display = 'none';
        var cbf = document.getElementById('bl-callback-form');
        if (cbf) cbf.style.display = 'none';

        var typing = blTypingBubble();

        var payload = {
            visitorId: chatState.visitorId,
            topicId: chatState.topicId,
            message: msg,
            history: chatState.history.slice(-10),
            page: location.pathname + location.search
        };
        if (!chatState.topicId) {
            payload.utm = _utmParams;
            payload.referrer = document.referrer || '';
            payload.userAgent = navigator.userAgent || '';
            payload.screen = screen.width + 'x' + screen.height;
            payload.lang = navigator.language || '';
        }

        var msgsEl = document.getElementById('bl-chat-messages');

        fetch('/api/chat-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
            body: JSON.stringify(payload)
        }).then(function(resp) {
            if (!resp.ok || !resp.body) {
                if (typing && typing.parentNode) typing.remove();
                blAddMsg('system', 'Ошибка. Попробуйте позже или напишите в Telegram.');
                return;
            }
            var reader = resp.body.getReader();
            var decoder = new TextDecoder('utf-8');
            var sseBuffer = '';
            var typingRemoved = false;
            var currentBubble = null;
            var bubbleBuffer = '';
            var pendingPart = '';

            function feedChunk(text) {
                if (!text) return;
                if (!currentBubble) {
                    if (!typingRemoved && typing && typing.parentNode) { typing.remove(); typingRemoved = true; }
                    currentBubble = blOpenBotBubble();
                    bubbleBuffer = '';
                }
                pendingPart += text;
                while (true) {
                    var idx = pendingPart.indexOf('\n\n');
                    if (idx === -1) break;
                    var head = pendingPart.slice(0, idx);
                    pendingPart = pendingPart.slice(idx + 2);
                    bubbleBuffer += head;
                    currentBubble.textContent = stripMarkdown(bubbleBuffer.trim());
                    currentBubble = null;
                    bubbleBuffer = '';
                    if (pendingPart.length) {
                        currentBubble = blOpenBotBubble();
                    }
                }
                if (currentBubble) {
                    bubbleBuffer += pendingPart;
                    pendingPart = '';
                    currentBubble.textContent = stripMarkdown(bubbleBuffer);
                    msgsEl.scrollTop = msgsEl.scrollHeight;
                }
            }

            function finishStream(final) {
                if (typing && typing.parentNode) typing.remove();
                if (pendingPart) {
                    if (!currentBubble) currentBubble = blOpenBotBubble();
                    bubbleBuffer += pendingPart;
                    pendingPart = '';
                    currentBubble.textContent = stripMarkdown(bubbleBuffer.trim());
                } else if (currentBubble) {
                    currentBubble.textContent = stripMarkdown(bubbleBuffer.trim());
                }

                if (final) {
                    if (final.topicId && !chatState.topicId) {
                        chatState.topicId = final.topicId;
                        localStorage.setItem('bl_topic_id', final.topicId);
                    }
                    if (final.reply) {
                        chatState.history.push({ role: 'user', content: msg });
                        chatState.history.push({ role: 'assistant', content: final.reply });
                        localStorage.setItem('bl_chat_history', JSON.stringify(chatState.history.slice(-20)));
                    }
                    if (typeof ym !== 'undefined') ym(108480715, 'reachGoal', 'chat_message');
                    if (final.contactDetected && typeof ym !== 'undefined') ym(108480715, 'reachGoal', 'chat_lead');
                }
                msgsEl.scrollTop = msgsEl.scrollHeight;
            }

            function handleSSEBlock(block) {
                var event = 'message', data = '';
                block.split('\n').forEach(function(line) {
                    if (line.indexOf('event:') === 0) event = line.slice(6).trim();
                    else if (line.indexOf('data:') === 0) data += (data ? '\n' : '') + line.slice(5).trim();
                });
                if (!data) return;
                var parsed;
                try { parsed = JSON.parse(data); } catch (e) { return; }
                if (event === 'chunk') {
                    feedChunk(parsed.text || '');
                } else if (event === 'meta') {
                    if (parsed.topicId && !chatState.topicId) {
                        chatState.topicId = parsed.topicId;
                        localStorage.setItem('bl_topic_id', parsed.topicId);
                    }
                } else if (event === 'done') {
                    finishStream(parsed);
                } else if (event === 'error') {
                    if (typing && typing.parentNode) typing.remove();
                    if (currentBubble && !bubbleBuffer) currentBubble.remove();
                    blAddMsg('system', 'Ошибка. Попробуйте позже или напишите в Telegram.');
                }
            }

            function pump() {
                return reader.read().then(function(r) {
                    if (r.done) {
                        if (sseBuffer.trim()) handleSSEBlock(sseBuffer);
                        return;
                    }
                    sseBuffer += decoder.decode(r.value, { stream: true });
                    var idx;
                    while ((idx = sseBuffer.indexOf('\n\n')) !== -1) {
                        var block = sseBuffer.slice(0, idx);
                        sseBuffer = sseBuffer.slice(idx + 2);
                        handleSSEBlock(block);
                    }
                    return pump();
                });
            }
            return pump();
        }).catch(function() {
            if (typing && typing.parentNode) typing.remove();
            blAddMsg('system', 'Не удалось отправить. Попробуйте позже или напишите в Telegram.');
        });
    };

    window.blQuick = function(text) {
        document.getElementById('bl-widget-chat-input').value = text;
        blSend();
    };

    window.blShowCallback = function() {
        var qa = document.getElementById('bl-quick-actions');
        if (qa) qa.style.display = 'none';
        document.getElementById('bl-callback-form').style.display = 'block';
        blAddMsg('bot', 'Оставьте имя и номер — перезвоним в рабочее время.');
    };

    window.blSendCallback = function() {
        var name = document.getElementById('bl-cb-name').value.trim();
        var phone = document.getElementById('bl-cb-phone').value.trim();
        if (!phone || phone.length < 5) { alert('Введите номер телефона'); return; }

        fetch('/api/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, phone: phone })
        })
        .then(function(r) {
            if (!r.ok) throw new Error('err');
            document.getElementById('bl-callback-form').style.display = 'none';
            blAddMsg('system', '✅ Заявка принята! Перезвоним в ближайшее время.');
            if (typeof ym !== 'undefined') ym(108480715, 'reachGoal', 'callback_chat');
        })
        .catch(function() {
            blAddMsg('system', 'Ошибка. Попробуйте позже.');
        });
    };
})();
