function searchLogs() {
  const query = document
    .getElementById("searchInput")
    .value.toLowerCase()
    .trim();
  const keywords = query.split(/\s+/); // розділяє по пробілах
  const logs = document.querySelectorAll(".log-list");

  let shownCount = 0;

  logs.forEach((log) => {
    const date = log.querySelector("td:nth-child(1)").textContent.toLowerCase();
    const email = log
      .querySelector("td:nth-child(2)")
      .textContent.toLowerCase();
    const message = log
      .querySelector("td:nth-child(3)")
      .textContent.toLowerCase();

    const combined = `${date} ${email} ${message}`;

    const matchesAll = keywords.every((word) => combined.includes(word));

    if (matchesAll && shownCount < 100) {
      log.style.display = "";
      shownCount++;
    } else {
      log.style.display = "none";
    }
  });
}
