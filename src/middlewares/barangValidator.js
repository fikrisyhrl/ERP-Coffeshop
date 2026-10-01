/**
 * Validasi payload request body untuk create / update Barang
 */
const validateBarangPayload = (req, res, next) => {
  const { nama_barang, kategori, satuan, harga_satuan, batas_safety_stock } = req.body;
  const errors = [];

  // Pengecekan kolom wajib (nama_barang, kategori, satuan)
  if (!nama_barang || typeof nama_barang !== 'string' || nama_barang.trim() === '') {
    errors.push({ field: 'nama_barang', message: 'nama_barang wajib diisi berupa teks' });
  }

  if (!kategori || typeof kategori !== 'string' || kategori.trim() === '') {
    errors.push({ field: 'kategori', message: 'kategori wajib diisi berupa teks (contoh: Coffee Beans, Dairy, Syrup)' });
  }

  if (!satuan || typeof satuan !== 'string' || satuan.trim() === '') {
    errors.push({ field: 'satuan', message: 'satuan wajib diisi (contoh: gr, ml, pcs)' });
  }

  // Pengecekan harga_satuan
  if (harga_satuan === undefined || harga_satuan === null || isNaN(Number(harga_satuan))) {
    errors.push({ field: 'harga_satuan', message: 'harga_satuan wajib diisi berupa angka' });
  } else if (Number(harga_satuan) < 0) {
    errors.push({ field: 'harga_satuan', message: 'harga_satuan tidak boleh bernilai negatif' });
  }

  // Pengecekan batas_safety_stock
  if (batas_safety_stock === undefined || batas_safety_stock === null || isNaN(Number(batas_safety_stock))) {
    errors.push({ field: 'batas_safety_stock', message: 'batas_safety_stock wajib diisi berupa angka' });
  } else if (Number(batas_safety_stock) < 0) {
    errors.push({ field: 'batas_safety_stock', message: 'batas_safety_stock tidak boleh bernilai negatif' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validasi data barang gagal',
      errors
    });
  }

  next();
};

module.exports = {
  validateBarangPayload
};
