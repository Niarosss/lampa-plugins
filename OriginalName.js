(() => {
  async function showTitles(card) {
    const orig = card.original_title || card.original_name;
    const render = Lampa.Activity.active().activity.render();
    if (!render) return;

    $(".full-start-new__title", render).after(
      `<div class="original_title" style="margin-top:-2.8em;text-align:left;">
         <div>
           <div style='font-size:1.3em;'>Оригінальна назва: ${orig}</div>
         </div>
       </div>`
    );
  }

  if (!window.title_plugin) {
    window.title_plugin = true;
    Lampa.Listener.follow("full", (e) => {
      if (e.type !== "complite" || !e.data.movie) return;
      $(".original_title", e.object.activity.render()).remove();
      $(".full-start-new__title", e.object.activity.render()).after(
        '<div class="original_title" style="margin-top:-0.8em;text-align:left;"><div></div></div>'
      );
      showTitles(e.data.movie);
    });
  }
})();
