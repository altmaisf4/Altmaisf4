// Usuário e senha fixos para testes
const USER = "admin";
const PASS = "1234";
const SITE_URL = "https://68ab216f912c1.site123.me/";

// --- Alternância de abas ---
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

loginTab.addEventListener('click', () => {
  loginTab.classList.add('active');
  signupTab.classList.remove('active');
  loginForm.classList.add('active');
  signupForm.classList.remove('active');
});

signupTab.addEventListener('click', () => {
  signupTab.classList.add('active');
  loginTab.classList.remove('active');
  signupForm.classList.add('active');
  loginForm.classList.remove('active');
});

// --- LOGIN ---
loginForm.addEventListener('submit', function(event) {
  event.preventDefault();

  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value.trim();

  if (!username || !password) {
    alert("Preencha todos os campos!");
    return;
  }

  if (username === USER && password === PASS) {
    alert("✅ Login realizado com sucesso!");
    window.location.href = SITE_URL;
  } else {
    alert("❌ Usuário ou senha inválidos!");
  }
});

// --- CADASTRO ---
signupForm.addEventListener('submit', function(event) {
  event.preventDefault();

  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const pass = document.getElementById('signupPass').value.trim();

  if (!name || !email || !pass) {
    alert("Por favor, preencha todos os campos!");
    return;
  }

  alert(`✅ Cadastro realizado com sucesso!\nBem-vindo, ${name}!`);
  window.location.href = SITE_URL;
});
