<script lang="ts">
	import { formatJumlah, formatTanggal } from '$lib/format'

	let { data } = $props()

	const dipilih = $derived(data.bahan.find((b) => b.id === data.bahanId))

	const labelJenis: Record<string, string> = {
		masuk: 'Masuk',
		keluar: 'Keluar',
		opname: 'Opname'
	}
</script>

<svelte:head>
	<title>Kartu Stok — Kopi Waskita</title>
</svelte:head>

<section class="panel">
	<h2 class="sub-judul">Kartu stok per bahan</h2>
	<form class="filters" method="GET">
		<select class="input" name="bahan" required aria-label="Pilih bahan">
			<option value="" disabled selected>Pilih bahan…</option>
			{#each data.bahan as b (b.id)}
				<option value={b.id} selected={data.bahanId === b.id}>{b.nama} ({b.kode})</option>
			{/each}
		</select>
		<label class="mini">Dari <input class="input" type="date" name="dari" value={data.dari} /></label>
		<label class="mini">Sampai <input class="input" type="date" name="sampai" value={data.sampai} /></label>
		<button class="btn btn--ghost" type="submit">Tampilkan</button>
		{#if data.bahanId}
			<a class="link-aksi" href="/transaksi/kartu-stok">Reset</a>
		{/if}
	</form>

	{#if data.bahanId && dipilih}
		<h3 class="judul-bahan">
			{dipilih.nama} · stok aktual {formatJumlah(dipilih.stokAktual)} {dipilih.satuan}
		</h3>

		{#if data.kartu.length === 0}
			<p class="kosong">Tidak ada pergerakan pada rentang ini.</p>
		{:else}
			<div class="ringkas">
				<span>Stok awal: <strong>{formatJumlah(data.stokAwal)}</strong> {dipilih.satuan}</span>
				<span>Stok akhir: <strong>{formatJumlah(data.stokAkhir)}</strong> {dipilih.satuan}</span>
				<span class="badge badge--{data.konsisten ? 'ok' : 'warn'}">
					{data.konsisten
						? 'Konsisten dengan stok aktual'
						: `Selisih ${formatJumlah(data.selisih)} vs stok aktual`}
				</span>
			</div>

			<div class="tabel-wrap">
				<table class="table">
					<thead>
						<tr>
							<th>Tanggal</th>
							<th>Jenis</th>
							<th class="num">Masuk</th>
							<th class="num">Keluar</th>
							<th class="num">Sisa</th>
							<th>Keterangan</th>
						</tr>
					</thead>
					<tbody>
						<tr class="baris-awal">
							<td colspan="4">Stok awal periode</td>
							<td class="num">{formatJumlah(data.stokAwal)}</td>
							<td>—</td>
						</tr>
						{#each data.kartu as baris, i (i)}
							<tr>
								<td>{formatTanggal(baris.tanggal)}</td>
								<td>
									<span class="badge badge--{baris.jenis === 'masuk'
										? 'ok'
										: baris.jenis === 'keluar'
											? 'warn'
											: 'info'}">{labelJenis[baris.jenis]}</span>
								</td>
								<td class="num">
									{baris.jenis === 'masuk' || (baris.jenis === 'opname' && baris.delta > 0)
										? '+' + formatJumlah(Math.abs(baris.delta))
										: '—'}
								</td>
								<td class="num">
									{baris.jenis === 'keluar' || (baris.jenis === 'opname' && baris.delta < 0)
										? '−' + formatJumlah(Math.abs(baris.delta))
										: '—'}
								</td>
								<td class="num">{formatJumlah(baris.sisa)}</td>
								<td>{baris.keterangan || '—'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{:else}
		<p class="kosong">Pilih bahan untuk melihat riwayat pergerakan stoknya.</p>
	{/if}
</section>

<style>
	.sub-judul {
		margin: 0 0 var(--space-md);
		font-size: var(--text-md);
	}

	.judul-bahan {
		margin: var(--space-lg) 0 var(--space-sm);
		font-size: var(--text-md);
	}

	.filters .input {
		width: auto;
	}

	.mini {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2xs);
		font-size: var(--text-xs);
		color: var(--color-muted);
	}

	.ringkas {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-md);
		margin-bottom: var(--space-md);
		font-size: var(--text-sm);
		color: var(--color-muted);
	}

	.baris-awal td {
		font-style: italic;
		color: var(--color-muted);
	}
</style>
