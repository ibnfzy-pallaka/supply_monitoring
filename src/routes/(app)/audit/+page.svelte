<script lang="ts">
	let { data } = $props()

	function urlTabel(t: string): string {
		const q = new URLSearchParams()
		if (t) q.set('tabel', t)
		return `/audit${q.size ? `?${q}` : ''}`
	}
</script>

<svelte:head>
	<title>Log Aktivitas — Kopi Waskita</title>
</svelte:head>

<header class="page-head">
	<div>
		<h1>Log Aktivitas</h1>
		<p class="sub">
			Audit trail otomatis: setiap perubahan data pada tabel utama dicatat beserta pelakunya
			(maks. 200 entri terakhir).
		</p>
	</div>
</header>

<nav class="filter-chips" aria-label="Filter tabel">
	<a href={urlTabel('')} class:active={!data.filterTabel}>Semua</a>
	{#each data.tabelOpsi as t (t)}
		<a href={urlTabel(t)} class:active={data.filterTabel === t}>{t}</a>
	{/each}
</nav>

<section class="panel">
	{#if data.log.length === 0}
		<p class="kosong">Tidak ada aktivitas tercatat{data.filterTabel ? ` pada tabel ${data.filterTabel}` : ''}.</p>
	{:else}
		<div class="tabel-wrap">
			<table class="table">
				<thead>
					<tr>
						<th>Waktu</th>
						<th>Aksi</th>
						<th>Tabel</th>
						<th>Pelaku</th>
						<th>Ringkasan data</th>
					</tr>
				</thead>
				<tbody>
					{#each data.log as l (l.id)}
						<tr>
							<td class="waktu">{new Date(l.waktu).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</td>
							<td><span class="badge {l.aksi === 'INSERT' ? 'badge--ok' : l.aksi === 'DELETE' ? 'badge--danger' : 'badge--warn'}">{l.aksi.toLowerCase()}</span></td>
							<td>{l.tabel}</td>
							<td>{l.aktor}</td>
							<td><code>{l.ringkas}</code></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>

<style>
	.filter-chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
		margin-bottom: var(--space-lg);
	}

	.filter-chips a {
		padding: var(--space-2xs) var(--space-sm);
		font-size: var(--text-xs);
		color: var(--color-muted);
		text-decoration: none;
		border: var(--rule-hair) solid var(--color-rule);
		border-radius: var(--radius-sm);
		white-space: nowrap;
		transition: border-color var(--dur-short) var(--ease-out), color var(--dur-short) var(--ease-out);
	}

	.filter-chips a:hover {
		color: var(--color-ink);
		border-color: var(--color-neutral);
	}

	.filter-chips a.active {
		color: var(--color-accent-deep);
		border-color: var(--color-accent);
		font-weight: 700;
	}

	.waktu {
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	code {
		font-family: var(--font-body);
		font-size: var(--text-xs);
		color: var(--color-muted);
		overflow-wrap: anywhere;
	}
</style>
