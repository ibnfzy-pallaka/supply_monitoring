<script lang="ts">
	import { enhance } from '$app/forms'
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import Modal from '$lib/components/Modal.svelte'

	let { data, form } = $props()

	let mengirim = $state(false)
	let pesanSukses = $state<string | null>(null)

	const modalBuka = $derived(page.url.searchParams.get('modal') === 'password')

	function selesai() {
		mengirim = false
	}

	function bukaModal() {
		goto(`${page.url.pathname}?modal=password`, { replaceState: true, noScroll: true })
	}

	function tutupModal() {
		goto(page.url.pathname, { replaceState: true, noScroll: true })
	}
</script>

<svelte:head>
	<title>Profil — Kopi Waskita</title>
</svelte:head>

<header class="page-head">
	<div>
		<h1>Profil &amp; Akun</h1>
		<p class="sub">Informasi akun Anda dan pengaturan keamanan kata sandi.</p>
	</div>
</header>

{#if !modalBuka && form?.message}
	<div class="alert alert--error" role="alert">{form.message}</div>
{/if}
{#if pesanSukses || form?.success}
	<div class="alert alert--ok" role="status">{pesanSukses ?? form?.success}</div>
{/if}

<section class="panel panel-profil">
	<h2 class="sub-judul">Data Akun</h2>
	<dl class="data-akun">
		<div>
			<dt>Nama Lengkap</dt>
			<dd>{data.profile.nama}</dd>
		</div>
		<div>
			<dt>Username</dt>
			<dd><code>{data.profile.username}</code></dd>
		</div>
		<div>
			<dt>Hak Akses / Peran</dt>
			<dd>{data.profile.role === 'owner' ? 'Owner / Pemilik' : 'Staff'}</dd>
		</div>
	</dl>

	<div class="aksi-profil">
		<button type="button" class="btn" onclick={bukaModal}>Ganti kata sandi…</button>
	</div>
</section>

<Modal buka={modalBuka} judul="Ganti Kata Sandi" onclose={tutupModal}>
	{#if form?.message}
		<div class="alert alert--error" role="alert">{form.message}</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			mengirim = true
			return async ({ result, update }) => {
				selesai()
				if (result.type === 'success' && result.data) {
					const res = result.data as { success?: string }
					pesanSukses = res.success ?? 'Password berhasil diperbarui.'
					tutupModal()
				} else {
					await update()
				}
			}
		}}
	>
		<div class="field">
			Password baru
			<span class="hint">Minimal 6 karakter</span>
			<input
				class="input"
				type="password"
				name="password"
				required
				minlength="6"
				autocomplete="new-password"
			/>
		</div>
		<div class="field" style="margin-top: var(--space-md)">
			Ulangi password baru
			<input
				class="input"
				type="password"
				name="ulang"
				required
				minlength="6"
				autocomplete="new-password"
			/>
		</div>

		<div class="form-actions">
			<button class="btn" type="submit" disabled={mengirim} data-state={mengirim ? 'loading' : undefined}>
				{mengirim ? 'Menyimpan…' : 'Perbarui password'}
			</button>
			<button type="button" class="btn btn--ghost" onclick={tutupModal}>Batal</button>
		</div>
	</form>
</Modal>

<style>
	.panel-profil {
		max-width: 32rem;
	}

	.sub-judul {
		margin: 0 0 var(--space-lg);
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

	.aksi-profil {
		margin-top: var(--space-xl);
		padding-top: var(--space-lg);
		border-top: var(--rule-hair) solid var(--color-rule);
	}
</style>
