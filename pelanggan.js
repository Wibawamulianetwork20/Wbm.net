// --- Firebase Config ---
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

$(document).ready(() => {
  // Inisialisasi DataTable
  table = $('#tabelPelanggan').DataTable({
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

  // Load data realtime dari Firebase
  db.ref("pelanggan").on("value", snapshot => {
    if (snapshot.exists()) {
      isiTabel(snapshot.val());
    } else {
      table.clear().draw();
    }
  });

  // Hubungkan tombol Import
  $("#btnImport").on("click", () => {
    const file = document.getElementById("fileKML").files[0];
    importDariXML(file);
  });
});

// --- Isi tabel dengan data ---
function isiTabel(data) {
  table.clear();
  Object.keys(data).forEach(id => {
    const p = data[id];
    table.row.add([
      "", // auto number
      p.nama || "",
      p.alamat || "",
      p.telepon || "",
      p.paket || "",
      p.harga || "",
      `
        <button class="aksi-btn edit" onclick="editPelanggan('${id}')">✏️</button>
        <button class="aksi-btn hapus" onclick="hapusPelanggan('${id}')">🗑️</button>
        <button class="aksi-btn bayar" onclick="bayarPelanggan('${id}')">💰</button>
        <button class="aksi-btn notif" onclick="kirimNotif('${id}')">📩</button>
      `
    ]);
  });
  table.draw(false);
}

// --- Edit Data ---
function editPelanggan(id) {
  db.ref("pelanggan/" + id).once("value").then(snapshot => {
    const data = snapshot.val();
    if (!data) return;

    document.getElementById("editId").value = id;
    document.getElementById("editNama").value = data.nama;
    document.getElementById("editAlamat").value = data.alamat;
    document.getElementById("editPaket").value = data.paket;
    document.getElementById("editHarga").value = data.harga;
    document.getElementById("editTelepon").value = data.telepon;
    document.getElementById("editModal").style.display = "flex";
  });
}

function tutupModal() {
  document.getElementById("editModal").style.display = "none";
}

function simpanEdit(e) {
  e.preventDefault();
  const id = document.getElementById("editId").value;
  const updated = {
    nama: document.getElementById("editNama").value,
    alamat: document.getElementById("editAlamat").value,
    paket: document.getElementById("editPaket").value,
    harga: document.getElementById("editHarga").value,
    telepon: document.getElementById("editTelepon").value
  };
  db.ref("pelanggan/" + id).update(updated, () => tutupModal());
}

// --- Hapus Data ---
function hapusPelanggan(id) {
  if (confirm("Yakin ingin menghapus pelanggan ini?")) {
    db.ref("pelanggan/" + id).remove();
  }
}

// --- Bayar (pindahkan data ke 'lunas') ---
function bayarPelanggan(id) {
  db.ref("pelanggan/" + id).once("value").then(snapshot => {
    const data = snapshot.val();
    if (!data) return;
    db.ref("pelanggan_lunas/" + id).set({
      ...data,
      tanggalLunas: new Date().toISOString()
    });
    db.ref("pelanggan/" + id).remove();
  });
}

// --- Kirim Notif (dummy contoh) ---
function kirimNotif(id) {
  alert("Notifikasi terkirim ke pelanggan ID: " + id);
}

// --- Import dari XML/KML ---
function importDariXML(file) {
  if (!file) return alert("Pilih file XML/KML dulu!");
  const reader = new FileReader();
  reader.onload = e => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(e.target.result, "text/xml");
    const placemarks = xml.getElementsByTagName("Placemark");
    for (let i = 0; i < placemarks.length; i++) {
      const nama = placemarks[i].getElementsByTagName("name")[0]?.textContent || "Tanpa Nama";
      const id = db.ref("pelanggan").push().key;
      db.ref("pelanggan/" + id).set({
        nama, alamat: "-", telepon: "-", paket: "-", harga: "-"
      });
    }
  };
  reader.readAsText(file);
}

// --- Reset Database ---
function resetDatabase() {
  if (confirm("Hapus semua data pelanggan?")) {
    db.ref("pelanggan").remove();
  }
}

// --- Hapus Duplikat ---
function hapusDuplikat() {
  db.ref("pelanggan").once("value", snapshot => {
    if (!snapshot.exists()) return;
    const seen = {};
    snapshot.forEach(child => {
      const data = child.val();
      const key = (data.nama || "") + (data.telepon || "");
      if (seen[key]) {
        db.ref("pelanggan/" + child.key).remove();
      } else {
        seen[key] = true;
      }
    });
  });
}

// --- Clear PWA Cache ---
function clearPWACache() {
  if ('caches' in window) {
    caches.keys().then(names => {
      for (let name of names) caches.delete(name);
    });
    alert("Cache PWA dibersihkan!");
  }
}
