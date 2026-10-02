<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { SortDir } from '$lib/sort'

	let {
		kolom,
		aktif,
		dir = 'asc',
		klik,
		numeric = false,
		children
	}: {
		/** Kunci kolom ini pada data (dibandingkan dengan `aktif`). */
		kolom: string
		/** Kolom yang sedang jadi acuan sort. */
		aktif: string
		/** Arah sort saat ini. */
		dir?: SortDir
		/** Handler saat header diklik. */
		klik: (kolom: string) => void
		/** Header angka (rata kanan) — pertahankan kelas `num`. */
		numeric?: boolean
		children: Snippet
	} = $props()

	const terpilih = $derived(aktif === kolom)
	const next = $derived(terpilih && dir === 'asc' ? 'desc' : 'asc')
	const labelAria = $derived(
		terpilih
			? `Terurut ${dir === 'asc' ? 'menaik' : 'menurun'}. Klik untuk ${next === 'asc' ? 'naik' : 'turun'}.`
			: 'Klik untuk mengurutkan.'
	)
</script>

<th class:num={numeric} aria-sort={terpilih ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
	<button
		type="button"
		class="th-sort"
		class:aktif={terpilih}
		onclick={() => klik(kolom)}
		title={labelAria}
	>
		<span class="th-sort__label">{@render children()}</span>
		<span class="th-sort__ikon" aria-hidden="true">
			{#if terpilih}
				{dir === 'asc' ? '▲' : '▼'}
			{:else}
				↕
			{/if}
		</span>
	</button>
</th>

<style>
	.th-sort {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		width: 100%;
		padding: var(--space-sm) var(--space-md);
		margin: calc(-1 * var(--space-sm)) calc(-1 * var(--space-md));
		background: none;
		border: 0;
		font: inherit;
		font-weight: inherit;
		letter-spacing: inherit;
		text-transform: inherit;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}

	th.num .th-sort {
		justify-content: flex-end;
		text-align: right;
	}

	.th-sort:hover {
		color: var(--color-ink);
	}

	.th-sort:focus-visible {
		outline: 2px solid var(--color-accent, #a0522d);
		outline-offset: 2px;
		border-radius: 2px;
	}

	.th-sort__ikon {
		font-size: 0.85em;
		opacity: 0.4;
		line-height: 1;
	}

	.th-sort.aktif {
		color: var(--color-ink);
	}

	.th-sort.aktif .th-sort__ikon {
		opacity: 1;
		color: var(--color-accent, #a0522d);
	}
</style>
