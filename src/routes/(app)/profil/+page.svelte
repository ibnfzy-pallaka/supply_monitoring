<script lang="ts">
	import { enhance } from '$app/forms'

	let { data, form } = $props()

	let mengirim = $state(false)
</script>

<svelte:head>
	<title>Profil — Kopi Waskita</title>
</svelte:head>

<header class="page-head">
	<div>
		<h1>Profil &amp; Password</h1>
		<p class="sub">Ganti password akun Anda sendiri.</p>
	</div>
</header>

<div class="grid-profil">
	<section class="panel">
		<h2 class="sub-judul">Data akun</h2>
		<dl class="data-akun">
			<div>
				<dt>Nama</dt>
				<dd>{data.profile.nama}</dd>
			</div>
			<div>
				<dt>Email</dt>
				<dd>{data.profile.email}</dd>
			</div>
			<div>
				<dt>Peran</dt>
				<dd>{data.profile.role === 'admin' ? 'Admin / Pemilik' : 'Staff'}</dd>
			</div>
		</dl>
	</section>

	<section class="panel">
		<h2 class="sub-judul">Ganti password</h2>
		<form
			method="POST"
			use:enhance={() => {
				mengirim = true
				return async ({ update }) => {
					mengirim = false
					await update()
				}
			}}
		>
			{#if form?.message}
				<div class="alert alert--error" role="alert">{form.message}</div>
			{/if}
			{#if form?.success}
				<div class="alert alert--ok" role="status">{form.success}</div>
			{/if}

			<div class="field">
				Password baru
				<span class="hint">Minimal 6 karakter</span>
				<input class="input" type="password" name="password" required minlength="6" autocomplete="new-password" />
			</div>
			<div class="field" style="margin-top: var(--space-md)">
				Ulangi password baru
				<input class="input" type="password" name="ulang" required minlength="6" autocomplete="new-password" />
			</div>

			<div class="form-actions">
				<button class="btn" type="submit" disabled={mengirim} data-state={mengirim ? 'loading' : undefined}>
					{mengirim ? 'Menyimpan…' : 'Perbarui password'}
				</button>
			</div>
		</form>
	</section>
</div>

<style>
	.grid-profil {
		display: grid;
		grid-template-columns: minmax(0, 22rem) minmax(0, 26rem);
		gap: var(--space-lg);
		align-items: start;
	}

	.sub-judul {
		margin: 0 0 var(--space-md);
		font-size: var(--text-md);
	}

	.data-akun {
		margin: 0;
		display: grid;
		gap: var(--space-md);
	}

	.data-akun dt {
		font-size: var(--text-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-muted);
		margin-bottom: var(--space-3xs);
	}

	.data-akun dd {
		margin: 0;
		font-size: var(--text-base);
		color: var(--color-ink);
	}

	@media (max-width: 54rem) {
		.grid-profil {
			grid-template-columns: 1fr;
		}
	}
</style>
