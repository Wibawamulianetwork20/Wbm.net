// Firebase Config
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
const auth = firebase.auth();
const db = firebase.firestore();
const rtdb = firebase.database();

// === REGISTER ===
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    auth.createUserWithEmailAndPassword(email, password)
      .then((cred) => {
        // Simpan ke Firestore
        return db.collection('users').doc(cred.user.uid).set({
          uid: cred.user.uid,
          name: name,
          email: email,
          role: 'pelanggan'
        }).then(() => {
          // Simpan juga ke RTDB
          return rtdb.ref('pelanggan/aktif/' + cred.user.uid).set({
            nama: name,
            email: email,
            paket: "-",
            harga: 0,
            keterangan: "Belum bayar"
          });
        });
      })
      .then(() => {
        alert("Registrasi berhasil. Silakan login.");
        window.location.href = "login.html";
      })
      .catch(err => {
        let message = "Gagal Registrasi: ";
        switch (err.code) {
          case 'auth/email-already-in-use':
            message += "Email sudah terdaftar.";
            break;
          case 'auth/invalid-email':
            message += "Email tidak valid.";
            break;
          case 'auth/weak-password':
            message += "Password terlalu lemah (min 6 karakter).";
            break;
          default:
            message += err.message;
        }
        alert(message);
      });
  });
}

// === LOGIN ===
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const uidField = document.getElementById('id');

    auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        return db.collection("users").doc(user.uid).get();
      })
      .then((doc) => {
        if (doc.exists) {
          const data = doc.data();
          const role = data.role;
          if (uidField) uidField.value = doc.id;

          if (role === 'admin') {
            alert(`Selamat datang Admin: ${data.name}`);
            window.location.href = "homepage.html";
          } else if (role === 'pelanggan') {
            alert(`Selamat datang Pelanggan: ${data.name}`);
            window.location.href = "pelanggan.html";
          } else {
            auth.signOut();
            alert("Akun tidak memiliki peran yang valid.");
          }
        } else {
          auth.signOut();
          alert("Data pengguna tidak ditemukan.");
        }
      })
      .catch((error) => {
        let message = "Gagal Login: ";
        switch (error.code) {
          case 'auth/user-not-found':
            message += "Email tidak ditemukan.";
            break;
          case 'auth/wrong-password':
            message += "Password salah.";
            break;
          case 'auth/invalid-email':
            message += "Email tidak valid.";
            break;
          case 'auth/too-many-requests':
            message += "Terlalu banyak percobaan login.";
            break;
          default:
            message += error.message;
        }
        alert(message);
      });
  });
}

// === TOGGLE PASSWORD VISIBILITY ===
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');
if (passwordInput && togglePassword) {
  togglePassword.addEventListener('click', function () {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    togglePassword.textContent = isPassword ? '🙈' : '👁️';
  });
}
