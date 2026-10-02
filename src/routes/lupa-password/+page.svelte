<script lang="ts">
	/* Hallmark · macrostructure: Centered Auth (letter variant) · genre: editorial
	 * theme: Almanac (system-managed — tokens.css) · enrichment: photo-scrim + interactive blur
	 * nav: none · footer: none · contrast: pass (scrim 62% + paper-terang)
	 * motion: parallax-pointer (≤20px) · scrim-breathe · card-blur-focus
	 * motion-cut project: transform/opacity only · reduced-motion → crossfade 150ms
	 */
	import { enhance } from '$app/forms'
	import { onMount } from 'svelte'

	let { form, data } = $props()

	let error = $state<string | null>(null)
	let sukses = $state<string | null>(null)
	let username = $state('')
	let mengirim = $state(false)

	let parallaxX = $state(0)
	let parallaxY = $state(0)

	onMount(() => {
		const halus = window.matchMedia('(prefers-reduced-motion: reduce)')
		const sentuh = window.matchMedia('(pointer: coarse)')
		if (halus.matches || sentuh.matches) return

		const MAKS = 20
		const onMove = (e: PointerEvent) => {
			const nx = (e.clientX / window.innerWidth - 0.5) * 2
			const ny = (e.clientY / window.innerHeight - 0.5) * 2
			parallaxX = nx * MAKS
			parallaxY = ny * MAKS
		}
		window.addEventListener('pointermove', onMove, { passive: true })
		return () => window.removeEventListener('pointermove', onMove)
	})

	$effect(() => {
		error = form?.error ?? null
		sukses = form?.success ?? null
		username = form?.username ?? ''
	})
</script>

<svelte:head>
	<title>Lupa Password — Sistem Persediaan Bahan Baku</title>
</svelte:head>

