(function () {
  "use strict";

  const FancyFace = {
    name: "FancyFace",
    version: "1.0.5",
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
    },
    observer: null,
  };

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

  // --- Ініціалізація ---

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

  function startPlugin() {
    Lampa.Manifest.plugins = {
      name: "FancyFace",
      version: FancyFace.version,
      description: "Покращений інтерфейс для застосунку Lampa",
      author: "@Niaros",
    };

    Lampa.SettingsApi.addComponent({
      component: "season_info",
      name: "Додаткові налаштування інтерфейсу",
      icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 5C4 4.44772 4.44772 4 5 4H19C19.5523 4 20 4.44772 20 5V7C20 7.55228 19.5523 8 19 8H5C4.44772 8 4 7.55228 4 7V5Z" stroke="white" stroke-width="2"/><path d="M4 11C4 10.4477 4.44772 10 5 10H19C19.5523 10 20 10.4477 20 11V13C20 13.5523 19.5523 14 19 14H5C4.44772 14 4 13.5523 4 13V11Z" stroke="white" stroke-width="2"/><path d="M4 17C4 16.4477 4.44772 16 5 16H19C19.5523 16 20 16.4477 20 17V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V17Z" stroke="white" stroke-width="2"/></svg>`,
    });

    const settingsFields = [
      {
        name: "seasons_info_mode",
        type: "select",
        values: {
          none: "Вимкнути",
          aired: "Актуальна інформація",
          total: "Повна кількість",
        },
        default: "aired",
        field: { name: "Інформація про серії" },
      },
      {
        name: "label_position",
        type: "select",
        values: {
          "top-right": "Верхній правий кут",
          "top-left": "Верхній лівий кут",
          "bottom-right": "Нижній правий кут",
          "bottom-left": "Нижній лівий кут",
        },
        default: "top-right",
        field: { name: "Розташування мітки про серії" },
      },
      {
        name: "season_info_show_movie_type",
        type: "trigger",
        default: true,
        field: { name: "Змінити мітки типу" },
      },
      {
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
        field: { name: "Тема інтерфейсу" },
        onChange: applyTheme,
      },
      {
        name: "colored_ratings",
        type: "trigger",
        default: true,
        field: { name: "Кольорові рейтинги" },
      },
      {
        name: "colored_elements",
        type: "trigger",
        default: true,
        field: { name: "Кольорові елементи" },
      },
      {
        name: "show_original_names",
        type: "trigger",
        default: true,
        field: { name: "Показувати оригінальні назви" },
      },
    ];

    settingsFields.forEach((setting) => {
      Lampa.SettingsApi.addParam({
        component: "season_info",
        param: {
          name: setting.name,
          type: setting.type,
          values: setting.values,
          default: setting.default,
        },
        field: setting.field,
        onChange: function (value) {
          FancyFace.settings[setting.name.replace("season_info_", "")] = value;
          Lampa.Settings.update();
          if (setting.onChange) setting.onChange(value);
        },
      });
    });

    Object.keys(FancyFace.settings).forEach((key) => {
      FancyFace.settings[key] = Lampa.Storage.get(key, FancyFace.settings[key]);
    });

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

    Lampa.Settings.listener.follow("open", () => {
      setTimeout(() => {
        const ourSettings = $('.settings-folder[data-component="season_info"]');
        const interfaceSettings = $(
          '.settings-folder[data-component="interface"]'
        );
        if (ourSettings.length && interfaceSettings.length) {
          ourSettings.insertAfter(interfaceSettings);
        }
      }, 100);
    });
  }

  if (window.appready) {
    startPlugin();
  } else {
    Lampa.Listener.follow("app", (event) => {
      if (event.type === "ready") startPlugin();
    });
  }

  window.season_info = FancyFace;
})();
