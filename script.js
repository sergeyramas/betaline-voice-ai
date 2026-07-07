/* ============================================================
   BetaLine Voice AI — landing interactions
   Формы и виджеты наследуют боевой код betaline-ai.ru.
   ============================================================ */

/* ── Analytics helper (события из спека §9) ── */
function zvTrack(name, params) {
  try {
    if (typeof ym !== 'undefined') ym(108480715, 'reachGoal', name);
    if (window.va) window.va('event', { name: name, data: params || {} });
    if (window.gtag) window.gtag('event', name, params || {});
  } catch (_) { /* analytics is best-effort */ }
}

document.addEventListener('DOMContentLoaded', function () {

  /* ── data-track клики ── */
  document.querySelectorAll('[data-track]').forEach(function (el) {
    el.addEventListener('click', function () { zvTrack(el.getAttribute('data-track')); });
  });

  /* ── Navbar scroll shadow ── */
  var navbar = document.getElementById('zv-navbar');
  window.addEventListener('scroll', function () {
    navbar && navbar.classList.toggle('scrolled', window.scrollY > 8);
  }, { passive: true });

  /* ── Burger / mobile menu ── */
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
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  /* ── FAQ open event ── */
  document.querySelectorAll('.zv-faq-item').forEach(function (d) {
    d.addEventListener('toggle', function () { if (d.open) zvTrack('voice_faq_open'); });
  });

  /* ── Sticky mobile CTA: показываем после hero, прячем на форме ── */
  var stickyCta = document.getElementById('zv-sticky-cta');
  var hero = document.getElementById('zv-hero');
  var formSection = document.getElementById('lead-form');
  if (stickyCta && hero && 'IntersectionObserver' in window) {
    var heroVisible = true, formVisible = false;
    function updateSticky() {
      var show = !heroVisible && !formVisible;
      stickyCta.classList.toggle('on', show);
      if (show) stickyCta.removeAttribute('hidden'); else stickyCta.setAttribute('hidden', '');
    }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { heroVisible = e.isIntersecting; });
      updateSticky();
    }, { threshold: 0 }).observe(hero);
    if (formSection) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { formVisible = e.isIntersecting; });
        updateSticky();
      }, { threshold: 0.1 }).observe(formSection);
    }
  }

  /* ── Exit-intent (механика основного сайта) ── */
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

  /* ── Lead form → POST /api/lead (боевой endpoint основного сайта) ── */
  var leadForm = document.getElementById('zv-lead-form');
  var formMsg = document.getElementById('zv-form-msg');
  var formSuccess = document.getElementById('zv-form-success');
  var submitBtn = document.getElementById('zv-submit');

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

  if (leadForm) {
    leadForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      formMsg.className = 'zv-form-msg';
      formMsg.textContent = '';

      var name = document.getElementById('zv-name');
      var phone = document.getElementById('zv-phone');
      var valid = true;
      [name, phone].forEach(function (f) {
        f.classList.remove('zv-invalid');
        if (!f.value.trim()) { f.classList.add('zv-invalid'); valid = false; }
      });
      if (phone.value.trim() && phone.value.replace(/\D/g, '').length < 7) {
        phone.classList.add('zv-invalid');
        valid = false;
      }
      if (!valid) {
        formMsg.className = 'zv-form-msg error';
        formMsg.textContent = 'Заполните имя и корректный телефон.';
        return;
      }

      submitBtn.disabled = true;
      var btnText = submitBtn.textContent;
      submitBtn.textContent = 'Отправляем…';

      // Комментарий несёт и UTM-хвост, чтобы не менять контракт /api/lead
      var utmTail = Object.keys(utm).filter(function (k) { return utm[k]; })
        .map(function (k) { return k + '=' + utm[k]; }).join(' ');
      var comment = document.getElementById('zv-comment').value.trim();

      var payload = {
        source: 'voice-landing',           // hidden field: источник
        intent: 'demo-call',               // hidden field: интент заявки
        page_variant: 'v1',
        name: name.value.trim(),
        phone: phone.value.trim(),
        company: document.getElementById('zv-company').value.trim(),
        niche: document.getElementById('zv-niche').value.trim(),
        task: document.getElementById('zv-task').value,
        base: document.getElementById('zv-base').value,
        result_channel: document.getElementById('zv-result').value,
        comment: comment + (utmTail ? (comment ? ' | ' : '') + utmTail : '')
      };
      Object.assign(payload, utm);

      try {
        var resp = await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        leadForm.style.display = 'none';
        formSuccess.style.display = 'block';
        zvTrack('voice_form_submit_success');
      } catch (err) {
        formMsg.className = 'zv-form-msg error';
        formMsg.textContent = 'Не удалось отправить заявку. Напишите нам в Telegram или попробуйте ещё раз.';
        zvTrack('voice_form_submit_error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = btnText;
      }
    });
  }
});

/* ============================================================
   BetaLine Chat Widget — JS 1:1 с основного сайта betaline-ai.ru
   (адаптированы только приветственные тексты под голосовой продукт)
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
