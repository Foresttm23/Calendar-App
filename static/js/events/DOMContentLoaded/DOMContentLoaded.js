document.addEventListener("DOMContentLoaded", async () => {
  const user_json = document.getElementById("user_json").textContent || "null";
  user = JSON.parse(user_json);

  initCachedEvents(user);
  initCachedHolidays(); // поки тестую
  // localStorage.removeItem("cachedHolidays");

  initCachedView();
  initCachedDate();
  initCachedCalendars();
  // initSelectedCalendars();

  // Оновлюємо сторінку для оновлення подій

  await loadUserCalendars(user);

  await populateCalendarsSubmenu();

  showView(cachedView);

  // Також завантажує вихідні, тому треба
  await loadEvents();

  const loginBtn = document.getElementById("googleLogin");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      window.location.href = "/login/google";
    });
  }

  if (user) {
    // Якщо користувач не авторизовний, нема сенсу, кожен раз кидати запит
    loadEventsSetInterval();

    // Фактично не потрібен, бо я і так пінгую сервер 😒
    // checkUserWebhook();
    // checkUserWebhookSetInterval();
  }
});
