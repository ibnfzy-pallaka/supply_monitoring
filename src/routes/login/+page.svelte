<script lang="ts">
	/* Hallmark · macrostructure: Centered Auth (letter variant) · genre: editorial
	 * theme: Almanac (system-managed — tokens.css) · enrichment: photo-scrim + interactive blur
	 * nav: none · footer: none · contrast: pass (scrim 62% + paper-terang)
	 * motion: parallax-pointer (≤20px) · scrim-breathe · card-blur-focus
	 * motion-cut project: transform/opacity only · reduced-motion → crossfade 150ms
	 * pre-emit critique: P5 H4 E5 S4 R5 V5
	 */
	import { enhance } from '$app/forms'
	import { onMount } from 'svelte'

	let { form, data } = $props()

	let error = $state<string | null>(null)
	let username = $state('')
	let mengirim = $state(false)

	/* Paralax halus — geser background mengikuti pointer. Hanya transform (gate).
	   Nonaktif di touch (pointer: coarse) dan saat prefers-reduced-motion. */
	let parallaxX = $state(0)
	let parallaxY = $state(0)

	onMount(() => {
		const halus = window.matchMedia('(prefers-reduced-motion: reduce)')
		const sentuh = window.matchMedia('(pointer: coarse)')
		if (halus.matches || sentuh.matches) return

		const MAKS = 20 // px — halus & terkendali
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
		username = form?.username ?? ''
	})
</script>

<svelte:head>
	<title>Masuk — Sistem Persediaan Bahan Baku</title>
</svelte:head>

<main class="login-wrap">
	<!-- Lapisan foto + scrim gelap. Foto geser halus (paralax), scrim bernapas. -->
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
		position: relative;
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: clamp(var(--space-md), 4vw, var(--space-2xl));
		background: var(--color-ink); /* fallback sebelum foto load */
		overflow: clip;
	}

	/* ---------- Latar foto + scrim ---------- */
	.bg {
		position: absolute;
		inset: 0;
		overflow: clip;
		z-index: 0;
	}

	.bg__foto {
		position: absolute;
		/* lebih besar dari container agar geser paralax tak menampakkan tepi */
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
		/* scrim gelap 68% + vignette tepi — jaga kontras & fokus ke kartu.
		   linear-gradient overlay; warna via token (gate 48). */
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

	/* ---------- Kartu login — kaca di atas foto ---------- */
	.card {
		position: relative;
		z-index: 1;
		width: min(100%, 24rem);
		/* kertas Almanak semi-transparan + blur kaca (efek frosted glass) */
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

	/* blur interactive — saat form difokus, kaca menebal & lebih opak */
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

	.alert.warn {
		background: color-mix(in oklch, var(--color-paper) 88%, transparent);
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
		/* input di kaca — tetap solid agar teks terbaca penuh */
		background: var(--color-paper);
	}

	button {
		width: 100%;
		margin-top: var(--space-2xs);
	}

	/* ---------- Mobile & reduced-motion ---------- */
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

	/* touch: tampilkan foto statis, blur lembut, tanpa parallax */
	@media (pointer: coarse) {
		.bg__foto {
			transition: opacity 150ms var(--ease-out);
		}
	}
</style>
