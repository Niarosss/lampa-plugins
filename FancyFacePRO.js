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

  // --- Buttons editor functionalaty ---

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

    // Перевіряємо налаштування та приховуємо кнопку, якщо редактор вимкнено
    if (Lampa.Storage.get("buttons_editor_enabled") === false) {
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
          return oldBtnId; // Keep old ID if no match found
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
                title: "Нова назва кнопки",
                nosave: true,
                value: currentName,
                nomic: true,
              },
              (newName) => {
                if (newName && newName.trim()) {
                  const renamedButtons = getRenamedButtons();
                  renamedButtons[btnId] = newName.trim();
                  setRenamedButtons(renamedButtons);
                  Lampa.Noty.show("Кнопку перейменовано");
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
      title: "Порядок кнопок у папці",
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
        title: "Назва папки",
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
        ? `Створити папку "${folderName}"`
        : "Створити папку без назви";

    const createBtn = $(`
      <div class="selector folder-create-confirm">
        <div style="text-align: center; padding: 1em;">${confirmText}</div>
      </div>
    `);

    createBtn.on("hover:enter", () => {
      if (selectedButtons.length < 2) {
        Lampa.Noty.show("Виберіть мінімум 2 кнопки");
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
          ? `Папку "${folderName}" створено`
          : "Папку без назви створено";
      Lampa.Noty.show(notifyText);

      if (currentContainer) {
        currentContainer.data("buttons-processed", false);
        reorderButtons(currentContainer);
      }
      refreshController();
    });

    list.append(createBtn);

    Lampa.Modal.open({
      title: "Виберіть кнопки для папки",
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
              title: "Перейменувати папку",
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
                  Lampa.Noty.show("Папку перейменовано");
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
        Lampa.Noty.show("Папку видалено");

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
              title: "Нова назва кнопки",
              nosave: true,
              value: currentName,
              nomic: true,
            },
            (newName) => {
              if (newName && newName.trim()) {
                const renamedButtons = getRenamedButtons();
                renamedButtons[btnId] = newName.trim();
                setRenamedButtons(renamedButtons);
                Lampa.Noty.show("Кнопку перейменовано");
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
        <div class="menu-edit-list__title">Створити папку</div>
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
        <div class="menu-edit-list__title">Скинути</div>
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
      title: "Налаштування кнопок",
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
      Ended: "Завершено",
      Canceled: "Скасовано",
      "Returning Series": "Виходить",
      "In Production": "У виробництві",
      Planned: "Заплановано",
      Pilot: "Пілотний",
      Released: "Випущено",
      Rumored: "За чутками",
      "Post Production": "Пост-продакшн",
    };
    return statusMap[status] || status || "Невідомо";
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
      seasonsText = plural(displaySeasons, "сезон", "сезони", "сезонів");
      episodesText = plural(displayEpisodes, "серія", "серії", "серій");

      const infoElement = $('<div class="season-info-label"></div>');
      const isCompleted =
        movie.status === "Ended" || movie.status === "Canceled";

      if (isCompleted) {
        const seasonEpisodeText = `${displaySeasons} ${seasonsText} ${displayEpisodes} ${episodesText}`;
        infoElement
          .append($("<div></div>").text(seasonEpisodeText))
          .append($("<div></div>").text(getStatusText(movie.status)));
      } else {
        let text = `${displaySeasons} ${seasonsText} ${displayEpisodes} ${episodesText}`;
        if (
          seasons_info_mode === "aired" &&
          totalEpisodes > 0 &&
          airedEpisodes < totalEpisodes
        ) {
          text += ` з ${totalEpisodes}`;
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
      dark_night: `
        body { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%); color: #ffffff; }
        .menu__item.focus, .menu__item.traverse, .menu__item.hover, .settings-folder.focus, .settings-param.focus, .selectbox-item.focus, .full-start__button.focus, .full-descr__tag.focus, .player-panel .button.focus {
            background: linear-gradient(to right, #8a2387, #e94057, #f27121); color: #fff; box-shadow: 0 0 30px rgba(233, 64, 87, 0.3); animation: night-pulse 2s infinite;
        }
        @keyframes night-pulse { 0% { box-shadow: 0 0 20px rgba(233, 64, 87, 0.3); } 50% { box-shadow: 0 0 30px rgba(242, 113, 33, 0.3); } 100% { box-shadow: 0 0 20px rgba(138, 35, 135, 0.3); } }
        .card.focus .card__view::after, .card.hover .card__view::after { border: 2px solid #e94057; box-shadow: 0 0 30px rgba(242, 113, 33, 0.5); }
      `,
      blue_cosmos: `
        body { background: linear-gradient(135deg, #0b365c 0%, #144d80 50%, #0c2a4d 100%); color: #ffffff; }
        .menu__item.focus, .menu__item.traverse, .menu__item.hover, .settings-folder.focus, .settings-param.focus, .selectbox-item.focus, .full-start__button.focus, .full-descr__tag.focus, .player-panel .button.focus {
            background: linear-gradient(to right, #12c2e9, #c471ed, #f64f59); color: #fff; box-shadow: 0 0 30px rgba(18, 194, 233, 0.3); animation: cosmos-pulse 2s infinite;
        }
        @keyframes cosmos-pulse { 0% { box-shadow: 0 0 20px rgba(18, 194, 233, 0.3); } 50% { box-shadow: 0 0 30px rgba(196, 113, 237, 0.3); } 100% { box-shadow: 0 0 20px rgba(246, 79, 89, 0.3); } }
        .card.focus .card__view::after, .card.hover .card__view::after { border: 2px solid #12c2e9; box-shadow: 0 0 30px rgba(196, 113, 237, 0.5); }
      `,
      sunset: `
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
      bywolf_mod: `
        body { background: linear-gradient(135deg, #090227 0%, #170b34 50%, #261447 100%); color: #ffffff; }
        .menu__item.focus, .menu__item.traverse, .menu__item.hover, .settings-folder.focus, .settings-param.focus, .selectbox-item.focus, .full-start__button.focus, .full-descr__tag.focus, .player-panel .button.focus {
            background: linear-gradient(to right, #fc00ff, #00dbde); color: #fff; box-shadow: 0 0 30px rgba(252, 0, 255, 0.3); animation: cosmic-pulse 2s infinite;
        }
        @keyframes cosmic-pulse { 0% { box-shadow: 0 0 20px rgba(252, 0, 255, 0.3); } 50% { box-shadow: 0 0 30px rgba(0, 219, 222, 0.3); } 100% { box-shadow: 0 0 20px rgba(252, 0, 255, 0.3); } }
        .card.focus .card__view::after, .card.hover .card__view::after { border: 2px solid #fc00ff; box-shadow: 0 0 30px rgba(0, 219, 222, 0.5); }
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
      completed: ["Завершено", "Ended"],
      canceled: ["Скасовано", "Canceled"],
      ongoing: ["Виходить", "Returning Series"],
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
          <div style="font-size: 1.2em; opacity: 0.8;">Оригінальна назва: ${orig}</div>
      </div>`
    );
  }

  // MutationObserver

  function initObservers() {
    FancyFace.observer = new MutationObserver((mutations) => {
      const cardsToUpdate = new Set();
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType !== 1) return;
            const $node = $(node);

            if (FancyFace.settings.show_movie_type) {
              if ($node.hasClass("card")) cardsToUpdate.add(node);
              $node.find(".card").each((_, card) => cardsToUpdate.add(card));
            }
            if (FancyFace.settings.colored_ratings) {
              $node
                .find(".card__vote, .full-start__rate, .full-start-new__rate")
                .each((_, el) => applyColorByRating(el));
            }
            if (FancyFace.settings.colored_elements) {
              $node
                .find(".full-start__status")
                .each((_, el) => applyStatusColor(el));
              if ($node.hasClass("full-start__status")) applyStatusColor(node);
              $node
                .find(".full-start__pg")
                .each((_, el) => applyAgeRatingColor(el));
              if ($node.hasClass("full-start__pg")) applyAgeRatingColor(node);
            }
          });
        }
        if (
          FancyFace.settings.show_movie_type &&
          mutation.type === "attributes" &&
          $(mutation.target).hasClass("card")
        ) {
          cardsToUpdate.add(mutation.target);
        }
      });
      if (cardsToUpdate.size > 0) {
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

  // START PLUGIN AND ADD SETTINGS

  function startPlugin() {
    Lampa.Manifest.plugins = {
      name: "FancyFace",
      version: FancyFace.version,
      description: "Покращений інтерфейс для застосунку Lampa",
      author: "@Niaros",
    };

    Lampa.SettingsApi.addComponent({
      component: "fancy_mod",
      name: "Додаткові налаштування інтерфейсу",
      icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 5C4 4.44772 4.44772 4 5 4H19C19.5523 4 20 4.44772 20 5V7C20 7.55228 19.5523 8 19 8H5C4.44772 8 4 7.55228 4 7V5Z" stroke="white" stroke-width="2"/><path d="M4 11C4 10.4477 4.44772 10 5 10H19C19.5523 10 20 10.4477 20 11V13C20 13.5523 19.5523 14 19 14H5C4.44772 14 4 13.5523 4 13V11Z" stroke="white" stroke-width="2"/><path d="M4 17C4 16.4477 4.44772 16 5 16H19C19.5523 16 20 16.4477 20 17V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V17Z" stroke="white" stroke-width="2"/></svg>`,
    });

    Lampa.SettingsApi.addParam({
      component: "fancy_mod",
      param: {
        name: "buttons_editor",
        type: "trigger",
        default: true,
      },
      field: {
        name: "Редактор кнопок",
        description: "Перемикання відображення Редактора кнопок",
      },
      onChange: function (value) {
        setTimeout(function () {
          FancyFace.settings.buttons_editor = value;
          Lampa.Settings.update();
          var currentValue = Lampa.Storage.get("buttons_editor_enabled", true);
          if (currentValue) {
            $(".button--edit-order").show();
            Lampa.Noty.show("Редактор кнопок увімкнено");
          } else {
            $(".button--edit-order").hide();
            Lampa.Noty.show("Редактор кнопок вимкнено");
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
          none: "Вимкнути",
          aired: "Актуальна інформація",
          total: "Повна кількість",
        },
        default: "aired",
      },
      field: {
        name: "Інформація про серії",
        description: "Оберіть, як відображати інформацію про серії та сезони",
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
          "top-right": "Верхній правий кут",
          "top-left": "Верхній лівий кут",
          "bottom-right": "Нижній правий кут",
          "bottom-left": "Нижній лівий кут",
        },
        default: "top-right",
      },
      field: {
        name: "Розташування мітки про серії",
        description: "Оберіть позицію мітки на постері",
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
        name: "Змінити мітки типу",
        description: 'Змінити "TV" на "Серіал" та додати мітку "Фільм"',
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
        name: "theme_select",
        type: "select",
        values: {
          default: "Немає",
          bywolf_mod: "Bywolf_mod",
          dark_night: "Dark Night bywolf",
          blue_cosmos: "Blue Cosmos",
          neon: "Neon",
          sunset: "Dark MOD",
          emerald: "Emerald V1",
          aurora: "Aurora",
        },
        default: "default",
      },
      field: {
        name: "Тема інтерфейсу",
        description: "Оберіть тему оформлення інтерфейсу",
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
        name: "colored_ratings",
        type: "trigger",
        default: true,
      },
      field: {
        name: "Кольорові рейтинги",
        description: "Змінювати колір рейтингу залежно від оцінки",
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
        name: "Кольорові елементи",
        description:
          "Відображати статуси серіалів та вікові обмеження кольоровими",
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
        name: "Показувати оригінальні назви",
        description: "Відображення оригінальної назви фільму/серіалу в картці",
      },
      onChange: function (value) {
        FancyFace.settings.show_original_names = value;
        Lampa.Storage.set("show_original_names", value);
      },
    });

    const style = $(
      `<style>
        @keyframes button-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .full-start__button { opacity: 0; }
        .full-start__button.hidden { display: none !important; }
        .button--folder { cursor: pointer; }
        .full-start-new__buttons { display: flex !important; flex-direction: row !important; flex-wrap: wrap !important; gap: 0.5em !important; }
        .full-start-new__buttons.buttons-loading .full-start__button { visibility: hidden !important; }
        .menu-edit-list__create-folder { background: rgba(100,200,100,0.2); border: 3px solid transparent; }
        .menu-edit-list__create-folder.focus { background: rgba(100,200,100,0.3); border-color: rgba(255,255,255,0.8); }
        .menu-edit-list__delete, .menu-edit-list__rename, .menu-edit-list__edit-content { width: 2.4em; height: 2.4em; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .menu-edit-list__delete svg, .menu-edit-list__rename svg, .menu-edit-list__edit-content svg { width: 1.2em !important; height: 1.2em !important; }
        .menu-edit-list__delete.focus, .menu-edit-list__rename.focus, .menu-edit-list__edit-content.focus { border: 2px solid rgba(255,255,255,0.8); border-radius: 0.3em; }
        .folder-item .menu-edit-list__move { margin-right: 0; }
        .folder-create-confirm { background: rgba(100,200,100,0.3); margin-top: 1em; border-radius: 0.3em; }
        .folder-create-confirm.focus { border: 3px solid rgba(255,255,255,0.8); }
        .bottom-controls { display: flex; gap: 0.5em; margin-top: 1em; }
        .bottom-controls > .menu-edit-list__item { width: calc(50% - 0.25em); margin-bottom: 0; justify-content: center; }
        .folder-reset-button { background: rgba(200,100,100,0.3); border: 3px solid transparent; }
        .folder-reset-button.focus { background: rgba(200,100,100,0.4); border-color: rgba(255,255,255,0.8); }
        .menu-edit-list__toggle.focus { border: 2px solid rgba(255,255,255,0.8); border-radius: 0.3em; }
        .button--folder.folder--no-name { min-width: 3.5em; max-width: 3.5em; justify-content: center; }
        .button--folder.folder--no-name > span { display: none; }
      </style>`
    );
    $("body").append(style);

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

    FancyFace.settings.show_movie_type = Lampa.Storage.get(
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

    initObservers();
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
