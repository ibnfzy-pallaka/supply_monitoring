<script lang="ts">
	import { enhance } from '$app/forms'
	import { formatJumlah, formatTanggal, hariIni } from '$lib/format'

	let { data, form } = $props()

	let mengirim = $state(false)
	let bahanId = $state('')

	const terpilih = $derived(data.bahan.find((b) => b.id === bahanId))
</script>

<svelte:head>
	<title>Barang Keluar — Kopi Waskita</title>
</svelte:head>

<div class="grid-2">
	<section class="panel">
		<h2 class="sub-judul">Catat pemakaian bahan</h2>
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
					<select class="input" name="bahan_baku_id" bind:value={bahanId} required>
						<option value="" disabled selected>Pilih bahan…</option>
						{#each data.bahan as b (b.id)}
							<option value={b.id}>{b.nama} — sisa {formatJumlah(b.stokAktual)} {b.satuan}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					Qty terpakai
					<input
						class="input"
						type="number"
						name="qty"
						min="0.01"
						step="any"
						required
						placeholder="0"
					/>
					{#if terpilih}
						<span class="hint">
							Tersedia {formatJumlah(terpilih.stokAktual)} {terpilih.satuan} — keluar melebihi
							sisa akan ditolak.
						</span>
					{/if}
				</label>
				<label class="field field--full">
					Keterangan <span class="hint">(opsional — mis. pemakaian shift pagi)</span>
					<input class="input" type="text" name="keterangan" />
				</label>
			</div>

			<div class="form-actions">
				<button class="btn" type="submit" disabled={mengirim} data-state={mengirim ? 'loading' : undefined}>
					{mengirim ? 'Menyimpan…' : 'Catat keluar'}
				</button>
			</div>
		</form>
	</section>

	<section class="panel">
		<h2 class="sub-judul">Riwayat terakhir (maks. 100)</h2>
		{#if data.transaksi.length === 0}
			<p class="kosong">Belum ada barang keluar tercatat.</p>
		{:else}
			<div class="tabel-wrap">
				<table class="table">
					<thead>
						<tr>
							<th>Tanggal</th>
							<th>Bahan</th>
							<th class="num">Qty</th>
							<th>Keterangan</th>
						</tr>
					</thead>
					<tbody>
						{#each data.transaksi as t (t.id)}
							<tr>
								<td>{formatTanggal(t.tanggal)}</td>
								<td>{t.bahanNama}</td>
								<td class="num">−{formatJumlah(t.qty)} {t.satuan}</td>
								<td>{t.keterangan || '—'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
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

	@media (max-width: 60rem) {
		.grid-2 {
			grid-template-columns: 1fr;
		}
	}
</style>
