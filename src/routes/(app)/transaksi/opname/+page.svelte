<script lang="ts">
	import { enhance } from '$app/forms'
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import Modal from '$lib/components/Modal.svelte'
	import { formatJumlah, formatTanggal, hariIni } from '$lib/format'

	let { data, form } = $props()

	let mengirim = $state(false)
	let bahanId = $state('')
	let stokFisik = $state<string>('')
	let pesanSukses = $state<string | null>(null)

	const owner = $derived(data.profile.role === 'owner')
	const modalBuka = $derived(owner && page.url.searchParams.get('modal') === 'opname')
	const terpilih = $derived(data.bahan.find((b) => b.id === bahanId))
	const selisih = $derived(
		terpilih && stokFisik !== '' && Number.isFinite(Number(stokFisik))
			? Number(stokFisik) - terpilih.stokAktual
			: null
	)

	function selesai() {
		mengirim = false
	}

	function bukaModal() {
		goto(`${page.url.pathname}?modal=opname`, { replaceState: true, noScroll: true })
	}

	function tutupModal() {
		goto(page.url.pathname, { replaceState: true, noScroll: true })
	}
</script>

<svelte:head>
	<title>Stock Opname — Kopi Waskita</title>
</svelte:head>

<div class="kepala-seksi">
	<p class="sub-seksi">
		{#if owner}
			Riwayat pencatatan stock opname (maks. 100 terakhir).
		{:else}
			Riwayat pencatatan stock opname — pencatatan hanya dapat dilakukan oleh Owner/Pemilik.
		{/if}
	</p>
	{#if owner}
		<button type="button" class="btn" onclick={bukaModal}>Catat stock opname</button>
	{/if}
</div>

{#if !modalBuka && form?.message}
	<div class="alert alert--error" role="alert">{form.message}</div>
{/if}
{#if pesanSukses || form?.success}
	<div class="alert alert--ok" role="status">{pesanSukses ?? form?.success}</div>
{/if}

<section class="panel">
	<h2 class="sub-judul">Riwayat opname</h2>
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

{#if owner}
	<Modal buka={modalBuka} judul="Catat Stock Opname" onclose={tutupModal}>
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
					pesanSukses = res.success ?? 'Stock opname berhasil dicatat.'
					bahanId = ''
					stokFisik = ''
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
							<option value={b.id}>{b.nama} — sistem {formatJumlah(b.stokAktual)} {b.satuan}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					Stok fisik hasil hitung
					<input
						class="input"
						type="number"
						name="stok_fisik"
						min="0"
						step="any"
						bind:value={stokFisik}
						required
						placeholder="0"
					/>
					{#if selisih !== null && terpilih}
						<span class="hint">
							Selisih vs sistem:
							{selisih === 0 ? '0 (cocok)' : `${selisih > 0 ? '+' : ''}${formatJumlah(selisih)} ${terpilih.satuan}`}
						</span>
					{/if}
				</label>
				<label class="field field--full">
					Alasan penyesuaian
					<input
						class="input"
						type="text"
						name="alasan"
						required
						placeholder="mis. rusak/terbuang, salah catat sebelumnya"
					/>
				</label>
			</div>

			<div class="form-actions">
				<button class="btn" type="submit" disabled={mengirim} data-state={mengirim ? 'loading' : undefined}>
					{mengirim ? 'Menyimpan…' : 'Simpan opname'}
				</button>
				<button type="button" class="btn btn--ghost" onclick={tutupModal}>Batal</button>
			</div>
		</form>
	</Modal>
{/if}

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

	.selisih.minus {
		color: var(--color-danger);
	}
</style>
