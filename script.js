// script.js - Lógica principal (Carrinho e Autenticação)

function $(selector) {
  return document.querySelector(selector);
}

// ----------------------------------------------------
// 1. DADOS DE PRODUTOS
// ----------------------------------------------------
const PRODUCTS = [
  {id:1,title:'GTA V (PS4)',price:49.90,img:'images/GTAV.jpg'},
  {id:2,title:'Minecraft (Windows)',price:29.90,img:'images/Minecraft.jpg'},
  {id:3,title:'Valorant (PS5)',price:0.00,img:'images/Valorant.jpg'},
  {id:4,title:'CS:GO (Windows)',price:19.90,img:'images/CSGO.jpg'},
  {id:5,title:'Among Us (PS4)',price:4.99,img:'images/Amongus.jpg'},
  {id:6,title:'F1 2021 (PS5)',price:79.90,img:'images/F12021.jpg'},
];


// ----------------------------------------------------
// 2. FUNÇÕES DE AUTENTICAÇÃO (Login/Logout)
// ----------------------------------------------------

function getLoggedInUser() {
  return localStorage.getItem('currentUser');
}

function updateAuthUI() {
  const user = getLoggedInUser();
  const loginLink = document.getElementById('loginLink');
  const logoutBtn = document.getElementById('logoutBtn');

  if (user) {
    if (loginLink) loginLink.classList.add('hidden');
    if (logoutBtn) {
      logoutBtn.classList.remove('hidden');
      logoutBtn.textContent = `Olá, ${user.split(' ')[0]} | Sair`;
    }
  } else {
    if (loginLink) loginLink.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
  }
}

function logoutUser() {
  localStorage.removeItem('currentUser');
  updateAuthUI();
  showToast('Você saiu da sua conta.');
}

function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUser').value.trim();
  
  if (username) {
    localStorage.setItem('currentUser', username); 
    document.getElementById('loginModal').classList.add('hidden');
    updateAuthUI(); 
    showToast(`Bem-vindo de volta, ${username.split(' ')[0]}!`);
  } else {
    alert("Por favor, preencha o campo de usuário.");
  }
}

function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signupName').value.trim();
  
  if (name) {
    alert(`Cadastro de ${name} realizado com sucesso! Fazendo login...`);
    document.getElementById('signupForm').reset();
    
    localStorage.setItem('currentUser', name); 
    document.getElementById('loginModal').classList.add('hidden');
    updateAuthUI(); 
    showToast(`Bem-vindo, ${name.split(' ')[0]}!`);
  } else {
    alert("Por favor, preencha todos os campos do cadastro.");
  }
}


// ----------------------------------------------------
// 3. LÓGICA DO CARRINHO
// ----------------------------------------------------
function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function addToCart(id) {
  let cart = getCart();
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;

  const itemIndex = cart.findIndex(item => item.id === id);

  if (itemIndex > -1) {
    cart[itemIndex].qty += 1;
  } else {
    cart.push({ id: id, qty: 1 });
  }

  saveCart(cart);
  showToast(`${product.title} adicionado ao carrinho!`);
}

function changeQty(id, delta) {
  let cart = getCart();
  const itemIndex = cart.findIndex(item => item.id === id);
  if (itemIndex > -1) {
    cart[itemIndex].qty += delta;
    if (cart[itemIndex].qty <= 0) {
      cart.splice(itemIndex, 1);
      showToast('Item removido.');
    }
  }
  saveCart(cart);
}

function removeItem(id) {
  let cart = getCart();
  cart = cart.filter(item => item.id !== id);
  saveCart(cart);
  showToast('Item removido.');
}

function clearCart() {
  saveCart([]);
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((total, item) => total + item.qty, 0);
  const cartCountEl = $('#cartCount');
  if (cartCountEl) cartCountEl.textContent = count;
}

function renderProducts() {
  const productContainer = $('#products');
  if (!productContainer) return;

  productContainer.innerHTML = PRODUCTS.map(p => `
    <div class="card">
      <img src="${p.img}" alt="${p.title}" />
      <h3>${p.title}</h3>
      <div class="price">R$ ${p.price.toFixed(2).replace('.', ',')}</div>
      <div class="actions">
        <button class="btn small primary" data-id="${p.id}">
          Adicionar 🛒
        </button>
      </div>
    </div>
  `).join('');
}

