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

// ========== Render DataTables ==========
function renderTable(data, append=false) {
  if (!append) table.clear();
  data.forEach(item => {
    table.row.add([
      "", // nomor urut otomatis
      item.nama,
      item.alamat || "-",
      item.telepon || "-",
      item.paket || "-",
      "Rp" + (item.harga || 0),
      `
      <button class="aksi-btn bayar" onclick="bayar('${item.id}')"><i class="fas fa-money-bill"></i></button>
      <button class="aksi-btn edit" onclick="edit('${item.id}')"><i class="fas fa-edit"></i></button>
      <button class="aksi-btn hapus" onclick="hapus('${item.id}')"><i class="fas fa-trash"></i></button>
      <button class="aksi-btn notif" onclick="notif('${item.id}')"><i class="fas fa-bell"></i></button>
      `
    ]);
  });
  table.draw(false);
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
        const namaSet = new Set(Object.values(dataLama).map(d => (d.nama || "").toLowerCase()));

        let totalBaru = 0;
        for (let i = 0; i < placemarks.length; i++) {
          const nameTag = placemarks[i].getElementsByTagName("name")[0];
          const coordTag = placemarks[i].getElementsByTagName("coordinates")[0];

          const nama = nameTag ? nameTag.textContent.trim() : "Tanpa Nama " + (i+1);
          const coords = coordTag ? coordTag.textContent.trim().split(",") : [null, null];

          if (!namaSet.has(nama.toLowerCase())) {
            const newRef = db.ref("pelanggan").push();
            newRef.set({
              nama,
              alamat: "-",
              telepon: "-",
              paket: "-",
              harga: 0,
              longitude: coords[0],
              latitude: coords[1]
            });
            namaSet.add(nama.toLowerCase());
            totalBaru++;
          }
        }

        alert(`✅ Import XML selesai! Tambahan baru: ${totalBaru}`);

        // Setelah impor, refresh tabel penuh
        db.ref("pelanggan").once("value").then(snap => {
          const allData = [];
          snap.forEach(child => {
            allData.push({ id: child.key, ...child.val() });
          });
          renderTable(allData, false);
          document.getElementById("status").textContent = "✅ Data terbaru sudah dimuat.";
        });
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
      let nama = (data[id].nama || "").trim().toLowerCase();
      if (seen[nama]) hapusList.push(id);
      else seen[nama] = true;
    }
    hapusList.forEach(id => db.ref("pelanggan/"+id).remove());
    alert(`✅ ${hapusList.length} duplikat dihapus!`);
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
