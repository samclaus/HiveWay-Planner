// Import the CSS so Vite (and Rollup) will bundle them with the application
import "./app.css";
import App from "./App.svelte";

const app = new App({
	target: document.body
});

export default app;