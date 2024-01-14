// Import the CSS so Vite (and Rollup) will bundle them with the application
import "./styles/reset.css";
import "./styles/base.css";
import "./styles/forms.css";
import "./styles/util.css";
import App from "./App.svelte";

const app = new App({
	target: document.body
});

export default app;