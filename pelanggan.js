// ======================
// 🔧 Konfigurasi Firebase
// ======================
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

// ======================
// ⚡ DataTables setup
// ======================
let table;
$(document).ready(() => {
  table = $('#tabelPelanggan').DataTable({
    pageLength: 25,
    ordering: false,
    searching: true,
    destroy: true
  });

  // load awal
  tampilkanTabel();

  // tombol import XML
  document.getElementById("btnImport").addEventListener("click", () => {
    const fileInput = document.getElementById("fileKML");
    if (!fileInput.files.length) return alert("Pilih file XML/KML terlebih dahulu!");
    importDariXML(fileInput.files[0]);
  });
});

// ======================
// 📥 Import pelanggan.xml/kml
// ======================
function importDariXML(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(e.target.result, "text/xml");

      // Ambil semua <Placemark>
      const placemarks = xmlDoc.getElementsByTagName("Placemark");
      console.log("Jumlah Placemark terbaca:", placemarks.length);

      db.ref("pelanggan").once("value").then(snapshot => {
        const dataLama = snapshot.val() || {};
        const namaSet = new Set(Object.values(dataLama).map(d => (d.nama || "").toLowerCase()));

        let totalBaru = 0;
        for (let i = 0; i < placemarks.length; i++) {
          const nameTag = placemarks[i].getElementsByTagName("name")[0];
          const nama = nameTag ? nameTag.textContent.trim() : "Tanpa Nama " + (i+1);

          if (!namaSet.has(nama.toLowerCase())) {
            const key = nama.toLowerCase().replace(/\s+/g, "_");
            db.ref("pelanggan/" + key).set({
              nama,
              alamat: "-",
              telepon: "-",
              paket: "-",
              harga: 0
            });
            totalBaru++;
          }
        }

        alert(`✅ Import XML selesai! Tambahan baru: ${totalBaru}`);
        tampilkanTabel(); // refresh tabel
      });
    } catch (err) {
      alert("❌ Gagal memproses file XML/KML: " + err.message);
    }
  };
  reader.readAsText(file);
}

// ======================
// 📊 Tampilkan tabel pelanggan
// ======================
function tampilkanTabel() {
  db.ref("pelanggan").once("value").then(snapshot => {
    table.clear();
    let no = 1;
    snapshot.forEach(child => {
      const d = child.val();
      table.row.add([
        no++,
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
    });
    table.draw(false);
    document.getElementById("status").textContent = "✅ Data pelanggan dimuat.";
  });
}

// ======================
// 🗑️ Reset & Hapus duplikat
// ======================
function resetDatabase() {
  if (confirm("⚠️ Semua data pelanggan akan dihapus.\nLanjutkan reset?")) {
    db.ref("pelanggan").set(null).then(() => {
      alert("✅ Semua data pelanggan sudah dihapus!");
      tampilkanTabel();
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
    tampilkanTabel();
  });
}

// ======================
// 🔘 Tombol Aksi dummy
// ======================
function bayar(id){ alert("Bayar ID: " + id); }
function edit(id){ alert("Edit ID: " + id); }
function hapus(id){ if(confirm("Hapus data?")) db.ref("pelanggan/"+id).remove().then(tampilkanTabel); }
function notif(id){ alert("Notifikasi ke ID: " + id); }
