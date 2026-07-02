document.addEventListener("DOMContentLoaded", () => {
    const submitBtn = document.getElementById("submit-data");
    const inputShow = document.getElementById("input-show");
    const showContainer = document.querySelector(".show-container");

    submitBtn.addEventListener("click", () => {
        performSearch();
    });

    inputShow.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            performSearch();
        }
    });

    async function performSearch() {
        const query = inputShow.value.trim();
        if (!query) return;

       
        showContainer.innerHTML = "";

        const url = `https://api.tvmaze.com/search/shows?q=${query}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

         
            data.forEach(item => {
                const show = item.show;

                const showDataDiv = document.createElement("div");
                showDataDiv.classList.add("show-data");

               
                const img = document.createElement("img");
                if (show.image && show.image.medium) {
                    img.src = show.image.medium;
                } else {
                    img.src = "https://via.placeholder.com/210x295?text=No+Image";
                }
                showDataDiv.appendChild(img);

                const showInfoDiv = document.createElement("div");
                showInfoDiv.classList.add("show-info");

                const titleH1 = document.createElement("h1");
                titleH1.textContent = show.name || "Unknown Title";
                showInfoDiv.appendChild(titleH1);

                
                if (show.summary) {
                    showInfoDiv.innerHTML += show.summary;
                } else {
                    showInfoDiv.innerHTML += "<p>No summary available.</p>";
                }

   
                showDataDiv.appendChild(showInfoDiv);
                showContainer.appendChild(showDataDiv);
            });

        } catch (error) {
            console.error("Error fetching data from TVMaze API:", error);
        }
    }
});