// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------
const POPULATION_URL =
  "https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/vaerak/11ra.px";

// NOTE: verify this URL against the Task 3 instructions on Moodle.
// (In earlier course versions the employment data came from the
// "tyokay" table; change this constant if your instructions differ.)
const EMPLOYMENT_URL =
  "https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/tyokay/115b.px";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// POST a query (loaded from a local .json query file) to a PxWeb endpoint
async function fetchStatData(apiUrl, queryFileName) {
  const query = await (await fetch(queryFileName)).json();

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query)
  });
  return res.json();
}

// Find the "Alue" (area) dimension id of a json-stat2 response without
// hardcoding it (e.g. "alue_23_20260101")
function getAreaDimensionId(data) {
  return (
    data.id.find(id => id.toLowerCase().includes("alue")) ||
    data.id.find(id => id.toLowerCase() === "kunta") ||
    data.id[0]
  );
}

// ---------------------------------------------------------------------------
// Build the table
// ---------------------------------------------------------------------------
async function buildTable() {
  const [populationData, employmentData] = await Promise.all([
    fetchStatData(POPULATION_URL, "population_query.json"),
    fetchStatData(EMPLOYMENT_URL, "employment_query.json")
  ]);

  // --- population ---
  const popAreaId = getAreaDimensionId(populationData);
  const popCategory = populationData.dimension[popAreaId].category;
  const labels = popCategory.label;      // { "SSS": "KOKO MAA", "KU020": "Akaa", ... }
  const popIndex = popCategory.index;    // { "SSS": 0, "KU020": 1, ... }
  const popValues = populationData.value;

  // --- employment (map area code -> employment value) ---
  const empAreaId = getAreaDimensionId(employmentData);
  const empIndex = employmentData.dimension[empAreaId].category.index;
  const empValues = employmentData.value;

  const tbody = document.querySelector("tbody");

  Object.keys(labels).forEach(code => {
    const name = labels[code];
    const population = popValues[popIndex[code]];
    const employment = empValues[empIndex[code]];

    const employmentPercent = (employment / population) * 100;
    const percentText = employmentPercent.toFixed(2) + "%";

    const tr = document.createElement("tr");

    const tdName = document.createElement("td");
    tdName.textContent = name;

    const tdPopulation = document.createElement("td");
    tdPopulation.textContent = population;

    const tdEmployment = document.createElement("td");
    tdEmployment.textContent = employment;

    const tdPercent = document.createElement("td");
    tdPercent.textContent = percentText;

    tr.append(tdName, tdPopulation, tdEmployment, tdPercent);

    // Conditional row coloring
    if (employmentPercent > 45) {
      tr.style.backgroundColor = "#abffbd";
    } else if (employmentPercent < 25) {
      tr.style.backgroundColor = "#ff9e9e";
    }

    tbody.appendChild(tr);
  });
}

buildTable();