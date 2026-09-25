<script lang="ts">
	import { enhance } from '$app/forms'

	let { form, data } = $props()

	let error = $state<string | null>(null)
	let username = $state('')
	let mengirim = $state(false)

	$effect(() => {
		error = form?.error ?? null
		username = form?.username ?? ''
	})
</script>

<svelte:head>
	<title>Masuk — Sistem Persediaan Bahan Baku</title>
</svelte:head>

<main class="login-wrap">
	<section class="card">
		<div class="brand">
			<svg class="logo" viewBox="0 0 24 24" aria-hidden="true">
				<path d="M12 3.5c4.5 2.8 4.5 8.2 0 17-4.5-8.8-4.5-14.2 0-17Z" fill="none" stroke="currentColor" stroke-width="1.6"/>
				<path d="M12 5v15" stroke="currentColor" stroke-width="1.2"/>
			</svg>
			<h1>Kopi Waskita</h1>
			<p>Sistem Informasi Persediaan Bahan Baku</p>
		</div>

		{#if data.nonaktif}
			<div class="alert warn">Sesi berakhir karena akun dinonaktifkan. Hubungi owner bila ini keliru.</div>
		{/if}
		{#if error}
			<div class="alert error" role="alert">{error}</div>
		{/if}

		<form
			method="POST"
			use:enhance={() => {
				error = null
				mengirim = true
				return async ({ update }) => {
					mengirim = false
					await update()
				}
			}}
		>
			<label>
				Username
				<input class="input" type="text" name="username" value={username} required autocomplete="username" placeholder="Masukkan username" />
			</label>
			<label>
				Password
				<input class="input" type="password" name="password" required autocomplete="current-password" placeholder="••••••••" />
			</label>

			<button class="btn" type="submit" disabled={mengirim}>
				{mengirim ? 'Memeriksa…' : 'Masuk'}
			</button>
		</form>
	</section>
</main>

<style>
	.login-wrap {
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: clamp(var(--space-md), 4vw, var(--space-2xl));
		background: var(--color-paper-2);
	}

	.card {
		width: min(100%, 24rem);
		background: var(--color-paper);
		border: var(--rule-hair) solid var(--color-rule);
		border-radius: var(--radius-sm);
		padding: clamp(var(--space-lg), 5vw, var(--space-2xl)) clamp(var(--space-md), 5vw, var(--space-xl));
	}

	.brand {
		text-align: center;
		margin-bottom: var(--space-xl);
	}

	.logo {
		width: 2.25rem;
		height: 2.25rem;
		color: var(--color-accent-deep);
		display: block;
		margin: 0 auto var(--space-3xs);
	}

	.brand h1 {
		margin: 0;
		font-size: var(--text-lg);
		color: var(--color-ink);
		letter-spacing: 0.01em;
	}

	.brand p {
		margin: var(--space-3xs) 0 0;
		color: var(--color-muted);
		font-size: var(--text-sm);
	}

	.alert {
		border-radius: var(--radius-sm);
		padding: var(--space-sm) var(--space-md);
		font-size: var(--text-sm);
		margin-bottom: var(--space-md);
	}

	.alert.error {
		background: var(--color-paper-2);
		color: var(--color-danger);
		border: var(--rule-hair) solid var(--color-danger);
	}

	.alert.warn {
		background: var(--color-paper-2);
		color: var(--color-accent-deep);
		border: var(--rule-hair) solid var(--color-rule);
	}

	label {
		display: block;
		font-size: var(--text-sm);
		font-weight: 700;
		color: var(--color-ink-2);
		margin-bottom: var(--space-md);
	}

	.input {
		margin-top: var(--space-3xs);
	}

	button {
		width: 100%;
		margin-top: var(--space-2xs);
	}
</style>
