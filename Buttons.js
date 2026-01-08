(function () {
  "use strict";

  const playIcon =
    '<svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M9.074 7.733L3.308 11.631C1.903 12.581 0 11.583 0 9.898V2.101C0 .415 1.903-.582 3.308.368L9.074 4.266C10.351 5.125 10.351 6.874 9.074 7.733Z" fill="white"/>' +
    "</svg>";

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

    const btn = $(`
      <div class="full-start__button selector button--folder" data-folder-id="${folder.id}">
        ${icon}
        <span>${folder.name}</span>
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

  function openRenameFolderDialog(folder) {
    Lampa.Input.edit(
      {
        title: "Перейменувати папку",
        value: folder.name,
        free: true,
        nosave: true,
        nomic: true,
      },
      (newName) => {
        if (newName) {
          const folders = getFolders();
          const targetFolder = folders.find((f) => f.id === folder.id);
          if (targetFolder) {
            targetFolder.name = newName;
            setFolders(folders);
            Lampa.Noty.show("Папку перейменовано");
            applyChanges();
          }
        }
      }
    );
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
          Lampa.Input.edit(
            {
              free: true,
              title: "Нова назва кнопки",
              nosave: true,
              value: currentName,
              nomic: true,
            },
            (newName) => {
              Lampa.Modal.close();
              if (newName && newName.trim()) {
                const renamedButtons = getRenamedButtons();
                renamedButtons[btnId] = newName.trim();
                setRenamedButtons(renamedButtons);
                Lampa.Noty.show("Кнопку перейменовано");
              }
              setTimeout(() => openFolderEditDialog(folder), 50);
            }
          );
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
        // if (!folderName || !folderName.trim()) {
        //   Lampa.Noty.show("Введіть назву папки");
        //   openEditDialog();
        //   return;
        // }
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

    const createBtn = $(`
      <div class="selector folder-create-confirm">
        <div style="text-align: center; padding: 1em;">Створити папку "${folderName}"</div>
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
      Lampa.Noty.show(`Папку "${folderName}" створено`);

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
        <div class="menu-edit-list__item folder-item selector">
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

      item.on("hover:enter", (e) => {
        if (
          !$(e.target).closest(
            ".menu-edit-list__move, .menu-edit-list__rename, .menu-edit-list__delete"
          ).length
        ) {
          Lampa.Modal.close();
          setTimeout(() => openFolderEditDialog(folder), 100);
        }
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
        Lampa.Input.edit(
          {
            title: "Перейменувати папку",
            value: folder.name,
            free: true,
            nosave: true,
            nomic: true,
          },
          (newName) => {
            Lampa.Modal.close();
            if (newName && newName.trim()) {
              const folders = getFolders();
              const targetFolder = folders.find((f) => f.id === folder.id);
              if (targetFolder) {
                targetFolder.name = newName.trim();
                setFolders(folders);
                Lampa.Noty.show("Папку перейменовано");
              }
            }
            setTimeout(openEditDialog, 50);
          }
        );
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
            openEditDialog(); // Re-open edit dialog to reflect changes
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
        Lampa.Input.edit(
          {
            free: true,
            title: "Нова назва кнопки",
            nosave: true,
            value: currentName,
            nomic: true,
          },
          (newName) => {
            Lampa.Modal.close();
            if (newName && newName.trim()) {
              const renamedButtons = getRenamedButtons();
              renamedButtons[btnId] = newName.trim();
              setRenamedButtons(renamedButtons);
              btn.find("span").text(newName.trim());
              Lampa.Noty.show("Кнопку перейменовано");
            }
            setTimeout(openEditDialog, 50);
          }
        );
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
          currentContainer.data("buttons-processed", false);
          reorderButtons(currentContainer);
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

  function init() {
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
        .menu-edit-list__delete { width: 2.4em; height: 2.4em; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .menu-edit-list__delete svg { width: 1.2em !important; height: 1.2em !important; }
        .menu-edit-list__delete.focus { border: 2px solid rgba(255,255,255,0.8); border-radius: 0.3em; }
        .menu-edit-list__rename { width: 2.4em; height: 2.4em; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .menu-edit-list__rename svg { width: 1.2em !important; height: 1.2em !important; }
        .menu-edit-list__rename.focus { border: 2px solid rgba(255,255,255,0.8); border-radius: 0.3em; }
        .folder-item .menu-edit-list__move { margin-right: 0; }
        .folder-create-confirm { background: rgba(100,200,100,0.3); margin-top: 1em; border-radius: 0.3em; }
        .folder-create-confirm.focus { border: 3px solid rgba(255,255,255,0.8); }
        .bottom-controls { display: flex; gap: 0.5em; margin-top: 1em; }
        .bottom-controls > .menu-edit-list__item { width: calc(50% - 0.25em); margin-bottom: 0; justify-content: center; }
        .folder-reset-button { background: rgba(200,100,100,0.3); border: 3px solid transparent; }
        .folder-reset-button.focus { background: rgba(200,100,100,0.4); border-color: rgba(255,255,255,0.8); }
        .menu-edit-list__toggle.focus { border: 2px solid rgba(255,255,255,0.8); border-radius: 0.3em; }
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
  }

  // Додаємо налаштування до розділу "Інтерфейс"
  if (Lampa.SettingsApi) {
    Lampa.SettingsApi.addParam({
      component: "interface",
      param: {
        name: "buttons_editor_enabled",
        type: "trigger",
        default: true,
      },
      field: {
        name: "Редактор кнопок",
      },
      onChange: function (value) {
        setTimeout(function () {
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
      onRender: function (element) {
        setTimeout(function () {
          var lastElement = $(
            'div[data-component="interface"] .settings-param'
          ).last();
          if (lastElement.length) {
            element.insertAfter(lastElement);
          }
        }, 0);
      },
    });
  }

  init();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {};
  }
})();
