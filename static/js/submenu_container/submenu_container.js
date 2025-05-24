async function populateCalendarsSubmenu() {
  // Можна в ДОМ кинуть
  const submenu = document.getElementById("calendarsSubmenu");
  submenu.innerHTML = "";

  const calendarsUserInfo = document.createElement("div");
  if (user) calendarsUserInfo.textContent = "Календарі:";
  else calendarsUserInfo.textContent = "Авторизуйтесь";

  calendarsUserInfo.classList.add("calendars-user-info");

  submenu.appendChild(calendarsUserInfo);

  if (user) {
    const allCalendarsIds = cachedCalendars.map((el) => el.id);
    const savedSelected =
      JSON.parse(localStorage.getItem("selectedCalendars")) || allCalendarsIds;
    selectedCalendars = [...savedSelected];

    cachedCalendars.forEach((calendar) => {
      const calendarInfoContainer = document.createElement("div");
      calendarInfoContainer.classList.add("calendar-info-container");

      const checkbox = document.createElement("div");
      checkbox.classList.add("calendar-checkbox-svg");
      checkbox.dataset.id = calendar.id;
      checkbox.dataset.color = calendar.colorId;
      if (savedSelected.includes(calendar.id)) {
        checkbox.classList.add("checked");
      }

      /////////
      if (checkbox.classList.contains("checked")) {
        checkbox.style.backgroundColor =
          eventColors[calendar.colorId] || "#cccccc";
      } else {
        checkbox.style.backgroundColor = "transparent";
      }
      /////////

      checkbox.addEventListener("click", () => {
        checkbox.classList.toggle("checked");

        /////////
        if (checkbox.classList.contains("checked")) {
          checkbox.style.backgroundColor =
            eventColors[calendar.colorId] || "#cccccc";
        } else {
          checkbox.style.backgroundColor = "transparent";
        }
        /////////

        const id = checkbox.dataset.id;
        if (checkbox.classList.contains("checked")) {
          if (!selectedCalendars.includes(id)) selectedCalendars.push(id);
        } else {
          selectedCalendars = selectedCalendars.filter((el) => el !== id);
        }

        // 💾 Зберігаємо
        localStorage.setItem(
          "selectedCalendars",
          JSON.stringify(selectedCalendars)
        );

        console.log("✅ selectedCalendars:", selectedCalendars);
        showView(cachedView);
      });

      const calendarSummary = document.createElement("div");
      calendarSummary.classList.add("calendar-info-summary");
      calendarSummary.textContent = calendar.summary.includes("@gmail.com")
        ? "Main"
        : calendar.summary;

      calendarInfoContainer.appendChild(checkbox);
      calendarInfoContainer.appendChild(calendarSummary);
      submenu.appendChild(calendarInfoContainer);
    });
  } else {
    localStorage.removeItem("selectedCalendars");
  }
}
