// ------------------------------
// Mock API Data (Replace later with a real fetch if desired)
// ------------------------------
const API_DATA = {
  "value": [
    { "CarParkID":"1","Area":"Marina","Development":"Suntec City","Location":"1.29375 103.85718","AvailableLots":1104,"LotType":"C","Agency":"LTA" },
    { "CarParkID":"2","Area":"Marina","Development":"Marina Square","Location":"1.29115 103.85728","AvailableLots":1091,"LotType":"C","Agency":"LTA" },
    { "CarParkID":"3","Area":"Marina","Development":"Raffles City","Location":"1.29382 103.85319","AvailableLots":453,"LotType":"C","Agency":"LTA" },
    { "CarParkID":"4","Area":"Marina","Development":"The Esplanade","Location":"1.29011 103.85561","AvailableLots":448,"LotType":"C","Agency":"LTA" },
    { "CarParkID":"5","Area":"Marina","Development":"Millenia Singapore","Location":"1.29251 103.86009","AvailableLots":532,"LotType":"C","Agency":"LTA" }
  ]
};

// If you want live data later, swap this in:
// async function getData(){
//   const res = await fetch('https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2', {
//     headers: { 'AccountKey': 'YOUR_LTA_KEY_HERE', 'accept': 'application/json' }
//   });
//   const data = await res.json();
//   return data.value;
// }

// ------------------------------
// Helpers
// ------------------------------
function parseLatLng(str){
  if(!str) return null;
  const [lat, lng] = str.split(' ').map(Number);
  if(Number.isFinite(lat) && Number.isFinite(lng)) return {lat,lng};
  return null;
}

function haversine(a, b){
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s1 = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(s1), Math.sqrt(1 - s1));
  return R * c;
}

function lotsClass(lots){
  if(lots > 500) return 'good';
  if(lots >= 200) return 'mid';
  return 'low';
}

function fmtDistance(m){
  if(!Number.isFinite(m)) return '—';
  if(m < 1000) return `${Math.round(m)} m`;
  return `${(m/1000).toFixed(2)} km`;
}

// ------------------------------
// State
// ------------------------------
let userPos = null;
const carparks = API_DATA.value.map(v => ({
  ...v,
  id: v.CarParkID,
  name: v.Development,
  latlng: parseLatLng(v.Location),
  distance: null,
}));

