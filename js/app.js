"use strict";

const CONFIG = {
  whatsapp: "5491132181527",
  catalogoUrl: "catalogo.json",
  preciosUrl: "precios.json",
  portada: "portada ok.png",
  logo: "logotipo PNG Telgofactory.png",
  carritoStorageKey: "telgofactory-carrito-v1"
};

let catalogo = null;
let precios = null;
let articuloIndex = new Map();
let familiaIndex = new Map();
let categoriaIndex = new Map();
let carrito = cargarCarrito();

const views = {
  home: document.getElementById("vista-portada"),
  categories: document.getElementById("vista-categorias"),
  families: document.getElementById("vista-familias"),
  family: document.getElementById("vista-familia"),
  bags: document.getElementById("vista-bolsas")
};

const btnVolver = document.getElementById("btn-volver");
const btnCarrito = document.getElementById("btn-carrito");
const btnCerrarCarrito = document.getElementById("btn-cerrar-carrito");
const btnSeguirComprando = document.getElementById("btn-seguir-comprando");
const btnWhatsapp = document.getElementById("btn-whatsapp");

const carritoPanel = document.getElementById("carrito-panel");
const cartOverlay = document.getElementById("cart-overlay");
const cartCount = document.getElementById("cart-count");
const carritoVacio = document.getElementById("carrito-vacio");
const carritoItems = document.getElementById("carrito-items");
const carritoResumen = document.getElementById("carrito-resumen");
const carritoTotal = document.getElementById("carrito-total");

const categoriasGrid = document.getElementById("categorias-grid");
const familiasGrid = document.getElementById("familias-grid");
const familiasTitulo = document.getElementById("familias-titulo");

const breadcrumbFamilias = document.getElementById("breadcrumb-familias");
const breadcrumbFamilia = document.getElementById("breadcrumb-familia");

const familiaFlyer = document.getElementById("familia-flyer");
const familiaCategoria = document.getElementById("familia-categoria");
const familiaNombre = document.getElementById("familia-nombre");
const familiaDescripcion = document.getElementById("familia-descripcion");
const articulosLista = document.getElementById("articulos-lista");

const toast = document.getElementById("toast");

document.addEventListener("DOMContentLoaded", iniciar);

async function iniciar() {
  configurarActivos();
  configurarEventos();

  try {
    const [respuestaCatalogo, respuestaPrecios] = await Promise.all([
      fetch(CONFIG.catalogoUrl, { cache: "no-store" }),
      fetch(CONFIG.preciosUrl, { cache: "no-store" })
    ]);

    if (!respuestaCatalogo.ok) {
      throw new Error("No se pudo cargar catalogo.json");
    }

    if (!respuestaPrecios.ok) {
      throw new Error("No se pudo cargar precios.json");
    }

    catalogo = await respuestaCatalogo.json();
    precios = await respuestaPrecios.json();

    construirIndices();
    limpiarCarritoInvalido();
    renderCarrito();

    history.replaceState(
      {
        view: "home"
      },
      "",
      window.location.pathname
    );

    mostrarVista("home");
  } catch (error) {
    console.error(error);
    mostrarErrorCarga();
  }
}

function configurarActivos() {
  const logo = document.querySelector(".header-logo");
  const portada = document.querySelector(".hero-image");

  if (logo) {
    logo.src = CONFIG.logo;
  }

  if (portada) {
    portada.src = CONFIG.portada;
  }
}

function configurarEventos() {
  document.querySelectorAll("[data-linea]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const linea = boton.dataset.linea;

      if (linea === "herramientas") {
        navegar({
          view: "categories"
        });
      }

      if (linea === "bolsas") {
        navegar({
          view: "bags"
        });
      }
    });
  });

  btnVolver.addEventListener("click", () => {
    history.back();
  });

  btnCarrito.addEventListener("click", abrirCarrito);
  btnCerrarCarrito.addEventListener("click", cerrarCarrito);
  cartOverlay.addEventListener("click", cerrarCarrito);
  btnSeguirComprando.addEventListener("click", cerrarCarrito);
  btnWhatsapp.addEventListener("click", enviarWhatsApp);

  window.addEventListener("popstate", (event) => {
    const state = event.state || { view: "home" };
    renderEstado(state);
  });
}

