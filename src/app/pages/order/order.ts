import { AfterViewInit, Component } from '@angular/core';

type YandexWindow = Window & { ymaps?: unknown };

@Component({
  selector: 'app-order',
  standalone: true,
  templateUrl: './order.html'
})
export class Order implements AfterViewInit {
  ngAfterViewInit(): void {
    const win = window as YandexWindow;

    const startOrderScript = (): void => {
      if (document.querySelector('script[data-dostaffkin-order]')) return;

      const pageScript = document.createElement('script');
      pageScript.src = new URL('scripts/order.js', document.baseURI).toString();
      pageScript.dataset['dostaffkinOrder'] = 'true';
      pageScript.onerror = () =>
        console.error('Не удалось загрузить scripts/order.js');

      document.body.appendChild(pageScript);
    };

    if (win.ymaps) {
      startOrderScript();
      return;
    }

    const existingLoader =
      document.querySelector<HTMLScriptElement>(
        'script[data-dostaffkin-yandex]'
      );

    if (existingLoader) {
      existingLoader.addEventListener(
        'load',
        () => this.waitForYandex(startOrderScript),
        { once: true }
      );
      existingLoader.addEventListener(
        'error',
        () => console.error('Не удалось загрузить API Яндекс.Карт'),
        { once: true }
      );
      this.waitForYandex(startOrderScript);
      return;
    }

    const loader = document.createElement('script');
    loader.src = 'https://testologia.ru/ymc_min.js';
    loader.setAttribute(
      'data-apikey',
      '6256457c-edf3-44bb-825c-f88a0c03160e'
    );
    loader.setAttribute(
      'data-suggest-apikey',
      '097b87cd-1068-486b-9d34-b507ebc6ccf2'
    );
    loader.dataset['dostaffkinYandex'] = 'true';

    loader.onload = () => this.waitForYandex(startOrderScript);
    loader.onerror = () =>
      console.error('Не удалось загрузить API Яндекс.Карт');

    document.head.appendChild(loader);
  }

  private waitForYandex(callback: () => void): void {
    let attempts = 0;

    const timer = window.setInterval(() => {
      attempts++;

      if ((window as YandexWindow).ymaps) {
        window.clearInterval(timer);
        callback();
      } else if (attempts >= 60) {
        window.clearInterval(timer);
        console.error('Яндекс.Карты не инициализировались за 30 секунд.');
      }
    }, 500);
  }
}
