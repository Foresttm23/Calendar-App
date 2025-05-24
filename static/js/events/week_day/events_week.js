function generateWeek() {
  const year = cachedDate.getFullYear();
  const month = cachedDate.getMonth();
  const day = cachedDate.getDate();

  const today = new Date();

  const weekGrid = document.getElementById("week-grid");
  weekGrid.innerHTML = "";

  const week_container = document.createElement("div");
  week_container.classList.add("week-container");

  const weekGridDateInfo = document.getElementById("weekGridDateInfo");
  weekGridDateInfo.innerHTML = "";

  const startDate = new Date(year, month, day);
  const dayOfWeek = startDate.getDay();

  const sundayDate = new Date(startDate);
  // По суті віднімаємо день тижня (1-понеділок..) від дати, щоб отримати неділю
  sundayDate.setDate(startDate.getDate() - dayOfWeek);

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(sundayDate);
    currentDate.setDate(sundayDate.getDate() + i);

    const currentDay = currentDate.getDate();

    const dayInfoContainer = document.createElement("div");
    dayInfoContainer.classList.add("day-info-container");
    dayInfoContainer.setAttribute("id", `day-info-container-${i}`);

    if (i != 6) {
      dayInfoContainer.style.borderRight = "1px solid lightgrey"; // white
    }
    if (i === 0) {
      dayInfoContainer.style.borderLeft = "1px solid transparent"; // просто зміщення, без відображення
    }

    const currDayOfWeek = currentDate.getDay();

    const dayOfWeekInfo = document.createElement("div");
    dayOfWeekInfo.classList.add("day-of-week-info");
    dayOfWeekInfo.textContent = `${daysOfWeek[currDayOfWeek]}`;

    const dayNumInfo = document.createElement("div");
    dayNumInfo.classList.add("day-num-info");
    dayNumInfo.textContent = `${currentDay}`;

    changeCurrentDateColorDay(
      today,
      year,
      month,
      currentDate.getDate(),
      dayNumInfo
    );

    dayInfoContainer.appendChild(dayOfWeekInfo);
    dayInfoContainer.appendChild(dayNumInfo);
    weekGridDateInfo.appendChild(dayInfoContainer);

    generateDayHours(
      "week",
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      weekGrid,
      week_container,
      i
    );
  }
}

function changeCurrentDateColorDay(today, year, month, day, el) {
  if (
    year === today.getFullYear() &&
    month === today.getMonth() &&
    day === today.getDate()
  ) {
    el.style.color = "cornflowerblue";
  }
}
