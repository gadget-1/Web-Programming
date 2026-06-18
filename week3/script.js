document.addEventListener("DOMContentLoaded", async () => {
    const populationUrl = "https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/11ra.px";
    const employmentUrl = "https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/tyokay/115b.px";

    try {
        // 1. Fetch both JSON query files from local environment
        const [popQueryRes, empQueryRes] = await Promise.all([
            fetch("population_query.json"),
            fetch("employment_query.json")
        ]);
        
        const populationQuery = await popQueryRes.json();
        const employmentQuery = await empQueryRes.json();

        // 2. Fetch data from StatFin APIs simultaneously
        const [popResponse, empResponse] = await Promise.all([
            fetch(populationUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(populationQuery)
            }),
            fetch(employmentUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(employmentQuery)
            })
        ]);

        const popData = await popResponse.json();
        const empData = await empResponse.json();

        // 3. Extract data safely using dynamic structure fallback
        const popDataset = popData.dataset || popData;
        const empDataset = empData.dataset || empData;

        const dimensionKeys = Object.keys(popDataset.dimension);
        const areaKey = dimensionKeys.find(key => key.toLowerCase().includes('alue'));
        const areaDimension = popDataset.dimension[areaKey];

        const municipalities = Object.values(areaDimension.category.label);
        const populations = popDataset.value;
        const employments = empDataset.value;

        const tbody = document.getElementById("table-body");

        // 4. Loop through data and construct table rows
        for (let i = 0; i < municipalities.length; i++) {
            const tr = document.createElement("tr");

            const cityName = municipalities[i];
            const population = populations[i];
            const employment = employments[i];
            
            // Calculate percentage
            const employmentPercent = ((employment / population) * 100).toFixed(2);

            // Create cells
            const tdCity = document.createElement("td");
            tdCity.textContent = cityName;
            
            const tdPop = document.createElement("td");
            tdPop.textContent = population;

            const tdEmp = document.createElement("td");
            tdEmp.textContent = employment;

            const tdPercent = document.createElement("td");
            tdPercent.textContent = employmentPercent + "%";

            // Append cells to row
            tr.appendChild(tdCity);
            tr.appendChild(tdPop);
            tr.appendChild(tdEmp);
            tr.appendChild(tdPercent);

            // 5. Conditional Styling based on percentage thresholds
            if (parseFloat(employmentPercent) > 45) {
                tr.style.backgroundColor = "#abffbd";
            } else if (parseFloat(employmentPercent) < 25) {
                tr.style.backgroundColor = "#ff9e9e";
            }

            // Append row to tbody
            tbody.appendChild(tr);
        }

    } catch (error) {
        console.error("Error fetching or processing data:", error);
    }
});