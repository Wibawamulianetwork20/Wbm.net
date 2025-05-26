// Firebase Config (ganti dengan milikmu)
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

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Register User
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
        window.location.href = "login.html";
      })
      .catch(err => alert("Error: " + err.message));
  });
}

// Login User
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const uidField = document.getElementById('id');

    auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        if (uidField) uidField.value = user.uid;
        alert("Login berhasil!");
        // Redirect ke dashboard jika mau
        // window.location.href = "dashboard.html";
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
}
