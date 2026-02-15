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
