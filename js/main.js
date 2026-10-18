(function () {
  // Telegram мастера, куда уходит заявка
  var TELEGRAM = 'lanskaya_nails';

  var form = document.getElementById('booking-form');
  var status = form.querySelector('.form__status');
  var dateInput = form.elements.date;
  var phoneInput = form.elements.phone;

  // Нельзя выбрать прошедшую дату
  var today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  dateInput.min = today.toISOString().slice(0, 10);

  // Маска телефона +7 (XXX) XXX-XX-XX
  phoneInput.addEventListener('input', function () {
    var d = phoneInput.value.replace(/\D/g, '');
    if (!d) { phoneInput.value = ''; return; }
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    var out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 4) out += ')';
    if (d.length > 4) out += ' ' + d.slice(4, 7);
    if (d.length > 7) out += '-' + d.slice(7, 9);
    if (d.length > 9) out += '-' + d.slice(9, 11);
    phoneInput.value = out;
  });

  function setInvalid(input, bad) {
    input.closest('.field').classList.toggle('is-invalid', bad);
  }

  form.addEventListener('input', function (e) {
    if (e.target.closest('.is-invalid')) setInvalid(e.target, false);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var f = form.elements;
    var checks = [
      [f.name, f.name.value.trim().length > 1],
      [f.phone, f.phone.value.replace(/\D/g, '').length === 11],
      [f.service, !!f.service.value],
      [f.date, !!f.date.value && f.date.value >= dateInput.min]
    ];
    var firstBad = null;
    checks.forEach(function (c) {
      setInvalid(c[0], !c[1]);
      if (!c[1] && !firstBad) firstBad = c[0];
    });

    if (firstBad) {
      status.textContent = 'Проверьте отмеченные поля';
      status.classList.add('is-error');
      (firstBad.type === 'hidden' ? firstBad.closest('.field').querySelector('button') : firstBad).focus();
      return;
    }

    var date = new Date(f.date.value + 'T00:00:00')
      .toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' });

    var lines = [
      'Здравствуйте! Хочу записаться.',
      'Имя: ' + f.name.value.trim(),
      'Телефон: ' + f.phone.value,
      f.telegram.value.trim() ? 'Telegram: ' + f.telegram.value.trim() : '',
      'Услуга: ' + f.service.value,
      'Дата: ' + date + (f.time.value ? ', ' + f.time.value : ''),
      f.comment.value.trim() ? 'Комментарий: ' + f.comment.value.trim() : ''
    ].filter(Boolean);

    window.open('https://t.me/' + TELEGRAM + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');

    status.classList.remove('is-error');
    status.textContent = 'Заявка готова: в открывшемся Telegram нажмите «Отправить». Я подтвержу время в течение часа.';
  });

  // Портфолио: клик по фото открывает просмотр со стрелками
  var tiles = [].slice.call(document.querySelectorAll('.tile'));
  var box = null, boxImg, boxCap, current = 0;
  var arrow = function (d) {
    return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';
  };

  function buildBox() {
    box = document.createElement('dialog');
    box.className = 'lightbox';
    box.setAttribute('aria-label', 'Просмотр работы');
    box.innerHTML =
      '<div class="lightbox__inner">' +
        '<button class="lightbox__btn" type="button" data-step="-1" aria-label="Предыдущая работа">' + arrow('M15 5l-7 7 7 7') + '</button>' +
        '<figure><img alt=""><figcaption></figcaption></figure>' +
        '<button class="lightbox__btn" type="button" data-step="1" aria-label="Следующая работа">' + arrow('M9 5l7 7-7 7') + '</button>' +
      '</div>' +
      '<button class="lightbox__btn lightbox__close" type="button" aria-label="Закрыть">' + arrow('M6 6l12 12M18 6L6 18') + '</button>';
    boxImg = box.querySelector('img');
    boxCap = box.querySelector('figcaption');
    box.addEventListener('click', function (e) {
      var step = e.target.closest('[data-step]');
      if (step) return show(current + Number(step.dataset.step));
      if (e.target.closest('.lightbox__close') || !e.target.closest('figure')) box.close();
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
    document.body.appendChild(box);
  }

  function show(i) {
    current = (i + tiles.length) % tiles.length;
    var img = tiles[current].querySelector('img');
    boxImg.src = img.srcset ? img.srcset.split(', ').pop().split(' ')[0] : img.src;
    boxImg.alt = img.alt;
    boxCap.textContent = (current + 1 < 10 ? '0' : '') + (current + 1) + ' — ' + img.alt;
  }

  tiles.forEach(function (tile, i) {
    tile.tabIndex = 0;
    tile.setAttribute('role', 'button');
    function open() {
      if (typeof HTMLDialogElement !== 'function') return;
      if (!box) buildBox();
      show(i);
      box.showModal();
    }
    tile.addEventListener('click', open);
    tile.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });
})();

// Шапка и мобильное меню
(function () {
  var bar = document.getElementById('topbar');
  var menu = document.getElementById('menu');
  var burger = bar.querySelector('.topbar__burger');

  var hero = document.querySelector('.hero');
  var lastY = window.scrollY;

  // На баннере шапка стоит на месте; ниже — закреплена и видна только при прокрутке вверх
  function onScroll() {
    var y = window.scrollY;
    var past = y > hero.offsetHeight;
    bar.classList.toggle('is-fixed', past);
    var dy = y - lastY;
    if (!past) bar.classList.remove('is-shown');
    else if (dy < -2) bar.classList.add('is-shown');
    else if (dy > 2) bar.classList.remove('is-shown');
    if (Math.abs(dy) > 2) lastY = y;
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function setMenu(open) {
    menu.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    bar.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  burger.addEventListener('click', function () { setMenu(menu.hidden); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
})();

// Календарь для выбора даты записи
(function () {
  var field = document.querySelector('.field--date');
  var toggle = field.querySelector('.datepick__toggle');
  var label = toggle.querySelector('#date-value');
  var input = field.querySelector('input[name="date"]');
  var pop = field.querySelector('.datepick');

  var MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  var WEEK = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
  var DAYS_AHEAD = 90; // на сколько дней вперёд открыта запись

  var today = startOfDay(new Date());
  var maxDate = addDays(today, DAYS_AHEAD);
  var selected = null;
  var view = new Date(today.getFullYear(), today.getMonth(), 1);
  var focusDate = today;

  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function same(a, b) { return !!a && !!b && a.getTime() === b.getTime(); }
  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function inRange(d) { return d >= today && d <= maxDate; }
  function clamp(d) { return d < today ? today : d > maxDate ? maxDate : d; }

  function arrow(d) {
    return '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';
  }

  function render() {
    var y = view.getFullYear(), m = view.getMonth();
    var lead = (new Date(y, m, 1).getDay() + 6) % 7; // неделя с понедельника
    var count = new Date(y, m + 1, 0).getDate();
    var canPrev = new Date(y, m, 0) >= today;
    var canNext = new Date(y, m + 1, 1) <= maxDate;

    var html =
      '<div class="datepick__head">' +
        '<button class="datepick__nav" type="button" data-nav="-1" aria-label="Предыдущий месяц"' + (canPrev ? '' : ' disabled') + '>' + arrow('M15 5l-7 7 7 7') + '</button>' +
        '<div class="datepick__title" aria-live="polite"><span class="datepick__month">' + MONTHS[m] + '</span><span class="datepick__year">' + y + '</span></div>' +
        '<button class="datepick__nav" type="button" data-nav="1" aria-label="Следующий месяц"' + (canNext ? '' : ' disabled') + '>' + arrow('M9 5l7 7-7 7') + '</button>' +
      '</div>' +
      '<div class="datepick__week" aria-hidden="true">' + WEEK.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div>' +
      '<div class="datepick__grid">';
    for (var i = 0; i < lead; i++) html += '<span></span>';
    for (var day = 1; day <= count; day++) {
      var d = new Date(y, m, day);
      var cls = 'datepick__day' + (same(d, today) ? ' is-today' : '') + (same(d, selected) ? ' is-selected' : '');
      html += '<button type="button" class="' + cls + '" data-date="' + iso(d) + '"' +
        ' tabindex="' + (same(d, focusDate) ? 0 : -1) + '"' +
        ' aria-label="' + d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' }) + '"' +
        (same(d, selected) ? ' aria-pressed="true"' : '') +
        (inRange(d) ? '' : ' disabled') + '>' + day + '</button>';
    }
    html += '</div>' +
      '<div class="datepick__foot">' +
        '<button type="button" class="datepick__quick" data-quick="0">Сегодня</button>' +
        '<button type="button" class="datepick__quick" data-quick="1">Завтра</button>' +
      '</div>';
    pop.innerHTML = html;
  }

  function focusDay() {
    var btn = pop.querySelector('[data-date="' + iso(focusDate) + '"]');
    if (btn) btn.focus();
  }

  function moveFocus(d) {
    focusDate = clamp(d);
    view = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1);
    render();
    focusDay();
  }

  function open() {
    focusDate = selected || today;
    view = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1);
    render();
    pop.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    focusDay();
  }

  function close(returnFocus) {
    if (pop.hidden) return;
    pop.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) toggle.focus();
  }

  function choose(d) {
    selected = d;
    input.value = iso(d);
    var text = d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' });
    label.textContent = text.charAt(0).toUpperCase() + text.slice(1);
    toggle.classList.remove('is-empty');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    close(true);
  }

  toggle.addEventListener('click', function () {
    if (pop.hidden) open(); else close(true);
  });

  pop.addEventListener('click', function (e) {
    var nav = e.target.closest('[data-nav]');
    var day = e.target.closest('[data-date]');
    var quick = e.target.closest('[data-quick]');
    if (nav) {
      var step = Number(nav.dataset.nav);
      view = new Date(view.getFullYear(), view.getMonth() + step, 1);
      focusDate = clamp(new Date(view.getFullYear(), view.getMonth(), Math.min(focusDate.getDate(), 28)));
      render();
      var again = pop.querySelector('[data-nav="' + step + '"]');
      (again && !again.disabled ? again : pop.querySelector('.datepick__day[tabindex="0"]')).focus();
    } else if (day && !day.disabled) {
      var p = day.dataset.date.split('-');
      choose(new Date(p[0], p[1] - 1, p[2]));
    } else if (quick) {
      choose(addDays(today, Number(quick.dataset.quick)));
    }
  });

  pop.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); close(true); return; }
    if (!e.target.closest('[data-date]')) return;
    var steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key in steps) { e.preventDefault(); moveFocus(addDays(focusDate, steps[e.key])); }
    if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault();
      moveFocus(new Date(focusDate.getFullYear(), focusDate.getMonth() + (e.key === 'PageUp' ? -1 : 1), focusDate.getDate()));
    }
  });

  document.addEventListener('pointerdown', function (e) {
    if (!pop.hidden && !field.contains(e.target)) close(false);
  });
})();
