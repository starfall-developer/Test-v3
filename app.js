/* Starfall app — catalog, navigation, search, favorites, and media player */
(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const storeKey = 'starfall-custom-items-v2';
  const favoritesKey = 'starfall-favorites-v2';
  let catalog = {games:[],anime:[],manga:[]};
  let custom = read(storeKey, []);
  let favorites = read(favoritesKey, []);
  let activePage = 'home';
  let currentFilter = 'all';
  let searchTerm = '';
  let addType = 'game';

  function read(key, fallback){try{return JSON.parse(localStorage.getItem(key)) ?? fallback}catch{return fallback}}
  function save(){localStorage.setItem(storeKey,JSON.stringify(custom));localStorage.setItem(favoritesKey,JSON.stringify(favorites))}
  function safeText(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function allItems(){return [...catalog.games,...catalog.anime,...catalog.manga,...custom]}
  function kind(item){return item.type || (catalog.games.includes(item)?'game':'game')}
  function showToast(message){const toast=$('#toast');toast.textContent=message;toast.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove('show'),2300)}
  function page(name){activePage=name;$$('.page').forEach(p=>p.classList.toggle('active',p.id===`page-${name}`));$$('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===name));$('.main-nav').classList.remove('open');render();window.scrollTo({top:0,behavior:'smooth'})}
  function matches(item){const q=searchTerm.toLowerCase();return !q||[item.title,item.category,item.description].join(' ').toLowerCase().includes(q)}
  function visible(items){return items.filter(matches)}
  function cover(item){if(item.cover){const src=window.starfallAsset?window.starfallAsset(item.cover):item.cover;return `<img loading="lazy" src="${safeText(src)}" alt="">`}const icons={game:'✦',anime:'▶',manga:'▤'};return `<span class="cover-symbol">${icons[item.type]||'✦'}</span>`}
  function card(item){const saved=favorites.includes(item.id);const label=item.type==='anime'?'Anime':item.type==='manga'?'Manga':(item.category||'Game');return `<article class="media-card"><div class="card-cover">${cover(item)}<div class="cover-shade"></div><button class="favorite-toggle ${saved?'saved':''}" data-favorite="${safeText(item.id)}" title="Save favorite">${saved?'★':'☆'}</button></div><div class="card-content"><div class="card-meta"><span>${safeText(label)}</span><span>✦ Starfall</span></div><h3>${safeText(item.title)}</h3><p>${safeText(item.description||'A new discovery waiting for you.')}</p><button class="card-open" data-open="${safeText(item.id)}">${item.type==='anime'?'Watch now':item.type==='manga'?'Open reader':'Play game'} ↗</button></div></article>`}
  function renderGrid(id,items,emptyId){const node=$(`#${id}`);if(!node)return;node.innerHTML=items.map(card).join('');if(emptyId)$(`#${emptyId}`).classList.toggle('hidden',items.length>0)}
  function render(){
    const games=visible(catalog.games.concat(custom.filter(x=>x.type==='game')));
    const anime=visible(catalog.anime.concat(custom.filter(x=>x.type==='anime')));
    const manga=visible(catalog.manga.concat(custom.filter(x=>x.type==='manga')));
    renderGrid('homeFeatured',visible(allItems()).slice(0,4));
    renderGrid('gamesGrid',games.filter(x=>currentFilter==='all'||(x.category||'').toLowerCase()===currentFilter),'gamesEmpty');
    renderGrid('animeGrid',anime,'animeEmpty');
    renderGrid('mangaGrid',manga,'mangaEmpty');
    renderGrid('favoritesGrid',visible(allItems()).filter(x=>favorites.includes(x.id)),'favoritesEmpty');
    if(searchTerm&&activePage==='home')$('.section-heading h2').textContent='Search discoveries';
  }
  function openItem(id){const item=allItems().find(x=>x.id===id);if(!item)return;$('#playerTitle').textContent=item.title;$('#playerDescription').textContent=item.description||'';$('#openExternal').href=item.url||'#';const frame=$('#playerFrame');frame.innerHTML='';const url=item.url||'';const ext=url.split('?')[0].toLowerCase();if(item.type==='anime'&&/\.(mp4|webm|ogg|m4v)$/.test(ext)){const video=document.createElement('video');video.controls=true;video.autoplay=true;video.src=url;frame.append(video)}else if(url){const iframe=document.createElement('iframe');iframe.src=url;iframe.title=item.title;iframe.allow='autoplay; fullscreen; gamepad';iframe.allowFullscreen=true;iframe.referrerPolicy='no-referrer';frame.append(iframe)}else{frame.innerHTML='<div class="player-placeholder">This item does not have a link yet.</div>'}$('#playerModal').showModal()}
  function toggleFavorite(id){favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];save();render();showToast(favorites.includes(id)?'Saved to favorites':'Removed from favorites')}
  function openAdd(type){addType=type;$('#formTitle').textContent=`Add ${type==='game'?'a game':type==='anime'?'anime':'manga'}`;$('#addModal').showModal()}
  function bind(){
    document.addEventListener('click',e=>{
      const nav=e.target.closest('[data-page]');if(nav){e.preventDefault();page(nav.dataset.page);return}
      const fav=e.target.closest('[data-favorite]');if(fav){toggleFavorite(fav.dataset.favorite);return}
      const open=e.target.closest('[data-open]');if(open){openItem(open.dataset.open);return}
      const add=e.target.closest('[data-add]');if(add){openAdd(add.dataset.add);return}
      const close=e.target.closest('[data-close]');if(close){$('#'+close.dataset.close).close();return}
      const filter=e.target.closest('[data-filter]');if(filter){currentFilter=filter.dataset.filter;$$('#gameFilters .filter-pill').forEach(x=>x.classList.toggle('selected',x===filter));render();return}
    });
    $('#searchInput').addEventListener('input',e=>{searchTerm=e.target.value.trim();if(searchTerm&&activePage==='home')render();else render()});
    $('#menuButton').addEventListener('click',()=>$('.main-nav').classList.toggle('open'));
    $('#themeButton').addEventListener('click',()=>document.body.classList.toggle('soft-glow'));
    $('#addForm').addEventListener('submit',e=>{e.preventDefault();const data=new FormData(e.currentTarget);const title=String(data.get('title')).trim(),url=String(data.get('url')).trim();if(!title||!url)return;custom.push({id:`custom-${Date.now()}`,title,url,type:addType,category:String(data.get('category')||'').trim(),description:String(data.get('description')||'').trim(),cover:String(data.get('cover')||'').trim()});save();e.currentTarget.reset();$('#addModal').close();page(addType==='game'?'games':addType);showToast('Added to your Starfall collection')});
    ['playerModal','addModal'].forEach(id=>$('#'+id).addEventListener('click',e=>{if(e.target===$('#'+id))$('#'+id).close()}));
    $('#playerModal').addEventListener('close',()=>{$('#playerFrame').innerHTML=''});
  }
  async function load(){try{const response=await fetch('catalog.json',{cache:'no-store'});if(response.ok){const data=await response.json();catalog={games:data.games||[],anime:data.anime||[],manga:data.manga||[]}}}catch(err){console.info('Catalog unavailable; loading saved Starfall items only.',err)}}
  document.addEventListener('DOMContentLoaded',async()=>{await load();bind();render()});
})();