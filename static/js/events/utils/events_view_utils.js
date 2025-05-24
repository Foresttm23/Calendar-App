function toggleMenu() {
  const submenu = document.getElementById("submenu_container");
  submenu.classList.toggle("open");
}

function changeView(event) {
  const viewId = event.target.value;
  showView(viewId);
}

function showView(viewId) {
  if (viewId === "today") {
    changeDateView(viewId);
    viewId = cachedView;
  }
  cachedView = viewId;
  localStorage.setItem("cachedView", JSON.stringify(viewId));

  updateShowCurrentDate();

  const viewSelect = document.getElementById("viewSelect");
  viewSelect.value = viewId;

  const views = document.querySelectorAll(".calendar-view");
  views.forEach((v) => v.classList.add("hidden"));
  document.getElementById(viewId + "-view").classList.remove("hidden");

  if (viewId === "year") {
    renderYear();
  } else if (viewId === "month") {
    renderMonth();
  } else if (viewId === "week") {
    generateWeek();
  } else if (viewId === "day") {
    generateDay();
  } else {
    let message = `showView: viewId Invalid Value; viewId: ${viewId};`;
    logAction(message);
  }
}

function toggleProfileMenu() {
  const profile_logout = document.getElementById("profile_menu");
  profile_logout.classList.toggle("hidden");

  const profile_pic = document.getElementById("profile_pic");
  profile_pic.classList.toggle("profile_pic_blur");
}

function initCachedEvents(user) {
  if (user) {
    if (localStorage.getItem("cachedEvents") !== null) {
      try {
        const saved = localStorage.getItem("cachedEvents");
        cachedEvents = JSON.parse(saved);
      } catch (e) {
        let message = `initCachedEvents: cachedEvents Invalid Value; Error: ${e};`;
        logAction(message);
      }
    } else {
      cachedEvents = [];
      localStorage.setItem("cachedEvents", JSON.stringify(cachedEvents));
    }
  } else {
    cachedEvents = [];
    localStorage.removeItem("cachedEvents");
  }
}

function initCachedHolidays() {
  if (localStorage.getItem("cachedHolidays") !== null) {
    try {
      const saved = localStorage.getItem("cachedHolidays");
      cachedHolidays = JSON.parse(saved);
    } catch (e) {
      let message = `initCachedHolidays: cachedHolidays Invalid Value; Error: ${e};`;
      logAction(message);
    }
  } else {
    cachedHolidays = [];
    localStorage.setItem("cachedHolidays", JSON.stringify(cachedHolidays));
  }
}

function initCachedCalendars() {
  if (localStorage.getItem("cachedCalendars") !== null || !user) {
    try {
      const saved = localStorage.getItem("cachedCalendars");
      cachedCalendars = JSON.parse(saved);
    } catch (e) {
      let message = `initCachedCalendars: cachedCalendars Invalid Value; Error: ${e};`;
      logAction(message);
    }
  } else {
    cachedCalendars = [];
    localStorage.setItem("cachedCalendars", JSON.stringify(cachedCalendars));
  }
}

function initCachedView() {
  if (localStorage.getItem("cachedView") !== null) {
    try {
      const saved = localStorage.getItem("cachedView");
      cachedView = JSON.parse(saved);
      const viewSelect = document.getElementById("viewSelect");
      viewSelect.value = cachedView;
    } catch (e) {
      let message = `initCachedView: cachedView Invalid Value; Error: ${e};`;
      logAction(message);
    }
  } else {
    localStorage.setItem("cachedView", JSON.stringify("day"));
  }

  showView(cachedView);
}

function initCachedDate() {
  if (localStorage.getItem("cachedDate") !== null) {
    try {
      const saved = localStorage.getItem("cachedDate");
      cachedDate = new Date(JSON.parse(saved));
    } catch (e) {
      let message = `initCachedDate: cachedDate Invalid Value; Error: ${e};`;
      logAction(message);
    }
  } else {
    cachedDate = new Date();
    localStorage.setItem("cachedDate", JSON.stringify(cachedDate));
  }

  showView(cachedView);
}

async function changeDateView(changeType) {
  tempDate = new Date(cachedDate);

  if (changeType === "prev") {
    if (cachedView === "day") {
      cachedDate.setDate(cachedDate.getDate() - 1);
    } else if (cachedView === "week") {
      cachedDate.setDate(cachedDate.getDate() - 7);
    } else if (cachedView === "month") {
      cachedDate.setMonth(cachedDate.getMonth() - 1);
    } else if (cachedView === "year") {
      cachedDate.setFullYear(cachedDate.getFullYear() - 1);
    }
  } else if (changeType === "next") {
    if (cachedView === "day") {
      cachedDate.setDate(cachedDate.getDate() + 1);
    } else if (cachedView === "week") {
      cachedDate.setDate(cachedDate.getDate() + 7);
    } else if (cachedView === "month") {
      cachedDate.setMonth(cachedDate.getMonth() + 1);
    } else if (cachedView === "year") {
      cachedDate.setFullYear(cachedDate.getFullYear() + 1);
    }
  } else if (changeType === "today") {
    cachedDate = new Date();
  }

  localStorage.setItem("cachedDate", JSON.stringify(cachedDate));

  showView(cachedView);

  if (cachedDate.getFullYear() != tempDate.getFullYear()) {
    await loadEvents();
  }

  const prevYear = new Date(cachedDate);
  prevYear.setDate(cachedDate.getDate() - 7);

  const nextYear = new Date(cachedDate);
  nextYear.setDate(cachedDate.getDate() + 7);
  // Оскільки відображення подій відбувається в тижні(7днів), то в кінці року, можуть не підвантажитись події, бо частина року буде минула
  if (prevYear.getFullYear() != cachedDate.getFullYear()) {
    await loadEvents(prevYear.getFullYear());
  } else if (nextYear.getFullYear() != cachedDate.getFullYear()) {
    await loadEvents(nextYear.getFullYear());
  }
}

function updateShowCurrentDate() {
  const updateYear = document.getElementById("showCurrentDateYear");
  updateYear.textContent = cachedDate.getFullYear();

  const updateMonth = document.getElementById("showCurrentDateMonth");
  const currentMonth = cachedDate.getMonth();
  updateMonth.textContent = monthNames[currentMonth];
}
