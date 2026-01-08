(function () {
  ("use strict");

  // Додаємо стилі для приховування елементів та оформлення
  $(
    "<style>\
    .hidden { display: none !important; }\
    .menu-hide-item .settings-param { \
        padding: 16px 40px !important; /* Збільшений відступ */ \
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
      uk: "Перемикання видимості елементів",
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
  const eyeIcon = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="white" stroke-width="2"/>
    </svg>`;

  // Іконка для кнопки "Показати все"
  const resetIcon = `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>`;

  // Іконка годинника
  const timeIcon = `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;

  const renderVisibilityIcon = (isHidden) => {
    return `<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="1.89111" y="1.78369" width="21.793" height="21.793" rx="3.5" stroke="currentColor" stroke-width="3"/>
<path d="M7.44873 12.9658L10.8179 16.3349L18.1269 9.02588" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="${
      isHidden ? "0" : "1"
    }"/>
</svg>`;
  };

  // Ініціалізуємо плагіни
  function startPlugin() {
    const manifest = {
      name: Lampa.Lang.translate("menu_items_hide"),
      author: "@Niaros",
      description: Lampa.Lang.translate("plugin_description"),
      url: "https://niarosss.github.io/lampa-plugins/Hide.js",
      version: "1.0.2",
      type: "other",
      component: "menu_filter",
    };
    Lampa.Manifest.plugins = manifest;

    // Функції для приховування/показу пунктів меню
    function updateMenuVisibility() {
      const hiddenItems = Lampa.Storage.get("menu_hide", []);

      $(".menu__item").each(function () {
        const $item = $(this);
        const textElement = $item.find(".menu__text");
        if (textElement.length === 0) return;

        const text = textElement.text().trim();

        if (hiddenItems.includes(text)) {
          $item.addClass("hidden");
        } else {
          $item.removeClass("hidden");
        }
      });
    }

    function updateHeadVisibility() {
      const hiddenItems = Lampa.Storage.get("head_hidden_items", []);

      $(".head__action, .head__time").each(function () {
        const $item = $(this);
        // Пропускаємо системні елементи
        if ($item.hasClass("processing")) return;

        // Генеруємо ID на основі класів
        const classes = $item.attr("class").split(" ");
        let idParts = [];
        for (let i = 0; i < classes.length; i++) {
          if (
            classes[i].indexOf("open--") === 0 ||
            classes[i] === "full--screen" ||
            classes[i] === "notice--icon" ||
            classes[i] === "head__time"
          ) {
            idParts.push(classes[i]);
          }
        }
        const id = idParts.join("_");

        if (!id) return;

        if (hiddenItems.includes(id)) {
          $item.addClass("hidden");
        } else {
          $item.removeClass("hidden");
        }
      });
    }

    function updateSettingsVisibility() {
      const hiddenItems = Lampa.Storage.get("settings_hidden_items", []);

      $(".settings-folder").each(function () {
        const $item = $(this);
        const component = $item.data("component");
        if (!component) return;

        // Не приховуємо налаштування нашого плагіна
        if (component === "menu_filter") return;

        if (hiddenItems.includes(component)) {
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
    let leftSettingsCreated = false;
    let headSettingsCreated = false;
    let settingsSettingsCreated = false;
    let resetButtonAdded = false; // Прапорець для кнопки "Показати все"

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
              margin: "0",
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
        const menuHiddenItems = Lampa.Storage.get("menu_hide", []);

        $(".menu__item").each(function () {
          const $item = $(this);
          const textElement = $item.find(".menu__text");
          if (textElement.length === 0) return;

          const text = textElement.text().trim();
          const iconElement = $item.find(".menu__ico");
          const icon = iconElement.length ? iconElement.html() : "•";

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
                padding: "10px",
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

              const isHidden = menuHiddenItems.includes(text);
              var $value = $('<div class="settings-param__value"/>').html(
                renderVisibilityIcon(isHidden)
              );

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
                const hiddenItems = Lampa.Storage.get("menu_hide", []);
                const index = hiddenItems.indexOf(text);

                if (index !== -1) {
                  hiddenItems.splice(index, 1);
                } else {
                  hiddenItems.push(text);
                }

                Lampa.Storage.set("menu_hide", hiddenItems);
                updateMenuVisibility();
                const isNowHidden = hiddenItems.includes(text);
                $value.html(renderVisibilityIcon(isNowHidden));
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
        const headHiddenItems = Lampa.Storage.get("head_hidden_items", []);
        const headAddedItems = {};

        $(".head__action, .head__time").each(function () {
          const $item = $(this);
          // Пропускаємо системні елементи
          if ($item.hasClass("processing")) return;

          // Генеруємо ID на основі класів
          const classes = $item.attr("class").split(" ");
          let idParts = [];
          for (let i = 0; i < classes.length; i++) {
            if (
              classes[i].indexOf("open--") === 0 ||
              classes[i] === "full--screen" ||
              classes[i] === "notice--icon" ||
              classes[i] === "head__time"
            ) {
              idParts.push(classes[i]);
            }
          }
          const id = idParts.join("_");

          if (!id) return;
          if (headAddedItems[id]) return;
          headAddedItems[id] = true;

          // Отримуємо іконку елемента
          let icon = "";
          if (id.includes("head__time")) {
            icon = timeIcon;
          } else if ($item.find("svg").length) {
            icon = $item.html();
          } else if ($item.find("img").length) {
            icon = `<img src="${$item
              .find("img")
              .attr("src")}" width="30" height="30" style="display:block;">`;
          } else {
            icon = "•";
          }

          // Визначаємо назву елемента за класами
          let titleKey = "";
          let title = "";
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
                padding: "10px",
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

              const isHidden = headHiddenItems.includes(id);
              var $value = $('<div class="settings-param__value"/>').html(
                renderVisibilityIcon(isHidden)
              );

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
                const hiddenItems = Lampa.Storage.get("head_hidden_items", []);
                const index = hiddenItems.indexOf(id);

                if (index !== -1) {
                  hiddenItems.splice(index, 1);
                } else {
                  hiddenItems.push(id);
                }

                Lampa.Storage.set("head_hidden_items", hiddenItems);
                updateHeadVisibility();

                const isNowHidden = hiddenItems.includes(id);
                $value.html(renderVisibilityIcon(isNowHidden));
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
        const settingsHiddenItems = Lampa.Storage.get(
          "settings_hidden_items",
          []
        );
        const settingsAddedItems = {};

        function processSettingsMenu() {
          const folders = $(".settings-folder");
          if (folders.length === 0) {
            setTimeout(processSettingsMenu, 300);
            return;
          }

          folders.each(function () {
            const $item = $(this);
            const component = $item.data("component");
            if (!component) return;
            if (settingsAddedItems[component]) return;
            settingsAddedItems[component] = true;

            const nameElement = $item.find(".settings-folder__name");
            let name = nameElement.length ? nameElement.text().trim() : "";
            const iconElement = $item.find(".settings-folder__icon");
            const icon = iconElement.length ? iconElement.html() : "•";

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
                  padding: "10px",
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

                const isHidden = settingsHiddenItems.includes(component);
                var $value = $('<div class="settings-param__value"/>').html(
                  renderVisibilityIcon(isHidden)
                );

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

                  const hiddenItems = Lampa.Storage.get(
                    "settings_hidden_items",
                    []
                  );
                  const index = hiddenItems.indexOf(component);

                  if (index !== -1) {
                    hiddenItems.splice(index, 1);
                  } else {
                    hiddenItems.push(component);
                  }

                  Lampa.Storage.set("settings_hidden_items", hiddenItems);
                  updateSettingsVisibility();

                  const isNowHidden = hiddenItems.includes(component);
                  $value.html(renderVisibilityIcon(isNowHidden));
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
      const observer = new MutationObserver(function () {
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
      const waitForMenu = setInterval(function () {
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
