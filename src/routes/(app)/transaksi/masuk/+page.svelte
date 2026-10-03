<script lang="ts">
	import { enhance } from '$app/forms'
	import { formatJumlah, formatRupiah, formatTanggal, hariIni } from '$lib/format'
	import SortableTh from '$lib/components/SortableTh.svelte'
	import { arahBerikut, sortir, type SortDir } from '$lib/sort'

	let { data, form } = $props()

	let mengirim = $state(false)

	// Harga master terisi otomatis saat bahan dipilih (masih bisa diubah manual).
	let bahanId = $state('')
	let hargaSatuan = $state('0')

	function pilihBahan(e: Event) {
		bahanId = (e.currentTarget as HTMLSelectElement).value
		const b = data.bahan.find((x) => x.id === bahanId)
		if (b) hargaSatuan = String(b.harga_satuan)
	}

	// Default: tanggal (terlama) paling atas.
	let sortKey = $state('tanggal')
	let sortDir = $state<SortDir>('asc')
	const transaksi = $derived(sortir(data.transaksi, sortKey, sortDir))

	function gantiSort(kolom: string) {
		sortDir = arahBerikut(sortKey, kolom, sortDir)
		sortKey = kolom
	}

	const total = $derived(
		transaksi.reduce((acc, t) => acc + t.qty * t.hargaSatuan, 0)
	)
</script>

<svelte:head>
	<title>Barang Masuk — Kopi Waskita</title>
</svelte:head>

<div class="grid-2">
	<section class="panel">
		<h2 class="sub-judul">Catat barang masuk</h2>
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

			<div class="form-grid">
				<label class="field">
					Tanggal
					<input class="input" type="date" name="tanggal" value={hariIni()} required />
				</label>
				<label class="field">
					Bahan baku
					<select class="input" name="bahan_baku_id" value={bahanId} onchange={pilihBahan} required>
						<option value="" disabled selected>Pilih bahan…</option>
						{#each data.bahan as b (b.id)}
							<option value={b.id}>{b.nama} ({b.kode})</option>
						{/each}
					</select>
				</label>
				<label class="field">
					Supplier <span class="hint">(opsional)</span>
					<select class="input" name="supplier_id">
						<option value="">— tanpa supplier —</option>
						{#each data.supplier as s (s.id)}
							<option value={s.id}>{s.nama}</option>
						{/each}
					</select>
				</label>
				<fieldset class="field field--full sumber">
					<legend>Sumber pembayaran</legend>
					<div class="sumber__pilihan">
						<label class="sumber__opsi">
							<input type="radio" name="sumber_pembayaran" value="tunai" checked />
							Tunai
						</label>
						<label class="sumber__opsi">
							<input type="radio" name="sumber_pembayaran" value="transfer" />
							Transfer
						</label>
					</div>
				</fieldset>
				<label class="field">
					Qty masuk
					<input class="input" type="number" name="qty" min="0.01" step="any" required placeholder="0" />
				</label>
				<label class="field">
					Harga satuan (Rp)
					<span class="hint">Terisi otomatis dari harga bahan, bisa diubah</span>
					<input
						class="input"
						type="number"
						name="harga_satuan"
						min="0"
						step="any"
						bind:value={hargaSatuan}
						required
					/>
				</label>
				<label class="field field--full">
					Keterangan <span class="hint">(opsional)</span>
					<input class="input" type="text" name="keterangan" placeholder="mis. pembelian tunai" />
				</label>
			</div>

			<div class="form-actions">
				<button class="btn" type="submit" disabled={mengirim} data-state={mengirim ? 'loading' : undefined}>
					{mengirim ? 'Menyimpan…' : 'Catat masuk'}
				</button>
			</div>
		</form>
	</section>

	<section class="panel">
		<h2 class="sub-judul">Riwayat terakhir (maks. 100)</h2>
		{#if data.transaksi.length === 0}
			<p class="kosong">Belum ada barang masuk tercatat.</p>
		{:else}
			<div class="tabel-wrap">
				<table class="table">
					<thead>
						<tr>
							<SortableTh kolom="tanggal" aktif={sortKey} dir={sortDir} klik={gantiSort}>Tanggal</SortableTh>
							<SortableTh kolom="bahanNama" aktif={sortKey} dir={sortDir} klik={gantiSort}>Bahan</SortableTh>
							<SortableTh kolom="supplierNama" aktif={sortKey} dir={sortDir} klik={gantiSort}>Supplier</SortableTh>
							<SortableTh kolom="sumberPembayaran" aktif={sortKey} dir={sortDir} klik={gantiSort}>Pembayaran</SortableTh>
							<SortableTh kolom="qty" aktif={sortKey} dir={sortDir} klik={gantiSort} numeric>Qty</SortableTh>
							<SortableTh kolom="hargaSatuan" aktif={sortKey} dir={sortDir} klik={gantiSort} numeric>Harga</SortableTh>
							<th class="num">Subtotal</th>
						</tr>
					</thead>
					<tbody>
						{#each transaksi as t (t.id)}
							<tr>
								<td>{formatTanggal(t.tanggal)}</td>
								<td>{t.bahanNama}</td>
								<td>{t.supplierNama}</td>
								<td>
									<span class="badge badge--{t.sumberPembayaran === 'transfer' ? 'warn' : 'ok'}">
										{t.sumberPembayaran}
									</span>
								</td>
								<td class="num">+{formatJumlah(t.qty)} {t.satuan}</td>
								<td class="num">{formatRupiah(t.hargaSatuan)}</td>
								<td class="num">{formatRupiah(t.qty * t.hargaSatuan)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<p class="total">Total nilai masuk tercatat: {formatRupiah(total)}</p>
		{/if}
	</section>
</div>

<style>
	.grid-2 {
		display: grid;
		grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
		gap: var(--space-lg);
		align-items: start;
	}

	.sub-judul {
		margin: 0 0 var(--space-md);
		font-size: var(--text-md);
	}

	.total {
		margin: var(--space-md) 0 0;
		font-size: var(--text-sm);
		color: var(--color-muted);
		text-align: right;
	}

	.sumber {
		border: 0;
		padding: 0;
		margin: 0;
	}

	.sumber legend {
		padding: 0;
		font-size: var(--text-sm);
		color: var(--color-muted);
	}

	.sumber__pilihan {
		display: flex;
		gap: var(--space-md);
		margin-top: var(--space-2xs);
	}

	.sumber__opsi {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2xs);
		cursor: pointer;
	}

	@media (max-width: 60rem) {
		.grid-2 {
			grid-template-columns: 1fr;
		}
	}
</style>