function construirIndices() {
  articuloIndex.clear();
  familiaIndex.clear();
  categoriaIndex.clear();

  catalogo.categorias.forEach((categoria) => {
    categoriaIndex.set(categoria.id, categoria);

    categoria.familias.forEach((familia) => {
      familiaIndex.set(familia.id, {
        ...familia,
        categoriaId: categoria.id,
        categoriaNombre: categoria.nombre
      });

      familia.articulos.forEach((articulo) => {
        articuloIndex.set(articulo.id, {
          ...articulo,
          familiaId: familia.id,
          familiaNombre: familia.nombre,
          categoriaId: categoria.id,
          categoriaNombre: categoria.nombre
        });
      });
    });
  });
}

function navegar(state) {
  history.pushState(state, "", window.location.pathname);
  renderEstado(state);
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function renderEstado(state) {
  if (!state || !state.view) {
    mostrarVista("home");
    return;
  }

  switch (state.view) {
    case "categories":
      renderCategorias();
      break;

    case "families":
      renderFamilias(state.categoryId);
      break;

    case "family":
      renderFamilia(state.familyId);
      break;

    case "bags":
      mostrarVista("bags");
      break;

    default:
      mostrarVista("home");
      break;
  }
}

function mostrarVista(nombre) {
  Object.values(views).forEach((view) => {
    view.hidden = true;
  });

  if (views[nombre]) {
    views[nombre].hidden = false;
  }

  btnVolver.hidden = nombre === "home";
}

function renderCategorias() {
  if (!catalogo) {
    return;
  }

  categoriasGrid.innerHTML = "";

  catalogo.categorias.forEach((categoria) => {
    const boton = document.createElement("button");

    boton.type = "button";
    boton.className = "category-card";
    boton.innerHTML = `
      <span class="category-card-title">${escaparHtml(categoria.nombre)}</span>
    `;

    boton.addEventListener("click", () => {
      navegar({
        view: "families",
        categoryId: categoria.id
      });
    });

    categoriasGrid.appendChild(boton);
  });

  mostrarVista("categories");
}

function renderFamilias(categoryId) {
  const categoria = categoriaIndex.get(categoryId);

  if (!categoria) {
    navegar({
      view: "categories"
    });
    return;
  }

  familiasTitulo.textContent = categoria.nombre;
  familiasGrid.innerHTML = "";

  renderBreadcrumb(
    breadcrumbFamilias,
    [
      {
        label: "Inicio",
        state: { view: "home" }
      },
      {
        label: "Herramientas, obra y hogar",
        state: { view: "categories" }
      },
      {
        label: categoria.nombre
      }
    ]
  );

  categoria.familias.forEach((familia) => {
    const card = document.createElement("article");
    card.className = "family-card";

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "family-card-button";

    const imagen = document.createElement("img");
    imagen.className = "family-card-image";
    imagen.src = familia.flyer;
    imagen.alt = familia.nombre;
    imagen.loading = "lazy";

    imagen.addEventListener("error", () => {
      imagen.style.display = "none";
    });

    const body = document.createElement("div");
    body.className = "family-card-body";

    const titulo = document.createElement("h2");
    titulo.className = "family-card-title";
    titulo.textContent = familia.nombre;

    const descripcion = document.createElement("p");
    descripcion.className = "family-card-description";
    descripcion.textContent = familia.descripcion;

    body.appendChild(titulo);
    body.appendChild(descripcion);

    boton.appendChild(imagen);
    boton.appendChild(body);

    boton.addEventListener("click", () => {
      navegar({
        view: "family",
        familyId: familia.id
      });
    });

    card.appendChild(boton);
    familiasGrid.appendChild(card);
  });

  mostrarVista("families");
}

function renderFamilia(familyId) {
  const familia = familiaIndex.get(familyId);

  if (!familia) {
    navegar({
      view: "categories"
    });
    return;
  }

  renderBreadcrumb(
    breadcrumbFamilia,
    [
      {
        label: "Inicio",
        state: { view: "home" }
      },
      {
        label: "Herramientas, obra y hogar",
        state: { view: "categories" }
      },
      {
        label: familia.categoriaNombre,
        state: {
          view: "families",
          categoryId: familia.categoriaId
        }
      },
      {
        label: familia.nombre
      }
    ]
  );

  familiaFlyer.src = familia.flyer;
  familiaFlyer.alt = familia.nombre;

  familiaCategoria.textContent = familia.categoriaNombre;
  familiaNombre.textContent = familia.nombre;
  familiaDescripcion.textContent = familia.descripcion;

  articulosLista.innerHTML = "";

  familia.articulos.forEach((articulo) => {
    articulosLista.appendChild(crearFilaArticulo(articulo));
  });

  mostrarVista("family");
}

function crearFilaArticulo(articulo) {
  const fila = document.createElement("div");
  fila.className = "purchasable-item";

  const precio = obtenerPrecio(articulo.id);
  const disponible = precio !== null;

  const nombre = document.createElement("div");
  nombre.className = "product-name";
  nombre.textContent = articulo.nombre;

  const precioElemento = document.createElement("div");
  precioElemento.className = disponible
    ? "product-price"
    : "product-price unavailable";

  precioElemento.textContent = disponible
    ? formatoPrecio(precio)
    : "Consultar";

  const cantidadArea = document.createElement("div");
  cantidadArea.className = "quantity-area";

  const control = document.createElement("div");
  control.className = "quantity-control";

  const menos = document.createElement("button");
  menos.type = "button";
  menos.textContent = "−";
  menos.setAttribute("aria-label", "Disminuir cantidad");

  const input = document.createElement("input");
  input.type = "number";
  input.min = "1";
  input.step = "1";
  input.value = "1";
  input.inputMode = "numeric";
  input.setAttribute("aria-label", `Cantidad de ${articulo.nombre}`);

  const mas = document.createElement("button");
  mas.type = "button";
  mas.textContent = "+";
  mas.setAttribute("aria-label", "Aumentar cantidad");

  menos.addEventListener("click", () => {
    const actual = normalizarCantidad(input.value);
    input.value = Math.max(1, actual - 1);
  });

  mas.addEventListener("click", () => {
    const actual = normalizarCantidad(input.value);
    input.value = actual + 1;
  });

  input.addEventListener("change", () => {
    input.value = normalizarCantidad(input.value);
  });

  control.appendChild(menos);
  control.appendChild(input);
  control.appendChild(mas);

  const agregar = document.createElement("button");
  agregar.type = "button";
  agregar.className = "add-cart-button";
  agregar.textContent = disponible ? "Agregar" : "Sin precio";
  agregar.disabled = !disponible;

  agregar.addEventListener("click", () => {
    const cantidad = normalizarCantidad(input.value);
    agregarAlCarrito(articulo.id, cantidad);
    input.value = "1";
  });

  cantidadArea.appendChild(control);
  cantidadArea.appendChild(agregar);

  fila.appendChild(nombre);
  fila.appendChild(precioElemento);
  fila.appendChild(cantidadArea);

  return fila;
}

function renderBreadcrumb(contenedor, items) {
  contenedor.innerHTML = "";

  items.forEach((item, index) => {
    if (index > 0) {
      const separador = document.createElement("span");
      separador.textContent = "›";
      contenedor.appendChild(separador);
    }

    if (item.state) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.textContent = item.label;

      boton.addEventListener("click", () => {
        navegar(item.state);
      });

      contenedor.appendChild(boton);
    } else {
      const texto = document.createElement("span");
      texto.textContent = item.label;
      contenedor.appendChild(texto);
    }
  });
}

