<script lang="ts">
	import { enhance } from '$app/forms'
	import { formatJumlah, formatTanggal, hariIni } from '$lib/format'

	let { data, form } = $props()

	let mengirim = $state(false)
	let bahanId = $state('')
	let stokFisik = $state<string>('')

	const admin = $derived(data.profile.role === 'admin')
	const terpilih = $derived(data.bahan.find((b) => b.id === bahanId))
	const selisih = $derived(
		terpilih && stokFisik !== '' && Number.isFinite(Number(stokFisik))
			? Number(stokFisik) - terpilih.stokAktual
			: null
	)
</script>

<svelte:head>
	<title>Stock Opname — Kopi Waskita</title>
</svelte:head>

<div class="grid-2">
	{#if admin}
		<section class="panel">
			<h2 class="sub-judul">Catat hasil hitung fisik</h2>
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
								<option value={b.id}>{b.nama} — sistem {formatJumlah(b.stokAktual)} {b.satuan}</option>
							{/each}
						</select>
					</label>
					<label class="field">
						Stok fisik hasil hitung
						<input class="input" type="number" name="stok_fisik" min="0" step="any" bind:value={stokFisik} required placeholder="0" />
						{#if selisih !== null && terpilih}
							<span class="hint">
								Selisih vs sistem:
								{selisih === 0 ? '0 (cocok)' : `${selisih > 0 ? '+' : ''}${formatJumlah(selisih)} ${terpilih.satuan}`}
							</span>
						{/if}
					</label>
					<label class="field field--full">
						Alasan penyesuaian
						<input class="input" type="text" name="alasan" required placeholder="mis. rusak/terbuang, salah catat sebelumnya" />
					</label>
				</div>

				<div class="form-actions">
					<button class="btn" type="submit" disabled={mengirim} data-state={mengirim ? 'loading' : undefined}>
						{mengirim ? 'Menyimpan…' : 'Simpan opname'}
					</button>
				</div>
			</form>
		</section>
	{:else}
		<section class="panel">
			<h2 class="sub-judul">Catat hasil hitung fisik</h2>
			<p class="kosong">
				Pencatatan stock opname hanya untuk admin — staff dapat melihat riwayat di samping.
			</p>
		</section>
	{/if}

	<section class="panel">
		<h2 class="sub-judul">Riwayat opname (maks. 100)</h2>
		{#if data.opname.length === 0}
			<p class="kosong">Belum ada stock opname tercatat.</p>
		{:else}
			<div class="tabel-wrap">
				<table class="table">
					<thead>
						<tr>
							<th>Tanggal</th>
							<th>Bahan</th>
							<th class="num">Sistem</th>
							<th class="num">Fisik</th>
							<th class="num">Selisih</th>
							<th>Alasan</th>
						</tr>
					</thead>
					<tbody>
						{#each data.opname as o (o.id)}
							<tr>
								<td>{formatTanggal(o.tanggal)}</td>
								<td>{o.bahanNama}</td>
								<td class="num">{formatJumlah(o.stokSistem)} {o.satuan}</td>
								<td class="num">{formatJumlah(o.stokFisik)} {o.satuan}</td>
								<td class="num selisih" class:minus={o.selisih < 0}>
									{o.selisih > 0 ? '+' : ''}{formatJumlah(o.selisih)}
								</td>
								<td>{o.alasan}</td>
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

	.selisih.minus {
		color: var(--color-danger);
	}

	@media (max-width: 60rem) {
		.grid-2 {
			grid-template-columns: 1fr;
		}
	}
</style>
