<script lang="ts">
	import type { Snippet } from 'svelte'

	let {
		buka = false,
		judul,
		onclose,
		children
	}: {
		buka?: boolean
		judul: string
		onclose?: () => void
		children: Snippet
	} = $props()

	let el: HTMLDialogElement | undefined = $state()
	const idJudul = $props.id()

	$effect(() => {
		if (!el) return
		if (buka && !el.open) {
			el.showModal()
			const target = el.querySelector<HTMLElement>(
				'.modal__isi input:not([type="hidden"]):not([disabled]), .modal__isi select:not([disabled]), .modal__isi textarea:not([disabled]), .modal__isi button:not([disabled])'
			)
			target?.focus()
		} else if (!buka && el.open) {
			el.close()
		}
	})

	function tanganiClose() {
		// dipanggil saat dialog ditutup natively (Escape) atau via .close()
		if (buka) {
			onclose?.()
		}
	}

	function klikDialog(e: MouseEvent) {
		if (!el || e.target !== el) return
		const r = el.getBoundingClientRect()
		const diLuar = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom
		if (diLuar) {
			el.close()
		}
	}
</script>

<dialog
	class="modal"
	bind:this={el}
	aria-labelledby={idJudul}
	onclose={tanganiClose}
	onclick={klikDialog}
>
	<div class="modal__kepala">
		<h2 class="modal__judul" id={idJudul}>{judul}</h2>
		<button
			type="button"
			class="modal__tutup"
			aria-label="Tutup dialog"
			onclick={() => el?.close()}
		>
			✕
		</button>
	</div>
	<div class="modal__isi">
		{@render children()}
	</div>
</dialog>
