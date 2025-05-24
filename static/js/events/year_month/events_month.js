function renderMonth() {
  const year = cachedDate.getFullYear();
  const month = cachedDate.getMonth();

  // const monthGrid = document.getElementById("month-grid");

  const monthView = document.getElementById("month-view");
  monthView.innerHTML = "";

  createMonth(year, month, monthView);
}
