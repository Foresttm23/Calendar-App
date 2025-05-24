function showToast(message, duration = 3000) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.classList.add("toast-show");

  // Сховати через duration
  setTimeout(() => {
    toast.classList.remove("toast-show");
    setTimeout(() => toast.classList.add("hidden"), 300); // дочекатись завершення анімації
  }, duration);
}