function renderCartModal() {
  const cart = getCart();
  const itemsContainer = $('#cartItems');
  const totalDisplay = $('#cartTotal');
  
  if (!itemsContainer || !totalDisplay) return;

  if (cart.length === 0) {
    itemsContainer.innerHTML = '<p style="text-align:center;">Seu carrinho está vazio.</p>';
    totalDisplay.textContent = '0,00';
    return;
  }

  let total = 0;
  itemsContainer.innerHTML = cart.map(item => {
    const product = PRODUCTS.find(p => p.id === item.id);
    if (!product) return '';
    const itemTotal = product.price * item.qty;
    total += itemTotal;

    return `
      <div class="cart-item">
        <img src="${product.img}" alt="${product.title}" />
        <div>
          <h4>${product.title}</h4>
          <p>R$ ${product.price.toFixed(2).replace('.', ',')}</p>
        </div>
        <div style="margin-left:auto; display:flex; align-items:center; gap:8px;">
          <button data-action="dec" data-id="${item.id}">-</button>
          <span>${item.qty}</span>
          <button data-action="inc" data-id="${item.id}">+</button>
          <button data-action="rm" data-id="${item.id}" class="btn small danger">X</button>
        </div>
        <strong>R$ ${itemTotal.toFixed(2).replace('.', ',')}</strong>
      </div>
    `;
  }).join('');

  totalDisplay.textContent = total.toFixed(2).replace('.', ',');
}

function showToast(text){
  const t=$('#toast');
  if (!t) return;
  t.textContent=text;
  t.classList.remove('hidden');
  clearTimeout(window.toastTimer);
  window.toastTimer=setTimeout(()=>t.classList.add('hidden'),2000);
}


// ----------------------------------------------------
// 4. INICIALIZAÇÃO E EVENTOS
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded',() => {
  renderProducts();
  updateAuthUI(); 
  updateCartCount();
  
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const loginModal = $('#loginModal');
  const loginLink = $('#loginLink');
  const closeLoginModal = $('#closeLoginModal');
  const loginTab = $('#loginTab');
  const signupTab = $('#signupTab');
  const loginForm = $('#loginForm');
  const signupForm = $('#signupForm');

  if (loginLink) loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.classList.remove('hidden');
  });
  if (closeLoginModal) closeLoginModal.addEventListener('click', () => {
    loginModal.classList.add('hidden');
  });

  if (loginTab) loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
  });
  if (signupTab) signupTab.addEventListener('click', () => {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.classList.add('active');
    loginForm.classList.remove('active');
  });
  
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (signupForm) signupForm.addEventListener('submit', handleSignup);

  document.body.addEventListener('click',e => {
    const btn = e.target.closest('.btn[data-id]');
    if (btn) addToCart(Number(btn.dataset.id));
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);

  const cartBtn = $('#cartBtn');
  const cartModal = $('#cartModal');
  const closeCart = $('#closeCart');
  const cartItems = $('#cartItems');
  const clearCartBtn = $('#clearCart');

  if (cartBtn) cartBtn.addEventListener('click',() => { renderCartModal(); cartModal.classList.remove('hidden'); });
  if (closeCart) closeCart.addEventListener('click',() => cartModal.classList.add('hidden'));

  if (cartItems) cartItems.addEventListener('click',e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.action === 'inc') changeQty(id, 1);
    if (btn.dataset.action === 'dec') changeQty(id, -1);
    if (btn.dataset.action === 'rm') removeItem(id);
    renderCartModal();
  });

  if (clearCartBtn) clearCartBtn.addEventListener('click',() => {
    if(confirm('Deseja esvaziar o carrinho?')){ 
      clearCart(); 
      renderCartModal(); 
      showToast('Carrinho esvaziado.');
    }
  });

  // --- Botão Finalizar Compra ---
  const finalizeBtn = document.querySelector('#cartModal .btn.primary');
  if (finalizeBtn) {
    finalizeBtn.addEventListener('click', () => {
      const user = getLoggedInUser();
      const cart = getCart();

      if (!user) {
        showToast('Faça login para finalizar a compra.');
        document.getElementById('loginModal').classList.remove('hidden');
        return;
      }

      if (cart.length === 0) {
        showToast('Seu carrinho está vazio.');
        return;
      }

      if (confirm('Deseja confirmar a compra?')) {
        const total = cart.reduce((sum, item) => {
          const product = PRODUCTS.find(p => p.id === item.id);
          return sum + (product ? product.price * item.qty : 0);
        }, 0);

        clearCart();
        renderCartModal();
        showToast(`Compra concluída! Total: R$ ${total.toFixed(2).replace('.', ',')}`);
        setTimeout(() => {
          document.getElementById('cartModal').classList.add('hidden');
        }, 1500);
      }
    });
  }
});