// ------------------------------
// Map Init
// ------------------------------
const map = L.map('map', { zoomControl: true });
const sgCenter = [1.29027, 103.851959];
map.setView(sgCenter, 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

const carparkLayer = L.layerGroup().addTo(map);
let userMarker = null;
const markerById = new Map();

function buildPopupContent(cp){
  return `
    <div>
      <strong>${cp.name}</strong><br/>
      <small>${cp.Area}</small><br/>
      <div style="margin-top:6px;">
        <span class="pill ${lotsClass(cp.AvailableLots)}"><i class="fa-solid fa-circle"></i> ${cp.AvailableLots} lots</span>
      </div>
      <div style="margin-top:8px;">
        <button class="btn" style="padding:6px 8px" onclick="focusCarpark('${cp.id}')">
          <i class="fa-regular fa-eye"></i> View details
        </button>
      </div>
    </div>
  `;
}

function addMarkers(){
  carparkLayer.clearLayers();
  markerById.clear();
  carparks.forEach(cp => {
    if(!cp.latlng) return;
    const m = L.marker([cp.latlng.lat, cp.latlng.lng]);
    m.bindPopup(buildPopupContent(cp));
    m.on('click', () => {
      selectCarpark(cp.id, {fly:false});
    });
    m.addTo(carparkLayer);
    markerById.set(cp.id, m);
  });
}
addMarkers();

// ------------------------------
// UI Elements
// ------------------------------
const $ = s => document.querySelector(s);
const listEl = $('#list');
const selectEl = $('#selectCarpark');
const searchEl = $('#search');
const sortEl = $('#sort');
const typeEl = $('#lotType');
const countBadge = $('#countBadge');

const dName = $('#dName');
const dArea = $('#dArea');
const dLots = $('#dLots');
const dLotType = $('#dLotType');
const dAgency = $('#dAgency');
const dDistance = $('#dDistance');
const dCoords = $('#dCoords');
const dOpenMaps = $('#dOpenMaps');

function refreshDropdown(items){
  const prev = selectEl.value;
  selectEl.innerHTML = `<option value="">Choose a carpark…</option>` +
    items.map(cp => `<option value="${cp.id}">${cp.name}</option>`).join('');
  if(items.some(i => i.id === prev)) selectEl.value = prev;
}

function renderList(){
  const query = searchEl.value.trim().toLowerCase();
  const filterType = typeEl.value;

  let items = carparks.filter(cp => {
    const hay = (cp.name + ' ' + cp.Area).toLowerCase();
    const okQuery = !query || hay.includes(query);
    const okType = !filterType || (cp.LotType === filterType);
    return okQuery && okType;
  });

  if(userPos){
    items.forEach(cp => {
      if(cp.latlng) cp.distance = haversine(userPos, cp.latlng);
    });
  }

  const sort = sortEl.value;
  items.sort((a,b) => {
    switch(sort){
      case 'lots-asc': return a.AvailableLots - b.AvailableLots;
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'distance-asc': return (a.distance ?? Infinity) - (b.distance ?? Infinity);
      case 'lots-desc':
      default: return b.AvailableLots - a.AvailableLots;
    }
  });

  listEl.innerHTML = items.map(cp => `
    <div class="card" data-id="${cp.id}">
      <h4>${cp.name}</h4>
      <small>${cp.Area}</small>
      <div class="row">
        <span class="pill ${lotsClass(cp.AvailableLots)}"><i class="fa-solid fa-circle"></i> ${cp.AvailableLots} lots</span>
        <span class="pill"><i class="fa-regular fa-square"></i> Lot: ${cp.LotType}</span>
        <span class="pill"><i class="fa-regular fa-building"></i> ${cp.Agency}</span>
        <span class="pill">
          <i class="fa-regular fa-compass"></i>
          ${cp.distance != null ? fmtDistance(cp.distance) : '—'}
        </span>
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
      selectCarpark(card.dataset.id, {fly:true});
    });
  });

  refreshDropdown(items);
  countBadge.textContent = `${items.length} carparks`;
  highlightActive();
}

function highlightActive(activeId=null){
  listEl.querySelectorAll('.card').forEach(el => {
    el.classList.toggle('active', el.dataset.id === activeId);
  });
  markerById.forEach((m, id) => {
    if(id === activeId){
      m.openPopup();
    }
  });
  if(activeId){
    selectEl.value = activeId;
  }
}

function selectCarpark(id, {fly=false}={}){
  const cp = carparks.find(c => c.id === id);
  if(!cp) return;
  highlightActive(id);
  updateDetails(cp);
  const m = markerById.get(id);
  if(m){
    if(fly) map.flyTo(m.getLatLng(), 17, {duration: .6});
    m.openPopup();
  }
}
window.focusCarpark = selectCarpark;

function updateDetails(cp){
  dName.textContent = cp.name;
  dArea.textContent = cp.Area;
  dLots.textContent = cp.AvailableLots;
  dLotType.textContent = cp.LotType;
  dAgency.textContent = cp.Agency;
  dCoords.textContent = cp.latlng ? `${cp.latlng.lat.toFixed(5)}, ${cp.latlng.lng.toFixed(5)}` : '—';

  if(cp.latlng && userPos){
    cp.distance = haversine(userPos, cp.latlng);
  }
  dDistance.textContent = cp.distance != null ? fmtDistance(cp.distance) : '—';

  const q = cp.latlng ? `${cp.latlng.lat},${cp.latlng.lng}` : '';
  dOpenMaps.href = `https://www.google.com/maps?q=${encodeURIComponent(q)} (${encodeURIComponent(cp.name)})`;
}

// Initial UI
renderList();

// Events
searchEl.addEventListener('input', renderList);
sortEl.addEventListener('change', renderList);
typeEl.addEventListener('change', renderList);
selectEl.addEventListener('change', e => {
  const id = e.target.value;
  if(id) selectCarpark(id, {fly:true});
});

document.getElementById('btnReset').addEventListener('click', () => {
  searchEl.value = '';
  sortEl.value = 'lots-desc';
  typeEl.value = '';
  renderList();
  map.flyTo(sgCenter, 15, {duration:.6});
  highlightActive(null);
  document.getElementById('details').scrollIntoView({behavior:'smooth', block:'nearest'});
});

async function locate(){
  if(!('geolocation' in navigator)){
    alert('Geolocation not supported by your browser.');
    return;
  }
  navigator.geolocation.getCurrentPosition((pos) => {
    const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    userPos = coords;

    if(userMarker) {
      userMarker.setLatLng(coords);
    } else {
      userMarker = L.circleMarker(coords, {
        radius: 8, weight: 2, color: '#22d3ee', fillColor: '#22d3ee', fillOpacity: .3
      }).addTo(map).bindTooltip('You are here');
    }

    carparks.forEach(cp => {
      if(cp.latlng) cp.distance = haversine(userPos, cp.latlng);
    });
    renderList();

    const group = L.featureGroup([
      userMarker,
      ...Array.from(markerById.values())
    ]);
    map.fitBounds(group.getBounds().pad(0.2));

  }, (err) => {
    console.warn(err);
    alert('Could not get your location.');
  }, { enableHighAccuracy: true, timeout: 7000, maximumAge: 30000 });
}
document.getElementById('btnLocate').addEventListener('click', locate);

// Optional: auto-locate on load
// locate();
