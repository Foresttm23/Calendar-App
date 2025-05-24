function generateDay() {
  year = cachedDate.getFullYear();
  month = cachedDate.getMonth();
  day = cachedDate.getDate();

  const today = new Date();

  const dayGrid = document.getElementById("day-grid");
  dayGrid.innerHTML = "";

  const day_container = document.createElement("div");
  day_container.classList.add("day-container");

  const dayInfoContainer = document.createElement("div");
  dayInfoContainer.classList.add("day-info-container");

  // Схоже, що не встигало чи просто не очищувалось, тому призначив інший елемент
  dayInfoContainer.setAttribute("id", `day-info-container-${-1}`);

  const dayGridDateInfo = document.getElementById("dayGridDateInfo");
  dayGridDateInfo.innerHTML = "";

  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay();

  const dayOfWeekInfo = document.createElement("div");
  dayOfWeekInfo.classList.add("day-of-week-info");
  dayOfWeekInfo.textContent = `${daysOfWeek[dayOfWeek]}`;

  const dayNumInfo = document.createElement("div");
  dayNumInfo.classList.add("day-num-info");
  dayNumInfo.textContent = `${day}`;

  changeCurrentDateColorDay(today, year, month, day, dayNumInfo);

  dayInfoContainer.appendChild(dayOfWeekInfo);
  dayInfoContainer.appendChild(dayNumInfo);

  dayGridDateInfo.appendChild(dayInfoContainer);

  generateDayHours("day", year, month, day, dayGrid, day_container, -1);
}
