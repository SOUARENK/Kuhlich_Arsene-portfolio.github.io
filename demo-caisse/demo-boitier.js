/* =====================================================================
   DÉMO — boîtier à boutons virtuel.
   Reproduit les gestes du vrai firmware (ESP32) : chaque bouton envoie
   les mêmes messages que la vraie carte, lus par la caisse chaque seconde.
   ===================================================================== */
(function () {
  var BTNS = [
    {id:'pain-campagne', label:'Campagne',        emoji:'🌾'},
    {id:'tournelin-g',   label:'Tournelin Grand', emoji:'🥯'},
    {id:'baguette',      label:'Baguette',        emoji:'🥖'},
    {id:'palais',        label:'Palais',          emoji:'🫓', rafale:true},
    {id:'fouchon',       label:'Fouchon',         emoji:'🥐', rafale:true},
    {id:'khorazan',      label:'Khorazan',        emoji:'❤️'},
    {id:'noix',          label:'À la Noix !',     emoji:'🥜'},
    {id:'_cash',         label:'Espèces',         emoji:'💶', cash:true}
  ];
  var LONG = 3000, DEL = 5000, RAFALE = 500;
  var seq = 100000;

  function send(pid) {
    DEMO_DB.remote_button_events.push({id: seq++, product_id: pid, market_type: null, created_at: new Date().toISOString(), consumed: false});
    var led = document.getElementById('dbLed'); if (!led) return;
    led.classList.add('on'); setTimeout(function(){ led.classList.remove('on'); }, 120);
  }

  var css = document.createElement('style');
  css.textContent =
    '#dbBadge{position:fixed;top:5px;left:50%;transform:translateX(-50%);z-index:9998;background:#C8960C;color:#2a1a00;font:700 10px/1 "DM Sans",sans-serif;letter-spacing:.8px;text-transform:uppercase;padding:5px 12px;border-radius:20px;pointer-events:none;white-space:nowrap}' +
    '#dbToggle{position:fixed;right:14px;bottom:96px;z-index:9998;background:#3D1135;color:#fff;border:2px solid #C8960C;border-radius:30px;padding:10px 16px;font:700 13px "DM Sans",sans-serif;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.35)}' +
    '#dbPanel{position:fixed;right:14px;bottom:146px;z-index:9998;width:306px;max-width:calc(100vw - 28px);background:#1b1b1b;color:#eee;border-radius:16px;padding:14px;box-shadow:0 12px 40px rgba(0,0,0,.5);font:13px "DM Sans",sans-serif;display:none}' +
    '#dbPanel.open{display:block}' +
    '#dbPanel h4{font:700 14px "DM Sans",sans-serif;margin:0 0 4px;display:flex;align-items:center;gap:8px;justify-content:space-between}' +
    '#dbLed{width:10px;height:10px;border-radius:50%;background:#333;display:inline-block}#dbLed.on{background:#4ade80;box-shadow:0 0 8px #4ade80}' +
    '#dbPanel p{margin:0 0 10px;color:#aaa;font-size:11.5px;line-height:1.4}' +
    '#dbGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}' +
    '.dbBtn{position:relative;overflow:hidden;background:#2b2b2b;border:2px solid #555;border-radius:12px;color:#fff;padding:10px 6px;font:600 12px "DM Sans",sans-serif;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none}' +
    '.dbBtn:active{background:#3a3a3a}.dbBtn .e{display:block;font-size:20px;margin-bottom:2px}' +
    '.dbBtn.cash{border-color:#4a7c59;background:#1f3328}' +
    '.dbBtn.rafale::after{content:"⚡";position:absolute;top:3px;right:6px;font-size:11px}' +
    '.dbBar{position:absolute;left:0;bottom:0;height:4px;width:0;background:#E8B830}.dbBar.go{width:100%;transition:width 5s linear}' +
    '.dbBar.warn{background:#ef4444}' +
    '#dbHelp{margin-top:10px;font-size:11px;color:#9a9a9a;line-height:1.5}#dbHelp b{color:#ddd}';
  document.head.appendChild(css);

  var badge = document.createElement('div');
  badge.id = 'dbBadge'; badge.textContent = 'Démo · données fictives';
  document.body.appendChild(badge);

  var toggle = document.createElement('button');
  toggle.id = 'dbToggle'; toggle.textContent = '🔘 Boîtier de démo';
  document.body.appendChild(toggle);

  var panel = document.createElement('div'); panel.id = 'dbPanel';
  panel.innerHTML =
    '<h4>Boîtier à boutons (simulé)<span id="dbLed" title="LED de la carte ESP32"></span></h4>' +
    '<p>Ces boutons envoient à la caisse les mêmes messages que mon vrai boîtier.</p>' +
    '<div id="dbGrid"></div>' +
    '<div id="dbHelp"><b>Appui court</b> : +1 pain · <b>Maintenu 3 s</b> : mode retrait · <b>5 s</b> : retire le pain<br>' +
    '<b>Palais, Fouchon ⚡</b> : appuie 2 ou 3 fois vite (+5, +10)<br>' +
    '<b>Espèces</b> : 1 appui = rendu de monnaie, 2 appuis = encaisse</div>';
  document.body.appendChild(panel);

  toggle.onclick = function () { panel.classList.toggle('open'); };
  if (window.innerWidth > 700) panel.classList.add('open');

  var grid = panel.querySelector('#dbGrid');
  BTNS.forEach(function (b) {
    var el = document.createElement('button');
    el.className = 'dbBtn' + (b.cash ? ' cash' : '') + (b.rafale ? ' rafale' : '');
    el.innerHTML = '<span class="e">' + b.emoji + '</span>' + b.label + '<span class="dbBar"></span>';
    var bar = el.querySelector('.dbBar'), t3 = null, t5 = null, armed = false, deleted = false, tapCount = 0, lastTap = 0;

    function reset() { clearTimeout(t3); clearTimeout(t5); bar.className = 'dbBar'; }

    el.addEventListener('pointerdown', function (e) {
      e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (x) {}
      armed = false; deleted = false;
      if (b.cash) { send('_cash'); return; }
      void bar.offsetWidth; bar.className = 'dbBar go';
      t3 = setTimeout(function () { armed = true; bar.classList.add('warn'); send(b.id + '~arm'); }, LONG);
      t5 = setTimeout(function () { deleted = true; send(b.id + '~del'); }, DEL);
    });
    function up() {
      if (b.cash) return;
      reset();
      if (armed || deleted) return;
      var now = Date.now();
      if (b.rafale) {
        tapCount = (tapCount > 0 && now - lastTap <= RAFALE) ? tapCount + 1 : 1;
        lastTap = now;
        send(tapCount === 1 ? b.id : b.id + '~' + (tapCount === 2 ? 4 : 5));
      } else {
        send(b.id);
      }
    }
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', function () { reset(); });
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    grid.appendChild(el);
  });
})();
