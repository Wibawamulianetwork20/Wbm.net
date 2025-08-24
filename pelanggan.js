let table;
let lastKey = null;
const limit = 50;
let loading = false;

$(document).ready(() => {
  table = $('#tabelPelanggan').DataTable({
    pageLength: 25,
    ordering: false,
    searching: true,
    destroy: true
  });

  loadPelanggan();

  // Infinite scroll
  window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
      if (!loading) loadPelanggan();
    }
  });

  // Tombol import XML
  document.getElementById("btnImport").addEventListener("click", () => {
    const fileInput = document.getElementById("fileKML");
    if (!fileInput.files.length) return alert("Pilih file XML/KML dulu!");
    importDariXML(fileInput.files[0]);
  });
});

// 🔄 Load batch pelanggan dari Firebase
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

// 🖼️ Render DataTables
function renderTable(data, append=false) {
  if (!append) table.clear();
  let no = table.data().count() + 1;
  data.forEach(item => {
    table.row.add([
      no++,
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

// 🚀 Import otomatis dari pelanggan.json
function importDariJSON() {
  fetch("pelanggan.json")
    .then(res => res.json())
    .then(jsonData => {
      db.ref("pelanggan").once("value").then(snapshot => {
        const dataLama = snapshot.val() || {};
        const namaSet = new Set(
          Object.values(dataLama).map(d => (d.nama || "").toLowerCase())
        );

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

// 📥 Import pelanggan dari file XML/KML (manual parse sesuai Wbmnet.xml)
function importDariXML(file) {
  if (!file) return alert("Pilih file XML/KML terlebih dahulu!");

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(e.target.result, "text/xml");

      // Ambil semua <Placemark>
      const placemarks = xmlDoc.getElementsByTagName("Placemark");

      db.ref("pelanggan").once("value").then(snapshot => {
        const dataLama = snapshot.val() || {};
        const namaSet = new Set(Object.values(dataLama).map(d => (d.nama || "").toLowerCase()));

        let totalBaru = 0;
        for (let i = 0; i < placemarks.length; i++) {
          const pm = placemarks[i];

          // Ambil <name>
          const namaNode = pm.getElementsByTagName("name")[0];
          const nama = namaNode ? namaNode.textContent.trim() : "Tanpa Nama " + (i+1);

          // Ambil <coordinates>
          const coordNode = pm.getElementsByTagName("coordinates")[0];
          let longitude = null, latitude = null;
          if (coordNode) {
            const coords = coordNode.textContent.trim().split(",");
            longitude = coords[0] || null;
            latitude = coords[1] || null;
          }

          // Tambahkan hanya jika belum ada
          if (!namaSet.has(nama.toLowerCase())) {
            const key = nama.toLowerCase().replace(/\s+/g, "_");
            db.ref("pelanggan/" + key).set({
              nama,
              alamat: "-",
              telepon: "-",
              paket: "-",
              harga: 0,
              longitude,
              latitude
            });
            totalBaru++;
          }
        }

        alert(`✅ Import XML selesai! Tambahan baru: ${totalBaru}`);
        // refresh tabel
        lastKey = null; // reset untuk load ulang dari awal
        table.clear().draw();
        loadPelanggan();
      });
    } catch (err) {
      alert("❌ Gagal memproses file XML/KML: " + err.message);
    }
  };
  reader.readAsText(file);
}

// 🗑️ Reset Database
function resetDatabase() {
  if (confirm("⚠️ Semua data pelanggan akan dihapus.\nLanjutkan reset?")) {
    db.ref("pelanggan").set(null).then(() => {
      alert("✅ Semua data pelanggan sudah dihapus!");
      table.clear().draw();
      lastKey = null;
    });
  }
}

// 🗑️ Hapus duplikat berdasarkan nama
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

// 🔘 Aksi tombol dummy
function bayar(id){ alert("Bayar ID: " + id); }
function edit(id){ alert("Edit ID: " + id); }
function hapus(id){ if(confirm("Hapus data?")) db.ref("pelanggan/"+id).remove().then(() => { table.clear().draw(); lastKey=null; loadPelanggan(); }); }
function notif(id){ alert("Notifikasi ke ID: " + id); }
