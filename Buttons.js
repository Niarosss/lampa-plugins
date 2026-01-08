(function () {
  "use strict";

  var LAMPAC_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M20.331 14.644l-13.794-13.831 17.55 10.075zM2.938 0c-0.813 0.425-1.356 1.2-1.356 2.206v27.581c0 1.006 0.544 1.781 1.356 2.206l16.038-16zM29.512 14.1l-3.681-2.131-4.106 4.031 4.106 4.031 3.756-2.131c1.125-0.893 1.125-2.906-0.075-3.8zM6.538 31.188l17.55-10.075-3.756-3.756z" fill="currentColor"></path></svg>';

  var EXCLUDED_CLASSES = [
    "button--play",
    "button--edit-order",
    "button--folder",
  ];

  var DEFAULT_GROUPS = [
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

  var currentButtons = [];
  var allButtonsCache = [];
  var allButtonsOriginal = [];
  var currentContainer = null;

  function findButton(btnId) {
    var btn = allButtonsOriginal.find(function (b) {
      return getButtonId(b) === btnId;
    });
    if (!btn) {
      btn = allButtonsCache.find(function (b) {
        return getButtonId(b) === btnId;
      });
    }
    return btn;
  }

  function getButtonsInFolders() {
    var folders = getFolders();
    var buttonsInFolders = [];
    folders.forEach(function (folder) {
      buttonsInFolders = buttonsInFolders.concat(folder.buttons);
    });
    return buttonsInFolders;
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
    var classes = button.attr("class") || "";
    var text = button.find("span").text().trim().replace(/\s+/g, "_");
    var subtitle = button.attr("data-subtitle") || "";

    if (
      classes.indexOf("modss") !== -1 ||
      text.indexOf("MODS") !== -1 ||
      text.indexOf("MOD") !== -1
    ) {
      return "modss_online_button";
    }

    if (classes.indexOf("showy") !== -1 || text.indexOf("Showy") !== -1) {
      return "showy_online_button";
    }

    var viewClasses = classes
      .split(" ")
      .filter(function (c) {
        return c.indexOf("view--") === 0 || c.indexOf("button--") === 0;
      })
      .join("_");

    if (!viewClasses && !text) {
      return "button_unknown";
    }

    var id = viewClasses + "_" + text;

    if (subtitle) {
      id = id + "_" + subtitle.replace(/\s+/g, "_").substring(0, 30);
    }

    return id;
  }

  function getButtonId(button) {
    var stableId = button.attr("data-stable-id");
    if (stableId) {
      return stableId;
    }
    var newId = generateButtonId(button);
    button.attr("data-stable-id", newId);
    return newId;
  }

  function applyRenamedButtons(buttons) {
    var renamed = getRenamedButtons();
    buttons.forEach(function (btn) {
      var id = getButtonId(btn);
      if (renamed[id]) {
        btn.find("span").text(renamed[id]);
      }
    });
  }

  function getButtonType(button) {
    var classes = button.attr("class") || "";

    for (var i = 0; i < DEFAULT_GROUPS.length; i++) {
      var group = DEFAULT_GROUPS[i];
      for (var j = 0; j < group.patterns.length; j++) {
        if (classes.indexOf(group.patterns[j]) !== -1) {
          return group.name;
        }
      }
    }

    return "other";
  }

  function isExcluded(button) {
    var classes = button.attr("class") || "";
    for (var i = 0; i < EXCLUDED_CLASSES.length; i++) {
      if (classes.indexOf(EXCLUDED_CLASSES[i]) !== -1) {
        return true;
      }
    }
    return false;
  }

  function categorizeButtons(container) {
    var allButtons = container
      .find(".full-start__button")
      .not(".button--edit-order, .button--folder, .button--play");

    var categories = {
      online: [],
      torrent: [],
      trailer: [],
      book: [],
      reaction: [],
      other: [],
    };

    allButtons.each(function () {
      var $btn = $(this);

      if (isExcluded($btn)) return;

      var type = getButtonType($btn);

      if (
        type === "online" &&
        $btn.hasClass("lampac--button") &&
        !$btn.hasClass("modss--button") &&
        !$btn.hasClass("showy--button")
      ) {
        var svgElement = $btn.find("svg").first();
        if (svgElement.length && !svgElement.hasClass("modss-online-icon")) {
          svgElement.replaceWith(LAMPAC_ICON);
        }
      }

      if (categories[type]) {
        categories[type].push($btn);
      } else {
        categories.other.push($btn);
      }
    });

    return categories;
  }

  function sortByCustomOrder(buttons) {
    var customOrder = getCustomOrder();

    var priority = [];
    var regular = [];

    buttons.forEach(function (btn) {
      var id = getButtonId(btn);
      if (id === "modss_online_button" || id === "showy_online_button") {
        priority.push(btn);
      } else {
        regular.push(btn);
      }
    });

    priority.sort(function (a, b) {
      var idA = getButtonId(a);
      var idB = getButtonId(b);
      if (idA === "modss_online_button") return -1;
      if (idB === "modss_online_button") return 1;
      if (idA === "showy_online_button") return -1;
      if (idB === "showy_online_button") return 1;
      return 0;
    });

    if (!customOrder.length) {
      regular.sort(function (a, b) {
        var typeOrder = [
          "online",
          "torrent",
          "trailer",
          "book",
          "reaction",
          "other",
        ];
        var typeA = getButtonType(a);
        var typeB = getButtonType(b);
        var indexA = typeOrder.indexOf(typeA);
        var indexB = typeOrder.indexOf(typeB);
        if (indexA === -1) indexA = 999;
        if (indexB === -1) indexB = 999;
        return indexA - indexB;
      });
      return priority.concat(regular);
    }

    var sorted = [];
    var remaining = regular.slice();

    customOrder.forEach(function (id) {
      for (var i = 0; i < remaining.length; i++) {
        if (getButtonId(remaining[i]) === id) {
          sorted.push(remaining[i]);
          remaining.splice(i, 1);
          break;
        }
      }
    });

    return priority.concat(sorted).concat(remaining);
  }

  function applyHiddenButtons(buttons) {
    var hidden = getHiddenButtons();
    buttons.forEach(function (btn) {
      var id = getButtonId(btn);
      if (hidden.indexOf(id) !== -1) {
        btn.addClass("hidden");
      } else {
        btn.removeClass("hidden");
      }
    });
  }

  function applyButtonAnimation(buttons) {
    buttons.forEach(function (btn, index) {
      btn.css({
        opacity: "0",
        animation: "button-fade-in 0.4s ease forwards",
        "animation-delay": index * 0.08 + "s",
      });
    });
  }

  function saveOrder() {
    var order = [];
    currentButtons.forEach(function (btn) {
      order.push(getButtonId(btn));
    });
    setCustomOrder(order);
  }

  function saveItemOrder() {
    var order = [];
    var items = $(".menu-edit-list .menu-edit-list__item").not(
      ".menu-edit-list__create-folder, .bottom-controls .menu-edit-list__item"
    );

    items.each(function () {
      var $item = $(this);
      var itemType = $item.data("itemType");

      if (itemType === "folder") {
        order.push({
          type: "folder",
          id: $item.data("folderId"),
        });
      } else if (itemType === "button") {
        order.push({
          type: "button",
          id: $item.data("buttonId"),
        });
      }
    });

    setItemOrder(order);
  }

  function applyChanges() {
    if (!currentContainer) return;

    var categories = categorizeButtons(currentContainer);
    var allButtons = []
      .concat(categories.online)
      .concat(categories.torrent)
      .concat(categories.trailer)
      .concat(categories.book)
      .concat(categories.reaction)
      .concat(categories.other);

    allButtons = sortByCustomOrder(allButtons);
    allButtonsCache = allButtons;

    var folders = getFolders();
    var foldersUpdated = false;

    folders.forEach(function (folder) {
      var updatedButtons = [];
      var usedButtons = [];

      folder.buttons.forEach(function (oldBtnId) {
        var found = false;

        for (var i = 0; i < allButtons.length; i++) {
          var btn = allButtons[i];
          var newBtnId = getButtonId(btn);

          if (usedButtons.indexOf(newBtnId) !== -1) continue;

          if (newBtnId === oldBtnId) {
            updatedButtons.push(newBtnId);
            usedButtons.push(newBtnId);
            found = true;
            break;
          }
        }

        if (!found) {
          for (var i = 0; i < allButtons.length; i++) {
            var btn = allButtons[i];
            var newBtnId = getButtonId(btn);

            if (usedButtons.indexOf(newBtnId) !== -1) continue;

            var text = btn.find("span").text().trim();
            var classes = btn.attr("class") || "";

            if (
              (oldBtnId.indexOf("modss") !== -1 ||
                oldBtnId.indexOf("MODS") !== -1) &&
              (classes.indexOf("modss") !== -1 || text.indexOf("MODS") !== -1)
            ) {
              updatedButtons.push(newBtnId);
              usedButtons.push(newBtnId);
              found = true;
              break;
            } else if (
              (oldBtnId.indexOf("showy") !== -1 ||
                oldBtnId.indexOf("Showy") !== -1) &&
              (classes.indexOf("showy") !== -1 || text.indexOf("Showy") !== -1)
            ) {
              updatedButtons.push(newBtnId);
              usedButtons.push(newBtnId);
              found = true;
              break;
            }
          }
        }

        if (!found) {
          updatedButtons.push(oldBtnId);
        }
      });

      if (
        updatedButtons.length !== folder.buttons.length ||
        updatedButtons.some(function (id, i) {
          return id !== folder.buttons[i];
        })
      ) {
        folder.buttons = updatedButtons;
        foldersUpdated = true;
      }
    });

    if (foldersUpdated) {
      setFolders(folders);
    }

    var buttonsInFolders = [];
    folders.forEach(function (folder) {
      buttonsInFolders = buttonsInFolders.concat(folder.buttons);
    });

    var filteredButtons = allButtons.filter(function (btn) {
      return buttonsInFolders.indexOf(getButtonId(btn)) === -1;
    });

    currentButtons = filteredButtons;
    applyHiddenButtons(filteredButtons);

    var targetContainer = currentContainer.find(".full-start-new__buttons");
    if (!targetContainer.length) return;

    targetContainer
      .find(".full-start__button")
      .not(".button--edit-order")
      .detach();

    var itemOrder = getItemOrder();
    var visibleButtons = [];
    var folders = getFolders();
    var buttonsInFolders = [];
    folders.forEach(function (folder) {
      buttonsInFolders = buttonsInFolders.concat(folder.buttons);
    });

    if (itemOrder.length > 0) {
      var addedFolders = [];
      var addedButtons = [];

      itemOrder.forEach(function (item) {
        if (item.type === "folder") {
          var folder = folders.find(function (f) {
            return f.id === item.id;
          });
          if (folder) {
            var folderBtn = createFolderButton(folder);
            targetContainer.append(folderBtn);
            visibleButtons.push(folderBtn);
            addedFolders.push(folder.id);
          }
        } else if (item.type === "button") {
          var btnId = item.id;
          if (buttonsInFolders.indexOf(btnId) === -1) {
            var btn = currentButtons.find(function (b) {
              return getButtonId(b) === btnId;
            });
            if (btn && !btn.hasClass("hidden")) {
              targetContainer.append(btn);
              visibleButtons.push(btn);
              addedButtons.push(btnId);
            }
          }
        }
      });

      currentButtons.forEach(function (btn) {
        var btnId = getButtonId(btn);
        if (
          addedButtons.indexOf(btnId) === -1 &&
          !btn.hasClass("hidden") &&
          buttonsInFolders.indexOf(btnId) === -1
        ) {
          var insertBefore = null;
          var btnType = getButtonType(btn);
          var typeOrder = [
            "online",
            "torrent",
            "trailer",
            "book",
            "reaction",
            "other",
          ];
          var btnTypeIndex = typeOrder.indexOf(btnType);
          if (btnTypeIndex === -1) btnTypeIndex = 999;

          if (
            btnId === "modss_online_button" ||
            btnId === "showy_online_button"
          ) {
            var firstNonPriority = targetContainer
              .find(".full-start__button")
              .not(".button--edit-order, .button--folder")
              .filter(function () {
                var id = getButtonId($(this));
                return (
                  id !== "modss_online_button" && id !== "showy_online_button"
                );
              })
              .first();

            if (firstNonPriority.length) {
              insertBefore = firstNonPriority;
            }

            if (btnId === "showy_online_button") {
              var modsBtn = targetContainer
                .find(".full-start__button")
                .filter(function () {
                  return getButtonId($(this)) === "modss_online_button";
                });
              if (modsBtn.length) {
                insertBefore = modsBtn.next();
                if (
                  !insertBefore.length ||
                  insertBefore.hasClass("button--edit-order")
                ) {
                  insertBefore = null;
                }
              }
            }
          } else {
            targetContainer
              .find(".full-start__button")
              .not(".button--edit-order, .button--folder")
              .each(function () {
                var existingBtn = $(this);
                var existingId = getButtonId(existingBtn);

                if (
                  existingId === "modss_online_button" ||
                  existingId === "showy_online_button"
                ) {
                  return true;
                }

                var existingType = getButtonType(existingBtn);
                var existingTypeIndex = typeOrder.indexOf(existingType);
                if (existingTypeIndex === -1) existingTypeIndex = 999;

                if (btnTypeIndex < existingTypeIndex) {
                  insertBefore = existingBtn;
                  return false;
                }
              });
          }

          if (insertBefore && insertBefore.length) {
            btn.insertBefore(insertBefore);
          } else {
            var editBtn = targetContainer.find(".button--edit-order");
            if (editBtn.length) {
              btn.insertBefore(editBtn);
            } else {
              targetContainer.append(btn);
            }
          }
          visibleButtons.push(btn);
        }
      });

      folders.forEach(function (folder) {
        if (addedFolders.indexOf(folder.id) === -1) {
          var folderBtn = createFolderButton(folder);
          targetContainer.append(folderBtn);
          visibleButtons.push(folderBtn);
        }
      });
    } else {
      folders.forEach(function (folder) {
        var folderBtn = createFolderButton(folder);
        targetContainer.append(folderBtn);
        visibleButtons.push(folderBtn);
      });

      currentButtons.forEach(function (btn) {
        var btnId = getButtonId(btn);
        if (!btn.hasClass("hidden") && buttonsInFolders.indexOf(btnId) === -1) {
          targetContainer.append(btn);
          visibleButtons.push(btn);
        }
      });
    }

    applyRenamedButtons(
      visibleButtons.filter(function (b) {
        return !b.hasClass("button--folder");
      })
    );
    applyButtonAnimation(visibleButtons);

    setTimeout(function () {
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
    var btnId = getButtonId(btn);
    var renamedButtons = getRenamedButtons();

    if (renamedButtons[btnId]) {
      return renamedButtons[btnId];
    }

    var text = btn.find("span").text().trim();
    var classes = btn.attr("class") || "";
    var subtitle = btn.attr("data-subtitle") || "";

    if (!text) {
      var viewClass = classes.split(" ").find(function (c) {
        return c.indexOf("view--") === 0 || c.indexOf("button--") === 0;
      });
      if (viewClass) {
        text = viewClass
          .replace("view--", "")
          .replace("button--", "")
          .replace(/_/g, " ");
        text = capitalize(text);
      } else {
        text = "Кнопка";
      }
      if (btn.hasClass("button--options")) {
        text = "Ще";
      }
      return text;
    }

    var sameTextCount = 0;
    allButtons.forEach(function (otherBtn) {
      if (otherBtn.find("span").text().trim() === text) {
        sameTextCount++;
      }
    });

    if (sameTextCount > 1) {
      if (subtitle) {
        return (
          text +
          ' <span style="opacity:0.5">(' +
          subtitle.substring(0, 30) +
          ")</span>"
        );
      }

      var viewClass = classes.split(" ").find(function (c) {
        return c.indexOf("view--") === 0;
      });
      if (viewClass) {
        var identifier = viewClass.replace("view--", "").replace(/_/g, " ");
        identifier = capitalize(identifier);
        return text + ' <span style="opacity:0.5">(' + identifier + ")</span>";
      }
    }

    return text;
  }

  function createFolderButton(folder) {
    var firstBtnId = folder.buttons[0];
    var firstBtn = findButton(firstBtnId);
    var icon =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>' +
      "</svg>";

    if (firstBtn) {
      var btnIcon = firstBtn.find("svg").first();
      if (btnIcon.length) {
        icon = btnIcon.prop("outerHTML");
      }
    }

    var btn = $(
      '<div class="full-start__button selector button--folder" data-folder-id="' +
        folder.id +
        '">' +
        icon +
        "<span>" +
        folder.name +
        "</span>" +
        "</div>"
    );

    btn.on("hover:enter", function () {
      openFolderMenu(folder);
    });

    return btn;
  }

  function openFolderMenu(folder) {
    var items = [];

    folder.buttons.forEach(function (btnId) {
      var btn = findButton(btnId);
      if (btn) {
        var displayName = getButtonDisplayName(btn, allButtonsOriginal);
        var iconElement = btn.find("svg").first();
        var icon = iconElement.length ? iconElement.prop("outerHTML") : "";
        var subtitle = btn.attr("data-subtitle") || "";

        var item = {
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

        items.push(item);
      }
    });

    Lampa.Select.show({
      title: folder.name,
      items: items,
      onSelect: function (item) {
        item.button.trigger("hover:enter");
      },
      onBack: function () {
        Lampa.Controller.toggle("full_start");
      },
    });
  }

  function openRenameFolderDialog(folder, onsave) {
    Lampa.Input.edit(
      {
        title: "Перейменувати папку",
        value: folder.name,
        free: true,
        nosave: true,
        nomic: true,
      },
      function (newName) {
        if (newName) {
          var folders = getFolders();
          var targetFolder = folders.find(function (f) {
            return f.id === folder.id;
          });
          if (targetFolder) {
            targetFolder.name = newName;
            setFolders(folders);
            Lampa.Noty.show("Папку перейменовано");
            if (onsave) onsave();
          }
        }
      }
    );
  }

  function openFolderEditDialog(folder) {
    var list = $('<div class="menu-edit-list"></div>');

    folder.buttons.forEach(function (btnId) {
      var btn = findButton(btnId);
      if (btn) {
        var displayName = getButtonDisplayName(btn, allButtonsOriginal);
        var iconElement = btn.find("svg").first();
        var icon = iconElement.length ? iconElement.clone() : $("<svg></svg>");

        var item = $(
          '<div class="menu-edit-list__item">' +
            '<div class="menu-edit-list__icon"></div>' +
            '<div class="menu-edit-list__title">' +
            displayName +
            "</div>" +
            '<div class="menu-edit-list__move move-up selector">' +
            '<svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M2 12L11 3L20 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' +
            "</svg>" +
            "</div>" +
            '<div class="menu-edit-list__move move-down selector">' +
            '<svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M2 2L11 11L20 2" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' +
            "</svg>" +
            "</div>" +
            "</div>"
        );

        item.find(".menu-edit-list__icon").append(icon);
        item.data("btnId", btnId);

        item.find(".move-up").on("hover:enter", function () {
          var prev = item.prev();
          if (prev.length) {
            item.insertBefore(prev);
            saveFolderButtonOrder(folder, list);
          }
        });

        item.find(".move-down").on("hover:enter", function () {
          var next = item.next();
          if (next.length) {
            item.insertAfter(next);
            saveFolderButtonOrder(folder, list);
          }
        });

        list.append(item);
      }
    });

    Lampa.Modal.open({
      title: "Порядок кнопок у папці",
      html: list,
      size: "small",
      scroll_to_center: true,
      onBack: function () {
        Lampa.Modal.close();
        openEditDialog();
      },
    });
  }

  function saveFolderButtonOrder(folder, list) {
    var newOrder = [];
    list.find(".menu-edit-list__item").each(function () {
      var btnId = $(this).data("btnId");
      newOrder.push(btnId);
    });

    folder.buttons = newOrder;

    var folders = getFolders();
    for (var i = 0; i < folders.length; i++) {
      if (folders[i].id === folder.id) {
        folders[i].buttons = newOrder;
        break;
      }
    }
    setFolders(folders);

    updateFolderIcon(folder);
  }

  function updateFolderIcon(folder) {
    if (!folder.buttons || folder.buttons.length === 0) return;

    var folderBtn = currentContainer.find(
      '.button--folder[data-folder-id="' + folder.id + '"]'
    );
    if (folderBtn.length) {
      var firstBtnId = folder.buttons[0];
      var firstBtn = findButton(firstBtnId);

      if (firstBtn) {
        var iconElement = firstBtn.find("svg").first();
        if (iconElement.length) {
          var btnIcon = iconElement.clone();
          folderBtn.find("svg").replaceWith(btnIcon);
        }
      } else {
        var defaultIcon =
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>' +
          "</svg>";
        folderBtn.find("svg").replaceWith(defaultIcon);
      }
    }
  }

  function createFolder(name, buttonIds) {
    var folders = getFolders();
    var folder = {
      id: "folder_" + Date.now(),
      name: name,
      buttons: buttonIds,
    };
    folders.push(folder);
    setFolders(folders);
    return folder;
  }

  function deleteFolder(folderId) {
    var folders = getFolders();
    folders = folders.filter(function (f) {
      return f.id !== folderId;
    });
    setFolders(folders);
  }

  function openCreateFolderDialog(onsave) {
    Lampa.Input.edit(
      {
        free: true,
        title: "Назва папки",
        nosave: true,
        value: "",
        nomic: true,
      },
      function (folderName) {
        if (!folderName || !folderName.trim()) {
          Lampa.Noty.show("Введіть назву папки");
          return;
        }
        openSelectButtonsDialog(folderName.trim(), onsave);
      }
    );
  }

  function openSelectButtonsDialog(folderName, onsave) {
    var selectedButtons = [];
    var list = $('<div class="menu-edit-list"></div>');

    var buttonsInFolders = getButtonsInFolders();
    var sortedButtons = sortByCustomOrder(allButtonsOriginal.slice());

    sortedButtons.forEach(function (btn) {
      var btnId = getButtonId(btn);

      if (buttonsInFolders.indexOf(btnId) !== -1) {
        return;
      }

      var displayName = getButtonDisplayName(btn, sortedButtons);
      var iconElement = btn.find("svg").first();
      var icon = iconElement.length ? iconElement.clone() : $("<svg></svg>");

      var item = $(
        '<div class="menu-edit-list__item">' +
          '<div class="menu-edit-list__icon"></div>' +
          '<div class="menu-edit-list__title">' +
          displayName +
          "</div>" +
          '<div class="menu-edit-list__toggle selector">' +
          '<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">' +
          '<rect x="1.89111" y="1.78369" width="21.793" height="21.793" rx="3.5" stroke="currentColor" stroke-width="3"/>' +
          '<path d="M7.44873 12.9658L10.8179 16.3349L18.1269 9.02588" stroke="currentColor" stroke-width="3" class="dot" opacity="0" stroke-linecap="round"/>' +
          "</svg>" +
          "</div>" +
          "</div>"
      );

      item.find(".menu-edit-list__icon").append(icon);

      item.find(".menu-edit-list__toggle").on("hover:enter", function () {
        var index = selectedButtons.indexOf(btnId);
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

    var createBtn = $(
      '<div class="selector folder-create-confirm">' +
        '<div style="text-align: center; padding: 1em;">Створити папку "' +
        folderName +
        '"</div>' +
        "</div>"
    );

    createBtn.on("hover:enter", function () {
      if (selectedButtons.length < 2) {
        Lampa.Noty.show("Виберіть мінімум 2 кнопки");
        return;
      }

      createFolder(folderName, selectedButtons);

      Lampa.Modal.close();
      Lampa.Noty.show('Папку "' + folderName + '" створено');
      if (onsave) onsave();
    });

    list.append(createBtn);

    Lampa.Modal.open({
      title: "Виберіть кнопки для папки",
      html: list,
      size: "medium",
      scroll_to_center: true,
      onBack: function () {
        Lampa.Modal.close();
      },
    });
  }

  function openEditDialog() {
    if (!allButtonsCache.length && !allButtonsOriginal.length) {
      Lampa.Noty.show(
        "Спочатку відкрийте головний екран, щоб завантажити список кнопок."
      );
      return;
    }

    Lampa.Settings.create(
      false,
      {},
      function (data) {
        saveItemOrder();
        applyChanges();

        Lampa.Controller.toggle("settings");
        Lampa.Controller.toggle("settings_component");

        Lampa.Settings.create("interface");
      },
      function () {
        applyChanges();

        Lampa.Controller.toggle("settings");
        Lampa.Controller.toggle("settings_component");

        Lampa.Settings.create("interface");
      },
      function (html) {
        if (currentContainer) {
          var categories = categorizeButtons(currentContainer);
          var allButtons = []
            .concat(categories.online)
            .concat(categories.torrent)
            .concat(categories.trailer)
            .concat(categories.book)
            .concat(categories.reaction)
            .concat(categories.other);

          allButtons = sortByCustomOrder(allButtons);
          allButtonsCache = allButtons;

          var folders = getFolders();
          var buttonsInFolders = getButtonsInFolders();

          var filteredButtons = allButtons.filter(function (btn) {
            return buttonsInFolders.indexOf(getButtonId(btn)) === -1;
          });

          currentButtons = filteredButtons;
        }

        var scroll = new Lampa.Scroll({
          mask: true,
          over: true,
        });
        var body = scroll.render();
        var items = [];

        function updateList() {
          body.empty();
          items.forEach(function (item) {
            body.append(item);
          });
          Lampa.Utils.trigger(body, "update");
        }

        function createSortable() {
          Lampa.Utils.sortable(
            body,
            ".menu-edit-list__item:not(.bottom-controls .menu-edit-list__item)",
            "[data-item-id]",
            {
              onUpdate: function onUpdate(startIndex, newIndex) {
                saveItemOrder();
              },
            }
          );
        }

        function createFolderEditItem(folder, allItems) {
          var item = $(
            '<div class="menu-edit-list__item folder-item selector" data-item-id="' +
              folder.id +
              '">' +
              '<div class="menu-edit-list__icon">' +
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>' +
              "</svg>" +
              "</div>" +
              '<div class="menu-edit-list__title">' +
              folder.name +
              ' <span style="opacity:0.5">(' +
              folder.buttons.length +
              ")</span></div>" +
              '<div class="menu-edit-list__rename selector">' +
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
              "</div>" +
              '<div class="menu-edit-list__delete selector">' +
              '<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">' +
              '<rect x="1.89111" y="1.78369" width="21.793" height="21.793" rx="3.5" stroke="currentColor" stroke-width="3"/>' +
              '<path d="M9.5 9.5L16.5 16.5M16.5 9.5L9.5 16.5" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
              "</svg>" +
              "</div>" +
              "</div>"
          );

          item.data("folderId", folder.id);
          item.data("itemType", "folder");

          item.on("hover:enter", function (e) {
            if (
              !$(e.target).closest(
                ".menu-edit-list__rename, .menu-edit-list__delete"
              ).length
            ) {
              openFolderEditDialog(folder);
            }
          });

          item.find(".menu-edit-list__rename").on("hover:enter", function () {
            openRenameFolderDialog(folder, renderList);
          });

          item.find(".menu-edit-list__delete").on("hover:enter", function () {
            deleteFolder(folder.id);
            renderList();
          });

          return item;
        }

        function createButtonEditItem(btn, hidden, allItems) {
          var displayName = getButtonDisplayName(btn, allButtonsOriginal);
          var icon = btn.find("svg").clone();
          var btnId = getButtonId(btn);
          var isHidden = hidden.indexOf(btnId) !== -1;

          var item = $(
            '<div class="menu-edit-list__item" data-item-id="' +
              btnId +
              '">' +
              '<div class="menu-edit-list__icon"></div>' +
              '<div class="menu-edit-list__title">' +
              displayName +
              "</div>" +
              '<div class="menu-edit-list__rename selector">' +
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
              "</div>" +
              '<div class="menu-edit-list__toggle toggle selector">' +
              '<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">' +
              '<rect x="1.89111" y="1.78369" width="21.793" height="21.793" rx="3.5" stroke="currentColor" stroke-width="3"/>' +
              '<path d="M7.44873 12.9658L10.8179 16.3349L18.1269 9.02588" stroke="currentColor" stroke-width="3" class="dot" opacity="' +
              (isHidden ? "0" : "1") +
              '" stroke-linecap="round"/>' +
              "</svg>" +
              "</div>" +
              "</div>"
          );

          item.find(".menu-edit-list__icon").append(icon);
          item.data("buttonId", btnId);
          item.data("itemType", "button");

          item.find(".menu-edit-list__rename").on("hover:enter", function () {
            var currentName = getButtonDisplayName(
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
              function (newName) {
                if (newName && newName.trim()) {
                  var renamedButtons = getRenamedButtons();
                  renamedButtons[btnId] = newName.trim();
                  setRenamedButtons(renamedButtons);
                  item.find(".menu-edit-list__title").html(newName.trim());
                  btn.find("span").text(newName.trim());
                  Lampa.Noty.show("Кнопку перейменовано");
                }
              }
            );
          });

          item.find(".toggle").on("hover:enter", function () {
            var hidden = getHiddenButtons();
            var index = hidden.indexOf(btnId);

            if (index !== -1) {
              hidden.splice(index, 1);
              item.find(".dot").attr("opacity", "1");
            } else {
              hidden.push(btnId);
              item.find(".dot").attr("opacity", "0");
            }

            setHiddenButtons(hidden);
          });

          return item;
        }

        function renderList() {
          items = [];
          var folders = getFolders();
          var hidden = getHiddenButtons();
          var buttonsInFolders = getButtonsInFolders();
          var itemOrder = getItemOrder();
          var allItems = [];

          allButtonsCache.forEach(function (btn) {
            var btnId = getButtonId(btn);
            if (buttonsInFolders.indexOf(btnId) === -1) {
              allItems.push({
                type: "button",
                id: btnId,
                element: btn,
              });
            }
          });

          folders.forEach(function (folder) {
            allItems.push({
              type: "folder",
              id: folder.id,
              data: folder,
            });
          });

          var sortedItems = [];
          var remainingItems = allItems.slice();

          if (itemOrder.length > 0) {
            itemOrder.forEach(function (orderedItem) {
              var foundIndex = remainingItems.findIndex(function (item) {
                return (
                  item.type === orderedItem.type && item.id === orderedItem.id
                );
              });
              if (foundIndex !== -1) {
                sortedItems.push(remainingItems[foundIndex]);
                remainingItems.splice(foundIndex, 1);
              }
            });
            sortedItems = sortedItems.concat(remainingItems);
          } else {
            sortedItems = allItems;
          }

          sortedItems.forEach(function (item) {
            if (item.type === "button") {
              items.push(createButtonEditItem(item.element, hidden, allItems));
            } else if (item.type === "folder") {
              items.push(createFolderEditItem(item.data, allItems));
            }
          });

          var createFolderItem = $(
            '<div class="menu-edit-list__item menu-edit-list__create-folder selector">' +
              '<div class="menu-edit-list__icon">' +
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>' +
              '<line x1="12" y1="11" x2="12" y2="17"></line>' +
              '<line x1="9" y1="14" x2="15" y2="14"></line>' +
              "</svg>" +
              "</div>" +
              '<div class="menu-edit-list__title">Створити папку</div>' +
              "</div>"
          );

          createFolderItem.on("hover:enter", function () {
            openCreateFolderDialog(renderList);
          });

          var resetBtn = $(
            '<div class="menu-edit-list__item folder-reset-button selector">' +
              '<div class="menu-edit-list__icon">' +
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>' +
              "</div>" +
              '<div class="menu-edit-list__title">Скинути</div>' +
              "</div>"
          );

          resetBtn.on("hover:enter", function () {
            Lampa.Storage.set("button_renamed", {});
            Lampa.Storage.set("button_custom_order", []);
            Lampa.Storage.set("button_hidden", []);
            Lampa.Storage.set("button_folders", []);
            Lampa.Storage.set("button_item_order", []);
            Lampa.Noty.show("Налаштування скинуто");
            renderList();
          });

          var bottomControls = $('<div class="bottom-controls"></div>');
          bottomControls.append(createFolderItem);
          bottomControls.append(resetBtn);

          items.push(bottomControls);
          updateList();
        }

        html.empty();
        html.append(body);
        renderList();
        createSortable();
      }
    );
  }

  function reorderButtons(container) {
    var targetContainer = container.find(".full-start-new__buttons");
    if (!targetContainer.length) return false;

    currentContainer = container;
    container
      .find(".button--play, .button--edit-order, .button--folder")
      .remove();

    var categories = categorizeButtons(container);

    var allButtons = []
      .concat(categories.online)
      .concat(categories.torrent)
      .concat(categories.trailer)
      .concat(categories.book)
      .concat(categories.reaction)
      .concat(categories.other);

    allButtons = sortByCustomOrder(allButtons);
    allButtonsCache = allButtons;

    if (allButtonsOriginal.length === 0) {
      allButtons.forEach(function (btn) {
        allButtonsOriginal.push(btn.clone(true, true));
      });
    }

    var folders = getFolders();
    var buttonsInFolders = [];
    folders.forEach(function (folder) {
      buttonsInFolders = buttonsInFolders.concat(folder.buttons);
    });

    var filteredButtons = allButtons.filter(function (btn) {
      return buttonsInFolders.indexOf(getButtonId(btn)) === -1;
    });

    currentButtons = filteredButtons;
    applyHiddenButtons(filteredButtons);

    targetContainer.children().detach();

    var visibleButtons = [];
    var itemOrder = getItemOrder();

    if (itemOrder.length > 0) {
      var addedFolders = [];
      var addedButtons = [];

      itemOrder.forEach(function (item) {
        if (item.type === "folder") {
          var folder = folders.find(function (f) {
            return f.id === item.id;
          });
          if (folder) {
            var folderBtn = createFolderButton(folder);
            targetContainer.append(folderBtn);
            visibleButtons.push(folderBtn);
            addedFolders.push(folder.id);
          }
        } else if (item.type === "button") {
          var btn = filteredButtons.find(function (b) {
            return getButtonId(b) === item.id;
          });
          if (btn && !btn.hasClass("hidden")) {
            targetContainer.append(btn);
            visibleButtons.push(btn);
            addedButtons.push(getButtonId(btn));
          }
        }
      });

      filteredButtons.forEach(function (btn) {
        var btnId = getButtonId(btn);
        if (addedButtons.indexOf(btnId) === -1 && !btn.hasClass("hidden")) {
          var insertBefore = null;
          var btnType = getButtonType(btn);
          var typeOrder = [
            "online",
            "torrent",
            "trailer",
            "book",
            "reaction",
            "other",
          ];
          var btnTypeIndex = typeOrder.indexOf(btnType);
          if (btnTypeIndex === -1) btnTypeIndex = 999;

          if (
            btnId === "modss_online_button" ||
            btnId === "showy_online_button"
          ) {
            var firstNonPriority = targetContainer
              .find(".full-start__button")
              .not(".button--edit-order, .button--folder")
              .filter(function () {
                var id = getButtonId($(this));
                return (
                  id !== "modss_online_button" && id !== "showy_online_button"
                );
              })
              .first();

            if (firstNonPriority.length) {
              insertBefore = firstNonPriority;
            }

            if (btnId === "showy_online_button") {
              var modsBtn = targetContainer
                .find(".full-start__button")
                .filter(function () {
                  return getButtonId($(this)) === "modss_online_button";
                });
              if (modsBtn.length) {
                insertBefore = modsBtn.next();
                if (
                  !insertBefore.length ||
                  insertBefore.hasClass("button--edit-order")
                ) {
                  insertBefore = null;
                }
              }
            }
          } else {
            targetContainer
              .find(".full-start__button")
              .not(".button--edit-order, .button--folder")
              .each(function () {
                var existingBtn = $(this);
                var existingId = getButtonId(existingBtn);

                if (
                  existingId === "modss_online_button" ||
                  existingId === "showy_online_button"
                ) {
                  return true;
                }

                var existingType = getButtonType(existingBtn);
                var existingTypeIndex = typeOrder.indexOf(existingType);
                if (existingTypeIndex === -1) existingTypeIndex = 999;

                if (btnTypeIndex < existingTypeIndex) {
                  insertBefore = existingBtn;
                  return false;
                }
              });
          }

          if (insertBefore && insertBefore.length) {
            btn.insertBefore(insertBefore);
          } else {
            targetContainer.append(btn);
          }
          visibleButtons.push(btn);
        }
      });

      folders.forEach(function (folder) {
        if (addedFolders.indexOf(folder.id) === -1) {
          var folderBtn = createFolderButton(folder);
          targetContainer.append(folderBtn);
          visibleButtons.push(folderBtn);
        }
      });
    } else {
      folders.forEach(function (folder) {
        var folderBtn = createFolderButton(folder);
        targetContainer.append(folderBtn);
        visibleButtons.push(folderBtn);
      });

      filteredButtons.forEach(function (btn) {
        if (!btn.hasClass("hidden")) {
          targetContainer.append(btn);
          visibleButtons.push(btn);
        }
      });
    }

    applyRenamedButtons(
      visibleButtons.filter(function (b) {
        return !b.hasClass("button--folder");
      })
    );
    applyButtonAnimation(visibleButtons);

    setTimeout(function () {
      setupButtonNavigation(container);
    }, 100);

    return true;
  }

  function setupButtonNavigation(container) {
    if (Lampa.Controller && typeof Lampa.Controller.toggle === "function") {
      try {
        Lampa.Controller.toggle("full_start");
      } catch (e) {}
    }
  }

  function refreshController() {
    if (!Lampa.Controller || typeof Lampa.Controller.toggle !== "function")
      return;

    setTimeout(function () {
      try {
        Lampa.Controller.toggle("full_start");

        if (currentContainer) {
          setTimeout(function () {
            setupButtonNavigation(currentContainer);
          }, 100);
        }
      } catch (e) {}
    }, 50);
  }

  function startPlugin() {
    var style = $(
      "<style>" +
        "@keyframes button-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }" +
        ".full-start__button { opacity: 0; }" +
        ".full-start__button.hidden { display: none !important; }" +
        ".button--folder { cursor: pointer; }" +
        ".full-start-new__buttons { " +
        "display: flex !important; " +
        "flex-direction: row !important; " +
        "flex-wrap: wrap !important; " +
        "gap: 0.5em !important; " +
        "}" +
        ".full-start-new__buttons.buttons-loading .full-start__button { visibility: hidden !important; }" +
        ".menu-edit-list__create-folder { background: rgba(100,200,100,0.2); border: 3px solid transparent; }" +
        ".menu-edit-list__create-folder.focus { background: rgba(100,200,100,0.3); border-color: rgba(255,255,255,0.8); }" +
        ".menu-edit-list__delete { width: 2.4em; height: 2.4em; display: flex; align-items: center; justify-content: center; cursor: pointer; }" +
        ".menu-edit-list__delete svg { width: 1.2em !important; height: 1.2em !important; }" +
        ".menu-edit-list__delete.focus { border: 2px solid rgba(255,255,255,0.8); border-radius: 0.3em; }" +
        ".menu-edit-list__rename { width: 2.4em; height: 2.4em; display: flex; align-items: center; justify-content: center; cursor: pointer; }" +
        ".menu-edit-list__rename svg { width: 1.2em !important; height: 1.2em !important; }" +
        ".menu-edit-list__rename.focus { border: 2px solid rgba(255,255,255,0.8); border-radius: 0.3em; }" +
        ".folder-item .menu-edit-list__move { margin-right: 0; }" +
        ".folder-create-confirm { background: rgba(100,200,100,0.3); margin-top: 1em; border-radius: 0.3em; }" +
        ".folder-create-confirm.focus { border: 3px solid rgba(255,255,255,0.8); }" +
        ".bottom-controls { display: flex; gap: 0.5em; margin-top: 1em; }" +
        ".bottom-controls > .menu-edit-list__item { width: calc(50% - 0.25em); margin-bottom: 0; justify-content: center; }" +
        ".folder-reset-button { background: rgba(200,100,100,0.3); border: 3px solid transparent; }" +
        ".folder-reset-button.focus { background: rgba(200,100,100,0.4); border-color: rgba(255,255,255,0.8); }" +
        ".menu-edit-list__toggle.focus { border: 2px solid rgba(255,255,255,0.8); border-radius: 0.3em; }" +
        "</style>"
    );
    $("body").append(style);

    Lampa.Listener.follow("full", function (e) {
      if (e.type !== "complite") return;

      var container = e.object.activity.render();
      var targetContainer = container.find(".full-start-new__buttons");
      if (targetContainer.length) {
        targetContainer.addClass("buttons-loading");
      }

      setTimeout(function () {
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
          if (targetContainer.length) {
            targetContainer.removeClass("buttons-loading");
          }
        }
      }, 400);
    });

    var editIcon =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';

    Lampa.SettingsApi.addComponent({
      component: "buttons_editor",
      name: "Редактор кнопок",
    });

    Lampa.SettingsApi.addParam({
      component: "interface",
      param: {
        name: "buttons_editor_link",
        type: "button",
      },
      field: {
        name: "Редактор кнопок",
      },
      onChange: function () {
        Lampa.Settings.create("buttons_editor");
      },
      onRender: function (item) {
        var parent = item.closest(".settings-param");
        var name = parent.find(".settings-param__name");
        var icon = $(editIcon);
        icon.css({
          width: "24px",
          height: "24px",
          "margin-right": "15px",
        });
        name.prepend(icon);
        parent.find(".settings-param__value").remove();

        var target = $(
          '.settings-folder[data-component="interface"] .settings-component__content > div'
        );
        if (target.length) target.prepend(parent.parent());
      },
    });

    window.plugin_buttons_ready = true;
    Lampa.Listener.send("plugin_buttons_ready");
  }

  startPlugin();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {};
  }
})();
