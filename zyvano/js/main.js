(() => {
  "use strict";

  /* ---- header scroll state ---- */
  const header = document.getElementById("siteHeader");
  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- mobile nav ---- */
  const menuToggle = document.getElementById("menuToggle");
  const mobileNav = document.getElementById("mobileNav");
  menuToggle.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("open");
    menuToggle.classList.toggle("open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  });
  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileNav.classList.remove("open");
      menuToggle.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });

  /* ---- reveal on scroll ---- */
  const revealEls = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );
  revealEls.forEach((el) => io.observe(el));

  /* ---- colorway swatches ---- */
  const swatches = document.querySelectorAll(".swatch");
  const colorLabel = document.getElementById("colorLabel");
  swatches.forEach((swatch) => {
    swatch.addEventListener("click", () => {
      swatches.forEach((s) => s.classList.remove("active"));
      swatch.classList.add("active");
      colorLabel.textContent = swatch.dataset.color;
    });
  });

  /* ---- size selector ---- */
  const sizeBtns = document.querySelectorAll(".size-btn");
  const sizeLabel = document.getElementById("sizeLabel");
  let selectedSize = null;
  sizeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      sizeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedSize = btn.dataset.size;
      sizeLabel.textContent = selectedSize;
    });
  });

  /* ---- add to bag ---- */
  const addToBagBtn = document.getElementById("addToBag");
  const bagFeedback = document.getElementById("bagFeedback");
  const bagCount = document.getElementById("bagCount");
  let count = 0;
  addToBagBtn.addEventListener("click", () => {
    if (!selectedSize) {
      bagFeedback.textContent = "Please select a size first.";
      return;
    }
    count += 1;
    bagCount.textContent = String(count);
    bagFeedback.textContent = `Added — Veil Sweatpants (${selectedSize}, ${colorLabel.textContent}).`;
  });

  /* ---- gallery thumbs (visual state only) ---- */
  const thumbs = document.querySelectorAll(".thumb");
  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      thumbs.forEach((t) => t.classList.remove("active"));
      thumb.classList.add("active");
    });
  });

  /* ---- newsletter form ---- */
  const joinForm = document.getElementById("joinForm");
  const joinFeedback = document.getElementById("joinFeedback");
  const joinEmail = document.getElementById("joinEmail");
  joinForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!joinEmail.value) return;
    joinFeedback.textContent = `You're on the list — we'll email ${joinEmail.value} when the drop goes live.`;
    joinForm.reset();
  });
})();