function agregarAlCarrito(articuloId, cantidad) {
  const precio = obtenerPrecio(articuloId);

  if (precio === null) {
    mostrarToast("Este artículo todavía no tiene precio disponible.");
    return;
  }

  carrito[articuloId] = (carrito[articuloId] || 0) + cantidad;

  guardarCarrito();
  renderCarrito();

  const articulo = articuloIndex.get(articuloId);

  mostrarToast(
    `${cantidad} × ${articulo.nombre} agregado al carrito`
  );
}

function renderCarrito() {
  carritoItems.innerHTML = "";

  const ids = Object.keys(carrito).filter((id) => {
    return carrito[id] > 0 && articuloIndex.has(id);
  });

  let totalCentavos = 0;
  let cantidadTotal = 0;
  let cantidadItemsValidos = 0;

  ids.forEach((id) => {
    const articulo = articuloIndex.get(id);
    const precio = obtenerPrecio(id);

    if (precio === null) {
      return;
    }

    const cantidad = carrito[id];
    const precioCentavos = aCentavos(precio);
    const subtotalCentavos = precioCentavos * cantidad;

    totalCentavos += subtotalCentavos;
    cantidadTotal += cantidad;
    cantidadItemsValidos += 1;

    const item = document.createElement("div");
    item.className = "cart-item";

    const titulo = document.createElement("p");
    titulo.className = "cart-item-title";
    titulo.textContent = articulo.nombre;

    const meta = document.createElement("div");
    meta.className = "cart-item-meta";
    meta.textContent =
      `${cantidad} × ${formatoCentavos(precioCentavos)}`;

    const bottom = document.createElement("div");
    bottom.className = "cart-item-bottom";

    const subtotal = document.createElement("div");
    subtotal.className = "cart-item-subtotal";
    subtotal.textContent = formatoCentavos(subtotalCentavos);

    const acciones = document.createElement("div");
    acciones.className = "cart-item-actions";

    const menos = document.createElement("button");
    menos.type = "button";
    menos.textContent = "−";
    menos.setAttribute("aria-label", `Quitar una unidad de ${articulo.nombre}`);

    menos.addEventListener("click", () => {
      cambiarCantidadCarrito(id, cantidad - 1);
    });

    const cantidadTexto = document.createElement("span");
    cantidadTexto.textContent = cantidad;

    const mas = document.createElement("button");
    mas.type = "button";
    mas.textContent = "+";
    mas.setAttribute("aria-label", `Agregar una unidad de ${articulo.nombre}`);

    mas.addEventListener("click", () => {
      cambiarCantidadCarrito(id, cantidad + 1);
    });

    const eliminar = document.createElement("button");
    eliminar.type = "button";
    eliminar.className = "cart-remove";
    eliminar.textContent = "×";
    eliminar.setAttribute("aria-label", `Eliminar ${articulo.nombre}`);

    eliminar.addEventListener("click", () => {
      eliminarDelCarrito(id);
    });

    acciones.appendChild(menos);
    acciones.appendChild(cantidadTexto);
    acciones.appendChild(mas);
    acciones.appendChild(eliminar);

    bottom.appendChild(subtotal);
    bottom.appendChild(acciones);

    item.appendChild(titulo);
    item.appendChild(meta);
    item.appendChild(bottom);

    carritoItems.appendChild(item);
  });

  cartCount.textContent = String(cantidadTotal);

  const carritoTieneItems = cantidadItemsValidos > 0;

  carritoVacio.hidden = carritoTieneItems;
  carritoResumen.hidden = !carritoTieneItems;

  carritoTotal.textContent = formatoCentavos(totalCentavos);
}

