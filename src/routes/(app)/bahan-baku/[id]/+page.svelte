<script lang="ts">
	import { enhance } from '$app/forms'
	import { formatJumlah } from '$lib/format'

	let { data, form } = $props()

	let mengirim = $state(false)
</script>

<svelte:head>
	<title>Ubah Bahan Baku — Kopi Waskita</title>
</svelte:head>

<header class="page-head">
	<div>
		<h1>Ubah Bahan Baku</h1>
		<p class="sub">
			Stok aktual <strong>{formatJumlah(data.bahan.stokAktual)} {data.bahan.satuan}</strong> tidak
			diubah di sini — hanya lewat transaksi atau stock opname.
		</p>
	</div>
	<a class="link-aksi" href="/bahan-baku">Kembali ke daftar</a>
</header>

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
	<div class="panel">
		{#if form?.message}
			<div class="alert alert--error" role="alert">{form.message}</div>
		{/if}
		{#if form?.success}
			<div class="alert alert--ok" role="status">{form.success}</div>
		{/if}

		<div class="form-grid">
			<label class="field">
				Kode
				<input class="input" type="text" name="kode" value={data.bahan.kode} required />
			</label>
			<label class="field">
				Nama bahan
				<input class="input" type="text" name="nama" value={data.bahan.nama} required />
			</label>
			<label class="field">
				Kategori
				<select class="input" name="kategori_id" required>
					<option value="" disabled={!data.bahan.kategoriId}>Pilih kategori…</option>
					{#each data.kategori as k (k.id)}
						<option value={k.id} selected={k.id === data.bahan.kategoriId}>{k.nama}</option>
					{/each}
				</select>
			</label>
			<label class="field">
				Satuan
				<input class="input" type="text" name="satuan" list="opsi-satuan" value={data.bahan.satuan} required />
			</label>
			<label class="field">
				Stok minimum
				<span class="hint">Batas sebelum sistem memperingatkan (reorder point)</span>
				<input
					class="input"
					type="number"
					name="stok_minimum"
					min="0"
					step="any"
					value={data.bahan.stokMinimum}
					required
				/>
			</label>
			<label class="field">
				Harga satuan (Rp)
				<span class="hint">Harga per 1 satuan saat ini</span>
				<input
					class="input"
					type="number"
					name="harga_satuan"
					min="0"
					step="any"
					value={data.bahan.hargaSatuan}
					required
				/>
			</label>
		</div>

		<datalist id="opsi-satuan">
			<option value="kg"></option>
			<option value="gram"></option>
			<option value="liter"></option>
			<option value="ml"></option>
			<option value="pcs"></option>
			<option value="pack"></option>
		</datalist>

		<div class="form-actions">
			<button class="btn" type="submit" disabled={mengirim} data-state={mengirim ? 'loading' : undefined}>
				{mengirim ? 'Menyimpan…' : 'Simpan perubahan'}
			</button>
			<a class="link-aksi" href="/bahan-baku">Batal</a>
		</div>
	</div>
</form>
