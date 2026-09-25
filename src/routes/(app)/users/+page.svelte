<script lang="ts">
	import { enhance } from '$app/forms'
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import Modal from '$lib/components/Modal.svelte'

	let { data, form } = $props()

	let mengirim = $state(false)
	let pesanSukses = $state<string | null>(null)

	const editId = $derived(page.url.searchParams.get('edit') ?? '')
	const modalTambah = $derived(page.url.searchParams.get('modal') === 'tambah')
	const editing = $derived(data.users.find((u) => u.id === editId) ?? null)

	const modalBuka = $derived(modalTambah || editing !== null)
	const modalJudul = $derived(editing ? `Ubah: ${editing.nama}` : 'Tambah user baru')

	function selesai() {
		mengirim = false
	}

	function tutupModal() {
		goto(page.url.pathname, { replaceState: true, noScroll: true })
	}
</script>

<svelte:head>
	<title>Manajemen User — Kopi Waskita</title>
</svelte:head>

<header class="page-head">
	<div>
		<h1>Manajemen User</h1>
		<p class="sub">
			Tambah akun, ubah peran (owner/staff), nonaktifkan, dan reset password karyawan.
		</p>
	</div>
	<a class="btn" href="/users?modal=tambah">Tambah user</a>
</header>

{#if !modalBuka && form?.message}
	<div class="alert alert--error" role="alert">{form.message}</div>
{/if}
{#if pesanSukses || form?.created || form?.updated}
	<div class="alert alert--ok" role="status">
		{pesanSukses ?? form?.created ?? form?.updated}
	</div>
{/if}

<section class="panel">
	<h2 class="sub-judul">Daftar akun</h2>
	{#if data.users.length === 0}
		<p class="kosong">Belum ada user.</p>
	{:else}
		<div class="tabel-wrap">
			<table class="table">
				<thead>
					<tr>
						<th>Nama</th>
						<th>Username</th>
						<th>Peran</th>
						<th>Status</th>
						<th>Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each data.users as u (u.id)}
						<tr class:nonaktif={!u.aktif}>
							<td>{u.nama}</td>
							<td><code>{u.username}</code></td>
							<td>
								<span class="badge {u.role === 'owner' ? 'badge--danger' : 'badge--warn'}">{u.role}</span>
							</td>
							<td>
								<span class="badge {u.aktif ? 'badge--ok' : 'badge--danger'}">
									{u.aktif ? 'aktif' : 'nonaktif'}
								</span>
							</td>
							<td class="aksi">
								<a class="link-aksi" href="/users?edit={u.id}">Ubah</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>

<Modal buka={modalBuka} judul={modalJudul} onclose={tutupModal}>
	{#if form?.message}
		<div class="alert alert--error" role="alert">{form.message}</div>
	{/if}

	<form
		method="POST"
		action={editing ? '?/update' : '?/create'}
		use:enhance={() => {
			mengirim = true
			return async ({ result, update }) => {
				selesai()
				if (result.type === 'success' && result.data) {
					const res = result.data as { created?: string; updated?: string }
					pesanSukses = res.created ?? res.updated ?? 'Berhasil disimpan.'
					tutupModal()
				} else {
					await update()
				}
			}
		}}
	>
		{#if editing}
			<input type="hidden" name="id" value={editing.id} />
		{/if}
		<div class="field">
			Nama lengkap
			<input class="input" type="text" name="nama" required value={editing?.nama ?? ''} />
		</div>

		{#if !editing}
			<div class="field" style="margin-top: var(--space-md)">
				Username
				<span class="hint">Huruf kecil, tanpa spasi (misal: budi, kasir1, owner2)</span>
				<input class="input" type="text" name="username" required placeholder="username" />
			</div>
			<div class="field" style="margin-top: var(--space-md)">
				Password awal
				<span class="hint">Minimal 6 karakter — bisa diubah sendiri lewat Profil.</span>
				<input class="input" type="text" name="password" required minlength="6" />
			</div>
		{/if}

		<div class="field" style="margin-top: var(--space-md)">
			Peran
			<select class="input" name="role">
				<option value="staff" selected={editing?.role === 'staff'}>
					Staff — input transaksi &amp; lihat stok
				</option>
				<option value="owner" selected={editing?.role === 'owner'}>
					Owner / Pemilik — akses penuh
				</option>
			</select>
		</div>

		{#if editing}
			<label class="opsi-aktif">
				<input type="checkbox" name="aktif" checked={editing.aktif} />
				<span>Akun aktif (bisa login)</span>
			</label>
		{/if}

		<div class="form-actions">
			<button class="btn" type="submit" disabled={mengirim} data-state={mengirim ? 'loading' : undefined}>
				{mengirim ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Buat akun'}
			</button>
			<button type="button" class="btn btn--ghost" onclick={tutupModal}>Batal</button>
		</div>
	</form>

	{#if editing}
		<form
			class="reset-box"
			method="POST"
			action="?/resetPassword"
			use:enhance={() => {
				mengirim = true
				return async ({ result, update }) => {
					selesai()
					if (result.type === 'success' && result.data) {
						const res = result.data as { updated?: string }
						pesanSukses = res.updated ?? 'Password berhasil direset.'
						tutupModal()
					} else {
						await update()
					}
				}
			}}
		>
			<input type="hidden" name="id" value={editing.id} />
			<div class="field">
				Reset password
				<span class="hint">Password baru untuk {editing.username}</span>
				<input class="input" type="text" name="password" required minlength="6" />
			</div>
			<div class="form-actions">
				<button class="btn btn--ghost" type="submit" disabled={mengirim}>Reset password</button>
			</div>
		</form>
	{/if}
</Modal>

<style>
	.sub-judul {
		margin: 0 0 var(--space-md);
		font-size: var(--text-md);
	}

	.opsi-aktif {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		margin-top: var(--space-md);
		font-size: var(--text-sm);
		font-weight: 400;
		color: var(--color-ink);
	}

	.opsi-aktif input {
		accent-color: var(--color-accent-deep);
	}

	.reset-box {
		border-top: var(--rule-hair) solid var(--color-rule);
		margin-top: var(--space-lg);
		padding-top: var(--space-lg);
	}

	tbody tr.nonaktif td {
		color: var(--color-muted);
	}

	.aksi {
		white-space: nowrap;
	}
</style>
