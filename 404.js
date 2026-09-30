/* ==========================================================================
   404.js — behavior for 404.html only (the "Go Back" button)
   Loaded after script.js. Guarded: does nothing on any page without
   #e404BackBtn, so it's safe even if ever included elsewhere by mistake.
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const backBtn = document.getElementById('e404BackBtn');
  if (!backBtn) return;
  backBtn.addEventListener('click', () => {
    if (document.referrer && document.referrer.indexOf(window.location.host) !== -1 && history.length > 1) {
      history.back();
    } else {
      window.location.href = 'index.html';
    }
  });
});