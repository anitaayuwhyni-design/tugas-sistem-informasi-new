
CREATE DATABASE IF NOT EXISTS pinkeu_cake_manis;
USE pinkeu_cake_manis;

CREATE TABLE produk (
    id_produk INT AUTO_INCREMENT PRIMARY KEY,
    nama_produk VARCHAR(100) NOT NULL,
    kategori VARCHAR(50) NOT NULL,
    harga DECIMAL(12,2) NOT NULL,
    stok INT NOT NULL DEFAULT 0,
    deskripsi TEXT
);

CREATE TABLE pelanggan (
    id_pelanggan INT AUTO_INCREMENT PRIMARY KEY,
    nama_pelanggan VARCHAR(100) NOT NULL,
    telepon VARCHAR(20),
    email VARCHAR(100),
    alamat TEXT
);

CREATE TABLE transaksi (
    id_transaksi INT AUTO_INCREMENT PRIMARY KEY,
    kode_transaksi VARCHAR(40) NOT NULL UNIQUE,
    id_pelanggan INT NULL,
    tanggal_transaksi DATETIME DEFAULT CURRENT_TIMESTAMP,
    metode_pembayaran VARCHAR(20) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    uang_diterima DECIMAL(12,2) NOT NULL,
    kembalian DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (id_pelanggan)
        REFERENCES pelanggan(id_pelanggan)
        ON DELETE SET NULL
);

CREATE TABLE detail_transaksi (
    id_detail INT AUTO_INCREMENT PRIMARY KEY,
    id_transaksi INT NOT NULL,
    id_produk INT NULL,
    nama_produk VARCHAR(100) NOT NULL,
    harga DECIMAL(12,2) NOT NULL,
    jumlah INT NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (id_transaksi)
        REFERENCES transaksi(id_transaksi)
        ON DELETE CASCADE,
    FOREIGN KEY (id_produk)
        REFERENCES produk(id_produk)
        ON DELETE SET NULL
);

INSERT INTO produk
(nama_produk, kategori, harga, stok, deskripsi)
VALUES
('Strawberry Shortcake', 'Cake', 85000, 8,
 'Sponge cake dengan krim stroberi'),
('Chocolate Fudge Cake', 'Cake', 95000, 4,
 'Cake cokelat dengan ganache'),
('Red Velvet Slice', 'Cake', 28000, 14,
 'Red velvet dengan cream cheese'),
('Butter Croissant', 'Pastry', 18000, 20,
 'Pastry berlapis butter'),
('Choco Chip Cookies', 'Cookies', 35000, 3,
 'Cookies dengan choco chips');

INSERT INTO pelanggan
(nama_pelanggan, telepon, email, alamat)
VALUES
('Nadia Putri', '081234567890',
 'nadia@example.com', 'Jember'),
('Raka Pratama', '082145678901',
 'raka@example.com', 'Bondowoso'),
('Pelanggan Umum', '-', '-', '-');
