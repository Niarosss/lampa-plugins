(function () {
  ("use strict");

  // Додаємо стилі для приховування елементів та оформлення
  $(
    "<style>\
    .hidden { display: none !important; }\
    .menu-hide-item .settings-param { \
        padding: 16px 60px !important; /* Збільшений відступ */ \
        min-height: 54px !important; \
        display: flex !important; \
        align-items: center !important; \
        border-radius: 12px !important; \
        margin-bottom: 12px !important; \
        background: rgba(255,255,255,0.05) !important; \
        transition: all 0.2s ease !important; \
    }\
    .menu-hide-item .settings-param:hover { \
        background: rgba(255,255,255,0.1) !important; \
        transform: translateY(-2px) !important; \
    }\
    .menu-hide-icon { \
        width: 30px !important; \
        height: 30px !important; \
        min-width: 30px !important; \
        min-height: 30px !important; \
        display: flex !important; \
        align-items: center !important; \
        justify-content: center !important; \
        margin-right: 16px !important; \
        margin-left: 10px !important; /* Додано відступ зліва */ \
    }\
    .menu-hide-text { \
        font-size: 18px !important; \
        flex-grow: 1 !important; \
        font-weight: 500 !important; \
        letter-spacing: 0.3px !important; \
    }\
    .menu-hide-hidden { \
        color: #ff4e45 !important; \
    }\
    .menu-hide-shown { \
        color: #4CAF50 !important; \
    }\
    .section-title .settings-param__name { \
        font-size: 20px !important; \
        font-weight: 600 !important; \
        margin: 25px 0 15px 0 !important; \
        padding-bottom: 8px !important; \
        border-bottom: 2px solid rgba(255,255,255,0.1) !important; \
        color: #fff !important; \
    }\
    .section-divider .settings-param { \
        height: 1px !important; \
        min-height: 1px !important; \
        padding: 0 !important; \
        background: rgba(255,255,255,0.1) !important; \
        margin: 25px 0 !important; \
    }\
    /* Стиль для неактивної кнопки */ \
    .settings-param.disable-hide { \
        opacity: 0.6 !important; \
        pointer-events: none !important; \
    }\
    /* Стиль для подяки */ \
    .credits-text { \
        text-align: center; \
        color: #b0b0b0 !important; /* Сірий колір зі зниженою яскравістю */ \
        font-size: 14px !important; \
        padding: 15px 20px 5px !important; \
        margin-top: 5px !important; \
        line-height: 1.5; \
    }\
</style>"
  ).appendTo("head");

  // Мультимовна підтримка
  Lampa.Lang.add({
    menu_items_hide: {
      en: "Setting the visibility of elements",
      uk: "Налаштування видимості елементів",
    },
    left_menu_title: {
      en: "Left menu",
      uk: "Ліве меню",
    },
    head_title: {
      en: "Head menu",
      uk: "Верхнє меню",
    },
    settings_title: {
      en: "Settings menu",
      uk: "Праве меню",
    },
    plugin_description: {
      en: "Plugin for hiding interface elements",
      uk: "Плагін для приховання елементів інтерфейсу",
    },
    hidden: {
      en: "Hidden",
      uk: "Приховано",
    },
    shown: {
      en: "Shown",
      uk: "Відображається",
    },
    no_name: {
      en: "Unnamed element",
      uk: "Елемент без назви",
    },
    head_action_search: {
      en: "Search",
      uk: "Пошук",
    },
    head_action_settings: {
      en: "Settings",
      uk: "Налаштування",
    },
    head_action_feed: {
      en: "Feed",
      uk: "Стрічка",
    },
    head_action_notice: {
      en: "Notifications",
      uk: "Сповіщення",
    },
    head_action_profile: {
      en: "Profile",
      uk: "Профіль",
    },
    head_action_fullscreen: {
      en: "Fullscreen",
      uk: "Повноекранний режим",
    },
    head_action_broadcast: {
      en: "Broadcast",
      uk: "Трансляція",
    },
    credits_text: {
      en: "Brazenly licked in free access and rewritten for own needs, bugs fixed. Author - @Niaros",
      uk: "Нахабно злизано у вільному доступі та переписано під власні потреби, виправлено баги. Автор - @Niaros",
    },
    reset_all_hidden: {
      en: "Show all",
      uk: "Показати все",
    },
    head_time: {
      ru: "Время",
      en: "Time",
      uk: "Час і дата",
    },
  });

  // Іконка ока для налаштувань
  var eyeIcon =
    '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';

  // Іконка для кнопки "Показати все"
  var resetIcon =
    '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>';

  // Іконка годинника
  var timeIcon =
    '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';

  // Ініціалізуємо плагіни
  function startPlugin() {
    var manifest = {
      type: "other",
      version: "1.0.1",
      name: Lampa.Lang.translate("menu_items_hide"),
      description: Lampa.Lang.translate("plugin_description"),
      component: "menu_filter",
    };
    Lampa.Manifest.plugins.push(manifest);

    // Функції для приховування/показу пунктів меню
    function updateMenuVisibility() {
      var hiddenItems = Lampa.Storage.get("menu_hide", []);

      $(".menu__item").each(function () {
        var $item = $(this);
        var textElement = $item.find(".menu__text");
        if (textElement.length === 0) return;

        var text = textElement.text().trim();

        if (hiddenItems.indexOf(text) !== -1) {
          $item.addClass("hidden");
        } else {
          $item.removeClass("hidden");
        }
      });
    }

    function updateHeadVisibility() {
      var hiddenItems = Lampa.Storage.get("head_hidden_items", []);

      $(".head__action, .head__time").each(function () {
        var $item = $(this);
        // Пропускаємо системні елементи
        if ($item.hasClass("processing")) return;

        // Генеруємо ID на основі класів
        var classes = $item.attr("class").split(" ");
        var idParts = [];
        for (var i = 0; i < classes.length; i++) {
          if (
            classes[i].indexOf("open--") === 0 ||
            classes[i] === "full--screen" ||
            classes[i] === "notice--icon" ||
            classes[i] === "head__time"
          ) {
            idParts.push(classes[i]);
          }
        }
        var id = idParts.join("_");

        if (!id) return;

        if (hiddenItems.indexOf(id) !== -1) {
          $item.addClass("hidden");
        } else {
          $item.removeClass("hidden");
        }
      });
    }

    function updateSettingsVisibility() {
      var hiddenItems = Lampa.Storage.get("settings_hidden_items", []);

      $(".settings-folder").each(function () {
        var $item = $(this);
        var component = $item.data("component");
        if (!component) return;

        // Не приховуємо налаштування нашого плагіна
        if (component === "menu_filter") return;

        if (hiddenItems.indexOf(component) !== -1) {
          $item.addClass("hidden");
        } else {
          $item.removeClass("hidden");
        }
      });
    }

    function updateAllVisibility() {
      updateMenuVisibility();
      updateHeadVisibility();
      updateSettingsVisibility();
    }

    // Функція скидання всіх прихованих елементів
    function resetAllHiddenItems() {
      // Очищаємо всі сховища прихованих елементів
      Lampa.Storage.set("menu_hide", []);
      Lampa.Storage.set("head_hidden_items", []);
      Lampa.Storage.set("settings_hidden_items", []);

      // Оновлюємо видимість елементів
      updateAllVisibility();

      // Оновлюємо статуси кнопок на поточному екрані
      $(".menu-hide-item").each(function () {
        var $item = $(this);
        var $value = $item.find(".settings-param__value");
        if ($value.length) {
          $value.text(Lampa.Lang.translate("shown"));
          $value.removeClass("menu-hide-hidden").addClass("menu-hide-shown");
        }
      });
    }

    // Додаємо компонент налаштувань
    Lampa.SettingsApi.addComponent({
      component: "menu_filter",
      name: Lampa.Lang.translate("menu_items_hide"),
      description: Lampa.Lang.translate("plugin_description"),
      icon: eyeIcon,
    });

    // Головне вікно налаштувань
    Lampa.SettingsApi.addParam({
      component: "interface",
      param: {
        type: "button",
      },
      field: {
        name: Lampa.Lang.translate("menu_items_hide"),
        description: Lampa.Lang.translate("plugin_description"),
      },
      onChange: function () {
        Lampa.Settings.create("menu_filter", {
          onBack: function () {
            Lampa.Settings.create("interface");
          },
        });
      },
    });
    // Змінні для відстеження створення налаштувань
    var leftSettingsCreated = false;
    var headSettingsCreated = false;
    var settingsSettingsCreated = false;
    var resetButtonAdded = false; // Прапорець для кнопки "Показати все"

    // Створюємо налаштування для меню з підтримкою TV
    function createMenuSettings() {
      // Додаємо подяку та кнопку скидання лише один раз
      if (!resetButtonAdded) {
        // Додаємо подяку в самому верху
        Lampa.SettingsApi.addParam({
          component: "menu_filter",
          param: {
            type: "space",
          },
          field: {},
          onRender: function (item) {
            var credits = $(
              '<div class="credits-text">' +
                Lampa.Lang.translate("credits_text") +
                "</div>"
            );
            item.append(credits);
          },
        });

        // Додаємо кнопку "Показати все" в самому верху
        Lampa.SettingsApi.addParam({
          component: "menu_filter",
          param: {
            type: "button",
          },
          field: {
            name: resetIcon,
            description: Lampa.Lang.translate("reset_all_hidden"),
          },
          onChange: function () {
            resetAllHiddenItems();
          },
          onRender: function (item) {
            item.addClass("menu-hide-item");
            item.find(".settings-param__descr").remove();

            item.find(".settings-param").css({
              padding: "0 15px",
              display: "flex",
              "align-items": "center",
              "justify-content": "space-between",
            });

            var $name = item.find(".settings-param__name");
            $name.css({
              "font-size": "16px",
              display: "flex",
              "align-items": "center",
              "justify-content": "space-between",
              width: "100%",
            });

            $name
              .find("svg")
              .css({
                width: "30px",
                height: "30px",
                "min-width": "30px",
                "min-height": "30px",
              })
              .addClass("menu-hide-icon");

            var $text = $(
              '<span class="menu-hide-text">' +
                Lampa.Lang.translate("reset_all_hidden") +
                "</span>"
            );
            $name.find("svg").after($text);
          },
        });

        resetButtonAdded = true;
      }

      // Захист від дублювання лівого меню
      if (!leftSettingsCreated) {
        // Додаємо заголовок для лівого меню
        Lampa.SettingsApi.addParam({
          component: "menu_filter",
          param: {
            type: "title",
          },
          field: {
            name: Lampa.Lang.translate("left_menu_title"),
          },
          onRender: function (item) {
            item.addClass("section-title");
          },
        });

        // Налаштування для лівого меню
        var menuHiddenItems = Lampa.Storage.get("menu_hide", []);

        $(".menu__item").each(function () {
          var $item = $(this);
          var textElement = $item.find(".menu__text");
          if (textElement.length === 0) return;

          var text = textElement.text().trim();
          var iconElement = $item.find(".menu__ico");
          var icon = iconElement.length ? iconElement.html() : "•";

          Lampa.SettingsApi.addParam({
            component: "menu_filter",
            param: {
              type: "button",
            },
            field: {
              name: icon,
              description: text,
            },
            onRender: function (item) {
              item.addClass("menu-hide-item");

              // Видаляємо опис
              item.find(".settings-param__descr").remove();

              // Налаштування для контейнера
              item.css({
                padding: "0",
                margin: "0",
              });

              // Налаштування для параметра
              item.find(".settings-param").css({
                padding: "0 15px",
                display: "flex",
                "align-items": "center",
                "justify-content": "space-between",
              });

              // Налаштування для імені параметра
              var $name = item.find(".settings-param__name");
              $name.css({
                padding: "0",
                margin: "0",
                "font-size": "16px",
                display: "flex",
                "align-items": "center",
                "justify-content": "space-between",
                width: "100%",
              });

              // Розмір іконки
              $name
                .find("svg, img")
                .css({
                  width: "30px",
                  height: "30px",
                  "min-width": "30px",
                  "min-height": "30px",
                })
                .addClass("menu-hide-icon");

              var isHidden = menuHiddenItems.indexOf(text) !== -1;
              var status = isHidden
                ? Lampa.Lang.translate("hidden")
                : Lampa.Lang.translate("shown");

              // Створюємо елемент значення
              var $value = $('<div class="settings-param__value"/>')
                .text(status)
                .addClass(isHidden ? "menu-hide-hidden" : "menu-hide-shown")
                .css({
                  "font-size": "15px",
                  "padding-right": "10px",
                });

              // Додаємо текст елемента поруч з іконкою
              var $text = $("<span/>")
                .text(text)
                .addClass("menu-hide-text")
                .css({
                  "margin-left": "10px",
                  "flex-grow": "1",
                });

              $name.find("svg, img").after($text);
              $name.append($value);

              // Функція переключення стану
              function toggleItem() {
                var hiddenItems = Lampa.Storage.get("menu_hide", []);
                var index = hiddenItems.indexOf(text);

                if (index !== -1) {
                  hiddenItems.splice(index, 1);
                } else {
                  hiddenItems.push(text);
                }

                Lampa.Storage.set("menu_hide", hiddenItems);
                updateMenuVisibility();

                var newStatus =
                  hiddenItems.indexOf(text) !== -1
                    ? Lampa.Lang.translate("hidden")
                    : Lampa.Lang.translate("shown");

                var isNowHidden = hiddenItems.indexOf(text) !== -1;
                $value
                  .text(newStatus)
                  .toggleClass("menu-hide-hidden", isNowHidden)
                  .toggleClass("menu-hide-shown", !isNowHidden);
              }

              // Універсальний обробник для всіх платформ
              item.off("hover:enter").on("hover:enter", function () {
                toggleItem();
              });
            },
          });
        });

        leftSettingsCreated = true;
      }

      // Додаємо роздільник
      Lampa.SettingsApi.addParam({
        component: "menu_filter",
        param: {
          type: "space",
        },
        field: {},
        onRender: function (item) {
          item.addClass("section-divider");
        },
      });

      // Захист від дублювання верхнього меню
      if (!headSettingsCreated) {
        // Додаємо заголовок для верхнього меню
        Lampa.SettingsApi.addParam({
          component: "menu_filter",
          param: {
            type: "title",
          },
          field: {
            name: Lampa.Lang.translate("head_title"),
          },
          onRender: function (item) {
            item.addClass("section-title");
          },
        });

        // Налаштування для верхнього меню
        var headHiddenItems = Lampa.Storage.get("head_hidden_items", []);
        var headAddedItems = {};

        $(".head__action, .head__time").each(function () {
          var $item = $(this);
          // Пропускаємо системні елементи
          if ($item.hasClass("processing")) return;

          // Генеруємо ID на основі класів
          var classes = $item.attr("class").split(" ");
          var idParts = [];
          for (var i = 0; i < classes.length; i++) {
            if (
              classes[i].indexOf("open--") === 0 ||
              classes[i] === "full--screen" ||
              classes[i] === "notice--icon" ||
              classes[i] === "head__time"
            ) {
              idParts.push(classes[i]);
            }
          }
          var id = idParts.join("_");

          if (!id) return;
          if (headAddedItems[id]) return;
          headAddedItems[id] = true;

          // Отримуємо іконку елемента
          var icon = "";
          if (id.includes("head__time")) {
            icon = timeIcon;
          } else if ($item.find("svg").length) {
            icon = $item.html();
          } else if ($item.find("img").length) {
            icon =
              '<img src="' +
              $item.find("img").attr("src") +
              '" width="30" height="30" style="display:block;">';
          } else {
            icon = "•";
          }

          // Визначаємо назву елемента за класами
          var titleKey = "";
          var title = "";
          if (id.includes("open--search")) {
            titleKey = "head_action_search";
          } else if (id.includes("open--broadcast")) {
            titleKey = "head_action_broadcast";
          } else if (id.includes("open--settings")) {
            titleKey = "head_action_settings";
          } else if (id.includes("open--feed")) {
            titleKey = "head_action_feed";
          } else if (id.includes("notice--icon")) {
            titleKey = "head_action_notice";
          } else if (id.includes("open--profile")) {
            titleKey = "head_action_profile";
          } else if (id.includes("full--screen")) {
            titleKey = "head_action_fullscreen";
          } else if (id.includes("head__time")) {
            titleKey = "head_time";
          } else {
            titleKey = "no_name";
          }
          title = Lampa.Lang.translate(titleKey);

          Lampa.SettingsApi.addParam({
            component: "menu_filter",
            param: {
              type: "button",
            },
            field: {
              name: icon,
              description: title,
            },
            onRender: function (item) {
              item.addClass("menu-hide-item");

              // Видаляємо опис
              item.find(".settings-param__descr").remove();

              // Налаштування для контейнера
              item.css({
                padding: "0",
                margin: "0",
              });

              // Налаштування для параметра
              item.find(".settings-param").css({
                padding: "0 15px",
                display: "flex",
                "align-items": "center",
                "justify-content": "space-between",
              });

              // Налаштування для імені параметра
              var $name = item.find(".settings-param__name");
              $name.css({
                padding: "0",
                margin: "0",
                "font-size": "16px",
                display: "flex",
                "align-items": "center",
                "justify-content": "space-between",
                width: "100%",
              });

              // Розмір іконки
              $name
                .find("svg, img")
                .css({
                  width: "30px",
                  height: "30px",
                  "min-width": "30px",
                  "min-height": "30px",
                })
                .addClass("menu-hide-icon");

              var isHidden = headHiddenItems.indexOf(id) !== -1;
              var status = isHidden
                ? Lampa.Lang.translate("hidden")
                : Lampa.Lang.translate("shown");

              // Создаем элемент значення
              var $value = $('<div class="settings-param__value"/>')
                .text(status)
                .addClass(isHidden ? "menu-hide-hidden" : "menu-hide-shown")
                .css({
                  "font-size": "15px",
                  "padding-right": "10px",
                });

              // Добавляем текст элемента рядом с иконкой
              var $text = $("<span/>")
                .text(title)
                .addClass("menu-hide-text")
                .css({
                  "margin-left": "10px",
                  "flex-grow": "1",
                });

              $name.find("svg, img").after($text);
              $name.append($value);

              // Функція переключення стану
              function toggleItem() {
                var hiddenItems = Lampa.Storage.get("head_hidden_items", []);
                var index = hiddenItems.indexOf(id);

                if (index !== -1) {
                  hiddenItems.splice(index, 1);
                } else {
                  hiddenItems.push(id);
                }

                Lampa.Storage.set("head_hidden_items", hiddenItems);
                updateHeadVisibility();

                var newStatus =
                  hiddenItems.indexOf(id) !== -1
                    ? Lampa.Lang.translate("hidden")
                    : Lampa.Lang.translate("shown");

                var isNowHidden = hiddenItems.indexOf(id) !== -1;
                $value
                  .text(newStatus)
                  .toggleClass("menu-hide-hidden", isNowHidden)
                  .toggleClass("menu-hide-shown", !isNowHidden);
              }

              // Універсальний обробник для всіх платформ
              item.off("hover:enter").on("hover:enter", function () {
                toggleItem();
              });
            },
          });
        });

        headSettingsCreated = true;
      }

      // Додаємо роздільник
      Lampa.SettingsApi.addParam({
        component: "menu_filter",
        param: {
          type: "space",
        },
        field: {},
        onRender: function (item) {
          item.addClass("section-divider");
        },
      });

      // Захист від дублювання правого меню
      if (!settingsSettingsCreated) {
        // Додаємо заголовок для правого меню (Налаштування)
        Lampa.SettingsApi.addParam({
          component: "menu_filter",
          param: {
            type: "title",
          },
          field: {
            name: Lampa.Lang.translate("settings_title"),
          },
          onRender: function (item) {
            item.addClass("section-title");
          },
        });

        // Налаштування для правого меню (Налаштування)
        var settingsHiddenItems = Lampa.Storage.get(
          "settings_hidden_items",
          []
        );
        var settingsAddedItems = {};

        function processSettingsMenu() {
          var folders = $(".settings-folder");
          if (folders.length === 0) {
            setTimeout(processSettingsMenu, 300);
            return;
          }

          folders.each(function () {
            var $item = $(this);
            var component = $item.data("component");
            if (!component) return;
            if (settingsAddedItems[component]) return;
            settingsAddedItems[component] = true;

            var nameElement = $item.find(".settings-folder__name");
            var name = nameElement.length ? nameElement.text().trim() : "";
            var iconElement = $item.find(".settings-folder__icon");
            var icon = iconElement.length ? iconElement.html() : "•";

            if (!name) {
              name = Lampa.Lang.translate("no_name");
            }

            Lampa.SettingsApi.addParam({
              component: "menu_filter",
              param: {
                type: "button",
              },
              field: {
                name: icon,
                description: name,
              },
              onRender: function (item) {
                item.addClass("menu-hide-item");

                // Видаляємо опис
                item.find(".settings-param__descr").remove();

                // Налаштування для контейнера
                item.css({
                  padding: "0",
                  margin: "0",
                });

                // Налаштування для параметра
                item.find(".settings-param").css({
                  padding: "0 15px",
                  display: "flex",
                  "align-items": "center",
                  "justify-content": "space-between",
                });

                // Деактивуємо кнопку "Приховати елементи інтерфейсу"
                if (component === "menu_filter") {
                  item.find(".settings-param").addClass("disable-hide");
                }

                // Налаштування для імені параметра
                var $name = item.find(".settings-param__name");
                $name.css({
                  padding: "0",
                  margin: "0",
                  "font-size": "16px",
                  display: "flex",
                  "align-items": "center",
                  "justify-content": "space-between",
                  width: "100%",
                });

                // Розмір іконки
                $name
                  .find("svg, img")
                  .css({
                    width: "26px",
                    height: "26px",
                    "min-width": "26px",
                    "min-height": "26px",
                  })
                  .addClass("menu-hide-icon");

                var isHidden = settingsHiddenItems.indexOf(component) !== -1;
                var status = isHidden
                  ? Lampa.Lang.translate("hidden")
                  : Lampa.Lang.translate("shown");

                // Создаем элемент значення
                var $value = $('<div class="settings-param__value"/>')
                  .text(status)
                  .addClass(isHidden ? "menu-hide-hidden" : "menu-hide-shown")
                  .css({
                    "font-size": "15px",
                    "padding-right": "10px",
                  });

                // Додавання тексту елемента поруч із значком
                var $text = $("<span/>")
                  .text(name)
                  .addClass("menu-hide-text")
                  .css({
                    "margin-left": "10px",
                    "flex-grow": "1",
                  });

                $name.find("svg, img").after($text);
                $name.append($value);

                // Функція перемикання стану
                function toggleItem() {
                  // Ми не дозволяємо приховувати налаштування плагіна
                  if (component === "menu_filter") return;

                  var hiddenItems = Lampa.Storage.get(
                    "settings_hidden_items",
                    []
                  );
                  var index = hiddenItems.indexOf(component);

                  if (index !== -1) {
                    hiddenItems.splice(index, 1);
                  } else {
                    hiddenItems.push(component);
                  }

                  Lampa.Storage.set("settings_hidden_items", hiddenItems);
                  updateSettingsVisibility();

                  var newStatus =
                    hiddenItems.indexOf(component) !== -1
                      ? Lampa.Lang.translate("hidden")
                      : Lampa.Lang.translate("shown");

                  var isNowHidden = hiddenItems.indexOf(component) !== -1;
                  $value
                    .text(newStatus)
                    .toggleClass("menu-hide-hidden", isNowHidden)
                    .toggleClass("menu-hide-shown", !isNowHidden);
                }

                // Універсальний обробник для всіх платформ
                item.off("hover:enter").on("hover:enter", function () {
                  toggleItem();
                });
              },
            });
          });
        }

        // Запускаємо обробку
        processSettingsMenu();

        settingsSettingsCreated = true;
      }
    }

    // Обробник для оновлення меню
    function handleMenuChanges() {
      // Застосовуємо налаштування під час завантаження
      updateAllVisibility();

      // Оновлюємо при зміні сховища
      Lampa.Storage.listener.follow("change", function (e) {
        if (
          e.name === "menu_hide" ||
          e.name === "head_hidden_items" ||
          e.name === "settings_hidden_items"
        ) {
          updateAllVisibility();
        }
      });

      // Оновлюємо при зміні DOM
      var observer = new MutationObserver(function () {
        if ($(".menu__list, .head__actions, .settings__body").length) {
          createMenuSettings();
          updateAllVisibility();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    // Запускаємо під час завантаження
    function initPlugin() {
      // Чекаємо, доки з'явиться меню
      var waitForMenu = setInterval(function () {
        if ($(".menu__list, .head__actions, .settings__body").length) {
          clearInterval(waitForMenu);
          createMenuSettings();
          handleMenuChanges();
        }
      }, 500);
    }

    // Підключення плагіна
    if (window.appready) {
      initPlugin();
    } else {
      Lampa.Listener.follow("app", function (e) {
        if (e.type === "ready") {
          initPlugin();
        }
      });
    }
  }

  // Підключення плагіна
  if (window.appready) {
    startPlugin();
  } else {
    Lampa.Listener.follow("app", function (e) {
      if (e.type === "ready") {
        startPlugin();
      }
    });
  }
})();
