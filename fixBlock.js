(function () {
  "use strict";

  const WORKER = "https://p.suharevich-vadim.workers.dev/?url=";

  const ALLOWED = [
    "z01.online",
    "levende.github.io",
    "tvigl.info",
    "github.com",
  ];

  function isTV() {
    const ua = navigator.userAgent.toLowerCase();
    return (
      ua.includes("smart-tv") ||
      ua.includes("smarttv") ||
      ua.includes("tizen") ||
      ua.includes("webos") ||
      ua.includes("android tv")
    );
  }

  if (isTV()) return;

  function shouldProxy(url) {
    try {
      const parsed = new URL(url);
      return ALLOWED.includes(parsed.hostname);
    } catch {
      return false;
    }
  }

  function wrap(url) {
    return WORKER + encodeURIComponent(url);
  }

  /* fetch */
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    let url = typeof input === "string" ? input : input.url;

    if (shouldProxy(url)) {
      const proxied = wrap(url);
      if (typeof input === "string") {
        return originalFetch(proxied, init);
      } else {
        return originalFetch(new Request(proxied, input), init);
      }
    }

    return originalFetch(input, init);
  };

  const OriginalWebSocket = window.WebSocket;

  window.WebSocket = function (url, protocols) {
    if (url.includes("z01.online")) {
      const proxied =
        "wss://p.suharevich-vadim.workers.dev/?url=" + encodeURIComponent(url);

      // Створюємо сокет
      const ws = protocols
        ? new OriginalWebSocket(proxied, protocols)
        : new OriginalWebSocket(proxied);

      // Маскуємо URL, щоб NativeWsClient не панікував
      Object.defineProperty(ws, "url", { value: url, writable: false });

      // Додаємо дебаг, щоб бачити чи шле скрипт щось
      const originalSend = ws.send;
      ws.send = function (data) {
        console.log("📤 [WS Outbound]:", data);
        return originalSend.apply(this, arguments);
      };

      return ws;
    }
    return protocols
      ? new OriginalWebSocket(url, protocols)
      : new OriginalWebSocket(url);
  };

  // ВАЖЛИВО: копіюємо прототип і константи, щоб скрипти не "падали"
  window.WebSocket.prototype = OriginalWebSocket.prototype;
  window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
  window.WebSocket.OPEN = OriginalWebSocket.OPEN;
  window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
  window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;

  /* ajax */
  if (window.$ && $.ajax) {
    const originalAjax = $.ajax;
    $.ajax = function (options) {
      if (options?.url && shouldProxy(options.url)) {
        options.url = wrap(options.url);
      }
      return originalAjax.apply(this, arguments);
    };
  }
})();
