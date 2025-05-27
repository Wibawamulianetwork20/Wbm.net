const text1 = "Selamat Datang di ";
const text2 = "Wibawamulia.Network";
let i = 0;

function typeBoth() {
  if (i < text1.length) {
    document.getElementById("part1").innerHTML += text1.charAt(i);
  } else if (i - text1.length < text2.length) {
    document.getElementById("part2").innerHTML += text2.charAt(i - text1.length);
  }
  i++;
  if (i <= text1.length + text2.length) {
    setTimeout(typeBoth, 70);
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener("DOMContentLoaded", () => {
  typeBoth();
});

  // Tutup navbar collapse saat klik link di dalamnya (untuk tampilan mobile)
  document.addEventListener("DOMContentLoaded", function () {
    const navLinks = document.querySelectorAll(".navbar-nav .nav-link");
    const navbarCollapse = document.querySelector(".navbar-collapse");

    navLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        if (navbarCollapse.classList.contains("show")) {
          new bootstrap.Collapse(navbarCollapse).toggle();
        }
      });
    });
  });