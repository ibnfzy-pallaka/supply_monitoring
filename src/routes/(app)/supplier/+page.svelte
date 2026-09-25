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
	const editing = $derived(data.editing)

	const modalBuka = $derived(owner && (modalTambah || editing !== null))
	const modalJudul = $derived(editing ? `Ubah Supplier: ${editing.nama}` : 'Tambah Supplier Baru')

	function selesai() {
		mengirim = false
	}

	function tutupModal() {
		goto(page.url.pathname, { replaceState: true, noScroll: true })
	}
</script>

<svelte:head>
	<title>Supplier — Kopi Waskita</title>
</svelte:head>

<header class="page-head">
	<div>
		<h1>Supplier / Vendor</h1>
		<p class="sub">Data pemasok bahan baku: nama, kontak, alamat, dan daftar bahan yang disuplai.</p>
	</div>
	{#if owner}
		<a class="btn" href="/supplier?modal=tambah">Tambah supplier</a>
	{/if}
</header>

{#if !modalBuka && form?.message}
	<div class="alert alert--error" role="alert">{form.message}</div>
{/if}
{#if pesanSukses || form?.created || form?.updated}
	<div class="alert alert--ok" role="status">{pesanSukses ?? form?.created ?? form?.updated}</div>
{/if}
{#if form?.deleted}
	<div class="alert alert--ok" role="status">Supplier dihapus.</div>
{/if}

<div class="panel">
	{#if data.supplier.length === 0}
		<p class="kosong">
			Belum ada supplier.
			{#if owner}Tambahkan lewat tombol “Tambah supplier”.{/if}
		</p>
	{:else}
		<div class="tabel-wrap">
			<table class="table">
				<thead>
					<tr>
						<th>Nama</th>
						<th>Kontak</th>
						<th>Alamat</th>
						<th class="num">Bahan disuplai</th>
						{#if owner}<th>Aksi</th>{/if}
					</tr>
				</thead>
				<tbody>
					{#each data.supplier as s (s.id)}
						<tr>
							<td>{s.nama}</td>
							<td>{s.kontak || '—'}</td>
							<td>{s.alamat || '—'}</td>
							<td class="num">{s.jumlahBahan} bahan</td>
							{#if owner}
								<td class="aksi">
									<a class="link-aksi" href="/supplier?edit={s.id}">Ubah</a>
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
										<input type="hidden" name="id" value={s.id} />
										<button
											class="btn btn--ghost btn--sm"
											type="submit"
											disabled={mengirim}
											onclick={(e) => {
												if (!confirm(`Hapus supplier “${s.nama}”?`)) e.preventDefault()
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
</div>

{#if owner}
	<Modal buka={modalBuka} judul={modalJudul} onclose={tutupModal}>
		{#if form?.message}
			<div class="alert alert--error" role="alert">{form.message}</div>
		{/if}

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
			{#if editing}
				<input type="hidden" name="id" value={editing.id} />
			{/if}

			<div class="form-grid">
				<label class="field">
					Nama supplier
					<input
						class="input"
						type="text"
						name="nama"
						required
						value={editing?.nama ?? ''}
						placeholder="PT Kopi Nusantara"
					/>
				</label>
				<label class="field">
					Kontak <span class="hint">(opsional)</span>
					<input
						class="input"
						type="text"
						name="kontak"
						value={editing?.kontak ?? ''}
						placeholder="0812… / nama PIC"
					/>
				</label>
				<label class="field field--full">
					Alamat <span class="hint">(opsional)</span>
					<input
						class="input"
						type="text"
						name="alamat"
						value={editing?.alamat ?? ''}
						placeholder="Jl. …, Makassar"
					/>
				</label>
			</div>

			<fieldset class="daftar-bahan">
				<legend>Daftar bahan yang disuplai <span class="hint">(opsional)</span></legend>
				{#if data.semuaBahan.length === 0}
					<p class="kosong">Belum ada data bahan baku — tambah dulu di menu Bahan Baku.</p>
				{:else}
					<div class="opsi-bahan">
						{#each data.semuaBahan as b (b.id)}
							<label class="opsi">
								<input
									type="checkbox"
									name="bahan"
									value={b.id}
									checked={editing?.bahanTerpilih.includes(b.id) ?? false}
								/>
								<span>{b.nama} <small>({b.kode} · {b.satuan})</small></span>
							</label>
						{/each}
					</div>
				{/if}
			</fieldset>

			<div class="form-actions">
				<button class="btn" type="submit" disabled={mengirim} data-state={mengirim ? 'loading' : undefined}>
					{mengirim ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Simpan supplier'}
				</button>
				<button type="button" class="btn btn--ghost" onclick={tutupModal}>Batal</button>
			</div>
		</form>
	</Modal>
{/if}

<style>
	.aksi {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		white-space: nowrap;
	}

	.aksi form {
		margin: 0;
	}

	.daftar-bahan {
		border: 0;
		margin: var(--space-lg) 0 0;
		padding: 0;
	}

	.daftar-bahan legend {
		font-size: var(--text-sm);
		font-weight: 700;
		color: var(--color-ink-2);
		margin-bottom: var(--space-sm);
		padding: 0;
	}

	.hint {
		font-weight: 400;
		color: var(--color-muted);
		font-size: var(--text-xs);
	}

	.opsi-bahan {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
		gap: var(--space-xs);
		max-height: 14rem;
		overflow-y: auto;
		padding: var(--space-2xs);
	}

	.opsi {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		font-size: var(--text-sm);
		font-weight: 400;
		color: var(--color-ink);
		border: var(--rule-hair) solid var(--color-rule);
		border-radius: var(--radius-sm);
		padding: var(--space-xs) var(--space-sm);
		cursor: pointer;
	}

	.opsi:hover {
		border-color: var(--color-accent);
	}

	.opsi input {
		accent-color: var(--color-accent-deep);
	}

	.opsi small {
		color: var(--color-muted);
	}
</style>
