let currentImageUrl = null;

// Event listener untuk preview gambar yang diupload
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        // Validasi tipe file
        if (!file.type.match('image.*')) {
            showMessage('Silakan pilih file gambar yang valid!');
            return;
        }
        
        // Validasi ukuran file (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showMessage('Ukuran file terlalu besar. Maksimal 5MB!');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            showImagePreview(e.target.result);
            currentImageUrl = e.target.result;
        }
        reader.readAsDataURL(file);
    }
});

function showImagePreview(imageUrl) {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = `<img src="${imageUrl}" alt="Preview Gambar">`;
}

function showMessage(message, type = 'error') {
    const container = document.getElementById('messageContainer');
    container.innerHTML = `<div class="${type === 'error' ? 'error-message' : 'success-message'}">${message}</div>`;
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }
}

function clearMessage() {
    document.getElementById('messageContainer').innerHTML = '';
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function processUploadedImage() {
    if (!currentImageUrl) {
        showMessage('Silakan pilih gambar terlebih dahulu!');
        return;
    }
    processImage(currentImageUrl);
}

function processImageFromUrl() {
    const urlInput = document.getElementById('urlInput').value.trim();
    if (!urlInput) {
        showMessage('Silakan masukkan URL gambar!');
        return;
    }

    // Validasi URL
    try {
        new URL(urlInput);
    } catch (e) {
        showMessage('URL tidak valid! Pastikan URL dimulai dengan http:// atau https://');
        return;
    }

    showImagePreview(urlInput);
    processImage(urlInput);
}

async function processImage(imageUrl) {
    clearMessage();
    showLoading(true);

    try {
        console.log('Memulai proses OCR...');
        
        const worker = Tesseract.createWorker({
            logger: progress => {
                console.log('Progress:', progress);
                if (progress.status === 'recognizing text') {
                    // Update progress jika diperlukan
                    updateProgress(progress.progress);
                }
            }
        });

        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        
        // Konfigurasi untuk membaca angka saja
        await worker.setParameters({
            tessedit_char_whitelist: '0123456789',
            tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
        });

        const { data: { text, confidence } } = await worker.recognize(imageUrl);
        
        await worker.terminate();

        console.log('Hasil OCR:', { text, confidence });
        
        // Ekstrak hanya angka dari hasil teks
        const numbers = text.replace(/[^\d]/g, '');
        
        displayResults(numbers, text, confidence);
        showMessage('Berhasil membaca nomor transaksi!', 'success');

    } catch (error) {
        console.error('Error OCR:', error);
        showMessage(`Terjadi kesalahan: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

function updateProgress(progress) {
    // Optional: Implement progress bar jika diperlukan
    console.log(`Progress: ${(progress * 100).toFixed(1)}%`);
}

function displayResults(numbers, rawText, confidence) {
    const resultsSection = document.getElementById('resultsSection');
    const transactionNumber = document.getElementById('transactionNumber');
    const rawTextElement = document.getElementById('rawText');
    const confidenceElement = document.getElementById('confidence');

    // Tampilkan nomor transaksi
    transactionNumber.textContent = numbers || 'Tidak terdeteksi';
    
    // Tampilkan teks mentah
    rawTextElement.textContent = rawText || 'Tidak ada teks yang terbaca';
    
    // Tampilkan confidence dengan warna berdasarkan tingkat akurasi
    const confidencePercent = (confidence * 100).toFixed(1);
    let confidenceClass = 'confidence-low';
    if (confidence > 0.7) confidenceClass = 'confidence-high';
    else if (confidence > 0.5) confidenceClass = 'confidence-medium';
    
    confidenceElement.innerHTML = `
        <span class="${confidenceClass}">${confidencePercent}%</span>
    `;

    resultsSection.style.display = 'block';
    
    // Scroll ke hasil
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
    // Reset semua form
    document.getElementById('fileInput').value = '';
    document.getElementById('urlInput').value = '';
    document.getElementById('imagePreview').innerHTML = '<p>Pratinjau gambar akan muncul di sini</p>';
    document.getElementById('resultsSection').style.display = 'none';
    clearMessage();
    currentImageUrl = null;
}

// Inisialisasi
document.addEventListener('DOMContentLoaded', function() {
    console.log('OCR Transaction Reader siap digunakan!');
    
    // Enter key support untuk URL input
    document.getElementById('urlInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            processImageFromUrl();
        }
    });
});