(function () {
  "use strict";

  var FancyFace = {
    name: "FancyFace",
    version: "1.0.5",
    debug: false,
    // Налаштування за замовчуванням
    settings: {
      enabled: true,
      show_movie_type: true,
      theme: "default",
      colored_ratings: true,
      seasons_info_mode: "aired",
      show_episodes_on_main: false,
      label_position: "top-right", // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
      colored_elements: true, // Об'єднана настройка для статусів і вікових обмежень
      show_original_names: true, // Показ оригінальної назви фільму або серіалу
    },
  };

  // Функція для додавання інформації про сезони та серії на постер
  function addSeasonInfo() {
    // Слухач події завантаження повної інформації про фільм/серіал
    Lampa.Listener.follow("full", function (data) {
      if (data.type === "complite" && data.data.movie.number_of_seasons) {
        // Перевіряємо режим відображення інформації
        if (FancyFace.settings.seasons_info_mode === "none") return;

        // Отримання даних про серіал
        var movie = data.data.movie;
        var status = movie.status;
        var totalSeasons = movie.number_of_seasons || 0;
        var totalEpisodes = movie.number_of_episodes || 0;

        // Виведення детальної інформації про серіал в консоль для налагодження
        console.log(
          "Детальна інформація про серіал:",
          movie.title || movie.name
        );
        console.log("Структура даних серіалу:", JSON.stringify(movie, null, 2));

        // Змінні для зберігання випущених сезонів та серій
        var airedSeasons = 0;
        var airedEpisodes = 0;

        // Отримуємо поточну дату
        var currentDate = new Date();

        // Обчислюємо кількість випущених сезонів та серій
        if (movie.seasons) {
          movie.seasons.forEach(function (season) {
            // Пропускаємо "нульовий" сезон (спеціальні випуски)
            if (season.season_number === 0) return;

            var seasonAired = false;
            var seasonEpisodes = 0;

            // Якщо у сезону є дата виходу і вона в минулому
            if (season.air_date) {
              var airDate = new Date(season.air_date);
              if (airDate <= currentDate) {
                seasonAired = true;
                airedSeasons++;
              }
            }

            // Рахуємо випущені епізоди в сезоні
            if (season.episodes) {
              season.episodes.forEach(function (episode) {
                if (episode.air_date) {
                  var epAirDate = new Date(episode.air_date);
                  if (epAirDate <= currentDate) {
                    seasonEpisodes++;
                    airedEpisodes++;
                  }
                }
              });
            } else if (seasonAired && season.episode_count) {
              // Якщо немає детальної інформації про епізоди, але сезон вийшов
              seasonEpisodes = season.episode_count;
              airedEpisodes += seasonEpisodes;
            }

            console.log(
              "Сезон " +
                season.season_number +
                ": вийшло " +
                seasonEpisodes +
                " з " +
                (season.episode_count || 0) +
                " серій"
            );
          });
        } else if (movie.last_episode_to_air) {
          // Альтернативний спосіб визначення за останнім випущеним епізодом
          airedSeasons = movie.last_episode_to_air.season_number || 0;

          // Перевіряємо, чи є інформація про останній епізод кожного сезону
          if (movie.season_air_dates) {
            airedEpisodes = movie.season_air_dates.reduce(function (
              sum,
              season
            ) {
              return sum + (season.episode_count || 0);
            },
            0);
          } else if (movie.last_episode_to_air.episode_number) {
            // Отримуємо інформацію про останній випущений епізод
            var lastSeason = movie.last_episode_to_air.season_number;
            var lastEpisode = movie.last_episode_to_air.episode_number;

            console.log(
              "Останній випущений: сезон " +
                lastSeason +
                ", епізод " +
                lastEpisode
            );

            // Рахуємо випущені епізоди точніше, якщо є інформація про сезони
            if (movie.seasons) {
              airedEpisodes = 0;
              movie.seasons.forEach(function (season) {
                if (season.season_number === 0) return; // Пропускаємо спецвипуски

                if (season.season_number < lastSeason) {
                  // Усі епізоди попередніх сезонів вважаємо випущеними
                  airedEpisodes += season.episode_count || 0;
                } else if (season.season_number === lastSeason) {
                  // У поточному сезоні рахуємо лише до останнього випущеного
                  airedEpisodes += lastEpisode;
                }
              });
            } else {
              // Припускаємо, що всі попередні сезони повні
              var prevSeasonsEpisodes = 0;
              if (lastSeason > 1) {
                for (var i = 1; i < lastSeason; i++) {
                  // Якщо немає даних, припускаємо 10 епізодів на сезон
                  prevSeasonsEpisodes += 10;
                }
              }
              airedEpisodes = prevSeasonsEpisodes + lastEpisode;
            }
          }
        }

        // Якщо не вдалося визначити випущені серії та сезони, використовуємо загальну кількість
        if (airedSeasons === 0) airedSeasons = totalSeasons;
        if (airedEpisodes === 0) airedEpisodes = totalEpisodes;

        // Перевіряємо інформацію про наступний епізод
        if (movie.next_episode_to_air) {
          console.log("Наступний епізод:", movie.next_episode_to_air);

          // Якщо інформація про наступний епізод є, можна уточнити кількість випущених серій
          var nextSeason = movie.next_episode_to_air.season_number;
          var nextEpisode = movie.next_episode_to_air.episode_number;

          // Якщо відома загальна кількість серій, можна обчислити випущені серії
          // як загальна кількість мінус ті, що залишилися до кінця
          if (totalEpisodes > 0) {
            // Знаходимо кількість серій в сезоні з next_episode
            var episodesInNextSeason = 0;
            var remainingEpisodes = 0;

            if (movie.seasons) {
              movie.seasons.forEach(function (season) {
                if (season.season_number === nextSeason) {
                  episodesInNextSeason = season.episode_count || 0;
                  // Епізоди, що залишилися в поточному сезоні
                  remainingEpisodes =
                    (season.episode_count || 0) - nextEpisode + 1;
                } else if (season.season_number > nextSeason) {
                  // Додаємо всі епізоди майбутніх сезонів
                  remainingEpisodes += season.episode_count || 0;
                }
              });
            }

            // Якщо ми змогли визначити кількість епізодів, що залишилися
            if (remainingEpisodes > 0) {
              var calculatedAired = totalEpisodes - remainingEpisodes;
              console.log(
                "Обчислені випущені серії (за next_episode):",
                calculatedAired
              );

              // Використовуємо це значення, якщо воно здається розумним
              if (calculatedAired >= 0 && calculatedAired <= totalEpisodes) {
                airedEpisodes = calculatedAired;
              }
            }
          }
        }

        // Забезпечуємо, що airedEpisodes не перевищує totalEpisodes, якщо відомо totalEpisodes
        if (totalEpisodes > 0 && airedEpisodes > totalEpisodes) {
          airedEpisodes = totalEpisodes;
        }

        // Функція для правильного відмінювання слів
        function plural(number, one, two, five) {
          let n = Math.abs(number);
          n %= 100;
          if (n >= 5 && n <= 20) {
            return five;
          }
          n %= 10;
          if (n === 1) {
            return one;
          }
          if (n >= 2 && n <= 4) {
            return two;
          }
          return five;
        }

        // Функція для перекладу статусу серіалу українською
        function getStatusText(status) {
          if (status === "Ended") return "Завершено";
          if (status === "Canceled") return "Скасовано";
          if (status === "Returning Series") return "Виходить";
          if (status === "In Production") return "У виробництві";
          if (status === "Planned") return "Заплановано";
          if (status === "Pilot") return "Пілотний";
          if (status === "Released") return "Випущено";
          if (status === "Rumored") return "За чутками";
          if (status === "Post Production") return "Пост-продакшн";
          return status || "Невідомо";
        }

        // Вибираємо, яку інформацію відображати залежно від налаштування
        var displaySeasons, displayEpisodes, seasonsText, episodesText;
        var isCompleted = status === "Ended" || status === "Canceled";
        var bgColor = isCompleted
          ? "rgba(33, 150, 243, 0.8)"
          : "rgba(244, 67, 54, 0.8)";

        if (FancyFace.settings.seasons_info_mode === "aired") {
          // Відображаємо інформацію про випущені серії
          displaySeasons = airedSeasons;
          displayEpisodes = airedEpisodes;
          seasonsText = plural(displaySeasons, "сезон", "сезони", "сезонів");
          episodesText = plural(displayEpisodes, "серія", "серії", "серій");
        } else if (FancyFace.settings.seasons_info_mode === "total") {
          // Відображаємо повну кількість серій та сезонів
          displaySeasons = totalSeasons;
          displayEpisodes = totalEpisodes;
          seasonsText = plural(displaySeasons, "сезон", "сезони", "сезонів");
          episodesText = plural(displayEpisodes, "серія", "серії", "серій");
        } else {
          return; // Режим "Вимкнути" - не відображаємо інформацію
        }

        // Створюємо елемент з інформацією про сезони та серії
        var infoElement = $('<div class="season-info-label"></div>');

        // Формуємо рядки з інформацією залежно від статусу серіалу
        if (isCompleted) {
          // Завершений серіал: "3 сезони 12 серій" та "Завершено"
          var seasonEpisodeText =
            displaySeasons +
            " " +
            seasonsText +
            " " +
            displayEpisodes +
            " " +
            episodesText;
          var statusText = getStatusText(status);

          var line1 = $("<div></div>").text(seasonEpisodeText);
          var line2 = $("<div></div>").text(statusText);

          infoElement.append(line1).append(line2);
        } else {
          // Незавершений серіал: "3 сезони 8 серій з 12"
          var text = "";
          if (FancyFace.settings.seasons_info_mode === "aired") {
            // У режимі "Актуальна інформація" показуємо "з" лише якщо є загальна кількість і вона більша за випущені
            if (totalEpisodes > 0 && airedEpisodes < totalEpisodes) {
              // Перевіряємо, що у нас дійсно є актуальні дані про випущені серії
              if (airedEpisodes > 0) {
                text =
                  displaySeasons +
                  " " +
                  seasonsText +
                  " " +
                  airedEpisodes +
                  " " +
                  episodesText +
                  " з " +
                  totalEpisodes;
              } else {
                // Якщо даних про випущені серії немає, просто показуємо загальну кількість
                text =
                  displaySeasons +
                  " " +
                  seasonsText +
                  " " +
                  totalEpisodes +
                  " " +
                  episodesText;
              }
            } else {
              // Якщо вийшли всі серії або немає даних про загальну кількість
              text =
                displaySeasons +
                " " +
                seasonsText +
                " " +
                airedEpisodes +
                " " +
                episodesText;
            }
          } else {
            // У режимі "Повна кількість" просто показуємо загальну кількість
            text =
              displaySeasons +
              " " +
              seasonsText +
              " " +
              displayEpisodes +
              " " +
              episodesText;
          }

          // Додаткова інформація для налагодження
          console.log(
            "Режим відображення:",
            FancyFace.settings.seasons_info_mode
          );
          console.log("Випущені серії:", airedEpisodes);
          console.log("Усього серій:", totalEpisodes);
          console.log("Текст для відображення:", text);

          infoElement.append($("<div></div>").text(text));
        }

        // Визначаємо CSS стилі залежно від обраної позиції
        var positionStyles = {
          "top-right": {
            position: "absolute",
            top: "1.4em",
            right: "-0.8em",
            left: "auto",
            bottom: "auto",
          },
          "top-left": {
            position: "absolute",
            top: "1.4em",
            left: "-0.8em",
            right: "auto",
            bottom: "auto",
          },
          "bottom-right": {
            position: "absolute",
            bottom: "1.4em",
            right: "-0.8em",
            top: "auto",
            left: "auto",
          },
          "bottom-left": {
            position: "absolute",
            bottom: "1.4em",
            left: "-0.8em",
            top: "auto",
            right: "auto",
          },
        };

        // Беремо позицію з налаштувань або використовуємо за замовчуванням
        var position = FancyFace.settings.label_position || "top-right";
        var positionStyle =
          positionStyles[position] || positionStyles["top-right"];

        // Загальні стилі для мітки
        var commonStyles = {
          "background-color": bgColor,
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

        // Об'єднуємо стилі позиціонування та загальні стилі
        var allStyles = $.extend({}, commonStyles, positionStyle);

        // Застосовуємо стилі до елемента
        infoElement.css(allStyles);

        // Додаємо елемент на постер та інформацію в консоль для налагодження
        setTimeout(function () {
          console.log("Інформація про серіал:", {
            title: movie.title || movie.name,
            status: status,
            totalSeasons: totalSeasons,
            totalEpisodes: totalEpisodes,
            airedSeasons: airedSeasons,
            airedEpisodes: airedEpisodes,
            displayMode: FancyFace.settings.seasons_info_mode,
          });

          var poster = $(data.object.activity.render()).find(
            ".full-start-new__poster"
          );
          if (poster.length) {
            poster.css("position", "relative");
            poster.append(infoElement);
          }
        }, 100);
      }
    });
  }
  // Функція для зміни міток ТВ та додавання мітки ФІЛЬМ
  function changeMovieTypeLabels() {
    // Додаємо CSS стилі для зміни міток
    var styleTag = $('<style id="movie_type_styles"></style>').html(`
            /* Базовий стиль для всіх міток */
            .content-label {
                position: absolute !important;
                top: 1.4em !important;
                left: -0.8em !important;
                color: white !important;
                padding: 0.4em 0.4em !important;
                border-radius: 0.3em !important;
                font-size: 0.8em !important;
                z-index: 10 !important;
            }
            
            /* Серіал - синій */
            .serial-label {
                background-color: #3498db !important;
            }
            
            /* Фільм - зелений */
            .movie-label {
                background-color: #2ecc71 !important;
            }
            
            /* Приховуємо вбудовану мітку TV лише при увімкненій функції */
            body[data-movie-labels="on"] .card--tv .card__type {
                display: none !important;
            }
        `);
    $("head").append(styleTag);

    // Встановлюємо атрибут для body, щоб CSS міг визначити, чи увімкнена функція
    if (FancyFace.settings.show_movie_type) {
      $("body").attr("data-movie-labels", "on");
    } else {
      $("body").attr("data-movie-labels", "off");
    }

    // Функція для додавання мітки до картки
    function addLabelToCard(card) {
      if (!FancyFace.settings.show_movie_type) return;

      // Якщо вже є наша мітка, пропускаємо
      if ($(card).find(".content-label").length) return;

      var view = $(card).find(".card__view");
      if (!view.length) return;

      // Розширене визначення типу контенту на основі метаданих
      var is_tv = false;
      var metadata = {};
      var movie_data = null;

      // Спробуємо отримати всі можливі метадані
      try {
        // 1. Перевіряємо вбудовані дані картки
        var cardData = $(card).attr("data-card");
        if (cardData) {
          try {
            metadata = JSON.parse(cardData);
            console.log("Метадані з data-card:", metadata);
          } catch (e) {
            console.error("Помилка парсингу data-card:", e);
          }
        }

        // 2. Перевіряємо прив'язані дані jQuery
        var jqData = $(card).data();
        if (jqData && Object.keys(jqData).length > 0) {
          metadata = { ...metadata, ...jqData };
          console.log("Метадані з jQuery data():", jqData);
        }

        // 3. Перевірка доступу до даних через API Lampa
        if (Lampa.Card && $(card).attr("id")) {
          var cardId = $(card).attr("id");
          var cardObj = Lampa.Card.get(cardId);
          if (cardObj) {
            metadata = { ...metadata, ...cardObj };
            console.log("Метадані з Lampa.Card:", cardObj);
          }
        }

        // 4. Намагаємося отримати дані з Lampa.Storage.cache
        if (Lampa.Storage && Lampa.Storage.cache) {
          var itemId =
            $(card).data("id") ||
            $(card).attr("data-id") ||
            (metadata ? metadata.id : null);
          if (itemId && Lampa.Storage.cache("card_" + itemId)) {
            var cachedData = Lampa.Storage.cache("card_" + itemId);
            if (cachedData) {
              metadata = { ...metadata, ...cachedData };
              console.log("Метадані з Lampa.Storage.cache:", cachedData);
            }
          }
        }

        // Компіляція всіх метаданих
        movie_data = metadata;

        // Налагодження зібраних метаданих
        if (FancyFace.debug) {
          console.log("Зібрані метадані для картки:", movie_data);
        }
      } catch (e) {
        console.error("Помилка при отриманні метаданих:", e);
      }

      // Логіка визначення типу контенту за метаданими
      if (movie_data) {
        // Пріоритет 1: Пряме зазначення типу
        if (
          movie_data.type === "tv" ||
          movie_data.type === "serial" ||
          movie_data.card_type === "tv" ||
          movie_data.card_type === "serial"
        ) {
          is_tv = true;
        }
        // Пріоритет 2: Наявність інформації про сезони
        else if (
          movie_data.seasons ||
          movie_data.number_of_seasons > 0 ||
          movie_data.season_count > 0 ||
          movie_data.seasons_count > 0
        ) {
          is_tv = true;
        }
        // Пріоритет 3: Наявність списку епізодів
        else if (
          movie_data.episodes ||
          movie_data.number_of_episodes > 0 ||
          movie_data.episodes_count > 0
        ) {
          is_tv = true;
        }
        // Пріоритет 4: Наявність позначки про серіал
        else if (
          movie_data.isSeries === true ||
          movie_data.is_series === true ||
          movie_data.isSerial === true ||
          movie_data.is_serial === true
        ) {
          is_tv = true;
        }
      }

      // Якщо за допомогою метаданих не визначили, використовуємо класи та структуру DOM
      if (!is_tv) {
        // Перевірка за класом картки
        if ($(card).hasClass("card--tv")) {
          is_tv = true;
        } else if (
          $(card).data("card_type") === "tv" ||
          $(card).data("type") === "tv"
        ) {
          is_tv = true;
        } else {
          // Перевірка за елементами всередині картки
          var hasSeasonInfo = $(card)
            .find(".card__type, .card__temp")
            .text()
            .match(/(сезон|серія|серії|эпізод|ТВ|TV)/i);
          if (hasSeasonInfo) {
            is_tv = true;
          }
        }
      }

      // Створюємо та додаємо мітку
      var label = $('<div class="content-label"></div>');

      // Визначаємо тип контенту
      if (is_tv) {
        // Для серіалів
        label.addClass("serial-label");
        label.text("Серіал");
        label.data("type", "serial");
      } else {
        // Для фільмів
        label.addClass("movie-label");
        label.text("Фільм");
        label.data("type", "movie");
      }

      // Додаємо мітку
      view.append(label);

      // Налагодження
      if (FancyFace.debug) {
        console.log("Додано мітку: " + (is_tv ? "Серіал" : "Фільм"), card);
      }
    }

    // Оновлення мітки при зміні даних картки
    function updateCardLabel(card) {
      if (!FancyFace.settings.show_movie_type) return;

      // Видаляємо стару мітку, якщо вона існує
      $(card).find(".content-label").remove();

      // Додаємо нову мітку з оновленими даними
      addLabelToCard(card);
    }

    // Обробка всіх карток
    function processAllCards() {
      if (!FancyFace.settings.show_movie_type) return;

      // Знаходимо всі картки на сторінці
      $(".card").each(function () {
        addLabelToCard(this);
      });
    }

    // Додатковий слухач для карток у детальному поданні
    Lampa.Listener.follow("full", function (data) {
      if (data.type === "complite" && data.data.movie) {
        // Додаткова логіка для визначення типу контенту в повному поданні
        var movie = data.data.movie;
        var posterContainer = $(data.object.activity.render()).find(
          ".full-start__poster"
        );

        if (posterContainer.length && movie) {
          var is_tv = false;

          // Визначаємо тип контенту за даними
          if (
            movie.number_of_seasons > 0 ||
            movie.seasons ||
            movie.season_count > 0
          ) {
            is_tv = true;
          } else if (movie.type === "tv" || movie.card_type === "tv") {
            is_tv = true;
          }

          // Перевіряємо, чи потрібно додати мітку в повне подання
          if (FancyFace.settings.show_movie_type) {
            var existingLabel = posterContainer.find(".content-label");
            if (existingLabel.length) {
              existingLabel.remove();
            }

            var label = $('<div class="content-label"></div>').css({
              position: "absolute",
              top: "1.4em",
              left: "-0.8em",
              color: "white",
              padding: "0.4em 0.4em",
              "border-radius": "0.3em",
              "font-size": "0.8em",
              "z-index": "10",
            });

            if (is_tv) {
              label.addClass("serial-label");
              label.text("Серіал");
              label.css("background-color", "#3498db");
            } else {
              label.addClass("movie-label");
              label.text("Фільм");
              label.css("background-color", "#2ecc71");
            }

            posterContainer.css("position", "relative");
            posterContainer.append(label);
          }
        }
      }
    });

    // Використовуємо MutationObserver для відстежування нових карток та змін в них
    var observer = new MutationObserver(function (mutations) {
      var needCheck = false;
      var cardsToUpdate = new Set();

      mutations.forEach(function (mutation) {
        // Перевіряємо додані вузли
        if (mutation.addedNodes && mutation.addedNodes.length) {
          for (var i = 0; i < mutation.addedNodes.length; i++) {
            var node = mutation.addedNodes[i];
            // Якщо додано елемент картки або елемент, що містить картки
            if ($(node).hasClass("card")) {
              cardsToUpdate.add(node);
              needCheck = true;
            } else if ($(node).find(".card").length) {
              $(node)
                .find(".card")
                .each(function () {
                  cardsToUpdate.add(this);
                });
              needCheck = true;
            }
          }
        }

        // Перевіряємо зміну атрибутів існуючих карток
        if (
          mutation.type === "attributes" &&
          (mutation.attributeName === "class" ||
            mutation.attributeName === "data-card" ||
            mutation.attributeName === "data-type")
        ) {
          var targetNode = mutation.target;
          if ($(targetNode).hasClass("card")) {
            cardsToUpdate.add(targetNode);
            needCheck = true;
          }
        }
      });

      if (needCheck) {
        setTimeout(function () {
          // Оновлюємо тільки змінені картки
          cardsToUpdate.forEach(function (card) {
            updateCardLabel(card);
          });
        }, 100);
      }
    });

    // Запускаємо спостерігач з розширеними параметрами
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "data-card", "data-type"],
    });

    // Запускаємо первинну перевірку
    processAllCards();

    // Періодична перевірка для карток, які могли бути пропущені
    setInterval(processAllCards, 2000);

    // Слідкуємо за зміною налаштування
    Lampa.Settings.listener.follow("change", function (e) {
      if (e.name === "season_info_show_movie_type") {
        if (e.value) {
          // Якщо увімкнено, додаємо стилі та мітки
          if (!$('style[data-id="movie-type-styles"]').length) {
            styleTag.attr("data-id", "movie-type-styles");
            $("head").append(styleTag);
          }
          $("body").attr("data-movie-labels", "on");
          processAllCards();
        } else {
          // Якщо вимкнено, видаляємо стилі та мітки
          $("body").attr("data-movie-labels", "off");
          $(".content-label").remove();
        }
      }
    });
  }

  // Функція для застосування тем
  function applyTheme(theme) {
    // Видаляємо попередні стилі теми
    $("#fancyface_mod_theme").remove();

    // Якщо обрано "Немає", просто видаляємо стилі
    if (theme === "default") return;

    // Створюємо новий стиль
    const style = $('<style id="fancyface_mod_theme"></style>');

    // Визначаємо стилі для різних тем
    const themes = {
      neon: `
                body {
                    background: linear-gradient(135deg, #0d0221 0%, #150734 50%, #1f0c47 100%);
                    color: #ffffff;
                }
                .menu__item.focus,
                .menu__item.traverse,
                .menu__item.hover,
                .settings-folder.focus,
                .settings-param.focus,
                .selectbox-item.focus,
                .full-start__button.focus,
                .full-descr__tag.focus,
                .player-panel .button.focus {
                    background: linear-gradient(to right, #ff00ff, #00ffff);
                    color: #fff;
                    box-shadow: 0 0 20px rgba(255, 0, 255, 0.4);
                    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
                    border: none;
                }
                .card.focus .card__view::after,
                .card.hover .card__view::after {
                    border: 2px solid #ff00ff;
                    box-shadow: 0 0 20px #00ffff;
                }
                .head__action.focus,
                .head__action.hover {
                    background: linear-gradient(45deg, #ff00ff, #00ffff);
                    box-shadow: 0 0 15px rgba(255, 0, 255, 0.3);
                }
                .full-start__background {
                    opacity: 0.7;
                    filter: brightness(1.2) saturate(1.3);
                }
                .settings__content,
                .settings-input__content,
                .selectbox__content,
                .modal__content {
                    background: rgba(15, 2, 33, 0.95);
                    border: 1px solid rgba(255, 0, 255, 0.1);
                }
            `,
      dark_night: `
                body {
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%);
                    color: #ffffff;
                }
                .menu__item.focus,
                .menu__item.traverse,
                .menu__item.hover,
                .settings-folder.focus,
                .settings-param.focus,
                .selectbox-item.focus,
                .full-start__button.focus,
                .full-descr__tag.focus,
                .player-panel .button.focus {
                    background: linear-gradient(to right, #8a2387, #e94057, #f27121);
                    color: #fff;
                    box-shadow: 0 0 30px rgba(233, 64, 87, 0.3);
                    animation: night-pulse 2s infinite;
                }
                @keyframes night-pulse {
                    0% { box-shadow: 0 0 20px rgba(233, 64, 87, 0.3); }
                    50% { box-shadow: 0 0 30px rgba(242, 113, 33, 0.3); }
                    100% { box-shadow: 0 0 20px rgba(138, 35, 135, 0.3); }
                }
                .card.focus .card__view::after,
                .card.hover .card__view::after {
                    border: 2px solid #e94057;
                    box-shadow: 0 0 30px rgba(242, 113, 33, 0.5);
                }
                .head__action.focus,
                .head__action.hover {
                    background: linear-gradient(45deg, #8a2387, #f27121);
                    animation: night-pulse 2s infinite;
                }
                .full-start__background {
                    opacity: 0.8;
                    filter: saturate(1.3) contrast(1.1);
                }
                .settings__content,
                .settings-input__content,
                .selectbox__content,
                .modal__content {
                    background: rgba(10, 10, 10, 0.95);
                    border: 1px solid rgba(233, 64, 87, 0.1);
                    box-shadow: 0 0 30px rgba(242, 113, 33, 0.1);
                }
            `,
      blue_cosmos: `
                body {
                    background: linear-gradient(135deg, #0b365c 0%, #144d80 50%, #0c2a4d 100%);
                    color: #ffffff;
                }
                .menu__item.focus,
                .menu__item.traverse,
                .menu__item.hover,
                .settings-folder.focus,
                .settings-param.focus,
                .selectbox-item.focus,
                .full-start__button.focus,
                .full-descr__tag.focus,
                .player-panel .button.focus {
                    background: linear-gradient(to right, #12c2e9, #c471ed, #f64f59);
                    color: #fff;
                    box-shadow: 0 0 30px rgba(18, 194, 233, 0.3);
                    animation: cosmos-pulse 2s infinite;
                }
                @keyframes cosmos-pulse {
                    0% { box-shadow: 0 0 20px rgba(18, 194, 233, 0.3); }
                    50% { box-shadow: 0 0 30px rgba(196, 113, 237, 0.3); }
                    100% { box-shadow: 0 0 20px rgba(246, 79, 89, 0.3); }
                }
                .card.focus .card__view::after,
                .card.hover .card__view::after {
                    border: 2px solid #12c2e9;
                    box-shadow: 0 0 30px rgba(196, 113, 237, 0.5);
                }
                .head__action.focus,
                .head__action.hover {
                    background: linear-gradient(45deg, #12c2e9, #f64f59);
                    animation: cosmos-pulse 2s infinite;
                }
                .full-start__background {
                    opacity: 0.8;
                    filter: saturate(1.3) contrast(1.1);
                }
                .settings__content,
                .settings-input__content,
                .selectbox__content,
                .modal__content {
                    background: rgba(11, 54, 92, 0.95);
                    border: 1px solid rgba(18, 194, 233, 0.1);
                    box-shadow: 0 0 30px rgba(196, 113, 237, 0.1);
                }
            `,
      sunset: `
                body {
                    background: linear-gradient(135deg, #2d1f3d 0%, #614385 50%, #516395 100%);
                    color: #ffffff;
                }
                .menu__item.focus,
                .menu__item.traverse,
                .menu__item.hover,
                .settings-folder.focus,
                .settings-param.focus,
                .selectbox-item.focus,
                .full-start__button.focus,
                .full-descr__tag.focus,
                .player-panel .button.focus {
                    background: linear-gradient(to right, #ff6e7f, #bfe9ff);
                    color: #2d1f3d;
                    box-shadow: 0 0 15px rgba(255, 110, 127, 0.3);
                    font-weight: bold;
                }
                .card.focus .card__view::after,
                .card.hover .card__view::after {
                    border: 2px solid #ff6e7f;
                    box-shadow: 0 0 15px rgba(255, 110, 127, 0.5);
                }
                .head__action.focus,
                .head__action.hover {
                    background: linear-gradient(45deg, #ff6e7f, #bfe9ff);
                    color: #2d1f3d;
                }
                .full-start__background {
                    opacity: 0.8;
                    filter: saturate(1.2) contrast(1.1);
                }
            `,
      emerald: `
                body {
                    background: linear-gradient(135deg, #1a2a3a 0%, #2C5364 50%, #203A43 100%);
                    color: #ffffff;
                }
                .menu__item.focus,
                .menu__item.traverse,
                .menu__item.hover,
                .settings-folder.focus,
                .settings-param.focus,
                .selectbox-item.focus,
                .full-start__button.focus,
                .full-descr__tag.focus,
                .player-panel .button.focus {
                    background: linear-gradient(to right, #43cea2, #185a9d);
                    color: #fff;
                    box-shadow: 0 4px 15px rgba(67, 206, 162, 0.3);
                    border-radius: 5px;
                }
                .card.focus .card__view::after,
                .card.hover .card__view::after {
                    border: 3px solid #43cea2;
                    box-shadow: 0 0 20px rgba(67, 206, 162, 0.4);
                }
                .head__action.focus,
                .head__action.hover {
                    background: linear-gradient(45deg, #43cea2, #185a9d);
                }
                .full-start__background {
                    opacity: 0.85;
                    filter: brightness(1.1) saturate(1.2);
                }
                .settings__content,
                .settings-input__content,
                .selectbox__content,
                .modal__content {
                    background: rgba(26, 42, 58, 0.98);
                    border: 1px solid rgba(67, 206, 162, 0.1);
                }
            `,
      aurora: `
                body {
                    background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
                    color: #ffffff;
                }
                .menu__item.focus,
                .menu__item.traverse,
                .menu__item.hover,
                .settings-folder.focus,
                .settings-param.focus,
                .selectbox-item.focus,
                .full-start__button.focus,
                .full-descr__tag.focus,
                .player-panel .button.focus {
                    background: linear-gradient(to right, #aa4b6b, #6b6b83, #3b8d99);
                    color: #fff;
                    box-shadow: 0 0 20px rgba(170, 75, 107, 0.3);
                    transform: scale(1.02);
                    transition: all 0.3s ease;
                }
                .card.focus .card__view::after,
                .card.hover .card__view::after {
                    border: 2px solid #aa4b6b;
                    box-shadow: 0 0 25px rgba(170, 75, 107, 0.5);
                }
                .head__action.focus,
                .head__action.hover {
                    background: linear-gradient(45deg, #aa4b6b, #3b8d99);
                    transform: scale(1.05);
                }
                .full-start__background {
                    opacity: 0.75;
                    filter: contrast(1.1) brightness(1.1);
                }
            `,
      bywolf_mod: `
                body {
                    background: linear-gradient(135deg, #090227 0%, #170b34 50%, #261447 100%);
                    color: #ffffff;
                }
                .menu__item.focus,
                .menu__item.traverse,
                .menu__item.hover,
                .settings-folder.focus,
                .settings-param.focus,
                .selectbox-item.focus,
                .full-start__button.focus,
                .full-descr__tag.focus,
                .player-panel .button.focus {
                    background: linear-gradient(to right, #fc00ff, #00dbde);
                    color: #fff;
                    box-shadow: 0 0 30px rgba(252, 0, 255, 0.3);
                    animation: cosmic-pulse 2s infinite;
                }
                @keyframes cosmic-pulse {
                    0% { box-shadow: 0 0 20px rgba(252, 0, 255, 0.3); }
                    50% { box-shadow: 0 0 30px rgba(0, 219, 222, 0.3); }
                    100% { box-shadow: 0 0 20px rgba(252, 0, 255, 0.3); }
                }
                .card.focus .card__view::after,
                .card.hover .card__view::after {
                    border: 2px solid #fc00ff;
                    box-shadow: 0 0 30px rgba(0, 219, 222, 0.5);
                }
                .head__action.focus,
                .head__action.hover {
                    background: linear-gradient(45deg, #fc00ff, #00dbde);
                    animation: cosmic-pulse 2s infinite;
                }
                .full-start__background {
                    opacity: 0.8;
                    filter: saturate(1.3) contrast(1.1);
                }
                .settings__content,
                .settings-input__content,
                .selectbox__content,
                .modal__content {
                    background: rgba(9, 2, 39, 0.95);
                    border: 1px solid rgba(252, 0, 255, 0.1);
                    box-shadow: 0 0 30px rgba(0, 219, 222, 0.1);
                }
            `,
    };

    // Встановлюємо стилі для вибраної теми
    style.html(themes[theme] || "");

    // Додаємо стиль в head
    $("head").append(style);
  }

  // Функція для зміни кольору рейтингу фільмів та серіалів
  function updateVoteColors() {
    if (!FancyFace.settings.colored_ratings) return;

    // Функція для зміни кольору елемента залежно від рейтингу
    function applyColorByRating(element) {
      const voteText = $(element).text().trim();
      // Регулярний вираз для витягування числа з тексту
      const match = voteText.match(/(\d+(\.\d+)?)/);
      if (!match) return;

      const vote = parseFloat(match[0]);

      if (vote >= 0 && vote <= 3) {
        $(element).css("color", "red");
      } else if (vote > 3 && vote < 6) {
        $(element).css("color", "orange");
      } else if (vote >= 6 && vote < 8) {
        $(element).css("color", "cornflowerblue");
      } else if (vote >= 8 && vote <= 10) {
        $(element).css("color", "lawngreen");
      }
    }

    // Обробляємо рейтинги на головній сторінці та в списках
    $(".card__vote").each(function () {
      applyColorByRating(this);
    });

    // Обробляємо рейтинги в детальній картці фільму/серіалу
    $(".full-start__rate, .full-start-new__rate").each(function () {
      applyColorByRating(this);
    });

    // Також обробляємо інші можливі елементи з рейтингом
    $(".info__rate, .card__imdb-rate, .card__kinopoisk-rate").each(function () {
      applyColorByRating(this);
    });
  }

  // Спостерігач за змінами в DOM для оновлення кольорів рейтингу
  function setupVoteColorsObserver() {
    if (!FancyFace.settings.colored_ratings) return;

    // Запускаємо первинне оновлення
    setTimeout(updateVoteColors, 500);

    // Створюємо спостерігач для відстежування змін в DOM
    const observer = new MutationObserver(function (mutations) {
      setTimeout(updateVoteColors, 100);
    });

    // Запускаємо спостерігач
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Додаємо слухача для оновлення кольорів у детальній картці
  function setupVoteColorsForDetailPage() {
    if (!FancyFace.settings.colored_ratings) return;

    // Слухач події завантаження повної інформації про фільм/серіал
    Lampa.Listener.follow("full", function (data) {
      if (data.type === "complite") {
        // Оновлюємо кольори рейтингів після завантаження інформації
        setTimeout(updateVoteColors, 100);
      }
    });
  }

  // Функція для зміни кольору статусів серіалів
  function colorizeSeriesStatus() {
    if (!FancyFace.settings.colored_elements) return;

    // Функція для застосування кольору до статусу
    function applyStatusColor(statusElement) {
      var statusText = $(statusElement).text().trim();

      var statusColors = {
        completed: {
          bg: "rgba(46, 204, 113, 0.8)",
          text: "white",
        },
        canceled: {
          bg: "rgba(231, 76, 60, 0.8)",
          text: "white",
        },
        ongoing: {
          bg: "rgba(243, 156, 18, 0.8)",
          text: "black",
        },
        production: {
          bg: "rgba(52, 152, 219, 0.8)",
          text: "white",
        },
        planned: {
          bg: "rgba(155, 89, 182, 0.8)",
          text: "white",
        },
        pilot: {
          bg: "rgba(230, 126, 34, 0.8)",
          text: "white",
        },
        released: {
          bg: "rgba(26, 188, 156, 0.8)",
          text: "white",
        },
        rumored: {
          bg: "rgba(149, 165, 166, 0.8)",
          text: "white",
        },
        post: {
          bg: "rgba(0, 188, 212, 0.8)",
          text: "white",
        },
      };

      var STATUS_MAP = {
        completed: ["Завершено", "Ended"],
        canceled: ["Скасовано", "Canceled"],
        ongoing: ["Виходить", "Returning Series"],
        production: ["У виробництві", "In Production"],
        planned: ["Заплановано", "Planned"],
        pilot: ["Пілотний", "Pilot"],
        released: ["Випущено", "Released"],
        rumored: ["За чутками", "Rumored"],
        post: ["Пост-продакшн", "Post Production"],
      };

      var bgColor = "";
      var textColor = "";

      for (var key in STATUS_MAP) {
        if (STATUS_MAP[key].includes(statusText)) {
          bgColor = statusColors[key].bg;
          textColor = statusColors[key].text;
          break;
        }
      }

      if (bgColor) {
        $(statusElement).css({
          "background-color": bgColor,
          color: textColor,
          "border-radius": "0.3em",
          border: "0px",
          "font-size": "1.3em",
          display: "inline-block",
        });
      }

      if (FancyFace.debug) {
        console.log("Статус серіала:", statusText, bgColor, textColor);
      }
    }

    // Обробка статусів на існуючих елементах
    $(".full-start__status").each(function () {
      applyStatusColor(this);
    });

    // Використовуємо MutationObserver для відстежування нових елементів
    var statusObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.addedNodes && mutation.addedNodes.length) {
          for (var i = 0; i < mutation.addedNodes.length; i++) {
            var node = mutation.addedNodes[i];
            $(node)
              .find(".full-start__status")
              .each(function () {
                applyStatusColor(this);
              });

            if ($(node).hasClass("full-start__status")) {
              applyStatusColor(node);
            }
          }
        }
      });
    });

    // Запускаємо спостерігач для body
    statusObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Також слухаємо події повного завантаження картки
    Lampa.Listener.follow("full", function (data) {
      if (data.type === "complite" && data.data.movie) {
        setTimeout(function () {
          $(data.object.activity.render())
            .find(".full-start__status")
            .each(function () {
              applyStatusColor(this);
            });
        }, 100);
      }
    });
  }

  // Функція для відображення оригінальної назви фільму
  function showTitles(card, render) {
    if (!FancyFace.settings.show_original_names) return;
    const orig = card.original_title || card.original_name;
    if (!orig) return;

    // Видаляємо старе перед додаванням (на випадок ре-рендерингу)
    $(".original_title", render).remove();

    // Додаємо розмітку одним блоком
    $(".full-start-new__title", render).after(
      `<div class="original_title" style="margin-bottom: 2em; text-align: left;">
            <div style="font-size: 1.2em; opacity: 0.8;">Оригінальна назва: ${orig}</div>
        </div>`
    );
  }

  if (!window.title_plugin) {
    window.title_plugin = true;
    Lampa.Listener.follow("full", (e) => {
      // Чекаємо саме завершення рендеру картки
      if (e.type !== "complite" || !e.data.movie) return;
      const render = e.object.activity.render();
      // Викликаємо функцію, передаючи дані та готовий render
      showTitles(e.data.movie, render);
    });
  }

  // Функція для зміни кольору вікових обмежень
  function colorizeAgeRating() {
    if (!FancyFace.settings.colored_elements) return;

    // Функція для застосування кольору до вікового обмеження
    function applyAgeRatingColor(ratingElement) {
      var ratingText = $(ratingElement).text().trim();

      // Вікові рейтинги за групами
      var ageRatings = {
        kids: ["G", "TV-Y", "TV-G", "0+", "3+", "0", "3"],
        children: ["PG", "TV-PG", "TV-Y7", "6+", "7+", "6", "7"],
        teens: ["PG-13", "TV-14", "12+", "13+", "14+", "12", "13", "14"],
        almostAdult: ["R", "TV-MA", "16+", "17+", "16", "17"],
        adult: ["NC-17", "18+", "18", "X"],
      };

      // Кольори для кожної групи
      var colors = {
        kids: {
          bg: "#2ecc71", // Зелений
          text: "white",
        },
        children: {
          bg: "#3498db", // Блакитний
          text: "white",
        },
        teens: {
          bg: "#f1c40f", // Жовтий
          text: "black",
        },
        almostAdult: {
          bg: "#e67e22", // Помаранчевий
          text: "white",
        },
        adult: {
          bg: "#e74c3c", // Червоний
          text: "white",
        },
      };

      // Визначаємо групу для поточного рейтингу
      var group = null;

      // Перевіряємо всі групи
      for (var groupKey in ageRatings) {
        // Перевіряємо точну відповідність
        if (ageRatings[groupKey].includes(ratingText)) {
          group = groupKey;
          break;
        }

        // Перевіряємо часткову відповідність
        for (var i = 0; i < ageRatings[groupKey].length; i++) {
          if (ratingText.includes(ageRatings[groupKey][i])) {
            group = groupKey;
            break;
          }
        }

        if (group) break;
      }

      // Застосовуємо стилі залежно від знайденої групи
      if (group) {
        $(ratingElement).css({
          "background-color": colors[group].bg,
          color: colors[group].text,
          "border-radius": "0.3em",
          "font-size": "1.3em",
          border: "0px",
        });

        if (FancyFace.debug) {
          console.log(
            "Вікове обмеження:",
            ratingText,
            "група:",
            group,
            "колір:",
            colors[group].bg
          );
        }
      }
    }

    // Обробка вікових обмежень на існуючих елементах
    $(".full-start__pg").each(function () {
      applyAgeRatingColor(this);
    });

    // Використовуємо MutationObserver для відстежування нових елементів
    var ratingObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.addedNodes && mutation.addedNodes.length) {
          for (var i = 0; i < mutation.addedNodes.length; i++) {
            var node = mutation.addedNodes[i];
            $(node)
              .find(".full-start__pg")
              .each(function () {
                applyAgeRatingColor(this);
              });

            if ($(node).hasClass("full-start__pg")) {
              applyAgeRatingColor(node);
            }
          }
        }
      });
    });

    // Запускаємо спостерігач для body
    ratingObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Також слухаємо події повного завантаження картки
    Lampa.Listener.follow("full", function (data) {
      if (data.type === "complite" && data.data.movie) {
        setTimeout(function () {
          $(data.object.activity.render())
            .find(".full-start__pg")
            .each(function () {
              applyAgeRatingColor(this);
            });
        }, 100);
      }
    });
  }

  // Функція ініціалізації плагіна
  function startPlugin() {
    // Реєструємо плагін у Lampa
    Lampa.SettingsApi.addComponent({
      component: "season_info",
      name: "Додаткові налаштування інтерфейсу",
      icon:
        '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M4 5C4 4.44772 4.44772 4 5 4H19C19.5523 4 20 4.44772 20 5V7C20 7.55228 19.5523 8 19 8H5C4.44772 8 4 7.55228 4 7V5Z" stroke="white" stroke-width="2"/>' +
        '<path d="M4 11C4 10.4477 4.44772 10 5 10H19C19.5523 10 20 10.4477 20 11V13C20 13.5523 19.5523 14 19 14H5C4.44772 14 4 13.5523 4 13V11Z" stroke="white" stroke-width="2"/>' +
        '<path d="M4 17C4 16.4477 4.44772 16 5 16H19C19.5523 16 20 16.4477 20 17V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V17Z" stroke="white" stroke-width="2"/>' +
        "</svg>",
    });

    Lampa.SettingsApi.addParam({
      component: "season_info",
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

        // Якщо обрано "Вимкнути", вимикаємо відображення інформації
        if (value === "none") {
          FancyFace.settings.enabled = false;
        } else {
          // Якщо обрано якийсь режим, вмикаємо відображення
          FancyFace.settings.enabled = true;
        }

        Lampa.Settings.update();
      },
    });

    // Додаємо вибір розташування мітки
    Lampa.SettingsApi.addParam({
      component: "season_info",
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

        // Повідомлення про необхідність перезавантажити сторінку для застосування змін
        Lampa.Noty.show(
          "Для застосування змін відкрийте картку серіалу заново"
        );
      },
    });
    Lampa.SettingsApi.addParam({
      component: "season_info",
      param: {
        name: "season_info_show_movie_type",
        type: "trigger",
        default: true,
      },
      field: {
        name: "Змінити мітки типу",
        description: 'Змінити "TV" на "Серіал" та додати мітку "Фільм"',
      },
      onChange: function (value) {
        FancyFace.settings.show_movie_type = value;
        Lampa.Settings.update();
      },
    });

    Lampa.SettingsApi.addParam({
      component: "season_info",
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
        Lampa.Settings.update();
        applyTheme(value);
      },
    });

    Lampa.SettingsApi.addParam({
      component: "season_info",
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
        // Зберігаємо поточний активний елемент
        var activeElement = document.activeElement;

        // Оновлюємо налаштування
        FancyFace.settings.colored_ratings = value;
        Lampa.Settings.update();

        // Використовуємо setTimeout для відкладеного виконання,
        // щоб не порушувати цикл обробки поточної події
        setTimeout(function () {
          if (value) {
            // Якщо увімкнено, запускаємо оновлення кольорів та спостерігач
            setupVoteColorsObserver();
            setupVoteColorsForDetailPage();
          } else {
            // Якщо вимкнено, повертаємо стандартний колір для всіх елементів з рейтингом
            $(
              ".card__vote, .full-start__rate, .full-start-new__rate, .info__rate, .card__imdb-rate, .card__kinopoisk-rate"
            ).css("color", "");
          }

          // Повертаємо фокус на активний елемент
          if (activeElement && document.body.contains(activeElement)) {
            activeElement.focus();
          }
        }, 0);
      },
    });

    Lampa.SettingsApi.addParam({
      component: "season_info",
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
        Lampa.Settings.update();

        if (value) {
          colorizeSeriesStatus();
          colorizeAgeRating();
        } else {
          // Повертаємо стандартні кольори
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
      component: "season_info",
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
        Lampa.Settings.update();
      },
    });

    FancyFace.settings.show_movie_type = Lampa.Storage.get(
      "season_info_show_movie_type",
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

    // Встановлюємо enabled на основі seasons_info_mode
    FancyFace.settings.enabled =
      FancyFace.settings.seasons_info_mode !== "none";

    applyTheme(FancyFace.settings.theme);

    // Запускаємо функції плагіна залежно від налаштувань
    if (FancyFace.settings.enabled) {
      addSeasonInfo();
    }
    // Змінюємо мітки типу контенту
    changeMovieTypeLabels();

    // Запускаємо функцію кольорових рейтингів та спостерігач
    if (FancyFace.settings.colored_ratings) {
      setupVoteColorsObserver();
      // Додаємо слухача для оновлення кольорів у детальній картці
      setupVoteColorsForDetailPage();
    }

    // Запускаємо функції кольорових статусів та вікових обмежень
    if (FancyFace.settings.colored_elements) {
      colorizeSeriesStatus();
      colorizeAgeRating();
    }

    // Додати до startPlugin() після реєстрації всіх компонентів
    Lampa.Settings.listener.follow("open", function (e) {
      // Дочекаємося рендерингу елементів меню
      setTimeout(function () {
        // Знаходимо наш компонент та компонент "Інтерфейс"
        var FancyFace = $('.settings-folder[data-component="season_info"]');
        var interfaceStandard = $(
          '.settings-folder[data-component="interface"]'
        );

        // Якщо знайшли обидва елементи, переміщаємо наш компонент після стандартного
        if (FancyFace.length && interfaceStandard.length) {
          FancyFace.insertAfter(interfaceStandard);
        }
      }, 100);
    });
  }

  if (window.appready) {
    startPlugin();
  } else {
    Lampa.Listener.follow("app", function (event) {
      if (event.type === "ready") {
        startPlugin();
      }
    });
  }

  let manifest = {
    name: "FancyFace",
    version: FancyFace.version,
    description: "Покращений інтерфейс для застосунку Lampa",
    author: "@Niaros",
    url: "https://niarosss.github.io/lampa-plugins/Hide.js",
    type: "other",
    component: "menu_filter",
  };
  Lampa.Manifest.plugins = manifest;

  window.season_info = FancyFace;
})();
