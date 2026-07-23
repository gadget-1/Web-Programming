// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const API_URL = "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/synt/12dy.px";

const YEARS = [
  "2000", "2001", "2002", "2003", "2004", "2005", "2006", "2007",
  "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015",
  "2016", "2017", "2018", "2019", "2020", "2021"
];

// Current chart state
let chart = null;
let currentValues = [];
let currentLabels = [];
let currentAreaName = "whole country";

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------
function buildQuery(areaCode, contentsCode) {
  return {
    query: [
      {
        code: "timeperiod_y",
        selection: {
          filter: "item",
          values: YEARS
        }
      },
      {
        code: "alue_23_20260101",
        selection: {
          filter: "item",
          values: [areaCode]
        }
      },
      {
        code: "contentscode",
        selection: {
          filter: "item",
          values: [contentsCode]
        }
      }
    ],
    response: {
      format: "json-stat2"
    }
  };
}

async function fetchPopulationData(areaCode) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildQuery(areaCode, "synt-vaesto"))
  });
  const data = await res.json();
  return data.value;
}

// GET request: municipality codes and names.
// The second variable holds areas: "values" = codes, "valueTexts" = names.
async function getMunicipalityCode(name) {
  const res = await fetch(API_URL);
  const meta = await res.json();

  const areaVariable = meta.variables[1];
  const codes = areaVariable.values;
  const names = areaVariable.valueTexts;

  const index = names.findIndex(
    n => n.toLowerCase() === name.trim().toLowerCase()
  );
  return index !== -1 ? codes[index] : null;
}

// ---------------------------------------------------------------------------
// Chart
// ---------------------------------------------------------------------------
function renderChart(labels, values, areaName) {
  currentLabels = [...labels];
  currentValues = [...values];
  currentAreaName = areaName;

  chart = new frappe.Chart("#chart", {
    title: "Population growth in " + areaName,
    height: 450,
    type: "line",
    colors: ["#eb5146"],
    data: {
      labels: currentLabels,
      datasets: [
        {
          name: "Population",
          values: currentValues
        }
      ]
    }
  });
}

// ---------------------------------------------------------------------------
// Init: whole country data on page load
// ---------------------------------------------------------------------------
async function init() {
  const values = await fetchPopulationData("SSS");
  renderChart(YEARS, values, "whole country");
}

init();

// ---------------------------------------------------------------------------
// Task 3: municipality search
// ---------------------------------------------------------------------------
document.getElementById("search-form").addEventListener("submit", async e => {
  e.preventDefault();

  const name = document.getElementById("input-area").value;
  const code = await getMunicipalityCode(name);
  if (!code) {
    return;
  }

  // Remember the chosen municipality for newchart.html
  localStorage.setItem("areaCode", code);
  localStorage.setItem("areaName", name.trim());

  const values = await fetchPopulationData(code);
  renderChart(YEARS, values, name.trim());
});

// ---------------------------------------------------------------------------
// Task 4: simple data prediction
// ---------------------------------------------------------------------------
document.getElementById("add-data").addEventListener("click", () => {
  if (currentValues.length < 2) {
    return;
  }

  // Mean of the deltas between consecutive data points
  let deltaSum = 0;
  for (let i = 1; i < currentValues.length; i++) {
    deltaSum += currentValues[i] - currentValues[i - 1];
  }
  const meanDelta = deltaSum / (currentValues.length - 1);

  const newValue = currentValues[currentValues.length - 1] + meanDelta;
  const newLabel = String(Number(currentLabels[currentLabels.length - 1]) + 1);

  currentValues.push(newValue);
  currentLabels.push(newLabel);

  chart.addDataPoint(newLabel, [newValue]);
});