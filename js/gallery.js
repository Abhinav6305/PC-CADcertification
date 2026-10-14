// Lightbox for the event gallery
(function () {
  const items = [...document.querySelectorAll(".g-item")];
  const box = document.getElementById("lightbox");
  if (!items.length || !box) return;
  const img = box.querySelector("img");
  let i = 0;
  const show = (n) => {
    i = (n + items.length) % items.length;
    img.src = items[i].dataset.full;
    img.alt = items[i].querySelector("img").alt;
  };
  const open = (n) => { show(n); box.hidden = false; document.body.style.overflow = "hidden"; };
  const close = () => { box.hidden = true; document.body.style.overflow = ""; };
  items.forEach((el, n) => el.addEventListener("click", () => open(n)));
  box.querySelector(".lb-close").addEventListener("click", close);
  box.querySelector(".lb-prev").addEventListener("click", (e) => { e.stopPropagation(); show(i - 1); });
  box.querySelector(".lb-next").addEventListener("click", (e) => { e.stopPropagation(); show(i + 1); });
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  document.addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(i - 1);
    if (e.key === "ArrowRight") show(i + 1);
  });
})();
