<script lang="ts">
	import { enhance } from '$app/forms'
	import { formatJumlah } from '$lib/format'

	let { data, form } = $props()

	let mengirim = $state(false)

	const belum = $derived(data.notifikasi.filter((n) => !n.dibaca))
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

<section class="panel">
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
</style>
