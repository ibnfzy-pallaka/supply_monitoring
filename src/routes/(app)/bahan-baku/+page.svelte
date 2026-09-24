<script lang="ts">
	import { enhance } from '$app/forms'
	import { formatJumlah, formatRupiah, statusStok } from '$lib/format'

	let { data, form } = $props()

	let mengirim = $state(false)

	const admin = $derived(data.profile.role === 'admin')
</script>

<svelte:head>
	<title>Bahan Baku — Kopi Waskita</title>
</svelte:head>

<header class="page-head">
	<div>
		<h1>Bahan Baku</h1>
		<p class="sub">
			Data induk bahan: kode, kategori, satuan, batas minimum, dan harga satuan. Pencarian &
			 filter per kategori tersedia di bawah.
		</p>
	</div>
	{#if admin}
		<a class="btn" href="/bahan-baku/baru">Tambah bahan</a>
	{/if}
</header>

{#if form?.message}
	<div class="alert alert--error" role="alert">{form.message}</div>
{/if}
{#if form?.deleted}
	<div class="alert alert--ok" role="status">Bahan baku dihapus.</div>
{/if}

<form class="filters" method="GET">
	<input
		class="input"
		type="search"
		name="q"
		placeholder="Cari nama atau kode…"
		value={data.q}
		aria-label="Cari bahan"
	/>
	<select class="input" name="kategori" aria-label="Filter kategori">
		<option value="">Semua kategori</option>
		{#each data.kategori as k (k.id)}
			<option value={k.id} selected={data.kategoriId === k.id}>{k.nama}</option>
		{/each}
	</select>
	<button class="btn btn--ghost" type="submit">Terapkan</button>
	{#if data.q || data.kategoriId}
		<a class="link-aksi" href="/bahan-baku">Reset</a>
	{/if}
</form>

<div class="panel">
	{#if data.bahan.length === 0}
		<p class="kosong">
			{data.q || data.kategoriId
				? 'Tidak ada bahan yang cocok dengan pencarian/filter.'
				: 'Belum ada data bahan baku.'}
			{#if admin && !data.q && !data.kategoriId}
				Tambahkan lewat tombol “Tambah bahan”.
			{/if}
		</p>
	{:else}
		<div class="tabel-wrap">
			<table class="table">
				<thead>
					<tr>
						<th>Kode</th>
						<th>Nama</th>
						<th>Kategori</th>
						<th class="num">Stok</th>
						<th class="num">Min.</th>
						<th class="num">Harga / satuan</th>
						{#if admin}<th>Aksi</th>{/if}
					</tr>
				</thead>
				<tbody>
					{#each data.bahan as b (b.id)}
						<tr>
							<td>{b.kode}</td>
							<td>{b.nama}</td>
							<td>{b.kategoriNama}</td>
							<td class="num">
								{formatJumlah(b.stokAktual)} {b.satuan}
								<span class="badge badge--{statusStok(b.stokAktual, b.stokMinimum) === 'habis' ? 'danger' : statusStok(b.stokAktual, b.stokMinimum) === 'menipis' ? 'warn' : 'ok'}">
									{statusStok(b.stokAktual, b.stokMinimum)}
								</span>
							</td>
							<td class="num">{formatJumlah(b.stokMinimum)} {b.satuan}</td>
							<td class="num">{formatRupiah(b.hargaSatuan)}</td>
							{#if admin}
								<td class="aksi">
									<a class="link-aksi" href="/bahan-baku/{b.id}">Ubah</a>
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
										<input type="hidden" name="id" value={b.id} />
										<button
											class="btn btn--ghost btn--sm"
											type="submit"
											disabled={mengirim}
											onclick={(e) => {
												if (!confirm(`Hapus bahan “${b.nama}”? Tidak dapat dipulihkan.`)) {
													e.preventDefault()
												}
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
	.badge {
		margin-left: var(--space-xs);
		vertical-align: middle;
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
