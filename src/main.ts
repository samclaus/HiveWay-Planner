// Import the CSS so Vite (and Rollup) will bundle them with the application
import "./styles/reset.css";
import "./styles/base.css";
import "./styles/forms.css";
import "./styles/util.css";
import Root from "./ui/Root.svelte";

export default new Root({
	target: document.body
});
