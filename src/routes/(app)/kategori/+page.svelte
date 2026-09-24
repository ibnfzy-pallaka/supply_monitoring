<script lang="ts">
	import { enhance } from '$app/forms'

	let { data, form } = $props()

	let mengirim = $state(false)

	const admin = $derived(data.profile.role === 'admin')

	function selesai() {
		mengirim = false
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
</header>

{#if form?.message}
	<div class="alert alert--error" role="alert">{form.message}</div>
{/if}
{#if form?.created || form?.updated || form?.deleted}
	<div class="alert alert--ok" role="status">{form.created ?? form.updated ?? form.deleted}</div>
{/if}

<div class="grid-kategori">
	{#if admin}
		<section class="panel">
			<h2 class="sub-judul">{data.editing ? 'Ubah kategori' : 'Tambah kategori'}</h2>
			<form
				method="POST"
				action={data.editing ? '?/update' : '?/create'}
				use:enhance={() => {
					mengirim = true
					return async ({ update }) => {
						selesai()
						await update()
					}
				}}
			>
				{#if data.editing}
					<input type="hidden" name="id" value={data.editing.id} />
				{/if}
				<div class="field">
					Nama
					<input
						class="input"
						type="text"
						name="nama"
						required
						value={data.editing?.nama ?? ''}
						placeholder="mis. Kopi"
					/>
				</div>
				<div class="field" style="margin-top: var(--space-md)">
					Deskripsi <span class="hint">(opsional)</span>
					<input
						class="input"
						type="text"
						name="deskripsi"
						value={data.editing?.deskripsi ?? ''}
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
						{mengirim ? 'Menyimpan…' : data.editing ? 'Simpan perubahan' : 'Tambah kategori'}
					</button>
					{#if data.editing}
						<a class="link-aksi" href="/kategori">Batal ubah</a>
					{/if}
				</div>
			</form>
		</section>
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
							{#if admin}<th>Aksi</th>{/if}
						</tr>
					</thead>
					<tbody>
						{#each data.kategori as k (k.id)}
							<tr>
								<td>{k.nama}</td>
								<td>{k.deskripsi || '—'}</td>
								{#if admin}
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
</div>

<style>
	.grid-kategori {
		display: grid;
		grid-template-columns: minmax(0, 22rem) minmax(0, 1fr);
		gap: var(--space-lg);
		align-items: start;
	}

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

	@media (max-width: 54rem) {
		.grid-kategori {
			grid-template-columns: 1fr;
		}
	}
</style>
