// ================================
// DADOS FIXOS DE PRODUTOS
// ================================
const fixedProducts = [
    { id: 1, name: "Grand Theft Auto V", price: 79.99, image: "GTAV.jpg", category: "Ação/Aventura" },
    { id: 2, name: "Among Us", price: 14.49, image: "Amongus.jpg", category: "Social" },
    { id: 3, name: "F1 2021", price: 59.90, image: "F12021.jpg", category: "Corrida" },
    { id: 4, name: "Minecraft", price: 120.00, image: "Minecraft.jpg", category: "Sandbox" },
    { id: 5, name: "Counter Strike 2", price: 25.50, image: "CSGO.jpg", category: "FPS" }
];

// ================================
// CLASSE PARA SIMULAR UM BANCO DE DADOS (USANDO localStorage)
// ================================
class AuthManager {
    constructor() {
        this.DB_KEY = 'altf4_users_db';
        // Usuário padrão para teste (não exposto na UI)
        this.defaultUsers = {
            "admin@altf4.com": { password: "1234", name: "Admin" }, 
            "teste@exemplo.com": { password: "senhaforte", name: "Teste" }
        };
        this.users = this.loadUsers();
    }

    // Carrega usuários do localStorage ou usa padrões
    loadUsers() {
        const storedUsers = localStorage.getItem(this.DB_KEY);
        if (storedUsers) {
            // Garante que usuários default sempre existam junto com os criados
            return { ...this.defaultUsers, ...JSON.parse(storedUsers) };
        }
        this.saveUsers(this.defaultUsers);
        return this.defaultUsers;
    }

    // Salva usuários no localStorage
    saveUsers(users) {
        // Filtra para salvar apenas usuários criados ou modificados, mantendo a lista limpa
        const usersToSave = Object.keys(users).reduce((acc, key) => {
            if (!this.defaultUsers[key] || users[key].password !== this.defaultUsers[key].password) {
                 acc[key] = users[key];
            }
            return acc;
        }, {});
        localStorage.setItem(this.DB_KEY, JSON.stringify(usersToSave));
    }

    // Encontra um usuário pelo email
    findUser(email) {
        return this.users[email.toLowerCase()];
    }

    // Registra um novo usuário
    registerUser(email, password) {
        const lowerEmail = email.toLowerCase();
        if (this.findUser(lowerEmail)) {
            return false; // Usuário já existe
        }
        this.users[lowerEmail] = { 
            password: password, 
            name: email.split('@')[0], 
            createdAt: new Date().toISOString() 
        };
        this.saveUsers(this.users);
        return true; // Sucesso
    }

    // Verifica login
    login(email, password) {
        const user = this.findUser(email);
        return user && user.password === password;
    }
}

// Inicializa o Gerenciador de Autenticação
const authManager = new AuthManager();

// ================================
// VARIÁVEIS GERAIS
// ================================
let productsData = fixedProducts; 
let userCart = [];
let isLoggedIn = false; 
let loggedInUser = null; 

// ================================
// FUNÇÕES UTILITÁRIAS
// ================================
function showToast(msg, type = "info") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = msg;
  // Garante que o toast é visível antes de animar
  toast.classList.remove("hidden");
  toast.className = `toast ${type}`;
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function updateAuthUI() {
    const loginLink = document.getElementById("loginLink");
    const logoutBtn = document.getElementById("logoutBtn");
    
    if (!loginLink || !logoutBtn) return;
    
    // Lógica que alterna os botões no cabeçalho
    if (isLoggedIn && loggedInUser) {
        loginLink.classList.add("hidden");
        logoutBtn.classList.remove("hidden");
    } else {
        loginLink.classList.remove("hidden");
        logoutBtn.classList.add("hidden");
    }
}