function cambiarCantidadCarrito(id, nuevaCantidad) {
  if (nuevaCantidad <= 0) {
    delete carrito[id];
  } else {
    carrito[id] = nuevaCantidad;
  }

  guardarCarrito();
  renderCarrito();
}

function eliminarDelCarrito(id) {
  delete carrito[id];
  guardarCarrito();
  renderCarrito();
}

function limpiarCarritoInvalido() {
  let huboCambios = false;

  Object.keys(carrito).forEach((id) => {
    if (
      !articuloIndex.has(id) ||
      !Number.isInteger(carrito[id]) ||
      carrito[id] <= 0
    ) {
      delete carrito[id];
      huboCambios = true;
    }
  });

  if (huboCambios) {
    guardarCarrito();
  }
}

function abrirCarrito() {
  carritoPanel.classList.add("open");
  carritoPanel.setAttribute("aria-hidden", "false");
  cartOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function cerrarCarrito() {
  carritoPanel.classList.remove("open");
  carritoPanel.setAttribute("aria-hidden", "true");
  cartOverlay.hidden = true;
  document.body.style.overflow = "";
}

function enviarWhatsApp() {
  const ids = Object.keys(carrito).filter((id) => {
    return (
      carrito[id] > 0 &&
      articuloIndex.has(id) &&
      obtenerPrecio(id) !== null
    );
  });

  if (ids.length === 0) {
    mostrarToast("El carrito está vacío.");
    return;
  }

  const lineas = [
    "Hola, quiero realizar el siguiente pedido a TELGOFACTORY:",
    ""
  ];

  let totalCentavos = 0;

  ids.forEach((id) => {
    const articulo = articuloIndex.get(id);
    const cantidad = carrito[id];
    const precioCentavos = aCentavos(obtenerPrecio(id));
    const subtotalCentavos = precioCentavos * cantidad;

    totalCentavos += subtotalCentavos;

    lineas.push(articulo.nombre);
    lineas.push(`Cantidad: ${cantidad}`);
    lineas.push(
      `Precio unitario: ${formatoCentavos(precioCentavos)}`
    );
    lineas.push(
      `Subtotal: ${formatoCentavos(subtotalCentavos)}`
    );
    lineas.push("");
  });

  lineas.push(
    `TOTAL DEL PEDIDO: ${formatoCentavos(totalCentavos)}`
  );

  const mensaje = lineas.join("\n");

  const url =
    `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensaje)}`;

  window.open(url, "_blank", "noopener,noreferrer");
}

function obtenerPrecio(articuloId) {
  if (
    !precios ||
    !precios.precios ||
    !(articuloId in precios.precios)
  ) {
    return null;
  }

  const valor = precios.precios[articuloId];

  if (
    valor === null ||
    valor === undefined ||
    typeof valor !== "number" ||
    !Number.isFinite(valor) ||
    valor < 0
  ) {
    return null;
  }

  return valor;
}

function formatoPrecio(valor) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(valor);
}

