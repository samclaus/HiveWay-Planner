<script lang="ts">
	import { authenticate, SESSION$ } from "../state/session";
	import TextField from "./widgets/TextField.svelte";

	let register = false;
	let username = "";
	let password = "";
	let regToken = "";
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
			registration_token: regToken,
			username,
			password,
			email,
		} : {
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
				Log in to an existing
			{/if}
			account
		</h2>

		{#if register}
			<p>
				You do not need to provide an email to create an account, but it
				may be desirable for communication within your organization. The
				username restrictions are quite lax so you may also use an email
				address as your username if it makes things easier to keep track
				of, but the system will not treat the username field any
				differently if you do so.
			</p>
			<p>
				You <strong>must</strong> provide a valid registration token. If
				you do not have one, contact a system administrator.
			</p>
		{/if}

		<div class="form-fields">

			<TextField label="Username" hint="May be an email address (but is independent from your optional contact email)" maxlength={50} required bind:value={username} autofocus />
			<TextField type="password" label="Password" required bind:value={password} />

			{#if register}
				<TextField label="Registration Token" hint="The secret token an administrator sent you" required bind:value={regToken} />
				<TextField type="email" label="Email" bind:value={email} />
			{/if}

		</div>

		<button type="submit" class="filled" disabled={authenticating}>
			{register ? 'Register' : 'Login'}
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
		transform-origin: bottom center;
	}

	.tab:active {
		transform: scaleY(0.9);
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
		display: block;
		width: 100%;
		max-width: 480px;
	}

	.forgot-password {
		margin: 0 auto;
		display: block;
		border: none;
	}

	.forgot-password:hover {
		outline: none;
		text-decoration: underline;
	}

	.copyright {
		text-align: center;
	}
</style>
