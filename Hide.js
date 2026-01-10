// Ініціалізуємо плагіни
function startPlugin() {
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

  // Змінні для відстеження створення налаштувань
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
          var $text = $("<span/>").text(text).addClass("menu-hide-text").css({
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
          var $text = $("<span/>").text(title).addClass("menu-hide-text").css({
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
    const settingsHiddenItems = Lampa.Storage.get("settings_hidden_items", []);
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
            var $text = $("<span/>").text(name).addClass("menu-hide-text").css({
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
