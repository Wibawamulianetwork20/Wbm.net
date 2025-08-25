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
let lastKey = null;
const limit = 50;
let loading = false;

$(document).ready(() => {
  table = $('#tabelPelanggan').DataTable({
    pageLength: 25,
    ordering: false,
    searching: true,
    destroy: true,
    columnDefs: [{
      targets: 0, // Kolom pertama untuk nomor urut
      render: function (data, type, row, meta) {
        return meta.row + 1; // Nomor urut otomatis
      }
    }]
  });

  loadPelanggan();

  // Infinite scroll
  window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
      if (!loading) loadPelanggan();
    }
  });
});

// ========== Load batch pelanggan ==========
function loadPelanggan() {
  loading = true;
  document.getElementById("status").textContent = "⏳ Memuat data...";

  let query = db.ref('pelanggan').orderByKey().limitToFirst(limit);
  if (lastKey) query = db.ref('pelanggan').orderByKey().startAfter(lastKey).limitToFirst(limit);

  query.once('value').then(snapshot => {
    const data = [];
    snapshot.forEach(child => {
      data.push({ id: child.key, ...child.val() });
      lastKey = child.key;
    });

    if (data.length > 0) {
      renderTable(data, true);
      document.getElementById("status").textContent = "Scroll ke bawah untuk memuat lebih banyak...";
    } else {
      document.getElementById("status").textContent = "✅ Semua data sudah dimuat.";
    }
    loading = false;
  });
}

// ========== Render DataTables ==========
function renderTable(data, append=false) {
  if (!append) table.clear();
  data.forEach(item => {
    table.row.add([
      "", // kolom nomor
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

// ========== Import dari pelanggan.json ==========
function importDariJSON() {
  fetch("pelanggan.json")
    .then(res => res.json())
    .then(jsonData => {
      db.ref("pelanggan").once("value").then(snapshot => {
        const dataLama = snapshot.val() || {};
        const namaSet = new Set(Object.values(dataLama).map(d => (d.nama || "").toLowerCase()));

        let totalBaru = 0;
        for (let id in jsonData) {
          const pelanggan = jsonData[id];
          const nama = pelanggan.nama || "Tanpa Nama";

          if (!namaSet.has(nama.toLowerCase())) {
            const key = nama.toLowerCase().replace(/\s+/g, "_");
            db.ref("pelanggan/" + key).set(pelanggan);
            totalBaru++;
          }
        }

        console.log(`✅ Import JSON selesai, tambahan baru: ${totalBaru}`);
      });
    })
    .catch(err => console.warn("⚠️ Tidak ada pelanggan.json atau gagal baca:", err));
}
window.addEventListener("load", importDariJSON);

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

          // Cek duplikat nama
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
  if(confirm("Hapus data?")) db.ref("pelanggan/"+id).remove().then(() => {
    table.clear().draw();
    lastKey = null;
    loadPelanggan();
  });
}
function notif(id){ alert("Notifikasi ke ID: " + id); }

// ========== Utility ==========
function resetDatabase() {
  if (confirm("⚠️ Semua data pelanggan akan dihapus.\nLanjutkan reset?")) {
    db.ref("pelanggan").set(null).then(() => {
      alert("✅ Semua data pelanggan sudah dihapus!");
      table.clear().draw();
      lastKey = null;
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

// ========== Event Listener untuk tombol Import ==========
document.addEventListener("DOMContentLoaded", () => {
  const btnImport = document.getElementById("btnImport");
  if (btnImport) {
    btnImport.addEventListener("click", () => {
      const fileInput = document.getElementById("fileKML");
      importDariXML(fileInput.files[0]);
    });
  }
});
