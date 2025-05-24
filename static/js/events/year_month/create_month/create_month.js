function createMonth(
  year,
  month, // 0-індекс
  dateView,
  yearContainer = null,
  dayClass = "month-day"
) {
  const monthGridInfoContainer = document.createElement("div");
  monthGridInfoContainer.setAttribute("id", "monthGridInfoContainer");

  const monthDayEl = document.createElement("div");
  monthDayEl.classList.add("month-day-grid");

  if (yearContainer) {
    monthGridInfoContainer.classList.add("year-grid-info-container");
    // monthDayEl.style.marginBottom = "0";

    yearContainer.appendChild(monthGridInfoContainer);
    yearContainer.appendChild(monthDayEl);
  } else {
    const container = document.createElement("div");
    container.classList.add("view-container");

    monthGridInfoContainer.classList.add("month-grid-info-container");

    container.appendChild(monthGridInfoContainer);
    container.appendChild(monthDayEl);

    dateView.appendChild(container);
  }

  //

  const daysInWeek = 7;
  const maxRowsDays = 6;

  // Очистити старі елементи
  monthDayEl.innerHTML = "";

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay;

  const prevMonthLastDay = new Date(year, month, 0).getDate();

  const today = new Date();

  // Дні з попереднього місяця
  for (let i = startOffset - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const prevEl = document.createElement("button");

    prevEl.dataset.month = month - 1;
    if (month - 1 < 0) {
      prevEl.dataset.month = 12;
      prevEl.dataset.year = year - 1;
    }
    prevEl.dataset.day = i;

    monthButtonListener(prevEl);

    prevEl.classList.add(dayClass);
    prevEl.textContent = day;

    prevEl.style.borderRight = "1px solid lightgrey";
    prevEl.style.borderBottom = "1px solid lightgrey";

    changeCurrentDateColorMonth(today, year, month, day, prevEl);

    monthDayEl.appendChild(prevEl);
  }

  const lastRow = daysInWeek * maxRowsDays - maxRowsDays;

  // Поточний місяць
  for (let i = 1; i <= daysInMonth; i++) {
    const dayEl = document.createElement("button"); // button
    dayEl.dataset.month = month;
    dayEl.dataset.day = i;

    monthButtonListener(dayEl);

    dayEl.classList.add(dayClass);
    dayEl.textContent = i;

    const dayIndex = (startOffset + i - 1) % daysInWeek;
    if (dayIndex !== 6) {
      dayEl.style.borderRight = "1px solid lightgrey";
    }

    const currentLastRow = startOffset + i;
    if (currentLastRow < lastRow) {
      dayEl.style.borderBottom = "1px solid lightgrey";
    }

    changeCurrentDateColorMonth(today, year, month, i, dayEl);

    monthDayEl.appendChild(dayEl);
  }

  // Дні з наступного місяця
  const totalCells = daysInWeek * maxRowsDays;
  const currentCount = startOffset + daysInMonth;
  const nextDays = totalCells - currentCount;

  for (let i = 1; i <= nextDays; i++) {
    const nextEl = document.createElement("button");
    nextEl.dataset.month = month + 1;
    nextEl.dataset.day = i;

    if (month + 1 === 12) {
      nextEl.dataset.month = 0;
      nextEl.dataset.year = year + 1;
    }

    monthButtonListener(nextEl);

    nextEl.classList.add(dayClass);
    nextEl.textContent = i;

    // Не ставити бордер для останнього елемента в ряді
    if ((i + currentCount - 1) % daysInWeek !== 6) {
      nextEl.style.borderRight = "1px solid lightgrey";
    }

    const nextLastRow = startOffset + daysInMonth + i;
    if (nextLastRow < lastRow) {
      nextEl.style.borderBottom = "1px solid lightgrey";
    }

    changeCurrentDateColorMonth(today, year, month, i, nextEl);

    monthDayEl.appendChild(nextEl);
  }

  let gridInfoContainer = monthGridInfoContainer;

  gridInfoContainer.innerHTML = "";

  const gridDateInfo = document.createElement("div");
  gridDateInfo.classList.add("grid-date-info");

  for (let i = 0; i < 7; i++) {
    const dayInfoMonthContainer = document.createElement("div");
    dayInfoMonthContainer.classList.add("day-info-month-container");

    if (i != 6) {
      dayInfoMonthContainer.style.borderRight = "1px solid lightgrey"; // white
    }
    if (i === 6) {
      dayInfoMonthContainer.style.borderRight = "1px solid transparent"; // зміщуємо вліво на 1 піксель
    }

    const dayOfWeekInfo = document.createElement("div");
    dayOfWeekInfo.classList.add("day-of-week-info");
    dayOfWeekInfo.textContent = daysOfWeek[i];

    dayInfoMonthContainer.appendChild(dayOfWeekInfo);
    gridDateInfo.appendChild(dayInfoMonthContainer);
  }
  gridInfoContainer.appendChild(gridDateInfo);
}

function monthButtonListener(el) {
  el.addEventListener("click", () => {
    const clickedMonth = el.dataset.month;
    const clickedDay = el.dataset.day;

    const clickedYear = el.dataset.year;

    if (clickedYear) {
      cachedDate.setYear(clickedYear);
    }
    cachedDate.setMonth(clickedMonth);
    cachedDate.setDate(clickedDay);

    localStorage.setItem("cachedDate", JSON.stringify(cachedDate));

    showView("week");

    // console.log(clickedDay);
  });
}

function changeCurrentDateColorMonth(today, year, month, day, el) {
  if (
    year === today.getFullYear() &&
    month === today.getMonth() &&
    day === today.getDate()
  ) {
    el.style.backgroundColor = "cornflowerblue";
  }
}
