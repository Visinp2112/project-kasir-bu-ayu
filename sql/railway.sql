CREATE TABLE user (
  id_user INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','petugas') NOT NULL
);

CREATE TABLE product (
  id_barang INT AUTO_INCREMENT PRIMARY KEY,
  nm_barang VARCHAR(100) NOT NULL,
  harga INT NOT NULL,
  stok INT NOT NULL DEFAULT 0,
  type_kategori VARCHAR(50)
);

CREATE TABLE product_foto (
  id_barang INT PRIMARY KEY,
  tipe VARCHAR(30) NOT NULL,
  data MEDIUMBLOB NOT NULL,
  diubah TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_barang) REFERENCES product(id_barang) ON DELETE CASCADE
);

CREATE TABLE member (
  id_member INT AUTO_INCREMENT PRIMARY KEY,
  nm VARCHAR(100) NOT NULL,
  tlpn VARCHAR(20),
  email VARCHAR(100),
  alamat TEXT
);

CREATE TABLE transaksi (
  id_transaksi INT AUTO_INCREMENT PRIMARY KEY,
  tgl DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_bayar INT NOT NULL,
  bayar INT NOT NULL,
  kembalian INT NOT NULL,
  id_user INT NOT NULL,
  id_member INT NULL,
  FOREIGN KEY (id_user) REFERENCES user(id_user),
  FOREIGN KEY (id_member) REFERENCES member(id_member)
);

CREATE TABLE detail_transaksi (
  id_detail INT AUTO_INCREMENT PRIMARY KEY,
  id_transaksi INT NOT NULL,
  id_barang INT NOT NULL,
  jumlah INT NOT NULL,
  harga_satuan INT NOT NULL,
  FOREIGN KEY (id_transaksi) REFERENCES transaksi(id_transaksi),
  FOREIGN KEY (id_barang) REFERENCES product(id_barang)
);