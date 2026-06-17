const usernameInput = document.getElementById("input-username");
const emailInput = document.getElementById("input-email");
const adminInput = document.getElementById("input-admin");
const imageInput = document.getElementById("input-image");

const submitButton = document.getElementById("submit-data");
const emptyButton = document.getElementById("empty-table");

const table = document.getElementById("user-table");


submitButton.addEventListener("click", function () {

    const username = usernameInput.value;
    const email = emailInput.value;
    const admin = adminInput.checked ? "X" : "-";

    let imageURL = "";

    if (imageInput.files.length > 0) {
        imageURL = URL.createObjectURL(imageInput.files[0]);
    }

    for (let i = 1; i < table.rows.length; i++) {

        if (table.rows[i].cells[0].textContent === username) {

            table.rows[i].cells[1].textContent = email;
            table.rows[i].cells[2].textContent = admin;

            const imageCell = table.rows[i].cells[3];
            imageCell.innerHTML = "";

            if (imageURL !== "") {

                const img = document.createElement("img");

                img.src = imageURL;
                img.width = 64;
                img.height = 64;

                imageCell.appendChild(img);
            }

            return;
        }
    }

    const row = table.insertRow();

    const usernameCell = row.insertCell();
    const emailCell = row.insertCell();
    const adminCell = row.insertCell();
    const imageCell = row.insertCell();

    usernameCell.textContent = username;
    emailCell.textContent = email;
    adminCell.textContent = admin;

    if (imageURL !== "") {

        const img = document.createElement("img");

        img.src = imageURL;
        img.width = 64;
        img.height = 64;

        imageCell.appendChild(img);
    }
});


emptyButton.addEventListener("click", function () {

    while (table.rows.length > 1) {

        table.deleteRow(1);
    }

});