function formatoCentavos(centavos) {
  return formatoPrecio(centavos / 100);
}

function aCentavos(valor) {
  return Math.round(valor * 100);
}

function normalizarCantidad(valor) {
  const cantidad = Number.parseInt(valor, 10);

  if (!Number.isFinite(cantidad) || cantidad < 1) {
    return 1;
  }

  return cantidad;
}

function cargarCarrito() {
  try {
    const guardado = localStorage.getItem(CONFIG.carritoStorageKey);

    if (!guardado) {
      return {};
    }

    const objeto = JSON.parse(guardado);

    if (
      objeto &&
      typeof objeto === "object" &&
      !Array.isArray(objeto)
    ) {
      return objeto;
    }

    return {};
  } catch (error) {
    console.warn("No se pudo recuperar el carrito guardado.", error);
    return {};
  }
}

function guardarCarrito() {
  localStorage.setItem(
    CONFIG.carritoStorageKey,
    JSON.stringify(carrito)
  );
}

function mostrarToast(mensaje) {
  toast.textContent = mensaje;
  toast.hidden = false;

  clearTimeout(mostrarToast.timeout);

  mostrarToast.timeout = setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

function mostrarErrorCarga() {
  const main = document.getElementById("main-content");

  main.innerHTML = `
    <section class="view">
      <div class="section-heading">
        <p class="eyebrow">TELGOFACTORY</p>
        <h1>No pudimos cargar el catálogo</h1>
        <p>
          Actualizá la página dentro de unos instantes.
        </p>
      </div>
    </section>
  `;
}

function escaparHtml(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
