(function () {
  ("use strict");

  const FancyFace = {
    name: "FancyFacePro",
    version: "1.0.0",
    debug: false,
    settings: {
      enabled: true,
      show_movie_type: true,
      theme: "default",
      colored_ratings: true,
      seasons_info_mode: "aired",
      show_episodes_on_main: false,
      label_position: "top-right",
      colored_elements: true,
      show_original_names: true,
      buttons_editor: true,
    },
    observer: null,
  };

  // -- Стилі для приховування елементів та оформлення ---
  $(
    "<style>\
      @keyframes button-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }\
        .full-start__button { opacity: 0; }\
        .full-start__button.hidden { display: none !important; }\
        .button--folder { cursor: pointer; }\
        .full-start-new__buttons { display: flex !important; flex-direction: row !important; flex-wrap: wrap !important; gap: 0.5em !important; }\
        .full-start-new__buttons.buttons-loading .full-start__button { visibility: hidden !important; }\
        .menu-edit-list__create-folder { background: rgba(100,200,100,0.2); border: 3px solid transparent; }\
        .menu-edit-list__create-folder.focus { background: rgba(100,200,100,0.3); border-color: rgba(255,255,255,0.8); }\
        .menu-edit-list__delete, .menu-edit-list__rename, .menu-edit-list__edit-content { width: 2.4em; height: 2.4em; display: flex; align-items: center; justify-content: center; cursor: pointer; }\
        .menu-edit-list__delete svg, .menu-edit-list__rename svg, .menu-edit-list__edit-content svg { width: 1.2em !important; height: 1.2em !important; }\
        .menu-edit-list__delete.focus, .menu-edit-list__rename.focus, .menu-edit-list__edit-content.focus { border: 2px solid rgba(255,255,255,0.8); border-radius: 0.3em; }\
        .folder-item .menu-edit-list__move { margin-right: 0; }\
        .folder-create-confirm { background: rgba(100,200,100,0.3); margin-top: 1em; border-radius: 0.3em; border: 3px solid transparent; }\
        .folder-create-confirm.focus { border: 3px solid rgba(255,255,255,0.8); }\
        .bottom-controls { display: flex; gap: 0.5em; margin-top: 1em; }\
        .bottom-controls > .menu-edit-list__item { width: calc(50% - 0.25em); margin-bottom: 0; justify-content: center; }\
        .folder-reset-button { background: rgba(200,100,100,0.3); border: 3px solid transparent; }\
        .folder-reset-button.focus { background: rgba(200,100,100,0.4); border-color: rgba(255,255,255,0.8); }\
        .menu-edit-list__toggle.focus { border: 2px solid rgba(255,255,255,0.8); border-radius: 0.3em; }\
        .button--folder.folder--no-name { min-width: 3.5em; max-width: 3.5em; justify-content: center; }\
        .button--folder.folder--no-name > span { display: none; }\
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
    .settings-param.disable-hide { \
        opacity: 0.6 !important; \
        pointer-events: none !important; \
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
      uk: "Плагін для керування елементами нтерфейсу",
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
    reset_all_hidden: {
      en: "Show all",
      uk: "Показати все",
    },
    head_time: {
      en: "Time",
      uk: "Час і дата",
    },
    buttons_editor_title: {
      en: "Buttons editor",
      uk: "Редактор кнопок",
    },
    buttons_editor_description: {
      en: "Toggle the display of the Button Editor",
      uk: "Перемикання відображення Редактора кнопок",
    },
    buttons_editor_on: {
      en: "The button editor is enabled",
      uk: "Редактор кнопок увімкнено",
    },
    buttons_editor_off: {
      en: "The button editor is disabled",
      uk: "Редактор кнопок вимкнено",
    },
    new_folder_name: {
      en: "Enter new folder name",
      uk: "Введіть нову назву папки",
    },
    folder_renamed: {
      en: "Folder renamed",
      uk: "Папку перейменовано",
    },
    new_button_name: {
      en: "Enter new button name",
      uk: "Введіть нову назву кнопки",
    },
    button_renamed: {
      en: "Button renamed",
      uk: "Кнопку перейменовано",
    },
    create_folder: {
      en: "Create folder",
      uk: "Створити папку",
    },
    folder_deleted: {
      en: "Folder deleted",
      uk: "Папку видалено",
    },
    folder_buttons_order: {
      en: "Button order in folder",
      uk: "Порядок кнопок у папці",
    },
    folder_name_title: {
      en: "Folder name",
      uk: "Назва папки",
    },
    create_folder_no_name: {
      en: "Create folder without name",
      uk: "Створити папку без назви",
    },
    select_min_2_buttons: {
      en: "Select at least 2 buttons",
      uk: "Оберіть щонайменше 2 кнопки",
    },
    folder_created_param: {
      en: 'Folder "{folderName}" created',
      uk: 'Папку "{folderName}" створено',
    },
    folder_created_no_name: {
      en: "Unnamed folder created",
      uk: "Папку без назви створено",
    },
    add_content_to_folder: {
      en: "Add content to folder",
      uk: "Додайте вміст до папки",
    },
    reset_settings: {
      en: "Reset",
      uk: "Скинути",
    },
    season_one: {
      en: "season",
      uk: "сезон",
    },
    season_two: {
      en: "seasons",
      uk: "сезони",
    },
    season_five: {
      en: "seasons",
      uk: "сезонів",
    },
    episode_one: {
      en: "episode",
      uk: "серія",
    },
    episode_two: {
      en: "episodes",
      uk: "серії",
    },
    episode_five: {
      en: "episodes",
      uk: "серій",
    },
    season_episode_text_completed: {
      en: "{seasons_count} {seasons_word} {episodes_count} {episodes_word}",
      uk: "{seasons_count} {seasons_word} {episodes_count} {episodes_word}",
    },
    season_episode_text_ongoing: {
      en: "{seasons_count} {seasons_word} {episodes_count} {episodes_word} from {total_episodes_count}",
      uk: "{seasons_count} {seasons_word} {episodes_count} {episodes_word} з {total_episodes_count}",
    },
    status_ended: {
      en: "Ended",
      uk: "Завершено",
    },
    status_canceled: {
      en: "Canceled",
      uk: "Скасовано",
    },
    status_returning_series: {
      en: "Returning Series",
      uk: "Виходить",
    },
    status_in_production: {
      en: "In Production",
      uk: "У виробництві",
    },
    status_planned: {
      en: "Planned",
      uk: "Заплановано",
    },
    status_pilot: {
      en: "Pilot",
      uk: "Пілотний",
    },
    status_released: {
      en: "Released",
      uk: "Випущено",
    },
    status_rumored: {
      en: "Rumored",
      uk: "За чутками",
    },
    status_post_production: {
      en: "Post Production",
      uk: "Пост-продакшн",
    },
    status_unknown: {
      en: "Unknown",
      uk: "Невідомо",
    },
    button_settings_title: {
      en: "Button settings",
      uk: "Налаштування кнопок",
    },
    original_title_label: {
      en: "Original title:",
      uk: "Оригінальна назва:",
    },
    plugin_fancy_description: {
      en: "Comprehensive interface improvement for the Lampa application",
      uk: "Комплексне покращення інтерфейсу для застосунку Lampa",
    },
    additional_interface_settings: {
      en: "Additional interface settings",
      uk: "Додаткові налаштування інтерфейсу",
    },
    series_info_title: {
      en: "Series information",
      uk: "Інформація про серії",
    },
    series_info_description: {
      en: "Choose how to display information about series and seasons",
      uk: "Оберіть, як відображати інформацію про серії та сезони",
    },
    settings_info_off: {
      en: "Disable",
      uk: "Вимкнути",
    },
    settings_info_aired: {
      en: "Aired",
      uk: "Актуальна інформація",
    },
    settings_info_total: {
      en: "Total",
      uk: "Повна кількість",
    },
    label_position_title: {
      en: "Label position for series",
      uk: "Розташування мітки про серії",
    },
    label_position_description: {
      en: "Select the position of the label on the poster",
      uk: "Оберіть позицію мітки на постері",
    },
    label_top_right: {
      en: "Top right corner",
      uk: "Верхній правий кут",
    },
    label_top_left: {
      en: "Top left corner",
      uk: "Верхній лівий кут",
    },
    label_bottom_right: {
      en: "Bottom right corner",
      uk: "Нижній правий кут",
    },
    label_bottom_left: {
      en: "Bottom left corner",
      uk: "Нижній лівий кут",
    },
    change_labels_title: {
      en: "Change labels",
      uk: "Змінити мітки",
    },
    change_labels_description: {
      en: 'Change "TV" to "Series" and add a "Movie" label',
      uk: 'Змінити "TV" на "Серіал" та додати мітку "Фільм"',
    },
    interface_theme_title: {
      en: "Interface theme",
      uk: "Тема інтерфейсу",
    },
    interface_theme_description: {
      en: "Select the interface theme",
      uk: "Оберіть тему оформлення інтерфейсу",
    },
    colored_ratings_title: {
      en: "Colored ratings",
      uk: "Кольорові рейтинги",
    },
    colored_ratings_description: {
      en: "Change the rating color depending on the score",
      uk: "Змінювати колір рейтингу залежно від оцінки",
    },
    colored_elements_title: {
      en: "Colored elements",
      uk: "Кольорові елементи",
    },
    colored_elements_description: {
      en: "Display series statuses and age restrictions in color",
      uk: "Відображати статуси серіалів та вікові обмеження кольоровими",
    },
    show_original_title: {
      en: "Show original titles",
      uk: "Показувати оригінальні назви",
    },
    show_original_title_description: {
      en: "Display the original title of the movie/series in the card",
      uk: "Відображення оригінальної назви фільму/серіалу в картці",
    },
  });

  // --- Buttons editor functionalaty ---

  const resetIcon = `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>`;

  const timeIcon = `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;

  const renderVisibilityIcon = (isHidden) => {
    return `<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="1.89111" y="1.78369" width="21.793" height="21.793" rx="3.5" stroke="currentColor" stroke-width="3"/>
<path d="M7.44873 12.9658L10.8179 16.3349L18.1269 9.02588" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="${
      isHidden ? "0" : "1"
    }"/>
</svg>`;
  };

  const playIcon =
    '<svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path d="M 10.234 7.733 L 4.468 11.631 C 3.063 12.581 1.16 11.583 1.16 9.898 L 1.16 2.101 C 1.16 0.415 3.063 -0.582 4.468 0.368 L 10.234 4.266 C 11.511 5.125 11.511 6.874 10.234 7.733 Z" fill="currentColor"></path></svg>';

  const EXCLUDED_CLASSES = [
    "button--play",
    "button--edit-order",
    "button--folder",
  ];

  const DEFAULT_GROUPS = [
    {
      name: "online",
      patterns: ["online", "lampac", "modss", "showy"],
      label: "Онлайн",
    },
    { name: "torrent", patterns: ["torrent"], label: "Торренти" },
    { name: "trailer", patterns: ["trailer", "rutube"], label: "Трейлери" },
    { name: "book", patterns: ["book"], label: "Закладки" },
    { name: "reaction", patterns: ["reaction"], label: "Реакції" },
  ];

  let currentButtons = [];
  let allButtonsCache = [];
  let allButtonsOriginal = [];
  let currentContainer = null;

  // Допоміжна функція для пошуку кнопки
  function findButton(btnId) {
    let btn = allButtonsOriginal.find((b) => getButtonId(b) === btnId);
    if (!btn) {
      btn = allButtonsCache.find((b) => getButtonId(b) === btnId);
    }
    return btn;
  }

  // Допоміжна функція для отримання всіх ID кнопок у папках
  function getButtonsInFolders() {
    const folders = getFolders();
    return folders.flatMap((folder) => folder.buttons);
  }

  function getCustomOrder() {
    return Lampa.Storage.get("button_custom_order", []);
  }

  function setCustomOrder(order) {
    Lampa.Storage.set("button_custom_order", order);
  }

  function getItemOrder() {
    return Lampa.Storage.get("button_item_order", []);
  }

  function setItemOrder(order) {
    Lampa.Storage.set("button_item_order", order);
  }

  function getHiddenButtons() {
    return Lampa.Storage.get("button_hidden", []);
  }

  function setHiddenButtons(hidden) {
    Lampa.Storage.set("button_hidden", hidden);
  }

  function getFolders() {
    return Lampa.Storage.get("button_folders", []);
  }

  function setFolders(folders) {
    Lampa.Storage.set("button_folders", folders);
  }

  function getRenamedButtons() {
    return Lampa.Storage.get("button_renamed", {});
  }

  function setRenamedButtons(renamed) {
    Lampa.Storage.set("button_renamed", renamed);
  }

  function generateButtonId(button) {
    const classes = button.attr("class") || "";
    const text = button.find("span").text().trim().replace(/\s+/g, "_");
    const subtitle = button.attr("data-subtitle") || "";

    if (
      classes.includes("modss") ||
      text.includes("MODS") ||
      text.includes("MOD")
    ) {
      return "modss_online_button";
    }

    if (classes.includes("showy") || text.includes("Showy")) {
      return "showy_online_button";
    }

    const viewClasses = classes
      .split(" ")
      .filter((c) => c.startsWith("view--") || c.startsWith("button--"))
      .join("_");

    if (!viewClasses && !text) {
      return "button_unknown";
    }

    let id = viewClasses + "_" + text;

    if (subtitle) {
      id = id + "_" + subtitle.replace(/\s+/g, "_").substring(0, 30);
    }

    return id;
  }

  function getButtonId(button) {
    let stableId = button.attr("data-stable-id");
    if (!stableId) {
      stableId = generateButtonId(button);
      button.attr("data-stable-id", stableId);
    }
    return stableId;
  }

  function applyRenamedButtons(buttons) {
    const renamed = getRenamedButtons();
    buttons.forEach((btn) => {
      const id = getButtonId(btn);
      if (renamed[id]) {
        btn.find("span").text(renamed[id]);
      }
    });
  }

  function getButtonType(button) {
    const classes = button.attr("class") || "";
    for (const group of DEFAULT_GROUPS) {
      if (group.patterns.some((pattern) => classes.includes(pattern))) {
        return group.name;
      }
    }
    return "other";
  }

  function isExcluded(button) {
    const classes = button.attr("class") || "";
    return EXCLUDED_CLASSES.some((excludedClass) =>
      classes.includes(excludedClass)
    );
  }

  function categorizeButtons(container) {
    const allButtons = container
      .find(".full-start__button")
      .not(".button--edit-order, .button--folder, .button--play");

    const categories = {
      online: [],
      torrent: [],
      trailer: [],
      book: [],
      reaction: [],
      other: [],
    };

    allButtons.each(function () {
      const $btn = $(this);

      if (isExcluded($btn)) return;

      const type = getButtonType($btn);

      if (
        type === "online" &&
        $btn.hasClass("lampac--button") &&
        !$btn.hasClass("modss--button") &&
        !$btn.hasClass("showy--button")
      ) {
        const svgElement = $btn.find("svg").first();
        if (svgElement.length && !svgElement.hasClass("modss-online-icon")) {
          svgElement.replaceWith(playIcon);
        }
      }

      (categories[type] || categories.other).push($btn);
    });

    return categories;
  }

  function sortByCustomOrder(buttons) {
    const customOrder = getCustomOrder();
    const priority = [];
    const regular = [];

    buttons.forEach((btn) => {
      const id = getButtonId(btn);
      if (id === "modss_online_button" || id === "showy_online_button") {
        priority.push(btn);
      } else {
        regular.push(btn);
      }
    });

    priority.sort((a, b) => {
      const idA = getButtonId(a);
      const idB = getButtonId(b);
      if (idA === "modss_online_button") return -1;
      if (idB === "modss_online_button") return 1;
      if (idA === "showy_online_button") return -1;
      if (idB === "showy_online_button") return 1;
      return 0;
    });

    if (!customOrder.length) {
      const typeOrder = [
        "online",
        "torrent",
        "trailer",
        "book",
        "reaction",
        "other",
      ];
      regular.sort((a, b) => {
        let typeA = getButtonType(a);
        let typeB = getButtonType(b);
        let indexA = typeOrder.indexOf(typeA);
        let indexB = typeOrder.indexOf(typeB);
        if (indexA === -1) indexA = 999;
        if (indexB === -1) indexB = 999;
        return indexA - indexB;
      });
      return [...priority, ...regular];
    }

    const buttonMap = new Map(regular.map((btn) => [getButtonId(btn), btn]));
    const sorted = [];

    customOrder.forEach((id) => {
      if (buttonMap.has(id)) {
        sorted.push(buttonMap.get(id));
        buttonMap.delete(id);
      }
    });

    return [...priority, ...sorted, ...Array.from(buttonMap.values())];
  }

  function applyHiddenButtons(buttons) {
    const hidden = getHiddenButtons();
    buttons.forEach((btn) => {
      const id = getButtonId(btn);
      btn.toggleClass("hidden", hidden.includes(id));
    });
  }

  function applyButtonAnimation(buttons) {
    buttons.forEach((btn, index) => {
      btn.css({
        opacity: "0",
        animation: "button-fade-in 0.4s ease forwards",
        "animation-delay": `${index * 0.08}s`,
      });
    });
  }

  function createEditButton() {
    const btn = $(
      `<div class="full-start__button selector button--edit-order" style="order: 9999;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 29" fill="none"><use xlink:href="#sprite-edit"></use></svg>
      </div>`
    );

    btn.on("hover:enter", openEditDialog);

    if (Lampa.Storage.get("buttons_editor") === false) {
      btn.hide();
    }

    return btn;
  }

  function saveOrder() {
    const order = currentButtons.map((btn) => getButtonId(btn));
    setCustomOrder(order);
  }

  function saveItemOrder() {
    const items = $(".menu-edit-list .menu-edit-list__item").not(
      ".menu-edit-list__create-folder"
    );

    const order = items
      .map(function () {
        const $item = $(this);
        const itemType = $item.data("itemType");

        if (itemType === "folder") {
          return {
            type: "folder",
            id: $item.data("folderId"),
          };
        }
        if (itemType === "button") {
          return {
            type: "button",
            id: $item.data("buttonId"),
          };
        }
        return null;
      })
      .get();

    setItemOrder(order.filter(Boolean));
  }

  function applyChanges() {
    if (!currentContainer) return;

    const categories = categorizeButtons(currentContainer);
    const allButtons = Object.values(categories).flat();

    allButtonsCache = sortByCustomOrder(allButtons);

    const folders = getFolders();
    let foldersUpdated = false;

    folders.forEach((folder) => {
      const usedButtons = new Set();
      const updatedButtons = folder.buttons
        .map((oldBtnId) => {
          let foundBtn = allButtonsCache.find((btn) => {
            const newBtnId = getButtonId(btn);
            return !usedButtons.has(newBtnId) && newBtnId === oldBtnId;
          });

          if (foundBtn) {
            const newBtnId = getButtonId(foundBtn);
            usedButtons.add(newBtnId);
            return newBtnId;
          }
          return oldBtnId;
        })
        .filter(Boolean);

      if (updatedButtons.length !== folder.buttons.length) {
        folder.buttons = updatedButtons;
        foldersUpdated = true;
      }
    });

    if (foldersUpdated) {
      setFolders(folders);
    }

    const buttonsInFolders = folders.flatMap((folder) => folder.buttons);

    currentButtons = allButtonsCache.filter(
      (btn) => !buttonsInFolders.includes(getButtonId(btn))
    );
    applyHiddenButtons(currentButtons);

    const targetContainer = currentContainer.find(".full-start-new__buttons");
    if (!targetContainer.length) return;

    targetContainer
      .find(".full-start__button")
      .not(".button--edit-order")
      .detach();

    const itemOrder = getItemOrder();
    let visibleButtons = [];

    const renderQueue = new Set();

    if (itemOrder.length > 0) {
      itemOrder.forEach((item) => {
        if (item.type === "folder") {
          const folder = folders.find((f) => f.id === item.id);
          if (folder && !renderQueue.has(folder.id)) {
            const folderBtn = createFolderButton(folder);
            targetContainer.append(folderBtn);
            visibleButtons.push(folderBtn);
            renderQueue.add(folder.id);
          }
        } else if (item.type === "button") {
          const btn = currentButtons.find(
            (b) => getButtonId(b) === item.id && !b.hasClass("hidden")
          );
          if (btn && !renderQueue.has(item.id)) {
            targetContainer.append(btn);
            visibleButtons.push(btn);
            renderQueue.add(item.id);
          }
        }
      });
    }

    folders.forEach((folder) => {
      if (!renderQueue.has(folder.id)) {
        const folderBtn = createFolderButton(folder);
        targetContainer.append(folderBtn);
        visibleButtons.push(folderBtn);
        renderQueue.add(folder.id);
      }
    });

    currentButtons.forEach((btn) => {
      const btnId = getButtonId(btn);
      if (!renderQueue.has(btnId) && !btn.hasClass("hidden")) {
        targetContainer.append(btn);
        visibleButtons.push(btn);
        renderQueue.add(btnId);
      }
    });

    applyRenamedButtons(
      visibleButtons.filter((b) => !b.hasClass("button--folder"))
    );
    applyButtonAnimation(visibleButtons);

    const editBtn = targetContainer.find(".button--edit-order");
    if (editBtn.length) {
      editBtn.detach();
      targetContainer.append(editBtn);
    }

    saveOrder();

    setTimeout(() => {
      if (currentContainer) {
        setupButtonNavigation(currentContainer);
      }
    }, 100);
  }

  function capitalize(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function getButtonDisplayName(btn, allButtons) {
    const btnId = getButtonId(btn);
    const renamedButtons = getRenamedButtons();

    if (renamedButtons[btnId]) {
      return renamedButtons[btnId];
    }

    let text = btn.find("span").text().trim();
    const classes = btn.attr("class") || "";
    const subtitle = btn.attr("data-subtitle") || "";

    if (!text) {
      const viewClass =
        classes
          .split(" ")
          .find((c) => c.startsWith("view--") || c.startsWith("button--")) ||
        "";
      text = capitalize(viewClass.replace(/view--|button--|_/g, " "));
      if (btn.hasClass("button--options")) text = "Ще";
      return text || "Кнопка";
    }

    const sameTextCount = allButtons.filter(
      (otherBtn) => otherBtn.find("span").text().trim() === text
    ).length;

    if (sameTextCount > 1) {
      if (subtitle) {
        return `${text} <span style="opacity:0.5">(${subtitle.substring(
          0,
          30
        )})</span>`;
      }
      const viewClass = classes.split(" ").find((c) => c.startsWith("view--"));
      if (viewClass) {
        const identifier = capitalize(
          viewClass.replace("view--", "").replace(/_/g, " ")
        );
        return `${text} <span style="opacity:0.5">(${identifier})</span>`;
      }
    }

    return text;
  }

  function createFolderButton(folder) {
    const firstBtn = findButton(folder.buttons[0]);
    let icon =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>';

    if (firstBtn) {
      const btnIcon = firstBtn.find("svg").first();
      if (btnIcon.length) {
        icon = btnIcon.prop("outerHTML");
      }
    }

    const hasName = folder.name && folder.name.trim();
    const btn = $(`
      <div class="full-start__button selector button--folder${
        !hasName ? " folder--no-name" : ""
      }" data-folder-id="${folder.id}">
        ${icon}
        ${hasName ? `<span>${folder.name}</span>` : ""}
      </div>
    `);

    btn.on("hover:enter", () => openFolderMenu(folder));

    return btn;
  }

  function openFolderMenu(folder) {
    const items = folder.buttons
      .map((btnId) => {
        const btn = findButton(btnId);
        if (!btn) return null;

        const displayName = getButtonDisplayName(btn, allButtonsOriginal);
        const iconElement = btn.find("svg").first();
        const icon = iconElement.length ? iconElement.prop("outerHTML") : "";
        const subtitle = btn.attr("data-subtitle") || "";

        const item = {
          title: displayName.replace(/<[^>]*>/g, ""),
          button: btn,
          btnId: btnId,
        };

        if (icon) {
          item.template = "selectbox_icon";
          item.icon = icon;
        }

        if (subtitle) {
          item.subtitle = subtitle;
        }

        return item;
      })
      .filter(Boolean);

    Lampa.Select.show({
      title: folder.name,
      items: items,
      onSelect: (item) => item.button.trigger("hover:enter"),
      onBack: () => Lampa.Controller.toggle("full_start"),
    });
  }

  function openFolderEditDialog(folder) {
    const list = $('<div class="menu-edit-list"></div>');

    folder.buttons.forEach((btnId) => {
      const btn = findButton(btnId);
      if (btn) {
        const displayName = getButtonDisplayName(btn, allButtonsOriginal);
        const iconElement = btn.find("svg").first();
        const icon = iconElement.length
          ? iconElement.clone()
          : $("<svg></svg>");

        const item = $(`
          <div class="menu-edit-list__item">
            <div class="menu-edit-list__icon"></div>
            <div class="menu-edit-list__title">${displayName}</div>
            <div class="menu-edit-list__move move-up selector">
              <svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12L11 3L20 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>
            </div>
            <div class="menu-edit-list__move move-down selector">
              <svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2L11 11L20 2" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>
            </div>
            <div class="menu-edit-list__rename selector">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </div>
          </div>
        `);

        item.find(".menu-edit-list__icon").append(icon);
        item.data("btnId", btnId);

        item.find(".move-up").on("hover:enter", () => {
          const prev = item.prev();
          if (prev.length) {
            item.insertBefore(prev);
            saveFolderButtonOrder(folder, list);
          }
        });

        item.find(".move-down").on("hover:enter", () => {
          const next = item.next();
          if (next.length) {
            item.insertAfter(next);
            saveFolderButtonOrder(folder, list);
          }
        });

        item.find(".menu-edit-list__rename").on("hover:enter", () => {
          const currentName = getButtonDisplayName(
            btn,
            allButtonsOriginal
          ).replace(/<[^>]*>/g, "");
          Lampa.Modal.close();
          setTimeout(() => {
            Lampa.Input.edit(
              {
                free: true,
                title: Lampa.Lang.translate("new_button_name"),
                nosave: true,
                value: currentName,
                nomic: true,
              },
              (newName) => {
                if (newName && newName.trim()) {
                  const renamedButtons = getRenamedButtons();
                  renamedButtons[btnId] = newName.trim();
                  setRenamedButtons(renamedButtons);
                  Lampa.Noty.show(Lampa.Lang.translate("button_renamed"));
                }
                openFolderEditDialog(folder);
              }
            );
          }, 100);
        });

        list.append(item);
      }
    });

    Lampa.Modal.open({
      title: Lampa.Lang.translate("folder_buttons_order"),
      html: list,
      size: "small",
      scroll_to_center: true,
      onBack: () => {
        Lampa.Modal.close();
        openEditDialog();
      },
    });
  }

  function saveFolderButtonOrder(folder, list) {
    const newOrder = list
      .find(".menu-edit-list__item")
      .map(function () {
        return $(this).data("btnId");
      })
      .get();

    folder.buttons = newOrder;

    let folders = getFolders();
    const folderIndex = folders.findIndex((f) => f.id === folder.id);
    if (folderIndex !== -1) {
      folders[folderIndex].buttons = newOrder;
      setFolders(folders);
    }

    updateFolderIcon(folder);
  }

  function updateFolderIcon(folder) {
    if (!folder.buttons || folder.buttons.length === 0) return;

    const folderBtn = currentContainer.find(
      `.button--folder[data-folder-id="${folder.id}"]`
    );
    if (folderBtn.length) {
      const firstBtn = findButton(folder.buttons[0]);

      if (firstBtn) {
        const iconElement = firstBtn.find("svg").first();
        if (iconElement.length) {
          folderBtn.find("svg").replaceWith(iconElement.clone());
        }
      } else {
        const defaultIcon =
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>';
        folderBtn.find("svg").replaceWith(defaultIcon);
      }
    }
  }

  function createFolder(name, buttonIds) {
    const folders = getFolders();
    const folder = {
      id: `folder_${Date.now()}`,
      name: name,
      buttons: buttonIds,
    };
    folders.push(folder);
    setFolders(folders);
    return folder;
  }

  function deleteFolder(folderId) {
    let folders = getFolders();
    folders = folders.filter((f) => f.id !== folderId);
    setFolders(folders);
  }

  function openCreateFolderDialog() {
    Lampa.Input.edit(
      {
        free: true,
        title: Lampa.Lang.translate("folder_name_title"),
        nosave: true,
        value: "",
        nomic: true,
      },
      (folderName) => {
        openSelectButtonsDialog(folderName.trim());
      }
    );
  }

  function openSelectButtonsDialog(folderName) {
    const selectedButtons = [];
    const list = $('<div class="menu-edit-list"></div>');

    const buttonsInFolders = getButtonsInFolders();
    const sortedButtons = sortByCustomOrder(allButtonsOriginal.slice());

    sortedButtons.forEach((btn) => {
      const btnId = getButtonId(btn);

      if (buttonsInFolders.includes(btnId)) {
        return;
      }

      const displayName = getButtonDisplayName(btn, sortedButtons);
      const iconElement = btn.find("svg").first();
      const icon = iconElement.length ? iconElement.clone() : $("<svg></svg>");

      const item = $(`
        <div class="menu-edit-list__item">
          <div class="menu-edit-list__icon"></div>
          <div class="menu-edit-list__title">${displayName}</div>
          <div class="menu-edit-list__toggle selector">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1.89111" y="1.78369" width="21.793" height="21.793" rx="3.5" stroke="currentColor" stroke-width="3"/>
              <path d="M7.44873 12.9658L10.8179 16.3349L18.1269 9.02588" stroke="currentColor" stroke-width="3" class="dot" opacity="0" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
      `);

      item.find(".menu-edit-list__icon").append(icon);

      item.find(".menu-edit-list__toggle").on("hover:enter", () => {
        const index = selectedButtons.indexOf(btnId);
        if (index !== -1) {
          selectedButtons.splice(index, 1);
          item.find(".dot").attr("opacity", "0");
        } else {
          selectedButtons.push(btnId);
          item.find(".dot").attr("opacity", "1");
        }
      });

      list.append(item);
    });

    const confirmText =
      folderName && folderName.trim()
        ? `${Lampa.Lang.translate("create_folder")} "${folderName}"`
        : Lampa.Lang.translate("create_folder_no_name");

    const createBtn = $(`
      <div class="selector folder-create-confirm">
        <div style="text-align: center; padding: 1em;">${confirmText}</div>
      </div>
    `);

    createBtn.on("hover:enter", () => {
      if (selectedButtons.length < 2) {
        Lampa.Noty.show(Lampa.Lang.translate("select_min_2_buttons"));
        return;
      }

      const folder = createFolder(folderName, selectedButtons);
      let itemOrder = getItemOrder();

      if (itemOrder.length === 0) {
        itemOrder = currentButtons.map((btn) => ({
          type: "button",
          id: getButtonId(btn),
        }));
      }

      const selectedSet = new Set(selectedButtons);
      let folderPlaced = false;

      const newItemOrder = itemOrder
        .map((item) => {
          if (item.type === "button" && selectedSet.has(item.id)) {
            if (!folderPlaced) {
              folderPlaced = true;
              return { type: "folder", id: folder.id };
            }
            return null;
          }
          return item;
        })
        .filter(Boolean);

      if (!folderPlaced) {
        newItemOrder.push({ type: "folder", id: folder.id });
      }

      setItemOrder(newItemOrder);

      currentButtons = currentButtons.filter(
        (btn) => !selectedSet.has(getButtonId(btn))
      );

      Lampa.Modal.close();
      const notifyText =
        folderName && folderName.trim()
          ? Lampa.Lang.translate("folder_created_param").replace(
              "{folderName}",
              folderName
            )
          : Lampa.Lang.translate("folder_created_no_name");
      Lampa.Noty.show(notifyText);

      if (currentContainer) {
        currentContainer.data("buttons-processed", false);
        reorderButtons(currentContainer);
      }
      refreshController();
    });

    list.append(createBtn);

    Lampa.Modal.open({
      title: Lampa.Lang.translate("add_content_to_folder"),
      html: list,
      size: "medium",
      scroll_to_center: true,
      onBack: () => {
        Lampa.Modal.close();
        openEditDialog();
      },
    });
  }

  function openEditDialog() {
    if (currentContainer) {
      const categories = categorizeButtons(currentContainer);
      const allButtons = Object.values(categories).flat();
      allButtonsCache = sortByCustomOrder(allButtons);

      const folders = getFolders();
      const buttonsInFolders = folders.flatMap((folder) => folder.buttons);

      currentButtons = allButtonsCache.filter(
        (btn) => !buttonsInFolders.includes(getButtonId(btn))
      );
    }

    const list = $('<div class="menu-edit-list"></div>');
    const hidden = getHiddenButtons();
    const folders = getFolders();
    const itemOrder = getItemOrder();

    function createFolderItem(folder) {
      const item = $(`
        <div class="menu-edit-list__item folder-item">
          <div class="menu-edit-list__icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <div class="menu-edit-list__title">${folder.name} <span style="opacity:0.5">(${folder.buttons.length})</span></div>
          <div class="menu-edit-list__move move-up selector">
            <svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12L11 3L20 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>
          </div>
          <div class="menu-edit-list__move move-down selector">
            <svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2L11 11L20 2" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>
          </div>
          <div class="menu-edit-list__edit-content selector">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          </div>
          <div class="menu-edit-list__rename selector">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </div>
          <div class="menu-edit-list__delete selector">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.89111" y="1.78369" width="21.793" height="21.793" rx="3.5" stroke="currentColor" stroke-width="3"/><path d="M9.5 9.5L16.5 16.5M16.5 9.5L9.5 16.5" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
          </div>
        </div>
      `);

      item.data("folderId", folder.id);
      item.data("itemType", "folder");

      item.find(".menu-edit-list__edit-content").on("hover:enter", () => {
        Lampa.Modal.close();
        setTimeout(() => openFolderEditDialog(folder), 100);
      });

      item.find(".move-up").on("hover:enter", () => {
        const prev = item
          .prevAll(":not(.menu-edit-list__create-folder)")
          .first();
        if (prev.length) {
          item.insertBefore(prev);
          saveItemOrder();
        }
      });

      item.find(".move-down").on("hover:enter", () => {
        const next = item.nextAll(":not(.folder-reset-button)").first();
        if (next.length) {
          item.insertAfter(next);
          saveItemOrder();
        }
      });

      item.find(".menu-edit-list__rename").on("hover:enter", () => {
        Lampa.Modal.close();
        setTimeout(() => {
          Lampa.Input.edit(
            {
              title: Lampa.Lang.translate("new_folder_name"),
              value: folder.name,
              free: true,
              nosave: true,
              nomic: true,
            },
            (newName) => {
              if (newName && newName.trim()) {
                const folders = getFolders();
                const targetFolder = folders.find((f) => f.id === folder.id);
                if (targetFolder) {
                  targetFolder.name = newName.trim();
                  setFolders(folders);
                  Lampa.Noty.show(Lampa.Lang.translate("folder_renamed"));
                }
              }
              openEditDialog();
            }
          );
        }, 100);
      });

      item.find(".menu-edit-list__delete").on("hover:enter", () => {
        const folderId = folder.id;
        const folderButtons = new Set(folder.buttons);

        deleteFolder(folderId);

        let itemOrder = getItemOrder();
        const newItemOrder = itemOrder.filter(
          (item) =>
            !(item.type === "folder" && item.id === folderId) &&
            !(item.type === "button" && folderButtons.has(item.id))
        );
        setItemOrder(newItemOrder);

        let customOrder = getCustomOrder();
        const newCustomOrder = customOrder.filter(
          (id) => !folderButtons.has(id)
        );
        setCustomOrder(newCustomOrder);

        item.remove();
        Lampa.Noty.show(Lampa.Lang.translate("folder_deleted"));

        setTimeout(() => {
          if (currentContainer) {
            currentContainer.data("buttons-processed", false);
            reorderButtons(currentContainer);
            openEditDialog();
          }
        }, 50);
      });

      return item;
    }

    function createButtonItem(btn) {
      const displayName = getButtonDisplayName(btn, currentButtons);
      const icon = btn.find("svg").clone();
      const btnId = getButtonId(btn);
      const isHidden = hidden.includes(btnId);

      const item = $(`
        <div class="menu-edit-list__item">
          <div class="menu-edit-list__icon"></div>
          <div class="menu-edit-list__title">${displayName}</div>
          <div class="menu-edit-list__move move-up selector">
            <svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12L11 3L20 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>
          </div>
          <div class="menu-edit-list__move move-down selector">
            <svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2L11 11L20 2" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>
          </div>
          <div class="menu-edit-list__rename selector">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </div>
          <div class="menu-edit-list__toggle toggle selector">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1.89111" y="1.78369" width="21.793" height="21.793" rx="3.5" stroke="currentColor" stroke-width="3"/>
              <path d="M7.44873 12.9658L10.8179 16.3349L18.1269 9.02588" stroke="currentColor" stroke-width="3" class="dot" opacity="${
                isHidden ? "0" : "1"
              }" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
      `);

      item.find(".menu-edit-list__icon").append(icon);
      item.data("buttonId", btnId);
      item.data("itemType", "button");

      item.find(".move-up").on("hover:enter", () => {
        const prev = item
          .prevAll(":not(.menu-edit-list__create-folder)")
          .first();
        if (prev.length) {
          item.insertBefore(prev);
          saveItemOrder();
        }
      });

      item.find(".move-down").on("hover:enter", () => {
        const next = item.nextAll(":not(.folder-reset-button)").first();
        if (next.length) {
          item.insertAfter(next);
          saveItemOrder();
        }
      });

      item.find(".menu-edit-list__rename").on("hover:enter", () => {
        const currentName = getButtonDisplayName(btn, currentButtons).replace(
          /<[^>]*>/g,
          ""
        );
        Lampa.Modal.close();
        setTimeout(() => {
          Lampa.Input.edit(
            {
              free: true,
              title: Lampa.Lang.translate("new_button_name"),
              nosave: true,
              value: currentName,
              nomic: true,
            },
            (newName) => {
              if (newName && newName.trim()) {
                const renamedButtons = getRenamedButtons();
                renamedButtons[btnId] = newName.trim();
                setRenamedButtons(renamedButtons);
                Lampa.Noty.show(Lampa.Lang.translate("button_renamed"));
              }
              openEditDialog();
            }
          );
        }, 100);
      });

      item.find(".toggle").on("hover:enter", () => {
        let hidden = getHiddenButtons();
        const index = hidden.indexOf(btnId);

        if (index !== -1) {
          hidden.splice(index, 1);
          btn.removeClass("hidden");
          item.find(".dot").attr("opacity", "1");
        } else {
          hidden.push(btnId);
          btn.addClass("hidden");
          item.find(".dot").attr("opacity", "0");
        }

        setHiddenButtons(hidden);
      });

      return item;
    }

    const renderedItems = new Set();

    if (itemOrder.length > 0) {
      itemOrder.forEach((item) => {
        if (item.type === "folder") {
          const folder = folders.find((f) => f.id === item.id);
          if (folder) {
            list.append(createFolderItem(folder));
            renderedItems.add(folder.id);
          }
        } else if (item.type === "button") {
          const btn = currentButtons.find((b) => getButtonId(b) === item.id);
          if (btn) {
            list.append(createButtonItem(btn));
            renderedItems.add(item.id);
          }
        }
      });
    }

    folders.forEach((folder) => {
      if (!renderedItems.has(folder.id)) {
        list.append(createFolderItem(folder));
      }
    });

    currentButtons.forEach((btn) => {
      const btnId = getButtonId(btn);
      if (!renderedItems.has(btnId)) {
        list.append(createButtonItem(btn));
      }
    });

    const createFolderBtn = $(`
      <div class="menu-edit-list__item menu-edit-list__create-folder selector">
        <div class="menu-edit-list__icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
        </div>
        <div class="menu-edit-list__title">${Lampa.Lang.translate(
          "create_folder"
        )}</div>
      </div>
    `);

    createFolderBtn.on("hover:enter", () => {
      Lampa.Modal.close();
      openCreateFolderDialog();
    });

    const resetBtn = $(`
      <div class="menu-edit-list__item folder-reset-button selector">
        <div class="menu-edit-list__icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
        </div>
        <div class="menu-edit-list__title">${Lampa.Lang.translate(
          "reset_settings"
        )}</div>
      </div>
    `);

    resetBtn.on("hover:enter", () => {
      Lampa.Storage.set("button_renamed", {});
      Lampa.Storage.set("button_custom_order", []);
      Lampa.Storage.set("button_hidden", []);
      Lampa.Storage.set("button_folders", []);
      Lampa.Storage.set("button_item_order", []);
      Lampa.Modal.close();
      Lampa.Noty.show("Налаштування скинуто");

      setTimeout(() => {
        if (currentContainer) {
          const targetContainer = currentContainer.find(
            ".full-start-new__buttons"
          );
          if (targetContainer.length) {
            targetContainer.find(".full-start__button").remove();
            allButtonsOriginal.forEach((btn) => {
              targetContainer.append(btn.clone(true, true));
            });
          }
          currentContainer.data("buttons-processed", false);
          reorderButtons(currentContainer);
          refreshController();
        }
      }, 100);
    });

    const bottomControls = $('<div class="bottom-controls"></div>');
    bottomControls.append(createFolderBtn);
    bottomControls.append(resetBtn);
    list.append(bottomControls);

    Lampa.Modal.open({
      title: Lampa.Lang.translate("button_settings_title"),
      html: list,
      size: "small",
      scroll_to_center: true,
      onBack: () => {
        Lampa.Modal.close();
        applyChanges();
        Lampa.Controller.toggle("full_start");
      },
    });
  }

  function reorderButtons(container) {
    const targetContainer = container.find(".full-start-new__buttons");
    if (!targetContainer.length) return false;

    currentContainer = container;
    container
      .find(".button--play, .button--edit-order, .button--folder")
      .remove();

    const categories = categorizeButtons(container);
    const allButtons = Object.values(categories).flat();

    allButtonsCache = sortByCustomOrder(allButtons);

    if (allButtonsOriginal.length === 0) {
      allButtonsOriginal = allButtons.map((btn) => btn.clone(true, true));
    }

    const folders = getFolders();
    const buttonsInFolders = new Set(
      folders.flatMap((folder) => folder.buttons)
    );

    currentButtons = allButtonsCache.filter(
      (btn) => !buttonsInFolders.has(getButtonId(btn))
    );
    applyHiddenButtons(currentButtons);

    targetContainer.children().detach();

    let visibleButtons = [];
    const itemOrder = getItemOrder();
    const renderedItems = new Set();

    if (itemOrder.length > 0) {
      itemOrder.forEach((item) => {
        if (item.type === "folder") {
          const folder = folders.find((f) => f.id === item.id);
          if (folder && !renderedItems.has(folder.id)) {
            const folderBtn = createFolderButton(folder);
            targetContainer.append(folderBtn);
            visibleButtons.push(folderBtn);
            renderedItems.add(folder.id);
          }
        } else if (item.type === "button") {
          const btn = currentButtons.find(
            (b) => getButtonId(b) === item.id && !b.hasClass("hidden")
          );
          if (btn && !renderedItems.has(item.id)) {
            targetContainer.append(btn);
            visibleButtons.push(btn);
            renderedItems.add(item.id);
          }
        }
      });
    }

    folders.forEach((folder) => {
      if (!renderedItems.has(folder.id)) {
        const folderBtn = createFolderButton(folder);
        targetContainer.append(folderBtn);
        visibleButtons.push(folderBtn);
        renderedItems.add(folder.id);
      }
    });

    currentButtons.forEach((btn) => {
      const btnId = getButtonId(btn);
      if (!renderedItems.has(btnId) && !btn.hasClass("hidden")) {
        targetContainer.append(btn);
        visibleButtons.push(btn);
        renderedItems.add(btnId);
      }
    });

    const editButton = createEditButton();
    targetContainer.append(editButton);
    visibleButtons.push(editButton);

    applyRenamedButtons(
      visibleButtons.filter((b) => !b.hasClass("button--folder"))
    );
    applyButtonAnimation(visibleButtons);

    setTimeout(() => setupButtonNavigation(container), 100);

    return true;
  }

  function setupButtonNavigation(container) {
    if (Lampa.Controller && typeof Lampa.Controller.toggle === "function") {
      try {
        Lampa.Controller.toggle("full_start");
      } catch (e) {
        console.error("Error toggling controller:", e);
      }
    }
  }

  function refreshController() {
    if (!Lampa.Controller || typeof Lampa.Controller.toggle !== "function")
      return;

    setTimeout(() => {
      try {
        Lampa.Controller.toggle("full_start");

        if (currentContainer) {
          setTimeout(() => setupButtonNavigation(currentContainer), 100);
        }
      } catch (e) {
        console.error("Error refreshing controller:", e);
      }
    }, 50);
  }

  // --- Утиліти ---

  function plural(number, one, two, five) {
    let n = Math.abs(number);
    n %= 100;
    if (n >= 5 && n <= 20) return five;
    n %= 10;
    if (n === 1) return one;
    if (n >= 2 && n <= 4) return two;
    return five;
  }

  function getStatusText(status) {
    const statusMap = {
      Ended: Lampa.Lang.translate("status_ended"),
      Canceled: Lampa.Lang.translate("status_canceled"),
      "Returning Series": Lampa.Lang.translate("status_returning_series"),
      "In Production": Lampa.Lang.translate("status_in_production"),
      Planned: Lampa.Lang.translate("status_planned"),
      Pilot: Lampa.Lang.translate("status_pilot"),
      Released: Lampa.Lang.translate("status_released"),
      Rumored: Lampa.Lang.translate("status_rumored"),
      "Post Production": Lampa.Lang.translate("status_post_production"),
    };
    return statusMap[status] || Lampa.Lang.translate("status_unknown");
  }

  // --- Інформація про сезони ---

  function calculateAiredInfo(movie) {
    const {
      number_of_seasons: totalSeasons = 0,
      number_of_episodes: totalEpisodes = 0,
    } = movie;
    let airedSeasons = 0;
    let airedEpisodes = 0;
    const currentDate = new Date();

    if (movie.seasons) {
      movie.seasons.forEach((season) => {
        if (season.season_number === 0) return;
        if (season.air_date && new Date(season.air_date) <= currentDate) {
          airedSeasons++;
        }
        if (season.episodes) {
          season.episodes.forEach((episode) => {
            if (episode.air_date && new Date(episode.air_date) <= currentDate) {
              airedEpisodes++;
            }
          });
        }
      });
    }

    if (airedEpisodes === 0 && movie.last_episode_to_air) {
      airedSeasons = movie.last_episode_to_air.season_number || 0;
      const lastSeasonNum = movie.last_episode_to_air.season_number;
      const lastEpisodeNum = movie.last_episode_to_air.episode_number;

      if (movie.seasons) {
        movie.seasons.forEach((season) => {
          if (season.season_number === 0) return;
          if (season.season_number < lastSeasonNum) {
            airedEpisodes += season.episode_count || 0;
          } else if (season.season_number === lastSeasonNum) {
            airedEpisodes += lastEpisodeNum;
          }
        });
      }
    }

    if (airedSeasons === 0) airedSeasons = totalSeasons;
    if (airedEpisodes === 0) airedEpisodes = totalEpisodes;
    if (totalEpisodes > 0 && airedEpisodes > totalEpisodes)
      airedEpisodes = totalEpisodes;

    return { airedSeasons, airedEpisodes, totalSeasons, totalEpisodes };
  }

  function addSeasonInfo() {
    Lampa.Listener.follow("full", (data) => {
      if (
        data.type !== "complite" ||
        !data.data.movie.number_of_seasons ||
        FancyFace.settings.seasons_info_mode === "none"
      ) {
        return;
      }

      const movie = data.data.movie;
      const { airedSeasons, airedEpisodes, totalSeasons, totalEpisodes } =
        calculateAiredInfo(movie);

      const { seasons_info_mode, label_position } = FancyFace.settings;
      let displaySeasons, displayEpisodes, seasonsText, episodesText;

      if (seasons_info_mode === "aired") {
        displaySeasons = airedSeasons;
        displayEpisodes = airedEpisodes;
      } else {
        // total
        displaySeasons = totalSeasons;
        displayEpisodes = totalEpisodes;
      }
      seasonsText = plural(
        displaySeasons,
        Lampa.Lang.translate("season_one"),
        Lampa.Lang.translate("season_two"),
        Lampa.Lang.translate("season_five")
      );
      episodesText = plural(
        displayEpisodes,
        Lampa.Lang.translate("episode_one"),
        Lampa.Lang.translate("episode_two"),
        Lampa.Lang.translate("episode_five")
      );

      const infoElement = $('<div class="season-info-label"></div>');
      const isCompleted =
        movie.status === "Ended" || movie.status === "Canceled";

      if (isCompleted) {
        const seasonEpisodeText = Lampa.Lang.translate(
          "season_episode_text_completed",
          {
            seasons_count: displaySeasons,
            seasons_word: seasonsText,
            episodes_count: displayEpisodes,
            episodes_word: episodesText,
          }
        );
        infoElement
          .append($("<div></div>").text(seasonEpisodeText))
          .append($("<div></div>").text(getStatusText(movie.status)));
      } else {
        let text = Lampa.Lang.translate("season_episode_text_completed", {
          seasons_count: displaySeasons,
          seasons_word: seasonsText,
          episodes_count: displayEpisodes,
          episodes_word: episodesText,
        });
        if (
          seasons_info_mode === "aired" &&
          totalEpisodes > 0 &&
          airedEpisodes < totalEpisodes
        ) {
          text = Lampa.Lang.translate("season_episode_text_ongoing", {
            seasons_count: displaySeasons,
            seasons_word: seasonsText,
            episodes_count: airedEpisodes,
            episodes_word: episodesText,
            total_episodes_count: totalEpisodes,
          });
        }
        infoElement.append($("<div></div>").text(text));
      }

      const positionStyles = {
        "top-right": { top: "1.4em", right: "-0.8em" },
        "top-left": { top: "1.4em", left: "-0.8em" },
        "bottom-right": { bottom: "1.4em", right: "-0.8em" },
        "bottom-left": { bottom: "1.4em", left: "-0.8em" },
      };

      const commonStyles = {
        position: "absolute",
        "background-color": isCompleted
          ? "rgba(33, 150, 243, 0.8)"
          : "rgba(244, 67, 54, 0.8)",
        color: "white",
        padding: "0.4em 0.6em",
        "border-radius": "0.3em",
        "font-size": "0.8em",
        "z-index": "999",
        "text-align": "center",
        "white-space": "nowrap",
        "line-height": "1.2em",
        "backdrop-filter": "blur(2px)",
        "box-shadow": "0 2px 5px rgba(0, 0, 0, 0.2)",
      };

      infoElement.css({
        ...commonStyles,
        ...(positionStyles[label_position] || positionStyles["top-right"]),
      });

      setTimeout(() => {
        const poster = $(data.object.activity.render()).find(
          ".full-start-new__poster"
        );
        if (poster.length) {
          poster.css("position", "relative").append(infoElement);
        }
      }, 100);
    });
  }

  // --- Мітки типу контенту ---

  function addLabelToCard(card) {
    if ($(card).find(".content-label").length) return;

    const view = $(card).find(".card__view");
    if (!view.length) return;

    let is_tv = $(card).hasClass("card--tv");

    const label = $('<div class="content-label"></div>');
    if (is_tv) {
      label.addClass("serial-label").text("Серіал");
    } else {
      label.addClass("movie-label").text("Фільм");
    }
    view.append(label);
  }

  function updateCardLabel(card) {
    if (!FancyFace.settings.show_movie_type) return;
    $(card).find(".content-label").remove();
    addLabelToCard(card);
  }

  function changeMovieTypeLabels() {
    const styleTag = $(`<style id="movie_type_styles"></style>`).html(`
        .content-label {
            position: absolute !important; top: 1.4em !important; left: -0.8em !important;
            color: white !important; padding: 0.4em 0.4em !important; border-radius: 0.3em !important;
            font-size: 0.8em !important; z-index: 10 !important;
        }
        .serial-label { background-color: #3498db !important; }
        .movie-label { background-color: #2ecc71 !important; }
        body[data-movie-labels="on"] .card--tv .card__type { display: none !important; }
    `);
    $("head").append(styleTag);

    $("body").attr(
      "data-movie-labels",
      FancyFace.settings.show_movie_type ? "on" : "off"
    );

    if (FancyFace.settings.show_movie_type) {
      $(".card").each((_, card) => addLabelToCard(card));
    }
  }

  // --- Теми ---
  function applyTheme(theme) {
    $("#fancyface_mod_theme").remove();
    if (theme === "default") return;

    const themes = {
      neon: `
        body { background: linear-gradient(135deg, #0d0221 0%, #150734 50%, #1f0c47 100%); color: #ffffff; }
        .menu__item.focus, .menu__item.traverse, .menu__item.hover, .settings-folder.focus, .settings-param.focus, .selectbox-item.focus, .full-start__button.focus, .full-descr__tag.focus, .player-panel .button.focus {
            background: linear-gradient(to right, #ff00ff, #00ffff); color: #fff; box-shadow: 0 0 20px rgba(255, 0, 255, 0.4);
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.5); border: none;
        }
        .card.focus .card__view::after, .card.hover .card__view::after { border: 2px solid #ff00ff; box-shadow: 0 0 20px #00ffff; }
      `,
      blue: `
        body { background: linear-gradient(135deg, #0b365c 0%, #144d80 50%, #0c2a4d 100%); color: #ffffff; }
        .menu__item.focus, .menu__item.traverse, .menu__item.hover, .settings-folder.focus, .settings-param.focus, .selectbox-item.focus, .full-start__button.focus, .full-descr__tag.focus, .player-panel .button.focus {
            background: linear-gradient(to right, #12c2e9, #c471ed, #f64f59); color: #fff; box-shadow: 0 0 30px rgba(18, 194, 233, 0.3); animation: cosmos-pulse 2s infinite;
        }
        @keyframes cosmos-pulse { 0% { box-shadow: 0 0 20px rgba(18, 194, 233, 0.3); } 50% { box-shadow: 0 0 30px rgba(196, 113, 237, 0.3); } 100% { box-shadow: 0 0 20px rgba(246, 79, 89, 0.3); } }
        .card.focus .card__view::after, .card.hover .card__view::after { border: 2px solid #12c2e9; box-shadow: 0 0 30px rgba(196, 113, 237, 0.5); }
      `,
      dark: `
        body { background: linear-gradient(135deg, #2d1f3d 0%, #614385 50%, #516395 100%); color: #ffffff; }
        .menu__item.focus, .menu__item.traverse, .menu__item.hover, .settings-folder.focus, .settings-param.focus, .selectbox-item.focus, .full-start__button.focus, .full-descr__tag.focus, .player-panel .button.focus {
            background: linear-gradient(to right, #ff6e7f, #bfe9ff); color: #2d1f3d; box-shadow: 0 0 15px rgba(255, 110, 127, 0.3); font-weight: bold;
        }
        .card.focus .card__view::after, .card.hover .card__view::after { border: 2px solid #ff6e7f; box-shadow: 0 0 15px rgba(255, 110, 127, 0.5); }
      `,
      emerald: `
        body { background: linear-gradient(135deg, #1a2a3a 0%, #2C5364 50%, #203A43 100%); color: #ffffff; }
        .menu__item.focus, .menu__item.traverse, .menu__item.hover, .settings-folder.focus, .settings-param.focus, .selectbox-item.focus, .full-start__button.focus, .full-descr__tag.focus, .player-panel .button.focus {
            background: linear-gradient(to right, #43cea2, #185a9d); color: #fff; box-shadow: 0 4px 15px rgba(67, 206, 162, 0.3); border-radius: 5px;
        }
        .card.focus .card__view::after, .card.hover .card__view::after { border: 3px solid #43cea2; box-shadow: 0 0 20px rgba(67, 206, 162, 0.4); }
      `,
      aurora: `
        body { background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%); color: #ffffff; }
        .menu__item.focus, .menu__item.traverse, .menu__item.hover, .settings-folder.focus, .settings-param.focus, .selectbox-item.focus, .full-start__button.focus, .full-descr__tag.focus, .player-panel .button.focus {
            background: linear-gradient(to right, #aa4b6b, #6b6b83, #3b8d99); color: #fff; box-shadow: 0 0 20px rgba(170, 75, 107, 0.3); transform: scale(1.02); transition: all 0.3s ease;
        }
        .card.focus .card__view::after, .card.hover .card__view::after { border: 2px solid #aa4b6b; box-shadow: 0 0 25px rgba(170, 75, 107, 0.5); }
      `,
    };
    $('<style id="fancyface_mod_theme"></style>')
      .html(themes[theme] || "")
      .appendTo("head");
  }

  // --- Кольорові рейтинги та елементи ---

  function applyColorByRating(element) {
    const voteText = $(element).text();
    const match = voteText.match(/(\d+(\.\d+)?)/);
    if (!match) return;
    const vote = parseFloat(match[0]);
    let color = "";
    if (vote >= 8) color = "lawngreen";
    else if (vote >= 6) color = "cornflowerblue";
    else if (vote > 3) color = "orange";
    else if (vote >= 0) color = "red";
    if (color) $(element).css("color", color);
  }

  function applyStatusColor(element) {
    const statusText = $(element).text().trim();
    const statusColors = {
      completed: { bg: "rgba(46, 204, 113, 0.8)", text: "white" },
      canceled: { bg: "rgba(231, 76, 60, 0.8)", text: "white" },
      ongoing: { bg: "rgba(243, 156, 18, 0.8)", text: "black" },
      production: { bg: "rgba(52, 152, 219, 0.8)", text: "white" },
    };
    const STATUS_MAP = {
      completed: ["Випущено", "Завершено", "Ended"],
      canceled: ["Скасовано", "Canceled"],
      ongoing: ["Виходить", "Онгоїнг", "Returning Series", "Ongoing"],
      production: ["У виробництві", "In Production"],
    };
    for (const key in STATUS_MAP) {
      if (STATUS_MAP[key].includes(statusText)) {
        $(element).css({
          "background-color": statusColors[key].bg,
          color: statusColors[key].text,
          "border-radius": "0.3em",
          border: "0px",
          "font-size": "1.3em",
          display: "inline-block",
        });
        return;
      }
    }
  }

  function applyAgeRatingColor(element) {
    const ratingText = $(element).text().trim();
    const ageRatings = {
      kids: ["G", "TV-Y", "TV-G", "0+", "3+"],
      children: ["PG", "TV-PG", "TV-Y7", "6+", "7+"],
      teens: ["PG-13", "TV-14", "12+", "13+", "14+"],
      almostAdult: ["R", "TV-MA", "16+", "17+"],
      adult: ["NC-17", "18+"],
    };
    const colors = {
      kids: { bg: "#2ecc71", text: "white" },
      children: { bg: "#3498db", text: "white" },
      teens: { bg: "#f1c40f", text: "black" },
      almostAdult: { bg: "#e67e22", text: "white" },
      adult: { bg: "#e74c3c", text: "white" },
    };
    for (const group in ageRatings) {
      if (ageRatings[group].some((r) => ratingText.includes(r))) {
        $(element).css({
          "background-color": colors[group].bg,
          color: colors[group].text,
          "border-radius": "0.3em",
          "font-size": "1.3em",
          border: "0px",
        });
        return;
      }
    }
  }

  // --- Оригінальні назви ---
  function showTitles(card, render) {
    if (!FancyFace.settings.show_original_names) return;
    const orig = card.original_title || card.original_name;
    if (!orig) return;
    $(".original_title", render).remove();
    $(".full-start-new__title", render).after(
      `<div class="original_title" style="margin-bottom: 2em; text-align: left;">
          <div style="font-size: 1.2em; opacity: 0.8;">${Lampa.Lang.translate(
            "original_title_label"
          )} ${orig}</div>
      </div>`
    );
  }

  // MutationObserver

  function initGlobalObserver() {
    // первинний апдейт
    updateAllVisibility();

    // listener на Storage
    Lampa.Storage.listener.follow("change", function (e) {
      if (
        e.name === "menu_hide" ||
        e.name === "head_hidden_items" ||
        e.name === "settings_hidden_items"
      ) {
        updateAllVisibility();
      }
    });

    FancyFace.observer = new MutationObserver((mutations) => {
      const cardsToUpdate = new Set();
      let menuTouched = false;

      mutations.forEach((mutation) => {
        // === DOM changes ===
        if (mutation.type === "childList" && mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType !== 1) return;
            const $node = $(node);

            // меню / хедер / налаштування
            if (
              $node.is(".menu__list, .head__actions, .settings__body") ||
              $node.find(".menu__list, .head__actions, .settings__body").length
            ) {
              menuTouched = true;
            }

            // картки
            if (FancyFace.settings.show_movie_type) {
              if ($node.hasClass("card")) cardsToUpdate.add(node);
              $node.find(".card").each((_, card) => cardsToUpdate.add(card));
            }

            // рейтинги
            if (FancyFace.settings.colored_ratings) {
              $node
                .find(".card__vote, .full-start__rate, .full-start-new__rate")
                .each((_, el) => applyColorByRating(el));
            }

            // кольорові елементи
            if (FancyFace.settings.colored_elements) {
              if ($node.hasClass("full-start__status")) applyStatusColor(node);
              $node
                .find(".full-start__status")
                .each((_, el) => applyStatusColor(el));

              if ($node.hasClass("full-start__pg")) applyAgeRatingColor(node);
              $node
                .find(".full-start__pg")
                .each((_, el) => applyAgeRatingColor(el));
            }
          });
        }

        // === attribute changes ===
        if (
          FancyFace.settings.show_movie_type &&
          mutation.type === "attributes" &&
          $(mutation.target).hasClass("card")
        ) {
          cardsToUpdate.add(mutation.target);
        }
      });

      // меню апдейти
      if (menuTouched) {
        createMenuSettings();
        updateAllVisibility();
      }

      // апдейт карток
      if (cardsToUpdate.size) {
        requestAnimationFrame(() =>
          cardsToUpdate.forEach((card) => updateCardLabel(card))
        );
      }
    });

    FancyFace.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "data-card", "data-type"],
    });
  }

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

  // START PLUGIN AND ADD SETTINGS

  function startPlugin() {
    Lampa.Manifest.plugins = {
      name: "FancyFace",
      version: FancyFace.version,
      description: Lampa.Lang.translate("plugin_fancy_description"),
      author: "@Niaros",
    };

    Lampa.SettingsApi.addComponent({
      component: "fancy_mod",
      name: Lampa.Lang.translate("additional_interface_settings"),
      icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 5C4 4.44772 4.44772 4 5 4H19C19.5523 4 20 4.44772 20 5V7C20 7.55228 19.5523 8 19 8H5C4.44772 8 4 7.55228 4 7V5Z" stroke="white" stroke-width="2"/><path d="M4 11C4 10.4477 4.44772 10 5 10H19C19.5523 10 20 10.4477 20 11V13C20 13.5523 19.5523 14 19 14H5C4.44772 14 4 13.5523 4 13V11Z" stroke="white" stroke-width="2"/><path d="M4 17C4 16.4477 4.44772 16 5 16H19C19.5523 16 20 16.4477 20 17V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V17Z" stroke="white" stroke-width="2"/></svg>`,
    });

    Lampa.SettingsApi.addComponent({
      component: "menu_filter",
      name: Lampa.Lang.translate("menu_items_hide"),
      description: Lampa.Lang.translate("plugin_description"),
    });

    Lampa.SettingsApi.addParam({
      component: "fancy_mod",
      param: {
        name: "theme_select",
        type: "select",
        values: {
          default: "Немає",
          blue: "Blue",
          neon: "Neon",
          dark: "Dark",
          emerald: "Emerald",
          aurora: "Aurora",
        },
        default: "default",
      },
      field: {
        name: Lampa.Lang.translate("interface_theme_title"),
        description: Lampa.Lang.translate("interface_theme_description"),
      },
      onChange: function (value) {
        FancyFace.settings.theme = value;
        Lampa.Storage.set("theme_select", value);
        applyTheme(value);
      },
    });

    Lampa.SettingsApi.addParam({
      component: "fancy_mod",
      param: {
        name: "buttons_editor",
        type: "trigger",
        default: true,
      },
      field: {
        name: Lampa.Lang.translate("buttons_editor_title"),
        description: Lampa.Lang.translate("buttons_editor_description"),
      },
      onChange: function (value) {
        setTimeout(function () {
          FancyFace.settings.buttons_editor = value;
          Lampa.Settings.update();
          var currentValue = Lampa.Storage.get("buttons_editor", true);
          if (currentValue) {
            $(".button--edit-order").show();
            Lampa.Noty.show(Lampa.Lang.translate("buttons_editor_on"));
          } else {
            $(".button--edit-order").hide();
            Lampa.Noty.show(Lampa.Lang.translate("buttons_editor_off"));
          }
        }, 100);
      },
    });

    Lampa.SettingsApi.addParam({
      component: "fancy_mod",
      param: {
        name: "seasons_info_mode",
        type: "select",
        values: {
          none: Lampa.Lang.translate("settings_info_off"),
          aired: Lampa.Lang.translate("settings_info_aired"),
          total: Lampa.Lang.translate("settings_info_total"),
        },
        default: "aired",
      },
      field: {
        name: Lampa.Lang.translate("series_info_title"),
        description: Lampa.Lang.translate("series_info_description"),
      },
      onChange: function (value) {
        FancyFace.settings.seasons_info_mode = value;
        Lampa.Settings.update();
      },
    });

    Lampa.SettingsApi.addParam({
      component: "fancy_mod",
      param: {
        name: "label_position",
        type: "select",
        values: {
          "top-right": Lampa.Lang.translate("label_top_right"),
          "top-left": Lampa.Lang.translate("label_top_left"),
          "bottom-right": Lampa.Lang.translate("label_bottom_right"),
          "bottom-left": Lampa.Lang.translate("label_bottom_left"),
        },
        default: "top-right",
      },
      field: {
        name: Lampa.Lang.translate("label_position_title"),
        description: Lampa.Lang.translate("label_position_description"),
      },
      onChange: function (value) {
        FancyFace.settings.label_position = value;
        Lampa.Settings.update();
      },
    });

    Lampa.SettingsApi.addParam({
      component: "fancy_mod",
      param: {
        name: "fancy_mod_show_movie_type",
        type: "trigger",
        default: true,
      },
      field: {
        name: Lampa.Lang.translate("change_labels_title"),
        description: Lampa.Lang.translate("change_labels_description"),
      },
      onChange: function (value) {
        FancyFace.settings.show_movie_type = value;
        Lampa.Storage.set("fancy_mod_show_movie_type", value);
        $("body").attr("data-movie-labels", value ? "on" : "off");
        if (!value) {
          $(".content-label").remove();
        }
      },
    });

    Lampa.SettingsApi.addParam({
      component: "fancy_mod",
      param: {
        name: "colored_ratings",
        type: "trigger",
        default: true,
      },
      field: {
        name: Lampa.Lang.translate("colored_ratings_title"),
        description: Lampa.Lang.translate("colored_ratings_description"),
      },
      onChange: function (value) {
        FancyFace.settings.colored_ratings = value;
        Lampa.Storage.set("colored_ratings", value);
        if (!value) {
          $(".card__vote, .full-start__rate, .full-start-new__rate").css(
            "color",
            ""
          );
        }
      },
    });

    Lampa.SettingsApi.addParam({
      component: "fancy_mod",
      param: {
        name: "colored_elements",
        type: "trigger",
        default: true,
      },
      field: {
        name: Lampa.Lang.translate("colored_elements_title"),
        description: Lampa.Lang.translate("colored_elements_description"),
      },
      onChange: function (value) {
        FancyFace.settings.colored_elements = value;
        Lampa.Storage.set("colored_elements", value);
        if (!value) {
          $(".full-start__status").css({
            "background-color": "",
            color: "",
            padding: "",
            "border-radius": "",
            "font-weight": "",
            display: "",
          });
          $(".full-start__pg").css({
            "background-color": "",
            color: "",
            "font-weight": "",
          });
        }
      },
    });

    Lampa.SettingsApi.addParam({
      component: "fancy_mod",
      param: {
        name: "show_original_names",
        type: "trigger",
        default: true,
      },
      field: {
        name: Lampa.Lang.translate("show_original_title"),
        description: Lampa.Lang.translate("show_original_title_description"),
      },
      onChange: function (value) {
        FancyFace.settings.show_original_names = value;
        Lampa.Storage.set("show_original_names", value);
      },
    });

    Lampa.SettingsApi.addParam({
      component: "fancy_mod",
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
            Lampa.Settings.create("fancy_mod");
          },
        });
      },
    });

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
    let leftSettingsCreated = false;
    let headSettingsCreated = false;
    let settingsSettingsCreated = false;

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

    Lampa.Listener.follow("full", (e) => {
      if (e.type !== "complite") return;

      const container = e.object.activity.render();
      const targetContainer = container.find(".full-start-new__buttons");
      if (targetContainer.length) {
        targetContainer.addClass("buttons-loading");
      }

      setTimeout(() => {
        try {
          if (!container.data("buttons-processed")) {
            container.data("buttons-processed", true);
            if (reorderButtons(container)) {
              if (targetContainer.length) {
                targetContainer.removeClass("buttons-loading");
              }
              refreshController();
            }
          }
        } catch (err) {
          console.error("Error processing buttons:", err);
          if (targetContainer.length) {
            targetContainer.removeClass("buttons-loading");
          }
        }
      }, 400);
    });

    FancyFace.settings.buttons_editor = Lampa.Storage.get(
      "buttons_editor",
      true
    );
    FancyFace.settings.show_movie_type = Lampa.Storage.get(
      "show_movie_type",
      true
    );
    FancyFace.settings.theme = Lampa.Storage.get("theme_select", "default");
    FancyFace.settings.colored_ratings = Lampa.Storage.get(
      "colored_ratings",
      true
    );
    FancyFace.settings.colored_elements = Lampa.Storage.get(
      "colored_elements",
      true
    );
    FancyFace.settings.seasons_info_mode = Lampa.Storage.get(
      "seasons_info_mode",
      "aired"
    );
    FancyFace.settings.show_episodes_on_main = Lampa.Storage.get(
      "show_episodes_on_main",
      false
    );
    FancyFace.settings.label_position = Lampa.Storage.get(
      "label_position",
      "top-right"
    );
    FancyFace.settings.show_original_names = Lampa.Storage.get(
      "show_original_names",
      true
    );

    FancyFace.settings.enabled =
      FancyFace.settings.seasons_info_mode !== "none";

    applyTheme(FancyFace.settings.theme);
    if (FancyFace.settings.enabled) addSeasonInfo();
    changeMovieTypeLabels();

    if (!window.title_plugin_inited) {
      Lampa.Listener.follow("full", (e) => {
        if (e.type === "complite" && e.data.movie) {
          showTitles(e.data.movie, e.object.activity.render());
        }
      });
      window.title_plugin_inited = true;
    }

    initGlobalObserver();
  }

  if (window.appready) {
    startPlugin();
  } else {
    Lampa.Listener.follow("app", (event) => {
      if (event.type === "ready") startPlugin();
    });
  }

  window.fancy_mod = FancyFace;
})();
