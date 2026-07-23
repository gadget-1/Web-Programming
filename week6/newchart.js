// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const API_URL = "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/synt/12dy.px";

const YEARS = [
  "2000", "2001", "2002", "2003", "2004", "2005", "2006", "2007",
  "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015",
  "2016", "2017", "2018", "2019", "2020", "2021"
];

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

async function fetchData(areaCode, contentsCode) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildQuery(areaCode, contentsCode))
  });
  const data = await res.json();
  return data.value;
}

// ---------------------------------------------------------------------------
// Build the bar chart
// ---------------------------------------------------------------------------
async function init() {
  // Same municipality as the main page (whole country by default)
  const areaCode = localStorage.getItem("areaCode") || "SSS";
  const areaName = localStorage.getItem("areaName") || "whole country";

  // Fetch the birth and death data separately
  const births = await fetchData(areaCode, "synt-vm01");
  const deaths = await fetchData(areaCode, "synt-vm11");

  new frappe.Chart("#chart", {
    title: "Births and deaths in " + areaName,
    height: 450,
    type: "bar",
    colors: ["#63d0ff", "#363636"],
    data: {
      labels: YEARS,
      datasets: [
        {
          name: "Births",
          values: births
        },
        {
          name: "Deaths",
          values: deaths
        }
      ]
    }
  });
}

init();