function switchAuthForm(formId) {
    // Esconde todos os formulários e tabs
    document.querySelectorAll('#authModal .form').forEach(form => {
        form.classList.remove('active');
    });
    document.querySelectorAll('#authModal .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById('forgotPasswordLink')?.classList.remove('hidden');

    // Mostra o formulário e a tab correta
    const form = document.getElementById(formId);
    if (form) form.classList.add('active');

    const activeTab = document.querySelector(`[data-form="${formId}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    // Esconde o link "Esqueci a Senha" no formulário "Esqueci a Senha"
    if (formId === 'forgotPassForm') {
        document.getElementById('forgotPasswordLink')?.classList.add('hidden');
    }
}

// ================================
// FUNÇÕES DE AUTENTICAÇÃO
// ================================
function handleLogin(e) {
  e.preventDefault();
  
  const identifier = document.getElementById("loginUser").value.toLowerCase(); 
  const pass = document.getElementById("loginPass").value;

  if (authManager.login(identifier, pass)) {
    const user = authManager.findUser(identifier);
    isLoggedIn = true;
    loggedInUser = identifier;
    showToast(`Bem-vindo, ${user.name}!`, "success");
    document.getElementById("authModal").classList.add("hidden"); 
    document.getElementById("loginForm").reset();
    updateAuthUI(); 
  } else {
    showToast("Email ou senha incorretos.", "error");
  }
}

function handleSignUp(e) {
    e.preventDefault();
    const email = document.getElementById("signupEmail").value.toLowerCase();
    const password = document.getElementById("signupPass").value;

    if (!isValidEmail(email)) {
        showToast("Formato de e-mail inválido.", "error");
        return;
    }

    if (password.length < 6) { 
        showToast("A senha deve ter no mínimo 6 caracteres.", "error");
        return;
    }

    if (authManager.registerUser(email, password)) {
        showToast(`Registro bem-sucedido. Faça login agora.`, "success");
        document.getElementById("signupForm").reset();
        switchAuthForm('loginForm'); // Volta para o login
    } else {
        showToast("Este e-mail já está registrado.", "error");
    }
}

function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById("forgotEmail").value.toLowerCase();

    if (!isValidEmail(email)) {
        showToast("Por favor, insira um e-mail válido.", "error");
        return;
    }

    if (authManager.findUser(email)) {
        // Em um sistema real, aqui o e-mail seria enviado.
        showToast(`Link de redefinição enviado para ${email} (Simulado).`, "info");
        document.getElementById("forgotPassForm").reset();
        switchAuthForm('loginForm');
    } else {
        showToast("E-mail não encontrado.", "error");
    }
}

function handleLogout() {
    isLoggedIn = false;
    loggedInUser = null;
    
    updateAuthUI(); 
    
    showToast("Você saiu da conta.", "info");
}


// ================================
// FUNÇÕES DE CATÁLOGO E CARRINHO (Finalização de Compra)
// ================================
function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.innerHTML = `
    <img src="images/${product.image}" alt="${product.name}" class="product-image">
    <div class="product-name"><h3>${product.name}</h3></div>
    <div class="product-category"><p>${product.category || "Jogo Digital"}</p></div>
    <div class="product-footer">
      <span class="product-price">R$ ${product.price.toFixed(2)}</span>
      <button class="btn primary small add-to-cart" data-id="${product.id}">Comprar</button>
    </div>
  `;
  card.querySelector(".add-to-cart").addEventListener("click", () => addToCart(product.id));
  return card;
}

function loadProducts() {
  const grid = document.getElementById("productsGrid");
  if (!grid) return; 

  grid.innerHTML = "";
  productsData.forEach(p => grid.appendChild(createProductCard(p)));
}

function addToCart(id) {
  const product = productsData.find(p => p.id === id);
  if (!product) return;
  const existing = userCart.find(p => p.id === id);
  existing ? existing.quantity++ : userCart.push({ ...product, quantity: 1 });
  updateCart();
  showToast(`${product.name} adicionado!`, "success");
}

function updateCart() {
  const itemsContainer = document.getElementById("cartItems");
  const totalSpan = document.getElementById("cartTotal");
  const countSpan = document.getElementById("cartCount");
  if (!itemsContainer || !totalSpan || !countSpan) return;

  itemsContainer.innerHTML = "";
  let total = 0;

  if (userCart.length === 0) {
    itemsContainer.innerHTML = "<p class='empty-cart-message'>Carrinho vazio.</p>";
  } else {
    userCart.forEach(item => {
      const subtotal = item.price * item.quantity;
      total += subtotal;
      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <span>${item.name} (${item.quantity}x)</span>
        <span>R$ ${subtotal.toFixed(2)}</span>
      `;
      itemsContainer.appendChild(div);
    });
  }

  totalSpan.textContent = total.toFixed(2);
  countSpan.textContent = userCart.reduce((s, i) => s + i.quantity, 0);
}

// Função para simular a finalização da compra
function handleCheckout() {
    if (!isLoggedIn) {
        showToast("Você precisa estar logado para finalizar a compra.", "error");
        document.getElementById("authModal")?.classList.remove("hidden");
        switchAuthForm('loginForm');
        return;
    }

    if (userCart.length === 0) {
        showToast("Seu carrinho está vazio.", "error");
        return;
    }

    // Simulação de processamento de compra
    const total = userCart.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2);
    
    // Limpa o carrinho
    userCart = [];
    updateCart(); 
    
    document.getElementById("cartModal")?.classList.add("hidden");
    showToast(`Compra de R$ ${total} finalizada com sucesso! Verifique seu email.`, "success");
}

// ================================
// EVENTOS
// ================================
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  updateCart();
  updateAuthUI(); 
  const yearElement = document.getElementById("year");
  if (yearElement) yearElement.textContent = new Date().getFullYear();

  // Eventos dos modais/tabs
  document.getElementById("loginLink")?.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("authModal")?.classList.remove("hidden");
    switchAuthForm('loginForm');
  });
  document.getElementById("closeAuthModal")?.addEventListener("click", () => {
    document.getElementById("authModal")?.classList.add("hidden");
  });
  document.getElementById("closeCart")?.addEventListener("click", () => {
    document.getElementById("cartModal")?.classList.add("hidden");
  });
  document.getElementById("cartBtn")?.addEventListener("click", () => {
    document.getElementById("cartModal")?.classList.remove("hidden");
  });
  document.getElementById("clearCart")?.addEventListener("click", () => {
    userCart = [];
    updateCart();
    showToast("Carrinho esvaziado.", "info");
  });

  // Evento de Finalizar Compra
  document.getElementById("checkoutBtn")?.addEventListener("click", handleCheckout); 

  // Eventos de Autenticação
  document.getElementById("loginForm")?.addEventListener("submit", handleLogin);
  document.getElementById("signupForm")?.addEventListener("submit", handleSignUp); 
  document.getElementById("logoutBtn")?.addEventListener("click", handleLogout);
  document.getElementById("forgotPassForm")?.addEventListener("submit", handleForgotPassword);

  // Eventos de Tabs (Login, Registro, Esqueci a Senha)
  document.getElementById("loginTab")?.addEventListener("click", () => {
      switchAuthForm('loginForm');
  });
  document.getElementById("signupTab")?.addEventListener("click", () => {
      switchAuthForm('signupForm');
  });
  document.getElementById("forgotPasswordLink")?.addEventListener("click", (e) => {
      e.preventDefault();
      switchAuthForm('forgotPassForm');
  });
  document.getElementById("backToLogin")?.addEventListener("click", () => {
      switchAuthForm('loginForm');
  });
});