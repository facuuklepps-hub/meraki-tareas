import "./style.css";
import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged,
} from "firebase/auth";
import {
  collection, addDoc, deleteDoc, updateDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp,
} from "firebase/firestore";

const app = document.getElementById("app");
let unsubscribe = null;

const TRABAJOS = ["Impresiones a color", "Impresiones blanco y negro",
  "Stickers personalizados", "Plastificados", "Agendas personalizadas",
  "Fotografías", "Folletos", "Tarjetas de presentación",
  "Libros y cuadernillos", "Otro"];
const ESTADOS = ["Pendiente", "En proceso", "Listo", "Entregado"];

const LOGO = `<img src="/logo.png" class="logo" alt="Meraki"
  onerror="this.style.display='none'" />`;

function pantallaLogin(error = "") {
  app.innerHTML = `
    <div class="card login">
      ${LOGO}
      <h1>Meraki papelería creativa</h1>
      <p class="mini">Gestión de pedidos</p>
      <input id="email" type="email" placeholder="Correo" />
      <input id="pass" type="password" placeholder="Contraseña (mín. 6)" />
      <p class="error">${error}</p>
      <button id="entrar">Entrar</button>
      <button id="registro" class="sec">Crear cuenta</button>
    </div>`;
  const email = () => document.getElementById("email").value;
  const pass = () => document.getElementById("pass").value;
  document.getElementById("entrar").onclick = () =>
    signInWithEmailAndPassword(auth, email(), pass()).catch(() =>
      pantallaLogin("Correo o contraseña incorrectos"));
  document.getElementById("registro").onclick = () =>
    createUserWithEmailAndPassword(auth, email(), pass()).catch((e) =>
      pantallaLogin("No se pudo crear: " + e.code));
}

function pantallaPedidos(user) {
  let pedidos = [];
  let filtro = "Todos";

  app.innerHTML = `
    <header class="top">
      ${LOGO}
      <div><h1>Pedidos</h1><p class="mini">${user.email}</p></div>
      <button id="salir" class="sec">Salir</button>
    </header>

    <div class="resumen">
      <div><b id="nActivos">0</b><span>Activos</span></div>
      <div><b id="totalActivo">$0</b><span>Por entregar</span></div>
    </div>

    <div class="card">
      <h2>Nuevo pedido</h2>
      <input id="cliente" placeholder="Cliente" />
      <select id="trabajo">
        ${TRABAJOS.map((t) => `<option>${t}</option>`).join("")}
      </select>
      <div class="fila">
        <input id="cantidad" type="number" min="1" placeholder="Cantidad" />
        <input id="precio" type="number" min="0" placeholder="Precio $" />
      </div>
      <input id="nota" placeholder="Nota (opcional)" />
      <button id="agregar">Agregar pedido</button>
    </div>

    <div class="filtros" id="filtros"></div>
    <ul id="lista"></ul>`;

  const col = collection(db, "users", user.uid, "pedidos");
  const val = (id) => document.getElementById(id).value.trim();

  document.getElementById("salir").onclick = () => signOut(auth);

  document.getElementById("agregar").onclick = async () => {
    if (!val("cliente")) return alert("Escribe el nombre del cliente");
    await addDoc(col, {
      cliente: val("cliente"),
      trabajo: document.getElementById("trabajo").value,
      cantidad: Number(val("cantidad")) || 1,
      precio: Number(val("precio")) || 0,
      nota: val("nota"),
      estado: "Pendiente",
      creada: serverTimestamp(),
    });
    ["cliente", "cantidad", "precio", "nota"].forEach(
      (id) => (document.getElementById(id).value = ""));
  };

  function dibujarFiltros() {
    const cont = document.getElementById("filtros");
    cont.innerHTML = "";
    ["Todos", ...ESTADOS].forEach((f) => {
      const b = document.createElement("button");
      b.textContent = f;
      b.className = "chip" + (f === filtro ? " activo" : "");
      b.onclick = () => { filtro = f; dibujarFiltros(); dibujarLista(); };
      cont.appendChild(b);
    });
  }

  function dibujarLista() {
    const activos = pedidos.filter((p) => p.estado !== "Entregado");
    document.getElementById("nActivos").textContent = activos.length;
    document.getElementById("totalActivo").textContent =
      "$" + activos.reduce((s, p) => s + (p.precio || 0), 0);

    const lista = document.getElementById("lista");
    lista.innerHTML = "";
    pedidos
      .filter((p) => filtro === "Todos" || p.estado === filtro)
      .forEach((p) => {
        const li = document.createElement("li");
        li.className = "pedido";
        li.innerHTML = `
          <div class="info">
            <b class="cl"></b>
            <span class="tr"></span>
            <small class="nt"></small>
          </div>
          <div class="acc">
            <b class="pr"></b>
            <button class="estado"></button>
            <button class="del">🗑️</button>
          </div>`;
        li.querySelector(".cl").textContent = p.cliente;
        li.querySelector(".tr").textContent = `${p.cantidad} × ${p.trabajo}`;
        li.querySelector(".nt").textContent = p.nota || "";
        li.querySelector(".pr").textContent = "$" + (p.precio || 0);
        const be = li.querySelector(".estado");
        be.textContent = p.estado;
        be.dataset.estado = p.estado;
        be.onclick = () => {
          const sig = ESTADOS[(ESTADOS.indexOf(p.estado) + 1) % ESTADOS.length];
          updateDoc(doc(db, "users", user.uid, "pedidos", p.id), { estado: sig });
        };
        li.querySelector(".del").onclick = () => {
          if (confirm("¿Borrar este pedido?"))
            deleteDoc(doc(db, "users", user.uid, "pedidos", p.id));
        };
        lista.appendChild(li);
      });
  }

  dibujarFiltros();
  unsubscribe = onSnapshot(query(col, orderBy("creada", "desc")), (snap) => {
    pedidos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    dibujarLista();
  });
}

onAuthStateChanged(auth, (user) => {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  user ? pantallaPedidos(user) : pantallaLogin();
});