 const painel = document.querySelector(".painel");
  const btnPainel = document.getElementById("btn-painel");

  // Alterna entre abrir e fechar
  btnPainel.addEventListener("click", () => {
    painel.classList.toggle("ativo");

    if (painel.classList.contains("ativo")) {
      btnPainel.textContent = "Fechar Painel";
    } else {
      btnPainel.textContent = "Abrir Painel";
    }
  });

   window.addEventListener("load", () => {
      document.querySelector(".painel").classList.add("ativo");
    });