<main class="login-wrap">
	<div class="bg" aria-hidden="true">
		<div
			class="bg__foto"
			style="transform: translate3d({parallaxX}px, {parallaxY}px, 0) scale(1.06)"
		></div>
		<div class="bg__scrim"></div>
	</div>

	<section class="card">
		<div class="brand">
			<svg class="logo" viewBox="0 0 24 24" aria-hidden="true">
				<path d="M12 3.5c4.5 2.8 4.5 8.2 0 17-4.5-8.8-4.5-14.2 0-17Z" fill="none" stroke="currentColor" stroke-width="1.6"/>
				<path d="M12 5v15" stroke="currentColor" stroke-width="1.2"/>
			</svg>
			<h1>Lupa Password</h1>
			<p>Ajukan reset password ke Owner</p>
		</div>

		{#if error}
			<div class="alert error" role="alert">{error}</div>
		{/if}
		{#if sukses}
			<div class="alert ok" role="status">{sukses}</div>
		{/if}

		{#if form?.tipe === 'pengajuan'}
			<div class="info">
				Owner akan meninjau pengajuan Anda. Setelah disetujui, password akan
				direset ke <code>12345678</code> — silakan segera ganti setelah masuk.
			</div>
		{:else if form?.tipe === 'owner'}
			<div class="info">
				Jika Anda Owner dan butuh bantuan pemulihan akun, hubungi developer
				aplikasi untuk proses lebih lanjut.
			</div>
		{/if}

		{#if !sukses}
			<form
				method="POST"
				use:enhance={() => {
					error = null
					sukses = null
					mengirim = true
					return async ({ update }) => {
						mengirim = false
						await update()
					}
				}}
			>
				<label>
					Username
					<span class="hint">Masukkan username akun Admin Gudang Anda.</span>
					<input class="input" type="text" name="username" value={username} required autocomplete="username" placeholder="Masukkan username" />
				</label>

				<button class="btn" type="submit" disabled={mengirim} data-state={mengirim ? 'loading' : undefined}>
					{mengirim ? 'Mengirim…' : 'Kirim pengajuan reset'}
				</button>
			</form>
		{/if}

		<a class="kembali" href="/login">← Kembali ke halaman masuk</a>
	</section>
</main>

<style>
	.login-wrap {
		position: relative;
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: clamp(var(--space-md), 4vw, var(--space-2xl));
		background: var(--color-ink);
		overflow: clip;
	}

	.bg {
		position: absolute;
		inset: 0;
		overflow: clip;
		z-index: 0;
	}

	.bg__foto {
		position: absolute;
		inset: -3%;
		background-image: url('/login-bg.jpeg');
		background-size: cover;
		background-position: center;
		will-change: transform;
		transition: transform 320ms var(--ease-out);
	}

	.bg__scrim {
		position: absolute;
		inset: 0;
		background: radial-gradient(
				120% 120% at 50% 42%,
				transparent 0%,
				color-mix(in oklch, var(--color-ink) 58%, transparent) 100%
			),
			color-mix(in oklch, var(--color-ink) 68%, transparent);
		opacity: 1;
		animation: scrim-breathe 11s var(--ease-in-out) infinite;
	}

	@keyframes scrim-breathe {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.88;
		}
	}

	.card {
		position: relative;
		z-index: 1;
		width: min(100%, 24rem);
		background: color-mix(in oklch, var(--color-paper) 82%, transparent);
		backdrop-filter: blur(18px) saturate(1.15);
		border: var(--rule-hair) solid color-mix(in oklch, var(--color-paper) 40%, transparent);
		border-radius: var(--radius-sm);
		padding: clamp(var(--space-lg), 5vw, var(--space-2xl)) clamp(var(--space-md), 5vw, var(--space-xl));
		box-shadow: 0 18px 48px -18px color-mix(in oklch, var(--color-ink) 65%, transparent);
		transition:
			backdrop-filter var(--dur-long) var(--ease-out),
			background-color var(--dur-long) var(--ease-out),
			box-shadow var(--dur-long) var(--ease-out);
	}

	.card:focus-within {
		background: color-mix(in oklch, var(--color-paper) 90%, transparent);
		backdrop-filter: blur(24px) saturate(1.2);
		box-shadow: 0 22px 56px -18px color-mix(in oklch, var(--color-ink) 72%, transparent);
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
		background: color-mix(in oklch, var(--color-paper) 88%, transparent);
		color: var(--color-danger);
		border: var(--rule-hair) solid var(--color-danger);
	}

	.alert.ok {
		background: color-mix(in oklch, var(--color-paper) 88%, transparent);
		color: var(--color-success);
		border: var(--rule-hair) solid var(--color-success);
	}

	.info {
		background: color-mix(in oklch, var(--color-paper) 88%, transparent);
		border: var(--rule-hair) solid var(--color-rule);
		border-radius: var(--radius-sm);
		padding: var(--space-sm) var(--space-md);
		font-size: var(--text-sm);
		color: var(--color-ink-2);
		margin-bottom: var(--space-md);
	}

	.info code {
		font-weight: 700;
		color: var(--color-ink);
	}

	label {
		display: block;
		font-size: var(--text-sm);
		font-weight: 700;
		color: var(--color-ink-2);
		margin-bottom: var(--space-md);
	}

	.hint {
		display: block;
		font-weight: 400;
		color: var(--color-muted);
		font-size: var(--text-xs);
		margin-bottom: var(--space-3xs);
	}

	.input {
		margin-top: var(--space-3xs);
		background: var(--color-paper);
	}

	button {
		width: 100%;
		margin-top: var(--space-2xs);
	}

	.kembali {
		display: block;
		text-align: center;
		margin-top: var(--space-lg);
		font-size: var(--text-sm);
		color: var(--color-accent-deep);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.kembali:hover {
		color: var(--color-accent);
	}

	@media (prefers-reduced-motion: reduce) {
		.bg__foto {
			transform: none !important;
			transition: opacity 150ms var(--ease-out) !important;
		}

		.bg__scrim {
			animation: none;
		}

		.card,
		.card:focus-within {
			transition: opacity 150ms var(--ease-out);
		}
	}

	@media (pointer: coarse) {
		.bg__foto {
			transition: opacity 150ms var(--ease-out);
		}
	}
</style>
