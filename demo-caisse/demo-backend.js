/* =====================================================================
   DÉMO — fausse base de données en mémoire.
   Remplace le client Supabase : AUCUNE requête réseau n'est envoyée,
   aucune donnée réelle n'est utilisée. Tout disparaît au rechargement.
   ===================================================================== */
var DEMO_CATALOG = [
  {id:'pain-campagne',name:'Campagne',color:'#F0DDB8',emoji:'🌾',price:2.5},
  {id:'pain-campagne-g',name:'Campagne Grand',color:'#F4B8C8',emoji:'🌾',price:3.5},
  {id:'tournelin',name:'Tournelin',color:'#FDE8C8',emoji:'🥯',price:3.5},
  {id:'tournelin-g',name:'Tournelin Grand',color:'#F4B8C8',emoji:'🥯',price:5},
  {id:'carre-graines',name:'Carré Cie Graines',color:'#D4EAB0',emoji:'🍞',price:3.5},
  {id:'grain-soleil',name:'Grain de Soleil',color:'#F9E4AA',emoji:'🔥',price:3.8},
  {id:'grain-soleil-g',name:'Grain de Soleil Grand',color:'#F4B8C8',emoji:'🔥',price:7.6},
  {id:'integrale',name:"L'intégrale",color:'#E8D5C0',emoji:'🛒',price:2.5},
  {id:'pur-seigle',name:'Pur Seigle',color:'#C8B8A8',emoji:'🧆',price:3.2},
  {id:'noix',name:'À la Noix !',color:'#E8C8A0',emoji:'🥜',price:4},
  {id:'raisins',name:'Aux Raisins',color:'#D0B8D8',emoji:'🍇',price:3},
  {id:'palais',name:'Palais',color:'#FDDCB5',emoji:'🫓',price:0.5},
  {id:'fouchon',name:'Fouchon',color:'#F5C4A1',emoji:'🥐',price:2},
  {id:'ecureuil',name:'Ecureuil',color:'#C4B8E8',emoji:'🐿️',price:3},
  {id:'libraire',name:"Libr'aire",color:'#A8D5E2',emoji:'🎁',price:3},
  {id:'libraire-g',name:"Libr'aire Grand",color:'#F4B8C8',emoji:'🎁',price:6},
  {id:'khorazan',name:'Khorazan',color:'#F2C4CE',emoji:'❤️',price:3},
  {id:'baguette',name:'Baguette',color:'#FDE8C8',emoji:'🥖',price:2},
  {id:'olives',name:'Aux olives',color:'#A8C890',emoji:'🫘',price:4}
];

/* Petit générateur pseudo-aléatoire : mêmes données fictives à chaque visite */
var _seed = 20261004;
function _rnd(){ _seed = (_seed * 1664525 + 1013904223) % 4294967296; return _seed / 4294967296; }
function _pad(n){ return (n < 10 ? '0' : '') + n; }

function _fakeOrders(n, startHour) {
  var out = [], t = startHour * 60 + 5;
  for (var i = 1; i <= n; i++) {
    var lines = 1 + Math.floor(_rnd() * 3), items = [], used = {}, total = 0;
    for (var l = 0; l < lines; l++) {
      var p = DEMO_CATALOG[Math.floor(_rnd() * DEMO_CATALOG.length)];
      if (used[p.id]) continue; used[p.id] = true;
      var q = p.id === 'palais' ? 5 : 1 + Math.floor(_rnd() * 2);
      items.push({id:p.id, qty:q, name:p.name, color:p.color, emoji:p.emoji, price:p.price});
      total += q * p.price;
    }
    total = Math.round(total * 100) / 100;
    var pay = _rnd() < 0.7 ? 'cash' : 'card', given = null, change = null;
    if (pay === 'cash') { given = total <= 10 ? 10 : (total <= 20 ? 20 : 50); change = Math.round((given - total) * 100) / 100; }
    t += 3 + Math.floor(_rnd() * 9);
    out.push({id:i, time:_pad(Math.floor(t / 60)) + ':' + _pad(t % 60), items:items, total:total, change:change, payment:pay, cashGiven:given});
  }
  return out;
}

function _fakeSession(idx, name, daysAgo, n) {
  var d = new Date(); d.setDate(d.getDate() - daysAgo);
  var orders = _fakeOrders(n, 8), ca = orders.reduce(function(s, o){ return s + o.total; }, 0);
  return {
    id: 1700000000000 + idx, name: name,
    date: _pad(d.getDate()) + '/' + _pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' 08:00',
    totalCA: Math.round(ca * 100) / 100, totalOrders: orders.length, orders: orders,
    products: DEMO_CATALOG, stockStart: {}, stockEnd: {}
  };
}

var _now = new Date();
var DEMO_DB = {
  marche_state: [
    {key:'catalog', value:{products: DEMO_CATALOG}},
    {key:'main', value:{
      orders: _fakeOrders(6, 8),
      marketSessions: [
        _fakeSession(1, 'Marché de démonstration (exemple 2)', 14, 18),
        _fakeSession(2, 'Marché de démonstration (exemple 1)', 7, 15)
      ],
      marketName: 'Marché de démonstration',
      marketStartTime: _pad(_now.getDate()) + '/' + _pad(_now.getMonth() + 1) + '/' + _now.getFullYear() + ' 08:00',
      orderCounter: 6,
      activeProductIds: DEMO_CATALOG.map(function(p){ return p.id; }),
      resConfig: {}, stock: {}, stockStart: {}
    }}
  ],
  remote_button_events: [], reservations: [], clients: [], clients_pro: [], commandes_pro: []
};

