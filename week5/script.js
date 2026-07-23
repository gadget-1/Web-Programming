// ---------------------------------------------------------------------------
// Config / endpoints
// ---------------------------------------------------------------------------
const GEOJSON_URL =
  "https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature" +
  "&typeName=tilastointialueet:kunta4500k&outputFormat=json&srsName=EPSG:4326";

const MIGRATION_URL =
  "https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/muutl/11a2.px";

// PxWeb query (same structure as the migration_data_query_2026.json file).
// Tiedot order: in-migration (tulo) first, out-migration (lähtö) second,
// so in the response every other value is positive and every other negative.
const MIGRATION_QUERY = {
  query: [
    {
      code: "Alue",
      selection: {
        filter: "all",
        values: ["*"]
      }
    },
    {
      code: "Vuosi",
      selection: {
        filter: "item",
        values: ["2025"]
      }
    },
    {
      code: "Tiedot",
      selection: {
        filter: "item",
        values: ["muutl-vm43_tulo", "muutl-vm43_lahto"]
      }
    }
  ],
  response: {
    format: "json-stat2"
  }
};

// ---------------------------------------------------------------------------
// Map setup
// ---------------------------------------------------------------------------
const map = L.map("map", {
  minZoom: -3
});

// OpenStreetMap background
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// ---------------------------------------------------------------------------
// Migration data
// ---------------------------------------------------------------------------

// POST the query and turn the json-stat2 response into
// { "KU020": { positive: ..., negative: ... }, ... }
async function fetchMigrationData() {
  const res = await fetch(MIGRATION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(MIGRATION_QUERY)
  });
  const data = await res.json();

  // Find the area dimension without hardcoding its exact id
  const areaId = data.id.find(id => id.toLowerCase().includes("alue")) || data.id[0];
  const areaIndex = data.dimension[areaId].category.index;

  // How many "Tiedot" values per area (should be 2: positive + negative)
  const lastDimId = data.id[data.id.length - 1];
  const stride = data.size[data.id.indexOf(lastDimId)];

  const migrationByArea = {};
  Object.keys(areaIndex).forEach(areaCode => {
    const base = areaIndex[areaCode] * stride;
    migrationByArea[areaCode] = {
      positive: data.value[base],     // every other value: positive
      negative: data.value[base + 1]  // every other value: negative
    };
  });

  return migrationByArea;
}

// hue = (positive / negative)^3 * 60, capped at 120
function getHue(positive, negative) {
  let hue = Math.pow(positive / negative, 3) * 60;
  if (hue > 120) hue = 120;
  return hue;
}

// Turn a geojson "kunta" property (e.g. "020") into the PxWeb area code (e.g. "KU020")
function toAreaCode(kuntaCode) {
  return "KU" + kuntaCode;
}

// ---------------------------------------------------------------------------
// Build the map
// ---------------------------------------------------------------------------
async function init() {
  // Migration data is optional: if it fails, the map is still drawn
  let migrationByArea = {};
  try {
    migrationByArea = await fetchMigrationData();
  } catch (err) {
    console.error("Migration data failed to load:", err);
  }

  let geoData;
  try {
    const res = await fetch(GEOJSON_URL);
    geoData = await res.json();
  } catch (err) {
    console.error("GeoJSON failed to load:", err);
    return;
  }

  const geojsonLayer = L.geoJSON(geoData, {
    weight: 2,
    style: feature => {
      const migration = migrationByArea[toAreaCode(feature.properties.kunta)];
      if (!migration || !migration.negative) {
        return { color: "hsl(120, 75%, 50%)", weight: 2 };
      }
      return {
        color: `hsl(${getHue(migration.positive, migration.negative)}, 75%, 50%)`,
        weight: 2
      };
    },
    onEachFeature: (feature, layer) => {
      const name = feature.properties.nimi;

      // Tooltip on hover: municipality name
      layer.bindTooltip(name);

      // Popup on click: name + positive/negative migration
      const migration = migrationByArea[toAreaCode(feature.properties.kunta)];
      const popupText = migration
        ? `<b>${name}</b><br>` +
          `Positive migration: ${migration.positive}<br>` +
          `Negative migration: ${migration.negative}`
        : `<b>${name}</b>`;
      layer.bindPopup(popupText);
    }
  }).addTo(map);

  map.fitBounds(geojsonLayer.getBounds());
}

init();