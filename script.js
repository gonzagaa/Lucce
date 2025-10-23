
const larguraDaTela = window.innerWidth

if (larguraDaTela < 800) {
  var swiper4 = new Swiper(".mySwiper4", {
      grabCursor: true,
      autoplay: {
          delay: 2000,
          disableOnInteraction: false,
        },
      spaceBetween: 20,
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
    });
} else {
  var swiper4 = new Swiper(".mySwiper4", {
      slidesPerView: 1,
      spaceBetween: 20,
      loop: true,
      grabCursor: true,
      autoplay: {
          delay: 2000,
          disableOnInteraction: false,
        },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
    });
}

if (larguraDaTela < 800) {
  var swiper5 = new Swiper(".mySwiper5", {
      grabCursor: true,
      autoplay: {
          delay: 2000,
          disableOnInteraction: false,
        },
      spaceBetween: 20,
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
    });
} else {
  var swiper5 = new Swiper(".mySwiper5", {
      slidesPerView: 3,
      spaceBetween: 10,
      loop: true,
      grabCursor: true,
      autoplay: {
          delay: 2000,
          disableOnInteraction: false,
        },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
    });
}

if (larguraDaTela < 800) {
  var swiper6 = new Swiper(".mySwiper6", {
      grabCursor: true,
      autoplay: {
          delay: 5000,
          disableOnInteraction: false,
        },
      spaceBetween: 5,
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
    });
} else {
  var swiper6 = new Swiper(".mySwiper6", {
      slidesPerView: 3,
      spaceBetween: 0,
      loop: true,
      grabCursor: true,
      autoplay: {
          delay: 5000,
          disableOnInteraction: false,
        },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("popupOverlay");
  const content = document.getElementById("popupContent");
  const closeBtn = document.getElementById("popupClose");

  // Mostrar o popup após 2s
  setTimeout(() => {
    overlay.classList.add("active");
    content.classList.add("active");
  }, 2000);

  // Fechar com botão X
  closeBtn.addEventListener("click", () => {
    closePopup();
  });

  // Fechar ao clicar fora do conteúdo (na overlay)
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePopup();
  });

  // Fechar ao clicar em QUALQUER link dentro do popup (ex.: <a href="#plan">...</a>)
  content.addEventListener("click", (e) => {
    const anchor = e.target.closest("a");
    if (anchor) {
      // fecha instantaneamente para não atrapalhar o scroll até a âncora
      closePopup({ instant: true });
      // não damos preventDefault: o navegador segue o link normalmente
    }
  });

  function closePopup(opts = {}) {
    const { instant = false } = opts;
    content.classList.remove("active");

    if (instant) {
      overlay.classList.remove("active");
      overlay.style.opacity = "";
      return;
    }

    overlay.style.opacity = "1";
    setTimeout(() => {
      overlay.classList.remove("active");
      overlay.style.opacity = "";
    }, 300); // mesmo tempo da transição no CSS
  }
});



