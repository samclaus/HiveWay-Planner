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

<main>
	<h1>HiveWay Planner</h1>
	{#if errText}
		<div class="error-banner">
			{errText}
		</div>
	{/if}
	<form on:submit|preventDefault={handleFormSubmit}>
		<TextField label="Username" required bind:value={username} autofocus />
		<TextField label="Password" required bind:value={password} />

		{#if register}
			<TextField label="Email" required bind:value={email} />
		{/if}

		<label for="register_checkbox">
			<input
				id="register_checkbox"
				type="checkbox"
				bind:checked={register}
				disabled={authenticating}>
			<span>I am a new user</span>
		</label>
		<button type="submit" disabled={authenticating}>
			Login
		</button>
	</form>
</main>

<style>
	main {
		padding-top: 32px;

		display: flex;
		flex-direction: column;
		place-items: center center;

		text-align: center;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

	h1 {
		color: #ff3e00;

		font-size: 4em;
		font-weight: 100;
	}

	.error-banner {
		padding: 12px;
		background-color: rgba(211, 47, 47, .3);
		border: 2px solid #D32F2F;
		border-radius: 8px;
		margin-bottom: 24px;
	}
</style>
