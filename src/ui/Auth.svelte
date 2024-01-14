<script lang="ts">
	import TextField from "./widgets/TextField.svelte";
	import { authenticate, SESSION$ } from "../session";

	let register = false;
	let username = "";
	let password = "";
	let email = "";
	let errText = "";

	$: authenticating = $SESSION$.state === "authenticating";
	$: if ($SESSION$.state !== "logged-out" || $SESSION$.authErr === undefined) {
		errText = "";
	} else {
		const authErr = $SESSION$.authErr;

		// TODO: need standard error formatting machinery with i18n
		errText = `Login failed: ${authErr instanceof Error ? authErr.message : "" + authErr}`;
	}

	function handleFormSubmit(): void {
		authenticate(register ? {
			register: true,
			username,
			password,
			email,
		} : {
			register: false,
			username,
			password,
		});
	}
</script>

<main class="legible-width">
	<h1>HiveWay Planner</h1>
	{#if errText}
		<div class="error-banner">
			{errText}
		</div>
	{/if}
	<!-- TODO: this implementation of tabs looks stupid cuz of border intersections -->
	<div class="form-tabs">
		<button
			class="tab login"
			class:active={!register}
			on:click={() => register = false}>
			Login
		</button>
		<button
			class="tab register"
			class:active={register}
			on:click={() => register = true}>
			Register
		</button>
	</div>
	<form
		class="legible-width"
		on:submit|preventDefault={handleFormSubmit}>

		<h2>
			{#if register}
				Register a new
			{:else}
				Log-in to an existing
			{/if}
			account
		</h2>

		<div class="form-fields">

			<TextField label="Username" required bind:value={username} autofocus />
			<TextField label="Password" required bind:value={password} />

			{#if register}
				<TextField label="Email" required bind:value={email} />
			{/if}

		</div>

		<button type="submit" disabled={authenticating}>
			Login
		</button>

		<button type="button" class="forgot-password">
			Forgot your password?
		</button>

	</form>
	<p class="faded copyright">
		Copyright &copy; 2024 Sam Claus
	</p>
</main>

<style>
	main {
		padding: 32px 24px;
	}

	.error-banner {
		padding: 12px;
		background-color: rgba(211, 47, 47, .3);
		border: 2px solid #D32F2F;
		border-radius: 8px;
		margin-bottom: 24px;
	}

	.form-tabs {
		display: flex;
	}

	.tab {
		flex: 1 1 0;
		text-align: center;
		background-color: #fafafa;
		border-radius: 12px 12px 0 0;
		border: 2px solid #aaa;
		border-bottom-color: #777;
		display: inline-block;
		transition: none;
	}

	.tab.active {
		border-color: #777;
		border-bottom-color: #fff;
		background-color: white;
	}

	form {
		border-radius: 0 0 12px 12px;
		border: 2px solid #777;
		border-top-width: 0;
		background-color: #fff;
	}

	[type="submit"] {
		margin: 2em auto 1em;
	}

	.forgot-password {
		min-width: 100%;
		border: none;
		display: block;
		margin: 0 auto;
		text-align: center;
	}

	.forgot-password:hover {
		outline: none;
		text-decoration: underline;
	}

	.copyright {
		text-align: center;
	}
</style>
