// 🔧 Konfigurasi Firebase
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

let lastKey = null;
const pageSize = 50; // ambil per 50 data
let totalLoaded = 0;

$(document).ready(() => {
  const table = $('#tabelPelanggan').DataTable({
    serverSide: true,
    processing: true,
    searching: false,
    ordering: false,
    pageLength: pageSize,
    ajax: (data, callback) => {
      loadPage(data.start, data.length, callback);
    }
  });

  // Import XML/KML event
  document.getElementById("btnImport").addEventListener("click", importDariXML);

  // Sinkron JSON otomatis
  importDariJSON();
});

// 🚀 Ambil data per halaman dari Firebase
function loadPage(start, length, callback) {
  let query = db.ref('pelanggan').orderByKey().limitToFirst(length);
  if (lastKey && start > 0) {
    query = db.ref('pelanggan').orderByKey().startAfter(lastKey).limitToFirst(length);
  }

  query.once('value').then(snapshot => {
    const data = [];
    snapshot.forEach(child => {
      const d = child.val();
      data.push([
        ++totalLoaded,
        d.nama || "-",
        d.alamat || "-",
        d.telepon || "-",
        d.paket || "-",
        "Rp" + (d.harga || 0),
        `
        <button class="aksi-btn bayar" onclick="bayar('${child.key}')"><i class="fas fa-money-bill"></i></button>
        <button class="aksi-btn edit" onclick="edit('${child.key}')"><i class="fas fa-edit"></i></button>
        <button class="aksi-btn hapus" onclick="hapus('${child.key}')"><i class="fas fa-trash"></i></button>
        <button class="aksi-btn notif" onclick="notif('${child.key}')"><i class="fas fa-bell"></i></button>
        `
      ]);
      lastKey = child.key;
    });

    callback({
      draw: 1,
      recordsTotal: totalLoaded,
      recordsFiltered: totalLoaded,
      data: data
    });

    document.getElementById("status").textContent = data.length
      ? "✅ Data pelanggan dimuat."
      : "⚠️ Tidak ada data pelanggan.";
  });
}

// 🚀 Import JSON
function importDariJSON() {
  fetch("pelanggan.json")
    .then(res => res.json())
    .then(jsonData => {
      db.ref("pelanggan").once("value").then(snapshot => {
        const dataLama = snapshot.val() || {};
        const namaSet = new Set(Object.values(dataLama).map(d => (d.nama || "").toLowerCase()));
        let totalBaru = 0;

        Object.values(jsonData).forEach((pelanggan, i) => {
          const nama = (pelanggan.nama || "Tanpa Nama").trim();
          if (!namaSet.has(nama.toLowerCase())) {
            const key = (nama + "_" + (pelanggan.telepon || i)).toLowerCase().replace(/\s+/g, "_");
            db.ref("pelanggan/" + key).set(pelanggan);
            totalBaru++;
          }
        });

        console.log(`✅ Import JSON selesai, tambahan baru: ${totalBaru}`);
      });
    })
    .catch(err => console.warn("⚠️ Tidak ada pelanggan.json:", err));
}

// 📥 Import XML/KML
function importDariXML() {
  const fileInput = document.getElementById("fileKML");
  if (!fileInput.files.length) return alert("Pilih file XML/KML terlebih dahulu!");
  const file = fileInput.files[0];

  const reader = new FileReader();
  reader.onload = e => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(e.target.result, "text/xml");
    const geojson = toGeoJSON.kml(xmlDoc);

    db.ref("pelanggan").once("value").then(snapshot => {
      const dataLama = snapshot.val() || {};
      const namaSet = new Set(Object.values(dataLama).map(d => (d.nama || "").toLowerCase()));
      let totalBaru = 0;

      geojson.features.forEach((f, i) => {
        const nama = f.properties.name || "Tanpa Nama " + i;
        if (!namaSet.has(nama.toLowerCase())) {
          const key = (nama + "_" + i).toLowerCase().replace(/\s+/g, "_");
          db.ref("pelanggan/" + key).set({
            nama,
            alamat: "-",
            telepon: "-",
            paket: "-",
            harga: 0
          });
          totalBaru++;
        }
      });

      alert(`✅ Import XML selesai! Tambahan baru: ${totalBaru}`);
      location.reload();
    });
  };
  reader.readAsText(file);
}

// 🗑️ Reset DB
function resetDatabase() {
  if (confirm("⚠️ Semua data pelanggan akan dihapus. Lanjutkan?")) {
    db.ref("pelanggan").set(null).then(() => {
      alert("✅ Semua data dihapus!");
      location.reload();
    });
  }
}

// 🗑️ Hapus duplikat
function hapusDuplikat() {
  db.ref("pelanggan").once("value", snapshot => {
    if (!snapshot.exists()) return alert("Tidak ada data.");
    const data = snapshot.val();
    const seen = {};
    const hapusList = [];

    for (let id in data) {
      const nama = (data[id].nama || "").trim().toLowerCase();
      if (seen[nama]) hapusList.push(id);
      else seen[nama] = true;
    }

    hapusList.forEach(id => db.ref("pelanggan/" + id).remove());
    alert(`✅ ${hapusList.length} duplikat dihapus!`);
    location.reload();
  });
}

// 🔘 Dummy aksi
function bayar(id){ alert("Bayar ID: " + id); }
function edit(id){ alert("Edit ID: " + id); }
function hapus(id){ if(confirm("Hapus data?")) db.ref("pelanggan/"+id).remove().then(() => location.reload()); }
function notif(id){ alert("Notifikasi ke ID: " + id); }