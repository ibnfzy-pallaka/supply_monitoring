<script lang="ts">
	import { enhance } from '$app/forms'
	import { page } from '$app/state'

	let { data, form } = $props()

	let mengirim = $state(false)

	const editId = $derived(page.url.searchParams.get('edit') ?? '')
	const editing = $derived(data.users.find((u) => u.id === editId) ?? null)

	function selesai() {
		mengirim = false
	}
</script>

<svelte:head>
	<title>Manajemen User — Kopi Waskita</title>
</svelte:head>

<header class="page-head">
	<div>
		<h1>Manajemen User</h1>
		<p class="sub">
			Tambah akun, ubah peran (admin/staff), nonaktifkan, dan reset password karyawan.
		</p>
	</div>
</header>

{#if form?.message}
	<div class="alert alert--error" role="alert">{form.message}</div>
{/if}
{#if form?.created}
	<div class="alert alert--ok" role="status">{form.created}</div>
{/if}
{#if form?.updated}
	<div class="alert alert--ok" role="status">{form.updated}</div>
{/if}

<div class="grid-users">
	<section class="panel">
		<h2 class="sub-judul">{editing ? `Ubah: ${editing.nama}` : 'Tambah user baru'}</h2>

		<form
			method="POST"
			action={editing ? '?/update' : '?/create'}
			use:enhance={() => {
				mengirim = true
				return async ({ update }) => {
					selesai()
					await update()
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
					Email
					<input class="input" type="email" name="email" required placeholder="nama@email.com" />
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
						Staff — input transaksi & lihat stok
					</option>
					<option value="admin" selected={editing?.role === 'admin'}>
						Admin / Pemilik — akses penuh
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
				{#if editing}
					<a class="link-aksi" href="/users">Batal ubah</a>
				{/if}
			</div>
		</form>

		{#if editing}
			<form
				class="reset-box"
				method="POST"
				action="?/resetPassword"
				use:enhance={() => {
					mengirim = true
					return async ({ update }) => {
						selesai()
						await update()
					}
				}}
			>
				<input type="hidden" name="id" value={editing.id} />
				<div class="field">
					Reset password
					<span class="hint">Password baru untuk {editing.email}</span>
					<input class="input" type="text" name="password" required minlength="6" />
				</div>
				<div class="form-actions">
					<button class="btn btn--ghost" type="submit" disabled={mengirim}>Reset password</button>
				</div>
			</form>
		{/if}
	</section>

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
							<th>Email</th>
							<th>Peran</th>
							<th>Status</th>
							<th>Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each data.users as u (u.id)}
							<tr class:nonaktif={!u.aktif}>
								<td>{u.nama}</td>
								<td>{u.email}</td>
								<td>
									<span class="badge {u.role === 'admin' ? 'badge--danger' : 'badge--warn'}">{u.role}</span>
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
</div>

<style>
	.grid-users {
		display: grid;
		grid-template-columns: minmax(0, 24rem) minmax(0, 1fr);
		gap: var(--space-lg);
		align-items: start;
	}

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

	@media (max-width: 60rem) {
		.grid-users {
			grid-template-columns: 1fr;
		}
	}
</style>
