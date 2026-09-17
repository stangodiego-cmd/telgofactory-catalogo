"use strict";

/* Extensión TELGOFACTORY: mejoras móviles + línea de bolsas */

CONFIG.logo = "logo PNG Telgofactory.png";
CONFIG.bolsaFlyer = "https://stangodiego-cmd.github.io/telgofactory-catalogo/bolsa_2.png?v=20260917-2053";

const BAG_ID = "bolsa-telgopor-110l";
const BAG_ARTICLE = {
  id: BAG_ID,
  nombre: "Bolsa de telgopor molido 110 litros",
  variante: "110 litros",
  familiaId: "bolsas-telgopor",
  familiaNombre: "Bolsas de telgopor molido",
  categoriaId: "bolsas",
  categoriaNombre: "Bolsas de telgopor molido"
};

const construirIndicesBase = construirIndices;
construirIndices = function () {
  construirIndicesBase();
  articuloIndex.set(BAG_ID, BAG_ARTICLE);
};

const renderEstadoBase = renderEstado;
renderEstado = function (state) {
  if (state && state.view === "bags") {
    renderBolsasTelgoFactory();
    return;
  }
  renderEstadoBase(state);
};

const obtenerPrecioBase = obtenerPrecio;
obtenerPrecio = function (articuloId, cantidad) {
  if (articuloId !== BAG_ID) {
    return obtenerPrecioBase(articuloId);
  }

  const q = normalizarCantidad(
    cantidad === undefined ? (carrito[BAG_ID] || 1) : cantidad
  );
  const escala = obtenerEscalaBolsa(q);
  return escala ? escala.precio : null;
};

function obtenerEscalasBolsas() {
  if (!precios || !Array.isArray(precios.escalas_bolsas)) return [];
  return precios.escalas_bolsas;
}

function obtenerEscalaBolsa(cantidad) {
  const q = normalizarCantidad(cantidad);
  return obtenerEscalasBolsas().find((escala) => {
    const cumpleMax = escala.max === null || escala.max === undefined || q <= escala.max;
    return q >= escala.min && cumpleMax;
  }) || null;
}

function textoEscalaBolsa(escala) {
  if (!escala) return "";
  if (escala.max === null || escala.max === undefined) {
    return `${escala.min} o más`;
  }
  return `${escala.min} a ${escala.max}`;
}

function renderBolsasTelgoFactory() {
  const contenedor = document.getElementById("bolsas-contenido");
  const seccion = document.getElementById("vista-bolsas");
  if (!contenedor || !seccion) return;

  const encabezado = seccion.querySelector(".section-heading");
  if (encabezado) encabezado.hidden = true;

  const escalas = obtenerEscalasBolsas();

  contenedor.innerHTML = `
    <nav class="breadcrumb" aria-label="Ruta de navegación">
      <button type="button" id="bolsas-inicio">Inicio</button>
      <span>›</span>
      <span>Bolsas de telgopor molido</span>
    </nav>

    <article class="bags-detail">
      <div class="family-media bags-media">
        <img
          src="${CONFIG.bolsaFlyer}"
          alt="Bolsa de telgopor molido de 110 litros"
          class="family-flyer bags-flyer"
          id="bolsa-flyer"
        >
        <div id="bolsa-imagen-aviso" class="bag-image-warning" hidden>
          Falta cargar la foto de la bolsa.
        </div>
      </div>

      <div class="family-info bags-info">
        <p class="eyebrow">TELGOFACTORY · Fábrica directa</p>
        <h1>Bolsa de telgopor molido de 110 litros</h1>
        <p class="family-description">
          Para rellenos, nivelaciones, aislación y preparación de hormigón liviano.
        </p>

        <div class="bags-facts">
          <div><strong>Rendimiento</strong><span>7 bolsas cubren 1 m³ de mezcla</span></div>
          <div><strong>Medidas llena</strong><span>85 cm de alto × 38 cm de diámetro</span></div>
          <div><strong>Bolsa cerrada</strong><span>110 cm de alto × 50 cm de ancho</span></div>
        </div>

        <div class="bags-mix">
          <h2>Dosificación recomendada</h2>
          <p>1 bolsa de telgopor molido + 1 balde de cemento + 1 balde de arena + 100 ml de aditivo.</p>
          <p class="bags-note">
            El aditivo no lo vendemos. Pedilo como “aditivo para hormigón celular” (por ejemplo Tacurú o Sika).
          </p>
        </div>

        <div class="bags-prices">
          <h2>Precio por cantidad</h2>
          <div class="bags-price-grid">
            ${escalas.map((e) => `
              <div class="bag-price-card">
                <span>${textoEscalaBolsa(e)} bolsas</span>
                <strong>${formatoPrecio(e.precio)} c/u</strong>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="bag-buy-box">
          <label class="bag-buy-label" for="bag-qty">Cantidad de bolsas</label>
          <div class="bag-buy-row">
            <div class="quantity-control bag-quantity-control">
              <button id="bag-minus" type="button" aria-label="Disminuir cantidad">−</button>
              <input id="bag-qty" type="number" min="1" step="1" inputmode="numeric" value="1">
              <button id="bag-plus" type="button" aria-label="Aumentar cantidad">+</button>
            </div>
            <div class="bag-current-price">
              <span>Precio unitario</span>
              <strong id="bag-unit-price"></strong>
              <small id="bag-scale-label"></small>
            </div>
          </div>

          <div class="bag-subtotal-row">
            <span>Subtotal</span>
            <strong id="bag-subtotal"></strong>
          </div>

          <button id="bag-add-cart" class="add-cart-button bag-add-cart" type="button">
            Agregar al carrito
          </button>
        </div>
      </div>
    </article>
  `;

  const flyer = document.getElementById("bolsa-flyer");
  const aviso = document.getElementById("bolsa-imagen-aviso");
  flyer.addEventListener("error", () => {
    flyer.hidden = true;
    aviso.hidden = false;
  });

  document.getElementById("bolsas-inicio").addEventListener("click", () => {
    navegar({ view: "home" });
  });

  const input = document.getElementById("bag-qty");
  const precioEl = document.getElementById("bag-unit-price");
  const escalaEl = document.getElementById("bag-scale-label");
  const subtotalEl = document.getElementById("bag-subtotal");
  const agregar = document.getElementById("bag-add-cart");

  const actualizar = () => {
    const cantidad = normalizarCantidad(input.value);
    input.value = String(cantidad);
    const escala = obtenerEscalaBolsa(cantidad);
    const precio = escala ? escala.precio : null;
    precioEl.textContent = precio === null ? "Consultar" : `${formatoPrecio(precio)} c/u`;
    escalaEl.textContent = escala ? `${textoEscalaBolsa(escala)} bolsas` : "";
    subtotalEl.textContent = precio === null ? "—" : formatoPrecio(precio * cantidad);
    agregar.disabled = precio === null;
  };

  document.getElementById("bag-minus").addEventListener("click", () => {
    input.value = String(Math.max(1, normalizarCantidad(input.value) - 1));
    actualizar();
  });

  document.getElementById("bag-plus").addEventListener("click", () => {
    input.value = String(normalizarCantidad(input.value) + 1);
    actualizar();
  });

  input.addEventListener("input", actualizar);
  input.addEventListener("change", actualizar);

  agregar.addEventListener("click", () => {
    const cantidad = normalizarCantidad(input.value);
    agregarAlCarrito(BAG_ID, cantidad);
    input.value = "1";
    actualizar();
  });

  actualizar();
  mostrarVista("bags");
}
