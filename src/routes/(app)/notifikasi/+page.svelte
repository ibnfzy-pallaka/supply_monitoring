<script lang="ts">
	import { enhance } from '$app/forms'
	import { formatJumlah } from '$lib/format'

	let { data, form } = $props()

	let mengirim = $state(false)
	let idProses = $state<string | null>(null)

	const belum = $derived(data.notifikasi.filter((n) => !n.dibaca))
	const jumlahPengajuan = $derived(data.pengajuan?.length ?? 0)
</script>

<svelte:head>
	<title>Notifikasi — Kopi Waskita</title>
</svelte:head>

<header class="page-head">
	<div>
		<h1>Notifikasi Stok</h1>
		<p class="sub">
			Peringatan otomatis saat stok bahan menyentuh atau melewati batas minimum.
			{#if belum.length > 0}Ada {belum.length} belum dibaca.{/if}
			{#if jumlahPengajuan > 0}Ada {jumlahPengajuan} pengajuan reset password menunggu persetujuan.{/if}
		</p>
	</div>
	{#if belum.length > 0}
		<form
			method="POST"
			action="?/bacaSemua"
			use:enhance={() => {
				mengirim = true
				return async ({ update }) => {
					mengirim = false
					await update()
				}
			}}
		>
			<button class="btn btn--ghost" type="submit" disabled={mengirim}>
				{mengirim ? 'Menandai…' : 'Tandai semua dibaca'}
			</button>
		</form>
	{/if}
</header>

{#if form?.message}
	<div class="alert alert--error" role="alert">{form.message}</div>
{/if}
{#if form?.success}
	<div class="alert alert--ok" role="status">{form.success}</div>
{/if}

{#if data.adalahOwner}
	<section class="panel panel--ajuan">
		<h2 class="sub-judul">Pengajuan Reset Password</h2>
		{#if data.pengajuan.length === 0}
			<p class="kosong">Tidak ada pengajuan reset password yang menunggu.</p>
		{:else}
			<ul class="daftar">
				{#each data.pengajuan as p (p.id)}
					<li class="item item--ajuan">
						<div class="isi">
							<p class="pesan">
								{p.nama} (<code>{p.username}</code>) mengajukan reset password.
							</p>
							<p class="detail">
								Disetujui → password direset ke <strong>12345678</strong>. Pengaju harus
								segera menggantinya setelah masuk.
							</p>
							{#if p.catatan}<p class="detail">Catatan: {p.catatan}</p>{/if}
						</div>
						<div class="aksi-ajuan">
							<form
								method="POST"
								action="?/setujui"
								use:enhance={() => {
									idProses = p.id
									mengirim = true
									return async ({ update }) => {
										idProses = null
										mengirim = false
										await update()
									}
								}}
							>
								<input type="hidden" name="id" value={p.id} />
								<button
									class="btn btn--sm"
									type="submit"
									disabled={mengirim}
									data-state={idProses === p.id && mengirim ? 'loading' : undefined}
								>
									Setujui &amp; reset
								</button>
							</form>
							<form
								method="POST"
								action="?/tolak"
								use:enhance={() => {
									idProses = p.id
									mengirim = true
									return async ({ update }) => {
										idProses = null
										mengirim = false
										await update()
									}
								}}
							>
								<input type="hidden" name="id" value={p.id} />
								<input type="hidden" name="catatan" value="Ditolak oleh owner" />
								<button class="btn btn--ghost btn--sm" type="submit" disabled={mengirim}>
									Tolak
								</button>
							</form>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
{/if}

<section class="panel">
	<h2 class="sub-judul">
		Bahan di Bawah Minimum Saat Ini
		{#if data.diBawahMinimum.length > 0}
			<span class="badge badge--warn">{data.diBawahMinimum.length} bahan</span>
		{/if}
	</h2>
	{#if data.diBawahMinimum.length === 0}
		<p class="kosong">Semua stok bahan berada di atas batas minimum.</p>
	{:else}
		<ul class="daftar">
			{#each data.diBawahMinimum as b (b.id)}
				<li class="item item--kritikal">
					<div class="isi">
						<p class="pesan">
							<a class="tautan" href="/bahan-baku/{b.id}">{b.nama}</a>
							<code>{b.kode}</code>
						</p>
						<p class="detail">
							sisa {formatJumlah(b.stokAktual)} {b.satuan} — minimum {formatJumlah(b.stokMinimum)} {b.satuan}
							{#if b.stokAktual <= 0}<span class="badge badge--danger">habis</span>{/if}
						</p>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<section class="panel">
	<h2 class="sub-judul">Riwayat Notifikasi</h2>
	{#if data.notifikasi.length === 0}
		<p class="kosong">Belum ada notifikasi — stok masih terpantau normal.</p>
	{:else}
		<ul class="daftar">
			{#each data.notifikasi as n (n.id)}
				<li class="item" class:belum={!n.dibaca}>
					<div class="isi">
						<p class="pesan">{n.pesan}</p>
						{#if n.bahanNama && n.stokAktual !== null}
							<p class="detail">
								{n.bahanNama}: sisa {formatJumlah(n.stokAktual)} — minimum {formatJumlah(n.stokMinimum ?? 0)}
							</p>
						{/if}
					</div>
					{#if !n.dibaca}
						<form
							method="POST"
							action="?/baca"
							use:enhance={() => {
								mengirim = true
								return async ({ update }) => {
									mengirim = false
									await update()
								}
							}}
						>
							<input type="hidden" name="id" value={n.id} />
							<button class="btn btn--ghost btn--sm" type="submit" disabled={mengirim}>Dibaca</button>
						</form>
					{:else}
						<span class="sudah">dibaca</span>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.panel--ajuan {
		margin-bottom: var(--space-xl);
	}

	.sub-judul {
		margin: 0 0 var(--space-md);
		font-size: var(--text-md);
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.tautan {
		color: var(--color-ink);
		font-weight: 700;
		text-decoration: none;
		border-bottom: 1px solid var(--color-rule);
	}

	.tautan:hover {
		color: var(--color-accent-deep);
		border-bottom-color: var(--color-accent);
	}

	.item--kritikal .pesan {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		flex-wrap: wrap;
	}

	.item--kritikal .detail {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.aksi-ajuan {
		display: flex;
		gap: var(--space-xs);
		flex-shrink: 0;
	}

	.aksi-ajuan form {
		margin: 0;
	}

	.item--ajuan .pesan {
		font-weight: 700;
		color: var(--color-ink);
	}

	.item--ajuan .pesan code {
		font-weight: 400;
	}

	.daftar {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.item {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md) 0;
		border-bottom: var(--rule-hair) solid var(--color-rule);
	}

	.item:last-child {
		border-bottom: 0;
	}

	.item.belum .pesan {
		font-weight: 700;
		color: var(--color-ink);
	}

	.item.belum::before {
		content: '';
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color-accent);
		flex-shrink: 0;
	}

	.isi {
		flex: 1;
		min-width: 0;
	}

	.pesan {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-muted);
	}

	.detail {
		margin: var(--space-3xs) 0 0;
		font-size: var(--text-xs);
		color: var(--color-neutral);
	}

	.sudah {
		font-size: var(--text-xs);
		color: var(--color-neutral);
		flex-shrink: 0;
	}

	.item form {
		margin: 0;
		flex-shrink: 0;
	}

	@media (max-width: 30rem) {
		.item {
			flex-wrap: wrap;
			align-items: flex-start;
		}

		.item form,
		.sudah {
			margin-left: auto;
		}

		.aksi-ajuan {
			width: 100%;
			margin-left: 0;
		}

		.aksi-ajuan form {
			flex: 1;
		}

		.aksi-ajuan .btn {
			width: 100%;
		}
	}
</style>
