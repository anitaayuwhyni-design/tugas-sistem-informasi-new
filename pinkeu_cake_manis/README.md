# Pinkeu Cake Manis — Sistem Informasi Penjualan & Stok

## Catatan database
Versi ini menggunakan **localStorage sebagai database lokal browser**, sesuai spesifikasi tanpa backend/database eksternal. Data produk, pelanggan, dan transaksi tersimpan setelah halaman dimuat ulang di browser yang sama. Ini bukan MySQL/SQL Server dan tidak otomatis dibagikan ke perangkat lain. Untuk database MySQL/Laragon sungguhan, perlu backend (misalnya PHP) untuk menghubungkan halaman dengan database.

## Struktur folder
```text
pinkeu_cake_manis/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Cara menjalankan
1. Ekstrak ZIP ke folder `pinkeu_cake_manis`.
2. Buka `index.html` menggunakan Chrome/Edge. Untuk lingkungan tugas, boleh juga buka folder melalui VS Code dan gunakan ekstensi Live Server.
3. Tidak ada login/logout dan tidak ada kata sandi.
4. Chart.js dan Google Fonts dimuat dari CDN, jadi grafik dan font khusus membutuhkan koneksi internet. Jika offline, fungsi utama tetap berjalan; grafik mungkin tidak muncul.
5. Data contoh otomatis dibuat pada kunjungan pertama. Data yang dibuat pengguna disimpan di localStorage browser tersebut.

## Fitur
- Dashboard: penjualan hari ini, jumlah produk/pelanggan, stok menipis, grafik tujuh hari, transaksi terakhir.
- Produk & stok: tambah, edit, hapus produk, pencarian, filter kategori/stok, status stok.
- Transaksi: pilih pelanggan, tambahkan beberapa produk, validasi jumlah dan stok, hitung total/kembalian, metode pembayaran, simpan transaksi, stok otomatis berkurang.
- Pelanggan: tambah, edit, hapus, cari pelanggan. Pelanggan dengan riwayat transaksi tidak bisa dihapus agar laporan tetap konsisten.
- Laporan: filter tanggal, ringkasan pendapatan/jumlah transaksi/item terjual, detail transaksi, cetak melalui dialog print browser.

## Data demo
Contoh produk: Strawberry Shortcake, Chocolate Fudge Cake, Red Velvet Slice, Butter Croissant, Choco Chip Cookies, Roti Sobek Cream, dan Cheesecake Blueberry. Tidak ada kredensial login karena halaman langsung terbuka.

## Checklist pengujian manual
- [ ] Dashboard terbuka dan menampilkan data contoh.
- [ ] Tambah produk dengan harga positif dan stok 0 atau lebih.
- [ ] Coba harga 0, stok negatif, atau jumlah pecahan: harus ditolak.
- [ ] Cari produk dan gunakan filter kategori/stok.
- [ ] Edit produk lalu pastikan perubahan tampil.
- [ ] Hapus produk tanpa riwayat transaksi.
- [ ] Tambah/edit pelanggan; coba email dengan format salah.
- [ ] Tambahkan produk ke pesanan dan coba jumlah melebihi stok: harus ditolak.
- [ ] Simpan transaksi dengan uang kurang: harus ditolak.
- [ ] Simpan transaksi dengan uang cukup: total, kembalian, dan stok harus benar.
- [ ] Periksa transaksi di Dashboard dan Laporan.
- [ ] Filter laporan tanggal dan gunakan Cetak Laporan.
- [ ] Muat ulang halaman: data harus tetap ada di browser yang sama.

## Reset data demo
Untuk menghapus seluruh data lokal dan mengembalikan contoh awal: buka DevTools browser (F12) → Console, jalankan:
```js
localStorage.removeItem('pinkeuCakeManisDB_v1');
location.reload();
```
Hati-hati: tindakan ini menghapus transaksi, produk, dan pelanggan yang sudah disimpan pada browser tersebut.
