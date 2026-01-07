(function () {
  "use strict";

  var Defined = {
    api: "lampac",
    localhost: "https://rc.bwa.to/",
    apn: "",
  };

  function component(object) {
    var network = new Lampa.Reguest();
    var scroll = new Lampa.Scroll({
      mask: true,
      over: true,
    });
    var files = new Lampa.Explorer(object);
    var filter = new Lampa.Filter(object);
    var sources = {};
    var last;
    var source;
    var balanser;
    var initialized;
    var balanser_timer;

    var filter_sources = ["ashdi", "kinoukr", "uatut", "anidub", "uaflix"];
    var balanser_titles = {
      ashdi: "Ashdi",
      kinoukr: "Kinoukr",
      uatut: "Uatut",
      anidub: "Цікава ідея",
      uaflix: "Uaflix",
    };

    function account(url) {
      url = url + "";
      if (url.indexOf("account_email=") == -1) {
        var email = Lampa.Storage.get("account_email");
        if (email)
          url = Lampa.Utils.addUrlComponent(
            url,
            "account_email=" + encodeURIComponent(email)
          );
      }
      if (url.indexOf("uid=") == -1) {
        var uid = Lampa.Storage.get("lampac_unic_id", "");
        if (uid)
          url = Lampa.Utils.addUrlComponent(
            url,
            "uid=" + encodeURIComponent(uid)
          );
      }
      if (url.indexOf("token=") == -1) {
        var token = "sa59fjg";
        if (token != "")
          url = Lampa.Utils.addUrlComponent(url, "token=sa59fjg");
      }
      return url;
    }

    this.initialize = function () {
      var _this = this;
      this.loading(true);

      filter.onSelect = function (type, a, b) {
        if (type == "sort") {
          Lampa.Select.close();
          object.lampac_custom_select = a.source;
          _this.changeBalanser(a.source);
        }
      };

      if (filter.addButtonBack) filter.addButtonBack();
      filter.render().find(".filter--sort span").text("Джерело");
      files.appendFiles(scroll.render());
      files.appendHead(filter.render());
      scroll.body().addClass("torrent-list");
      scroll.minus(files.render().find(".explorer__files-head"));

      this.createSource()
        .then(function () {
          _this.search();
        })
        .catch(function (e) {
          _this.empty();
        });
    };

    this.createSource = function () {
      var _this = this;
      return new Promise(function (resolve, reject) {
        var url = _this.requestParams(
          Defined.localhost + "lite/events?life=true"
        );
        network.timeout(15000);
        network.silent(
          account(url),
          function (json) {
            if (json.accsdb) return reject(json);
            _this.startSource(json).then(resolve).catch(reject);
          },
          reject
        );
      });
    };

    this.startSource = function (json) {
      var _this = this;
      return new Promise(function (resolve, reject) {
        json.forEach(function (j) {
          var name = (j.balanser || j.name.split(" ")[0]).toLowerCase();
          if (filter_sources.indexOf(name) > -1) {
            sources[name] = {
              url: j.url,
              name: j.name,
              show: typeof j.show == "undefined" ? true : j.show,
            };
          }
        });

        if (filter_sources.length) {
          balanser = Lampa.Storage.get("online_balanser", filter_sources[0]);
          if (!sources[balanser]) balanser = filter_sources[0];
          source = sources[balanser].url;
          Lampa.Storage.set("active_balanser", balanser);
          resolve(json);
        } else {
          reject();
        }
      });
    };

    this.requestParams = function (url) {
      var query = [];
      query.push("id=" + encodeURIComponent(object.movie.id));
      if (object.movie.imdb_id)
        query.push("imdb_id=" + (object.movie.imdb_id || ""));
      if (object.movie.kinopoisk_id)
        query.push("kinopoisk_id=" + (object.movie.kinopoisk_id || ""));
      query.push(
        "title=" + encodeURIComponent(object.movie.title || object.movie.name)
      );
      query.push(
        "original_title=" +
          encodeURIComponent(
            object.movie.original_title || object.movie.original_name
          )
      );
      query.push("serial=" + (object.movie.name ? 1 : 0));
      query.push(
        "year=" +
          (
            (object.movie.release_date ||
              object.movie.first_air_date ||
              "0000") + ""
          ).slice(0, 4)
      );
      return url + (url.indexOf("?") >= 0 ? "&" : "?") + query.join("&");
    };

    this.search = function () {
      this.filter({}, this.getChoice());
      this.find();
    };

    this.find = function () {
      this.request(this.requestParams(source));
    };

    this.request = function (url) {
      network.native(
        account(url),
        this.parse.bind(this),
        this.empty.bind(this),
        false,
        {
          dataType: "text",
        }
      );
    };

    this.parse = function (str) {
      var _this = this;
      var json = Lampa.Arrays.decodeJson(str, {});
      if (json.rch) {
        // WebSocket logic removed for simplicity
        _this.empty();
        return;
      }

      var items = this.parseJsonDate(str, ".videos__item");
      if (items.length) {
        this.draw(items);
      } else {
        this.empty();
      }
    };

    this.parseJsonDate = function (str, name) {
      try {
        var html = $("<div>" + str + "</div>");
        var elems = [];
        html.find(name).each(function () {
          var item = $(this);
          var data = JSON.parse(item.attr("data-json"));
          var season = item.attr("s");
          var episode = item.attr("e");
          var text = item.text();
          if (episode) data.episode = parseInt(episode);
          if (season) data.season = parseInt(season);
          if (text) data.title = text;
          elems.push(data);
        });
        return elems;
      } catch (e) {
        return [];
      }
    };

    this.draw = function (items) {
      var _this = this;
      scroll.clear();
      items.forEach(function (element) {
        var html = Lampa.Template.get("online_view_item", element);
        html.on("hover:enter", function () {
          _this.play(element);
        });
        scroll.append(html);
      });
      this.loading(false);
      Lampa.Controller.enable("content");
    };

    this.play = function (element) {
      Lampa.Player.play(element);
    };

    this.changeBalanser = function (balanser_name) {
      Lampa.Storage.set("online_balanser", balanser_name);
      Lampa.Activity.replace();
    };

    this.getChoice = function () {
      return {};
    };

    this.empty = function () {
      var html = Lampa.Template.get("online_view_empty");
      scroll.clear();
      scroll.append(html);
      this.loading(false);
    };

    this.loading = function (status) {
      if (status) this.activity.loader(true);
      else {
        this.activity.loader(false);
        this.activity.toggle();
      }
    };

    this.filter = function (filter_items, choice) {
      filter.set(
        "sort",
        filter_sources.map(function (e) {
          return {
            title: balanser_titles[e] || e,
            source: e,
            selected: e == balanser,
          };
        })
      );
      filter.chosen("sort", [balanser_titles[balanser] || balanser]);
    };

    this.start = function () {
      if (Lampa.Activity.active().activity !== this.activity) return;
      if (!initialized) {
        initialized = true;
        this.initialize();
      }
      Lampa.Controller.add("content", {
        toggle: function toggle() {
          Lampa.Controller.collectionSet(scroll.render(), files.render());
          Lampa.Controller.collectionFocus(last || false, scroll.render());
        },
        up: function up() {
          Navigator.move("up");
        },
        down: function down() {
          Navigator.move("down");
        },
        right: function right() {
          Navigator.move("right");
        },
        left: function left() {
          Navigator.move("left");
        },
        back: this.back.bind(this),
      });
      Lampa.Controller.toggle("content");
    };

    this.render = function () {
      return files.render();
    };

    this.back = function () {
      Lampa.Activity.backward();
    };

    this.destroy = function () {
      network.clear();
      files.destroy();
      scroll.destroy();
      clearInterval(balanser_timer);
    };

    this.create = function () {
      return this.render();
    };
  }

  function startPlugin() {
    window.online_view_plugin_with_sources = true;

    Lampa.Template.add(
      "online_view_item",
      '<div class="online-view-item selector">{title}</div>'
    );
    Lampa.Template.add(
      "online_view_empty",
      '<div class="online-view-empty">Нічого не знайдено</div>'
    );

    Lampa.Lang.add({
      online_watch: {
        ru: "Смотреть онлайн",
        en: "Watch online",
        uk: "Дивитися онлайн",
      },
    });

    var manifest = {
      type: "video",
      version: "1.0.0",
      name: "Online View",
      description: "Плагін для перегляду онлайн",
      component: "online_view_ws",
      onContextLauch: function onContextLauch(object) {
        Lampa.Component.add("online_view_ws", component);
        Lampa.Activity.push({
          url: "",
          title: Lampa.Lang.translate("title_online"),
          component: "online_view_ws",
          movie: object,
        });
      },
    };

    Lampa.Manifest.plugins = manifest;

    var button =
      '<div class="full-start__button selector view--online">' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M8 5v14l11-7z"/></svg>' +
      "<span>#{online_watch}</span>" +
      "</div>";

    function addButton(e) {
      var btn = $(Lampa.Lang.translate(button));
      btn.on("hover:enter", function () {
        manifest.onContextLauch(e.data.movie);
      });
      e.object.activity.render().find(".view--torrent").after(btn);
    }

    Lampa.Listener.follow("full", function (e) {
      if (e.type == "complite") {
        if (e.object.activity.render().find(".view--online").length) return;
        addButton(e);
      }
    });

    try {
      if (Lampa.Activity.active().component == "full") {
        addButton({
          object: Lampa.Activity.active(),
          data: {
            movie: Lampa.Activity.active().card,
          },
        });
      }
    } catch (e) {}
  }

  if (!window.online_view_plugin_with_sources) startPlugin();
})();
