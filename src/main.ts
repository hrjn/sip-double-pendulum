import { App } from "./app.ts";
import { APP_HTML } from "./html.ts";
import "./styles.css";

const root = document.getElementById("app");
if (!root) throw new Error("missing #app root");

root.innerHTML = APP_HTML;

new App().start();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
