<script lang="ts">
	import { enhance } from '$app/forms'
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import Modal from '$lib/components/Modal.svelte'

	let { data, form } = $props()

	let mengirim = $state(false)
	let pesanSukses = $state<string | null>(null)

	const owner = $derived(data.profile.role === 'owner')
	const editId = $derived(page.url.searchParams.get('edit') ?? '')
	const modalTambah = $derived(page.url.searchParams.get('modal') === 'tambah')
	const editing = $derived(data.kategori.find((k) => k.id === editId) ?? null)

	const modalBuka = $derived(owner && (modalTambah || editing !== null))
	const modalJudul = $derived(editing ? 'Ubah kategori' : 'Tambah kategori')

	function selesai() {
		mengirim = false
	}

	function tutupModal() {
		goto(page.url.pathname, { replaceState: true, noScroll: true })
	}
</script>

<svelte:head>
	<title>Kategori — Kopi Waskita</title>
</svelte:head>

<header class="page-head">
	<div>
		<h1>Kategori</h1>
		<p class="sub">Pengelompokan bahan: kopi, susu, sirup, kemasan, dan lainnya.</p>
	</div>
	{#if owner}
		<a class="btn" href="/kategori?modal=tambah">Tambah kategori</a>
	{/if}
</header>

{#if !modalBuka && form?.message}
	<div class="alert alert--error" role="alert">{form.message}</div>
{/if}
{#if pesanSukses || form?.created || form?.updated || form?.deleted}
	<div class="alert alert--ok" role="status">
		{pesanSukses ?? form?.created ?? form?.updated ?? form?.deleted}
	</div>
{/if}

<section class="panel">
	<h2 class="sub-judul">Daftar kategori</h2>
	{#if data.kategori.length === 0}
		<p class="kosong">Belum ada kategori.</p>
	{:else}
		<div class="tabel-wrap">
			<table class="table">
				<thead>
					<tr>
						<th>Nama</th>
						<th>Deskripsi</th>
						{#if owner}<th>Aksi</th>{/if}
					</tr>
				</thead>
				<tbody>
					{#each data.kategori as k (k.id)}
						<tr>
							<td>{k.nama}</td>
							<td>{k.deskripsi || '—'}</td>
							{#if owner}
								<td class="aksi">
									<a class="link-aksi" href="/kategori?edit={k.id}">Ubah</a>
									<form
										method="POST"
										action="?/delete"
										use:enhance={() => {
											mengirim = true
											return async ({ update }) => {
												selesai()
												await update()
											}
										}}
									>
										<input type="hidden" name="id" value={k.id} />
										<button
											class="btn btn--ghost btn--sm"
											type="submit"
											disabled={mengirim}
											onclick={(e) => {
												if (!confirm(`Hapus kategori “${k.nama}”?`)) e.preventDefault()
											}}
										>
											Hapus
										</button>
									</form>
								</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>

{#if owner}
	<Modal buka={modalBuka} judul={modalJudul} onclose={tutupModal}>
		<form
			method="POST"
			action={editing ? '?/update' : '?/create'}
			use:enhance={() => {
				mengirim = true
				return async ({ result, update }) => {
					selesai()
					if (result.type === 'success' && result.data) {
						const res = result.data as { created?: string; updated?: string }
						pesanSukses = res.created ?? res.updated ?? 'Berhasil disimpan.'
						tutupModal()
					} else {
						await update()
					}
				}
			}}
		>
			{#if form?.message}
				<div class="alert alert--error" role="alert">{form.message}</div>
			{/if}

			{#if editing}
				<input type="hidden" name="id" value={editing.id} />
			{/if}
			<div class="field">
				Nama
				<input
					class="input"
					type="text"
					name="nama"
					required
					value={editing?.nama ?? ''}
					placeholder="mis. Kopi"
				/>
			</div>
			<div class="field" style="margin-top: var(--space-md)">
				Deskripsi <span class="hint">(opsional)</span>
				<input
					class="input"
					type="text"
					name="deskripsi"
					value={editing?.deskripsi ?? ''}
					placeholder="Biji dan bubuk kopi"
				/>
			</div>
			<div class="form-actions">
				<button
					class="btn"
					type="submit"
					disabled={mengirim}
					data-state={mengirim ? 'loading' : undefined}
				>
					{mengirim ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Tambah kategori'}
				</button>
				<button type="button" class="btn btn--ghost" onclick={tutupModal}>Batal</button>
			</div>
		</form>
	</Modal>
{/if}

<style>
	.sub-judul {
		margin: 0 0 var(--space-md);
		font-size: var(--text-md);
	}

	.aksi {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		white-space: nowrap;
	}

	.aksi form {
		margin: 0;
	}
</style>
