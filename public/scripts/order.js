(function () {
  const fromInput = document.getElementById('from');
  const toInput = document.getElementById('to');
  const calcButton = document.getElementById('calc');

  if (!fromInput || !toInput || !calcButton) {
    console.error('Не найдены поля формы доставки.');
    return;
  }

  const sizes = document.querySelectorAll('.main-size-card');
  const speeds = document.querySelectorAll('.main-speed-card');

  const output = {
    distance: document.getElementById('distanceValue'),
    duration: document.getElementById('durationValue'),
    rate: document.getElementById('rateValue'),
    total: document.getElementById('totalValue')
  };

  const rates = { xs: 9, s: 13, m: 20, l: 27, xl: 35, max: 70 };
  const minimums = { xs: 149, s: 199, m: 249, l: 349, xl: 499, max: 999 };

  let map;
  let route;
  let calculated = false;

  function initMap() {
    if (!window.ymaps || map) return;

    ymaps.ready(function () {
      map = new ymaps.Map('yandex-map', {
        center: [55.751244, 37.618423],
        zoom: 5
      });

      if (ymaps.SuggestView) {
        new ymaps.SuggestView('from');
        new ymaps.SuggestView('to');
      }
    });
  }

  initMap();

  function selectedSize() {
    const active = document.querySelector(
      '.main-size-card.active, .main-size-card.is-active'
    );
    return active ? active.dataset.value : 's';
  }

  function selectedSpeed() {
    const active = document.querySelector('.main-speed-card.is-active');
    return active ? active.dataset.value : 'regular';
  }

  function reset() {
    calculated = false;
    document.getElementById('submit').disabled = true;

    Object.values(output).forEach(function (element) {
      if (element) element.textContent = '—';
    });

    if (route && map) {
      map.geoObjects.remove(route);
      route = null;
    }
  }

  sizes.forEach(function (card) {
    card.addEventListener('click', function () {
      sizes.forEach(function (item) {
        item.classList.remove('active', 'is-active');
      });

      card.classList.add('active', 'is-active');
      reset();
    });
  });

  speeds.forEach(function (card) {
    card.addEventListener('click', function () {
      speeds.forEach(function (item) {
        item.classList.remove('is-active');
        item.setAttribute('aria-pressed', 'false');
      });

      card.classList.add('is-active');
      card.setAttribute('aria-pressed', 'true');
      reset();
    });
  });

  [fromInput, toInput].forEach(function (input) {
    input.addEventListener('input', function () {
      calcButton.disabled = !(fromInput.value.trim() && toInput.value.trim());
      reset();
    });
  });

  calcButton.addEventListener('click', async function () {
    const from = fromInput.value.trim();
    const to = toInput.value.trim();

    if (!from || !to) {
      alert('Укажите оба адреса.');
      return;
    }

    if (!map || !window.ymaps) {
      alert('Карта ещё загружается. Подождите немного и попробуйте снова.');
      return;
    }

    calcButton.disabled = true;
    calcButton.textContent = 'Рассчитываем…';

    try {
      const result = await ymaps.route([from, to], {
        mapStateAutoApply: true
      });

      if (route) map.geoObjects.remove(route);
      route = result;
      map.geoObjects.add(route);

      const distance = result.getLength() / 1000;
      const size = selectedSize();
      const speed = selectedSpeed();
      const rate = rates[size];

      let total = Math.max(minimums[size], Math.ceil(distance * rate));
      let days = Math.max(1, Math.ceil(distance / 80));

      if (speed === 'fast') {
        total = Math.ceil(total * 1.15);
        days = Math.max(1, Math.ceil(days * 0.7));
      }

      output.distance.textContent = distance.toFixed(1) + ' км';
      output.duration.textContent = days + ' дн.';
      output.rate.textContent = rate + ' ₽/км';
      output.total.textContent = total.toLocaleString('ru-RU') + ' ₽';

      calculated = true;
      document.getElementById('submit').disabled = false;
    } catch (error) {
      console.error('Ошибка построения маршрута:', error);
      alert(
        'Ошибка построения маршрута: ' +
        (error?.message || String(error))
      );
    } finally {
      calcButton.disabled = false;
      calcButton.textContent = 'Рассчитать';
    }
  });

  document.getElementById('submit').addEventListener('click', function () {
    if (!calculated) {
      alert('Сначала рассчитайте доставку.');
      return;
    }

    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();

    if (!name || phone.replace(/\D/g, '').length < 10) {
      alert('Введите имя и корректный номер телефона.');
      return;
    }

    const id = String(Math.floor(10000 + Math.random() * 90000));
    const orders = JSON.parse(
      localStorage.getItem('dostaffkinOrders') || '{}'
    );

    orders[id] = {
      id: id,
      name: name,
      phone: phone,
      from: fromInput.value,
      to: toInput.value,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem('dostaffkinOrders', JSON.stringify(orders));

    document.getElementById('orderId').textContent = id;
    document.getElementById('orderForm').style.display = 'none';
    document.getElementById('orderSuccess').hidden = false;
  });

  calcButton.disabled = true;
  document.getElementById('submit').disabled = true;
})();
```
