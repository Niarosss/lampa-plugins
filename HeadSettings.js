(function () {
  "use strict";

  // Adding multi-language support
  Lampa.Lang.add({
    search: {
      ru: "Поиск",
      en: "Search",
      uk: "Пошук",
    },
    settings: {
      ru: "Настройки",
      en: "Settings",
      uk: "Налаштування",
    },
    premium: {
      ru: "Премиум",
      en: "Premium",
      uk: "Преміум",
    },
    profile: {
      ru: "Профиль",
      en: "Profile",
      uk: "Профіль",
    },
    feed: {
      ru: "Новости",
      en: "Feed",
      uk: "Новини",
    },
    notice: {
      ru: "Уведомления",
      en: "Notifications",
      uk: "Сповіщення",
    },
    broadcast: {
      ru: "Вещание",
      en: "Broadcast",
      uk: "Мовлення",
    },
    fullscreen: {
      ru: "Полноэкранный режим",
      en: "Fullscreen mode",
      uk: "Повноекранний режим",
    },
    reload: {
      ru: "Обновление страницы",
      en: "Page reload",
      uk: "Оновлення сторінки",
    },
    blackfriday: {
      ru: "Черная пятница",
      en: "Black Friday",
      uk: "Чорна п’ятниця",
    },
    split: {
      ru: "Разделитель",
      en: "Divider",
      uk: "Розділювач",
    },
    time: {
      ru: "Время",
      en: "Time",
      uk: "Годинник",
    },
    name_menu: {
      ru: "Отображать в шапке",
      en: "Display in header",
      uk: "Відображати у шапці",
    },
    name_plugin: {
      ru: "Настройка шапки",
      en: "Display in header",
      uk: "Налаштування шапки",
    },
    plugin_description: {
      ru: "Плагин для настройки шапки",
      en: "Plugin for customizing the header",
      uk: "Плагін для налаштування шапки",
    },
  });

  function startPlugin() {
    var manifest = {
      type: "other",
      version: "1.0.1",
      name: Lampa.Lang.translate("name_plugin"),
      description: Lampa.Lang.translate("plugin_description"),
      component: "head_filter",
    };
    Lampa.Manifest.plugins = manifest;

    var head = {
      head_filter_show_search: {
        name: Lampa.Lang.translate("search"),
        element: ".open--search",
      },
      head_filter_show_settings: {
        name: Lampa.Lang.translate("settings"),
        element: ".open--settings",
      },
      head_filter_show_premium: {
        name: Lampa.Lang.translate("premium"),
        element: ".open--premium",
      },
      head_filter_show_profile: {
        name: Lampa.Lang.translate("profile"),
        element: ".open--profile",
      },
      head_filter_show_feed: {
        name: Lampa.Lang.translate("feed"),
        element: ".open--feed",
      },
      head_filter_show_notice: {
        name: Lampa.Lang.translate("notice"),
        element: ".notice--icon",
      },
      head_filter_show_broadcast: {
        name: Lampa.Lang.translate("broadcast"),
        element: ".open--broadcast",
      },
      head_filter_show_fullscreen: {
        name: Lampa.Lang.translate("fullscreen"),
        element: ".full--screen",
      },
      head_filter_show_reload: {
        name: Lampa.Lang.translate("reload"),
        element: ".m-reload-screen",
      },
      head_filter_show_blackfriday: {
        name: Lampa.Lang.translate("blackfriday"),
        element: ".black-friday__button",
      },
      head_filter_show_split: {
        name: Lampa.Lang.translate("split"),
        element: ".head__split",
      },
      head_filter_show_time: {
        name: Lampa.Lang.translate("time"),
        element: ".head__time",
      },
    };

    function showHideElement(element, show) {
      if (show == true) {
        $(element).show();
      } else {
        $(element).hide();
      }
    }

    Lampa.Storage.listener.follow("change", function (event) {
      if (event.name == "activity") {
        setTimeout(function () {
          Object.keys(head).forEach(function (key) {
            var show_element = Lampa.Storage.get(key, true);
            showHideElement(head[key].element, show_element);
          });
        }, 1000);
      } else if (event.name in head) {
        var show_element = Lampa.Storage.get(event.name, true);
        showHideElement(head[event.name].element, show_element);
      }
    });

    Lampa.Template.add("settings_head_filter", `<div></div>`);

    Lampa.SettingsApi.addParam({
      component: "interface",
      param: {
        type: "button",
      },
      field: {
        name: Lampa.Lang.translate("name_plugin"),
        description: Lampa.Lang.translate("plugin_description"),
      },
      onChange: () => {
        Lampa.Settings.create("head_filter", {
          onBack: () => {
            Lampa.Settings.create("interface");
          },
        });
      },
    });

    Lampa.SettingsApi.addParam({
      component: "head_filter",
      param: {
        type: "title",
      },
      field: {
        name: Lampa.Lang.translate("name_menu"),
      },
    });

    Object.keys(head).forEach(function (key) {
      Lampa.SettingsApi.addParam({
        component: "head_filter",
        param: {
          name: key,
          type: "trigger",
          default: true,
        },
        field: {
          name: head[key].name,
        },
      });
    });
  }

  if (window.appready) {
    startPlugin();
  } else {
    Lampa.Listener.follow("app", function (e) {
      if (e.type == "ready") {
        startPlugin();
      }
    });
  }
})();
