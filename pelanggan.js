// ========== Konfigurasi Firebase ==========
const firebaseConfig = {
  apiKey: "AIzaSyBXnXCSXhy06eqWBPzYmzxCo_LBzl51DO4",
  authDomain: "wibawamulianetwork.firebaseapp.com",
  databaseURL: "https://wibawamulianetwork-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wibawamulianetwork",
  storageBucket: "wibawamulianetwork.appspot.com",
  messagingSenderId: "605020393823",
  appId: "1:605020393823:web:6ba8afe7e250bc004da6ea"
};
const app = firebase.initializeApp(firebaseConfig);
const db = app.database();

// ========== Variabel tabel ==========
let table;
$(document).ready(() => {
  table = $('#tabelPelanggan').DataTable({
    pageLength: 25,
    ordering: false,
    searching: true,
    destroy: true,
    columnDefs: [{
      targets: 0,
      render: function (data, type, row, meta) {
        return meta.row + 1;
      }
    }]
  });

  loadPelanggan();
});

// ========== Load semua pelanggan ==========
function loadPelanggan() {
  document.getElementById("status").textContent = "⏳ Memuat data...";
  db.ref("pelanggan").once("value").then(snapshot => {
    const data = [];
    snapshot.forEach(child => {
      data.push({ id: child.key, ...child.val() });
    });
    renderTable(data, false);
    document.getElementById("status").textContent = data.length > 0
      ? "✅ Data pelanggan dimuat."
      : "⚠️ Tidak ada data pelanggan.";
  });
}

function resetDatabase() {
  if (confirm("Yakin ingin reset database? Semua data akan hilang!")) {
    db.ref("pelanggan").remove().then(() => {
      // Ambil file JSON default
      fetch("pelanggan.json")
        .then(res => res.json())
        .then(data => {
          // Simpan lagi ke Firebase
          for (let id in data) {
            db.ref("pelanggan").push(data[id]);
          }
          alert("Database berhasil direset & restore dari JSON!");
          table.clear().draw();
          lastKey = null;
          loadPelanggan();
        });
    });
  }
}

// ========== Utility normalisasi nama ==========
function normalizeNama(nama) {
  return (nama || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")   // rapikan spasi
    .replace(/\./g, "");    // hapus titik
}

// ========== Import dari XML/KML ==========
function importDariXML(file) {
  if (!file) return alert("Pilih file XML/KML terlebih dahulu!");

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(e.target.result, "text/xml");

      const placemarks = xmlDoc.getElementsByTagName("Placemark");
      console.log("Jumlah Placemark terbaca:", placemarks.length);

      db.ref("pelanggan").once("value").then(snapshot => {
        const dataLama = snapshot.val() || {};
        const namaSet = new Set(
          Object.values(dataLama).map(d => normalizeNama(d.nama))
        );

        let totalBaru = 0;
        for (let i = 0; i < placemarks.length; i++) {
          const nameTag = placemarks[i].getElementsByTagName("name")[0];
          const coordTag = placemarks[i].getElementsByTagName("coordinates")[0];

          const nama = nameTag ? nameTag.textContent.trim() : "Tanpa Nama " + (i+1);
          const coords = coordTag ? coordTag.textContent.trim().split(",") : [null, null];

          // Normalisasi nama untuk deteksi duplikat
          const namaNorm = normalizeNama(nama);

          // Cek nama duplikat
          if (!namaSet.has(namaNorm)) {
            const newRef = db.ref("pelanggan").push(); // key unik
            newRef.set({
              nama,
              alamat: "-",          
              telepon: "-",
              paket: "-",
              harga: 0,
              longitude: coords[0],
              latitude: coords[1]
            });
            namaSet.add(namaNorm); // tandai sudah ada
            totalBaru++;
          }
        }

        alert(`✅ Import XML selesai! Tambahan baru: ${totalBaru}`);
        table.clear().draw();
        lastKey = null;
        loadPelanggan();
      });
    } catch (err) {
      alert("❌ Gagal memproses file XML/KML: " + err.message);
    }
  };
  reader.readAsText(file);
}

// ========== Aksi tombol ==========
function bayar(id){ alert("Bayar ID: " + id); }
function edit(id){ alert("Edit ID: " + id); }
function hapus(id){
  if(confirm("Hapus data?")) db.ref("pelanggan/"+id).remove().then(() => loadPelanggan());
}
function notif(id){ alert("Notifikasi ke ID: " + id); }

// ========== Utility ==========
function resetDatabase() {
  if (confirm("⚠️ Semua data pelanggan akan dihapus.\nLanjutkan reset?")) {
    db.ref("pelanggan").set(null).then(() => {
      alert("✅ Semua data pelanggan sudah dihapus!");
      loadPelanggan();
    });
  }
}

// ========== Hapus duplikat berdasarkan nama normalisasi ==========
function hapusDuplikat() {
  db.ref("pelanggan").once("value", snapshot => {
    if (!snapshot.exists()) {
      alert("Tidak ada data pelanggan.");
      return;
    }

    const data = snapshot.val();
    const seen = {};
    const hapusList = [];

    for (let id in data) {
      let namaNorm = normalizeNama(data[id].nama || "");
      if (seen[namaNorm]) {
        // Kalau sudah pernah ada nama ini → masuk daftar hapus
        hapusList.push(id);
      } else {
        // Simpan yang pertama kali ditemukan
        seen[namaNorm] = id;
      }
    }

    // Hapus semua duplikat
    hapusList.forEach(id => db.ref("pelanggan/" + id).remove());

    alert(`✅ ${hapusList.length} duplikat dihapus!`);
    table.clear().draw();
    lastKey = null;
    loadPelanggan();
  });
}

function clearPWACache() {
  if (!confirm("⚠️ Hapus semua cache & service worker PWA?")) return;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => reg.unregister()));
  }
  caches.keys().then(names => names.forEach(name => caches.delete(name)));
  localStorage.clear(); sessionStorage.clear();
  alert("✅ Cache & Service Worker PWA dibersihkan.\nReload halaman.");
}

// ========== Event Listener tombol Import ==========
document.addEventListener("DOMContentLoaded", () => {
  const btnImport = document.getElementById("btnImport");
  if (btnImport) {
    btnImport.addEventListener("click", () => {
      const fileInput = document.getElementById("fileKML");
      importDariXML(fileInput.files[0]);
    });
  }
});
