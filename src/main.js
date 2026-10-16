import "./style.css";
import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp,
} from "firebase/firestore";

const app = document.getElementById("app");
let unsubscribe = null;

function pantallaLogin(error = "") {
  app.innerHTML = `
    <div class="card">
      <h1>Meraki papelería 📝</h1>
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

function pantallaTareas(user) {
  app.innerHTML = `
    <div class="card">
      <h1>Mis tareas</h1>
      <p class="mini">${user.email}</p>
      <div class="fila">
        <input id="nueva" placeholder="Nueva tarea..." />
        <button id="agregar">+</button>
      </div>
      <ul id="lista"></ul>
      <button id="salir" class="sec">Salir</button>
    </div>`;

  const col = collection(db, "users", user.uid, "tasks");
  document.getElementById("agregar").onclick = async () => {
    const input = document.getElementById("nueva");
    if (!input.value.trim()) return;
    await addDoc(col, { texto: input.value.trim(), creada: serverTimestamp() });
    input.value = "";
  };
  document.getElementById("salir").onclick = () => signOut(auth);

  unsubscribe = onSnapshot(query(col, orderBy("creada")), (snap) => {
    const lista = document.getElementById("lista");
    lista.innerHTML = "";
    snap.forEach((d) => {
      const li = document.createElement("li");
      li.innerHTML = `<span></span><button>🗑️</button>`;
      li.querySelector("span").textContent = d.data().texto;
      li.querySelector("button").onclick = () =>
        deleteDoc(doc(db, "users", user.uid, "tasks", d.id));
      lista.appendChild(li);
    });
  });
}

onAuthStateChanged(auth, (user) => {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  user ? pantallaTareas(user) : pantallaLogin();
});