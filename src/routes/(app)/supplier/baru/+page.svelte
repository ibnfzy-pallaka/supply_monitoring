<script lang="ts">
	import { enhance } from '$app/forms'

	let { data, form } = $props()

	let mengirim = $state(false)
</script>

<svelte:head>
	<title>Tambah Supplier — Kopi Waskita</title>
</svelte:head>

<header class="page-head">
	<div>
		<h1>Tambah Supplier</h1>
		<p class="sub">Centang bahan yang disuplai supplier ini — bisa dikurangi/ditambah lewat Ubah nanti.</p>
	</div>
	<a class="link-aksi" href="/supplier">Kembali ke daftar</a>
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

		<div class="form-grid">
			<label class="field">
				Nama supplier
				<input class="input" type="text" name="nama" required placeholder="PT Kopi Nusantara" />
			</label>
			<label class="field">
				Kontak <span class="hint">(opsional)</span>
				<input class="input" type="text" name="kontak" placeholder="0812… / nama PIC" />
			</label>
			<label class="field field--full">
				Alamat <span class="hint">(opsional)</span>
				<input class="input" type="text" name="alamat" placeholder="Jl. …, Makassar" />
			</label>
		</div>

		<fieldset class="daftar-bahan">
			<legend>Daftar bahan yang disuplai <span class="hint">(opsional)</span></legend>
			{#if data.semuaBahan.length === 0}
				<p class="kosong">Belum ada data bahan baku — tambah dulu di menu Bahan Baku.</p>
			{:else}
				<div class="opsi-bahan">
					{#each data.semuaBahan as b (b.id)}
						<label class="opsi">
							<input type="checkbox" name="bahan" value={b.id} />
							<span>{b.nama} <small>({b.kode} · {b.satuan})</small></span>
						</label>
					{/each}
				</div>
			{/if}
		</fieldset>

		<div class="form-actions">
			<button class="btn" type="submit" disabled={mengirim} data-state={mengirim ? 'loading' : undefined}>
				{mengirim ? 'Menyimpan…' : 'Simpan supplier'}
			</button>
			<a class="link-aksi" href="/supplier">Batal</a>
		</div>
	</div>
</form>

<style>
	.daftar-bahan {
		border: 0;
		margin: var(--space-lg) 0 0;
		padding: 0;
	}

	.daftar-bahan legend {
		font-size: var(--text-sm);
		font-weight: 700;
		color: var(--color-ink-2);
		margin-bottom: var(--space-sm);
		padding: 0;
	}

	.hint {
		font-weight: 400;
		color: var(--color-muted);
		font-size: var(--text-xs);
	}

	.opsi-bahan {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
		gap: var(--space-xs);
	}

	.opsi {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		font-size: var(--text-sm);
		font-weight: 400;
		color: var(--color-ink);
		border: var(--rule-hair) solid var(--color-rule);
		border-radius: var(--radius-sm);
		padding: var(--space-xs) var(--space-sm);
		cursor: pointer;
	}

	.opsi:hover {
		border-color: var(--color-accent);
	}

	.opsi input {
		accent-color: var(--color-accent-deep);
	}

	.opsi small {
		color: var(--color-muted);
	}
</style>
