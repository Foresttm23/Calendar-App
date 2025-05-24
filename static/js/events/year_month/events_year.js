function renderYear() {
  const year = cachedDate.getFullYear();

  const yearView = document.getElementById("year-view");
  yearView.innerHTML = "";

  const yearGrid = document.createElement("div");
  yearGrid.setAttribute("id", "yearGrid");
  yearGrid.classList.add("year-grid");

  yearView.appendChild(yearGrid);

  for (let m = 0; m < 12; m++) {
    const container = document.createElement("div");
    container.classList.add("view-container");

    const title = document.createElement("h3");
    title.textContent = monthNames[m];
    container.appendChild(title);

    createMonth(year, m, yearView, container);
    // container.appendChild(monthGrid);
    yearGrid.appendChild(container);
  }
}
