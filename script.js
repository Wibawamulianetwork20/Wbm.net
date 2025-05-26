// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyBXnXCSXhy06eqWBPzYmzxCo_LBzl51DO4",
  authDomain: "wibawamulianetwork.firebaseapp.com",
  databaseURL: "https://wibawamulianetwork-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wibawamulianetwork",
  storageBucket: "wibawamulianetwork.appspot.com",
  messagingSenderId: "605020393823",
  appId: "1:605020393823:web:6ba8afe7e250bc004da6ea",
  measurementId: "G-9EWJE8F5FG"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
console.log("Script.js berhasil dimuat");

// =========== Register ===========
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log("Register berhasil dimuat");
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
const loginForm = document.getElementById('login-form');
const uidField = document.getElementById('id');

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log("Login berhasil dimuat");
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
}

// Status Login
auth.onAuthStateChanged((user) => {
  if (user && uidField) {
    uidField.value = user.uid;
  }
});

// ... (lanjutan fungsi pelanggan, ticket, dashboard, dll tidak perlu diubah)
