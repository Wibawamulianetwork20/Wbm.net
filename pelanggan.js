// ================= Firebase Config =================
const firebaseConfig = {
  apiKey: "AIzaSyBXnXCSXhy06eqWBPzYmzxCo_LBzl51DO4",
  authDomain: "wibawamulianetwork.firebaseapp.com",
  databaseURL: "https://wibawamulianetwork-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wibawamulianetwork",
  storageBucket: "wibawamulianetwork.appspot.com",
  messagingSenderId: "605020393823",
  appId: "1:605020393823:web:6ba8afe7e250bc004da6ea"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let table;
let editIdGlobal = null;

// ================== Load Data ==================
function loadPelanggan() {
  table.clear();

  db.ref("pelanggan").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const data = child.val();

      const aksi = `
        <button class="aksi-btn bayar" onclick="bayar('${child.key}')"><i class="fas fa-credit-card"></i></button>
        <button class="aksi-btn edit" onclick="edit('${child.key}')"><i class="fas fa-edit"></i></button>
        <button class="aksi-btn hapus" onclick="hapus('${child.key}')"><i class="fas fa-trash"></i></button>
        <button class="aksi-btn notif" onclick="notif('${child.key}')"><i class="fas fa-bell"></i></button>
      `;

      table.row.add([
        "", 
        data.nama || "-",
        data.alamat || "-",
        data.telepon || "-",
        data.paket || "-",
        data.harga ? "Rp " + data.harga.toLocaleString("id-ID") : "Rp 0",
        aksi
      ]);
    });
    table.draw(false);
  });
}

// ========== Restore data awal dari JSON ==========
function cekDanRestoreData() {
  db.ref("pelanggan").once("value").then(snapshot => {
    if (!snapshot.exists()) {
      console.log("⚠️ Data kosong, restore dari pelanggan.json...");
      fetch("pelanggan.json")
        .then(res => res.json())
        .then(json => {
          // json.pelanggan isinya { pel001: {...}, pel002: {...}, ... }
          const pelanggan = json.pelanggan || {};
          return db.ref("pelanggan").update(pelanggan);
        })
        .then(() => {
          alert("✅ Data awal berhasil di-restore dari JSON!");
          loadPelanggan();
        })
        .catch(err => console.error("❌ Gagal restore data:", err));
    } else {
      loadPelanggan();
    }
  });
}

// ================== Aksi Tombol ==================
function bayar(id) {
  db.ref("pelanggan/" + id).once("value").then(snapshot => {
    const data = snapshot.val();
    if (!data) return;

    db.ref("pelanggan_lunas/" + id).set({
      ...data,
      tanggalBayar: new Date().toISOString()
    }).then(() => {
      db.ref("pelanggan/" + id).remove().then(() => loadPelanggan());
      alert("✅ Pembayaran berhasil untuk " + data.nama);
    });
  });
}

// ===== Modal Edit =====
function edit(id) {
  db.ref("pelanggan/" + id).once("value").then(snapshot => {
    const data = snapshot.val();
    if (!data) return;

    editIdGlobal = id;
    document.getElementById("editId").value = id;
    document.getElementById("editNama").value = data.nama || "";
    document.getElementById("editAlamat").value = data.alamat || "";
    document.getElementById("editPaket").value = data.paket || "";
    document.getElementById("editHarga").value = data.harga || 0;
    document.getElementById("editTelepon").value = data.telepon || "";

    document.getElementById("editModal").style.display = "flex";
  });
}

function tutupModal() {
  document.getElementById("editModal").style.display = "none";
  editIdGlobal = null;
}

function simpanEdit(e) {
  e.preventDefault();
  if (!editIdGlobal) return;

  const updatedData = {
    nama: document.getElementById("editNama").value,
    alamat: document.getElementById("editAlamat").value,
    paket: document.getElementById("editPaket").value,
    harga: parseInt(document.getElementById("editHarga").value) || 0,
    telepon: document.getElementById("editTelepon").value
  };

  db.ref("pelanggan/" + editIdGlobal).update(updatedData).then(() => {
    tutupModal();
    loadPelanggan();
    alert("✅ Data pelanggan berhasil diperbarui!");
  });
}

// ===== Hapus =====
function hapus(id) {
  if (confirm("Hapus data pelanggan ini?")) {
    db.ref("pelanggan/" + id).remove().then(() => {
      loadPelanggan();
      alert("🗑️ Data berhasil dihapus");
    });
  }
}

// ===== Notifikasi =====
function notif(id) {
  db.ref("pelanggan/" + id).once("value").then(snapshot => {
    const data = snapshot.val();
    if (!data) return;
    alert("🔔 Kirim notifikasi ke " + data.nama + " (" + data.telepon + ")");
    console.log("TODO: integrasi WhatsApp API / FCM", data);
  });
}

// ================== Utilitas ==================
function resetDatabase() {
  if (confirm("⚠️ Reset semua data pelanggan?")) {
    db.ref("pelanggan").remove().then(() => {
      cekDanRestoreData();
      alert("✅ Database berhasil di-reset!");
    });
  }
}

function hapusDuplikat() {
  alert("🚧 Fitur hapus duplikat belum diimplementasikan.");
}

function clearPWACache() {
  if ('caches' in window) {
    caches.keys().then(names => {
      for (let name of names) caches.delete(name);
    });
    alert("🧹 Cache PWA berhasil dibersihkan!");
  }
}

// ================== Import XML/KML ==================
function importDariXML(file) {
  if (!file) {
    alert("⚠️ Pilih file XML/KML terlebih dahulu!");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(e.target.result, "text/xml");

    const placemarks = xml.getElementsByTagName("Placemark");
    let dataBaru = {};
    for (let i = 0; i < placemarks.length; i++) {
      const nama = placemarks[i].getElementsByTagName("name")[0]?.textContent || "Tanpa Nama";
      const alamat = placemarks[i].getElementsByTagName("description")[0]?.textContent || "-";

      const id = db.ref().child("pelanggan").push().key;
      dataBaru[id] = {
        nama,
        alamat,
        telepon: "-",
        paket: "-",
        harga: 0
      };
    }

    db.ref("pelanggan").update(dataBaru).then(() => {
      loadPelanggan();
      alert(`✅ Berhasil import ${Object.keys(dataBaru).length} pelanggan dari XML/KML!`);
    });
  };
  reader.readAsText(file);
}

// ================== Init DataTables ==================
$(document).ready(() => {
  $('#tabelPelanggan').DataTable({
      pageLength: 10,
      lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
      searching: true,
      ordering: false,
      destroy: true,
      columnDefs: [{
        targets: 0,
        render: function (data, type, row, meta) {
          return meta.row + 1;
        }
      }]
    });

  cekDanRestoreData();
});
