// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBXnXCSXhy06eqWBPzYmzxCo_LBzl51DO4",
  authDomain: "wibawamulianetwork.firebaseapp.com",
  databaseURL: "https://wibawamulianetwork-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wibawamulianetwork",
  storageBucket: "wibawamulianetwork.firebasestorage.app",
  messagingSenderId: "605020393823",
  appId: "1:605020393823:web:6ba8afe7e250bc004da6ea",
  measurementId: "G-9EWJE8F5FG"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

export { auth };

// =========== Register ===========
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    auth.createUserWithEmailAndPassword(email, password)
      .then((cred) => {
        return db.collection('users').doc(cred.user.uid).set({
          uid: cred.user.uid,
          name: name,
          email: email
        });
      })
      .then(() => {
        alert("Registrasi berhasil! Silakan login.");
        registerForm.reset();
        window.location.href = "login.html";
      })
      .catch(err => alert("Error: " + err.message));
  });
}

// =========== Login ===========
// =========== Login dengan Validasi Error ===========
const loginForm = document.getElementById('login-form');
    const uidField = document.getElementById('id');

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          uidField.value = user.uid;
          alert("Login berhasil!");
        })
        .catch((error) => {
          let message = "Login gagal: ";
          switch (error.code) {
            case 'auth/user-not-found':
              message += "Email tidak terdaftar.";
              break;
            case 'auth/wrong-password':
              message += "Password salah.";
              break;
            case 'auth/invalid-email':
              message += "Format email tidak valid.";
              break;
            case 'auth/too-many-requests':
              message += "Terlalu banyak percobaan login. Coba lagi nanti.";
              break;
            default:
              message += error.message;
          }
          alert(message);
        });
    });

    auth.onAuthStateChanged((user) => {
      if (user) {
        uidField.value = user.uid;
      }
    });

// Fungsi Tambah Pelanggan
function tambahPelanggan(data) {
  db.collection('pelanggan').add(data)
    .then(() => alert('Pelanggan ditambahkan!'))
    .catch(err => alert(err.message));
}

// Fungsi Edit Pelanggan
function editPelanggan(id, data) {
  db.collection('pelanggan').doc(id).update(data)
    .then(() => alert('Pelanggan diperbarui!'))
    .catch(err => alert(err.message));
}

// Fungsi Hapus Pelanggan
function hapusPelanggan(id) {
  db.collection('pelanggan').doc(id).delete()
    .then(() => alert('Pelanggan dihapus!'))
    .catch(err => alert(err.message));
}

// Fungsi Konfirmasi Bayar
function konfirmasiBayar(id) {
  db.collection('pelanggan').doc(id).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      db.collection('lunas').add(data)
        .then(() => db.collection('pelanggan').doc(id).delete())
        .then(() => alert('Pembayaran dikonfirmasi!'));
    }
  });
}

// Fungsi Kembalikan ke Aktif
function kembalikanPelanggan(id) {
  db.collection('lunas').doc(id).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      db.collection('pelanggan').add(data)
        .then(() => db.collection('lunas').doc(id).delete())
        .then(() => alert('Pelanggan dikembalikan ke aktif.'));
    }
  });
}

// Fungsi Ticket
function buatTicket(data) {
  db.collection('ticket').add(data)
    .then(() => alert('Ticket berhasil dibuat!'))
    .catch(err => alert(err.message));
}

// Fungsi Pemasukan
function tambahPemasukan(data) {
  db.collection('pemasukan').add(data)
    .then(() => alert('Pemasukan tercatat!'))
    .catch(err => alert(err.message));
}

// Tampilkan Dashboard
function loadDashboard() {
  db.collection('pelanggan').get().then(snapshot => {
    document.getElementById('totalPelanggan').innerText = snapshot.size;
  });
  db.collection('lunas').get().then(snapshot => {
    document.getElementById('pelangganLunas').innerText = snapshot.size;
  });
  db.collection('ticket').get().then(snapshot => {
    document.getElementById('totalTicket').innerText = snapshot.size;
  });
  db.collection('pemasukan').get().then(snapshot => {
    let total = 0;
    snapshot.forEach(doc => {
      total += doc.data().nominal;
    });
    document.getElementById('totalPemasukan').innerText = `Rp ${total.toLocaleString()}`;
  });
}

// Logout
function logout() {
  auth.signOut().then(() => window.location.href = 'login.html');
}
