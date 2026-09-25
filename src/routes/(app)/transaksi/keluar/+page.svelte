<script lang="ts">
	import { enhance } from '$app/forms'
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import Modal from '$lib/components/Modal.svelte'
	import { formatJumlah, formatTanggal, hariIni } from '$lib/format'

	let { data, form } = $props()

	let mengirim = $state(false)
	let bahanId = $state('')
	let pesanSukses = $state<string | null>(null)

	const modalBuka = $derived(page.url.searchParams.get('modal') === 'keluar')
	const terpilih = $derived(data.bahan.find((b) => b.id === bahanId))

	function selesai() {
		mengirim = false
	}

	function bukaModal() {
		goto(`${page.url.pathname}?modal=keluar`, { replaceState: true, noScroll: true })
	}

	function tutupModal() {
		goto(page.url.pathname, { replaceState: true, noScroll: true })
	}
</script>

<svelte:head>
	<title>Barang Keluar — Kopi Waskita</title>
</svelte:head>

<div class="kepala-seksi">
	<p class="sub-seksi">Riwayat pemakaian bahan baku (maks. 100 terakhir).</p>
	<button type="button" class="btn" onclick={bukaModal}>Catat pemakaian bahan</button>
</div>

{#if !modalBuka && form?.message}
	<div class="alert alert--error" role="alert">{form.message}</div>
{/if}
{#if pesanSukses || form?.success}
	<div class="alert alert--ok" role="status">{pesanSukses ?? form?.success}</div>
{/if}

<section class="panel">
	<h2 class="sub-judul">Riwayat terakhir</h2>
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

<Modal buka={modalBuka} judul="Catat Pemakaian Bahan" onclose={tutupModal}>
	{#if form?.message}
		<div class="alert alert--error" role="alert">{form.message}</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			mengirim = true
			return async ({ result, update }) => {
				selesai()
				if (result.type === 'success' && result.data) {
					const res = result.data as { success?: string }
					pesanSukses = res.success ?? 'Barang keluar berhasil dicatat.'
					bahanId = ''
					tutupModal()
				} else {
					await update()
				}
			}
		}}
	>
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
			<button type="button" class="btn btn--ghost" onclick={tutupModal}>Batal</button>
		</div>
	</form>
</Modal>

<style>
	.kepala-seksi {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		flex-wrap: wrap;
		margin-bottom: var(--space-lg);
	}

	.sub-seksi {
		margin: 0;
		color: var(--color-muted);
		font-size: var(--text-sm);
	}

	.sub-judul {
		margin: 0 0 var(--space-md);
		font-size: var(--text-md);
	}
</style>
