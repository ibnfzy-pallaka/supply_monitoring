<script lang="ts">
	import { enhance } from '$app/forms'

	let { data, form } = $props()

	let mengirim = $state(false)

	const admin = $derived(data.profile.role === 'admin')
</script>

<svelte:head>
	<title>Supplier — Kopi Waskita</title>
</svelte:head>

<header class="page-head">
	<div>
		<h1>Supplier / Vendor</h1>
		<p class="sub">Data pemasok bahan baku: nama, kontak, alamat, dan daftar bahan yang disuplai.</p>
	</div>
	{#if admin}
		<a class="btn" href="/supplier/baru">Tambah supplier</a>
	{/if}
</header>

{#if form?.message}
	<div class="alert alert--error" role="alert">{form.message}</div>
{/if}
{#if form?.deleted}
	<div class="alert alert--ok" role="status">Supplier dihapus.</div>
{/if}

<div class="panel">
	{#if data.supplier.length === 0}
		<p class="kosong">
			Belum ada supplier.
			{#if admin}Tambahkan lewat tombol “Tambah supplier”.{/if}
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
						{#if admin}<th>Aksi</th>{/if}
					</tr>
				</thead>
				<tbody>
					{#each data.supplier as s (s.id)}
						<tr>
							<td>{s.nama}</td>
							<td>{s.kontak || '—'}</td>
							<td>{s.alamat || '—'}</td>
							<td class="num">{s.jumlahBahan} bahan</td>
							{#if admin}
								<td class="aksi">
									<a class="link-aksi" href="/supplier/{s.id}">Ubah</a>
									<form
										method="POST"
										action="?/delete"
										use:enhance={() => {
											mengirim = true
											return async ({ update }) => {
												mengirim = false
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
</style>
