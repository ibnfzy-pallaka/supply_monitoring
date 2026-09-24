<script lang="ts">
	import { enhance } from '$app/forms'
	import { formatJumlah, formatRupiah, formatTanggal, hariIni } from '$lib/format'

	let { data, form } = $props()

	let mengirim = $state(false)

	const total = $derived(
		data.transaksi.reduce((acc, t) => acc + t.qty * t.hargaSatuan, 0)
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
					<select class="input" name="bahan_baku_id" required>
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
				<label class="field">
					Qty masuk
					<input class="input" type="number" name="qty" min="0.01" step="any" required placeholder="0" />
				</label>
				<label class="field">
					Harga satuan (Rp)
					<input class="input" type="number" name="harga_satuan" min="0" step="any" value="0" required />
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
							<th>Tanggal</th>
							<th>Bahan</th>
							<th>Supplier</th>
							<th class="num">Qty</th>
							<th class="num">Harga</th>
							<th class="num">Subtotal</th>
						</tr>
					</thead>
					<tbody>
						{#each data.transaksi as t (t.id)}
							<tr>
								<td>{formatTanggal(t.tanggal)}</td>
								<td>{t.bahanNama}</td>
								<td>{t.supplierNama}</td>
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

	@media (max-width: 60rem) {
		.grid-2 {
			grid-template-columns: 1fr;
		}
	}
</style>