function _clone(x){ return x === undefined ? x : JSON.parse(JSON.stringify(x)); }
var _autoId = 1;

function _SbQ(table) { this._t = table; this._f = []; this._single = false; this._lim = null; this._ord = null; }
_SbQ.prototype.select = function(){ return this; };
_SbQ.prototype.eq   = function(c,v){ this._f.push(function(r){ return String(r[c]) === String(v); }); return this; };
_SbQ.prototype.neq  = function(c,v){ this._f.push(function(r){ return String(r[c]) !== String(v); }); return this; };
_SbQ.prototype.gte  = function(c,v){ this._f.push(function(r){ return r[c] >= v; }); return this; };
_SbQ.prototype.lte  = function(c,v){ this._f.push(function(r){ return r[c] <= v; }); return this; };
_SbQ.prototype.ilike = function(c,v){ var s = String(v).replace(/%/g,'').toLowerCase(); this._f.push(function(r){ return String(r[c] || '').toLowerCase().indexOf(s) >= 0; }); return this; };
_SbQ.prototype.in   = function(c,vs){ this._f.push(function(r){ return vs.map(String).indexOf(String(r[c])) >= 0; }); return this; };
_SbQ.prototype.single = function(){ this._single = true; return this; };
_SbQ.prototype.limit  = function(n){ this._lim = n; return this; };
_SbQ.prototype.order  = function(c,o){ this._ord = {c:c, asc: !(o && o.ascending === false)}; return this; };
_SbQ.prototype.then = function(res, rej) {
  var rows = (DEMO_DB[this._t] || []).filter(function(r, i, a){ return true; });
  this._f.forEach(function(f){ rows = rows.filter(f); });
  if (this._ord) { var o = this._ord; rows = rows.slice().sort(function(a,b){ return (a[o.c] > b[o.c] ? 1 : a[o.c] < b[o.c] ? -1 : 0) * (o.asc ? 1 : -1); }); }
  if (this._lim) rows = rows.slice(0, this._lim);
  var data = _clone(rows);
  return Promise.resolve({data: this._single ? (data[0] || null) : data, error: null}).then(res, rej);
};

_SbQ.prototype.catch = function(fn){ return this.then(null, fn); };

function _SbMut(table, method) { this._t = table; this._m = method; this._f = []; this._body = null; this._key = null; }
_SbMut.prototype.eq = function(c,v){ this._f.push(function(r){ return String(r[c]) === String(v); }); return this; };
_SbMut.prototype.then = function(res, rej) {
  var tbl = DEMO_DB[this._t] || (DEMO_DB[this._t] = []), out = [], self = this;
  var match = function(r){ return self._f.every(function(f){ return f(r); }); };
  if (this._m === 'POST') {
    [].concat(this._body).forEach(function(b){
      var row = _clone(b);
      if (row.id === undefined) row.id = self._t === 'remote_button_events' ? _autoId++ : 'demo-' + (_autoId++);
      if (!row.created_at) row.created_at = new Date().toISOString();
      if (self._t === 'remote_button_events' && row.consumed === undefined) row.consumed = false;
      tbl.push(row); out.push(_clone(row));
    });
  } else if (this._m === 'UPSERT') {
    [].concat(this._body).forEach(function(b){
      var key = self._key || (b.key !== undefined ? 'key' : 'id'), found = null;
      tbl.forEach(function(r){ if (r[key] === b[key]) found = r; });
      if (found) { for (var k in b) found[k] = _clone(b[k]); out.push(_clone(found)); }
      else { var row = _clone(b); tbl.push(row); out.push(_clone(row)); }
    });
  } else if (this._m === 'PATCH') {
    tbl.forEach(function(r){ if (match(r)) { for (var k in self._body) r[k] = _clone(self._body[k]); out.push(_clone(r)); } });
  } else if (this._m === 'DELETE') {
    DEMO_DB[this._t] = tbl.filter(function(r){ if (match(r)) { out.push(_clone(r)); return false; } return true; });
  }
  return Promise.resolve({data: out, error: null}).then(res, rej);
};

_SbMut.prototype.catch = function(fn){ return this.then(null, fn); };

var sb = {
  from: function(table) {
    return {
      select: function(c){ return (new _SbQ(table)).select(c); },
      insert: function(b){ var m = new _SbMut(table,'POST'); m._body = b; return m; },
      upsert: function(b,o){ var m = new _SbMut(table,'UPSERT'); m._body = b; if (o && o.onConflict) m._key = o.onConflict; return m; },
      update: function(b){ var m = new _SbMut(table,'PATCH'); m._body = b; return m; },
      delete: function(){ return new _SbMut(table,'DELETE'); }
    };
  },
  channel: function(){ return { on: function(){ return this; }, subscribe: function(cb){ if (cb) cb('SUBSCRIBED'); return this; } }; },
  removeChannel: function(){}
};
