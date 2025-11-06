// ==================================
// CONFIGURAÇÃO REAL DO FIREBASE
// ==================================
// ESTES SÃO OS SEUS DADOS
const firebaseConfig = {
    apiKey: "AIzaSyBUlqntLVnmnH4pY6aXUg2iTJ_yNrsP-44",
    authDomain: "altf4-loja.firebaseapp.com",
    projectId: "altf4-loja",
    storageBucket: "altf4-loja.firebasestorage.app",
    messagingSenderId: "53548138975",
    appId: "1:53548138975:web:794fa01f91510f9321446a"
};

// Inicializa o Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = app.auth();
const db = app.firestore(); 

// ================================
// DADOS FIXOS E VARIÁVEIS GERAIS
// ================================
const fixedProducts = [
    // CATÁLOGO DE JOGOS ORIGINAL
    { id: 1, name: "Grand Theft Auto V", price: 79.99, image: "GTAV.jpg", category: "Ação/Aventura", ageRating: "18+" },
    { id: 2, name: "Among Us", price: 14.49, image: "Amongus.jpg", category: "Social", ageRating: "Livre" },
    { id: 3, name: "F1 2021", price: 59.90, image: "F12021.jpg", category: "Corrida", ageRating: "Livre" },
    { id: 4, name: "Minecraft", price: 120.00, image: "Minecraft.jpg", category: "Sandbox", ageRating: "10+" },
    { id: 5, name: "Counter Strike 2", price: 25.50, image: "CSGO.jpg", category: "FPS", ageRating: "16+" },
    { id: 6, name: "Cyberpunk 2077", price: 199.90, image: "Cyberpunk.jpg", category: "RPG", ageRating: "18+" },
    { id: 7, name: "The Witcher 3", price: 49.90, image: "Witcher3.jpg", category: "RPG", ageRating: "18+" },
    { id: 8, name: "Halo Infinite", price: 99.90, image: "Halo.jpg", category: "FPS", ageRating: "16+" }
];

let productsData = fixedProducts; 
let userCart = [];
let orderCounter = 1000; 
let userEmailForCheckout = ""; 
// Chave mantida apenas para o formulário de CONTATO (Web3Forms)
const ACCESS_KEY = "eb6bb3ca-0826-48b1-9643-ed2e22ec8c70"; 

// ================================
// FUNÇÕES DE UTILIDADE E UI
// ================================

function showToast(message, type) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove("hidden");

    setTimeout(() => {
        toast.classList.add("hidden");
    }, 4000);
}

function openAuthModal(e, formId = "loginForm") {
    e.preventDefault();
    const modal = document.getElementById("authModal");
    if (!modal) return;
    
    document.querySelectorAll('#authModal .form').forEach(form => {
        form.classList.remove('active');
        form.classList.remove('hidden'); 
    });
    
    document.querySelectorAll('.tab').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('hidden');
        if (btn.id === 'signupTab' || btn.id === 'loginTab') {
            btn.classList.remove('hidden'); 
        }
    });
    
    // Mostra a aba e o formulário corretos
    const targetForm = document.getElementById(formId);
    if (targetForm) targetForm.classList.add('active');

    const targetTab = document.querySelector(`[data-form="${formId}"]`);
    if (targetTab) targetTab.classList.add('active');

    modal.classList.remove("hidden");
}

function closeModals() {
    document.getElementById("cartModal")?.classList.add("hidden");
    document.getElementById("authModal")?.classList.add("hidden");
}

function handleTabSwitching() {
    const authModal = document.getElementById("authModal");
    if (!authModal) return;

    authModal.addEventListener('click', (e) => {
        const target = e.target;
        if (target.matches('.tab') && target.dataset.form) {
            openAuthModal(e, target.dataset.form);
        }
    });
}

function updateHeaderUI(user) {
    const loginLink = document.getElementById("loginLink");
    const logoutBtn = document.getElementById("logoutBtn");

    const newLoginHandler = (e) => openAuthModal(e, "loginForm");
    
    // Limpeza de ouvintes (previne duplicidade)
    if (loginLink.onclick) {
        loginLink.onclick = null;
    }

    if (user) {
        loginLink.textContent = user.email.split('@')[0]; // Exibe o nome de usuário (parte do email)
        logoutBtn.classList.remove('hidden');
        userEmailForCheckout = user.email; // Armazena o e-mail para o checkout
        loginLink.onclick = handleLogout; // Clicar no nome agora faz logout
    } else {
        loginLink.textContent = 'Login / Registro';
        logoutBtn.classList.add('hidden');
        userEmailForCheckout = "";
        loginLink.onclick = newLoginHandler; // Clicar abre o modal
    }
}

// ================================
// AUTENTICAÇÃO FIREBASE
// ================================

const firebaseErrorMap = {
    'auth/invalid-email': 'O formato do e-mail é inválido.',
    'auth/user-not-found': 'Conta não encontrada. Verifique o e-mail.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/email-already-in-use': 'Este e-mail já está registrado.',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
    'auth/too-many-requests': 'Muitas tentativas falharam. Tente novamente mais tarde.',
    'auth/network-request-failed': 'Falha na conexão de rede. Verifique sua internet.'
};

function getFirebaseErrorMessage(errorCode) {
    return firebaseErrorMap[errorCode] || 'Ocorreu um erro desconhecido. Tente novamente.';
}

async function handleLoginForm(e) {
    e.preventDefault();
    const email = document.getElementById("loginUser").value;
    const password = document.getElementById("loginPass").value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        closeModals();
        showToast("Login realizado com sucesso!", "success");
    } catch (error) {
        showToast(getFirebaseErrorMessage(error.code), "error");
    }
}

async function handleSignupForm(e) {
    e.preventDefault();
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPass").value;

    try {
        await auth.createUserWithEmailAndPassword(email, password);
        closeModals();
        showToast("Conta criada com sucesso! Você está logado.", "success"); 
    } catch (error) {
        showToast(getFirebaseErrorMessage(error.code), "error");
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById("forgotEmail").value;

    try {
        await auth.sendPasswordResetEmail(email); 
        document.getElementById("forgotPassForm").reset();
        closeModals();
        showToast(`As instruções de redefinição foram enviadas para ${email}.`, "success");
    } catch (error) {
        showToast(getFirebaseErrorMessage(error.code), "error");
    }
}

function handleLogout(e) {
    if (e && e.preventDefault) e.preventDefault(); 
    
    auth.signOut().then(() => {
        showToast("Você foi desconectado com sucesso.", "info");
    }).catch((error) => {
        showToast("Erro ao desconectar.", "error");
    });
}

auth.onAuthStateChanged((user) => {
    updateHeaderUI(user);
});

// ================================
// LÓGICA DO CARROSSEL (Geral)
// ================================
let currentCarouselIndex = 0; // Para o carrossel de Destaques
let currentCatalogIndex = 0; // Para o carrossel do Catálogo Completo
const CARDS_PER_VIEW = 3;

function createCarouselCard(product) {
    const card = createProductCard(product);
    card.classList.add('carousel-card');
    card.classList.remove('product-card'); // Usa o estilo de carrossel
    return card;
}

// ------------------------------------
// Destaques da Semana (primeiros 5 jogos)
// ------------------------------------
function loadDestaquesCarousel() {
    const track = document.getElementById("carouselTrack");
    if (!track) return;
    
    // O carrossel carrega os primeiros 5 produtos
    const carouselProducts = productsData.slice(0, 5); 
    
    track.innerHTML = "";
    carouselProducts.forEach(p => track.appendChild(createCarouselCard(p)));
    
    // Garante que o carrossel de destaques se posicione corretamente
    moveDestaquesCarousel(0); 
}

function moveDestaquesCarousel(direction) {
    const track = document.getElementById("carouselTrack");
    if (!track || track.children.length === 0) return;

    const totalProducts = productsData.slice(0, 5).length;
    const maxIndex = Math.max(0, totalProducts - CARDS_PER_VIEW);

    currentCarouselIndex = currentCarouselIndex + direction;

    if (currentCarouselIndex > maxIndex) {
        currentCarouselIndex = 0;
    } else if (currentCarouselIndex < 0) {
        currentCarouselIndex = maxIndex;
    }

    const cardWidth = track.children[0].offsetWidth + 20; // Largura do card + margem de 20px
    const translateX = -currentCarouselIndex * cardWidth;
    
    track.style.transform = `translateX(${translateX}px)`;
}

// ------------------------------------
// Catálogo Completo (TODOS os jogos)
// ------------------------------------
function loadCatalogCarousel() {
    const track = document.getElementById("catalogTrack");
    if (!track) return; 

    track.innerHTML = "";
    productsData.forEach(p => track.appendChild(createCarouselCard(p)));
    
    // Garante que o carrossel do catálogo se posicione corretamente
    moveCatalogCarousel(0); 
}

function moveCatalogCarousel(direction) {
    const track = document.getElementById("catalogTrack");
    if (!track || track.children.length === 0) return;

    const totalProducts = productsData.length; // Usa todos os produtos
    const maxIndex = Math.max(0, totalProducts - CARDS_PER_VIEW); // Usa a mesma visualização

    currentCatalogIndex = currentCatalogIndex + direction;

    if (currentCatalogIndex > maxIndex) {
        currentCatalogIndex = 0;
    } else if (currentCatalogIndex < 0) {
        currentCatalogIndex = maxIndex;
    }

    const cardWidth = track.children[0].offsetWidth + 20; // Largura do card + margem de 20px
    const translateX = -currentCatalogIndex * cardWidth;
    
    track.style.transform = `translateX(${translateX}px)`;
}


// ================================
// FUNÇÕES DE CARRINHO E CHECKOUT (SEM E-MAIL)
// ================================

function createProductCard(product) {
  const card = document.createElement("div");
  // O card base mantém a classe product-card para reuso no carrossel
  card.className = "product-card"; 
  card.innerHTML = `
    <img src="images/${product.image}" alt="${product.name}" class="product-image">
    <div class="product-info-top">
        <span class="product-age-rating">${product.ageRating}</span>
    </div>
    <div class="product-name"><h3>${product.name}</h3></div>
    <div class="product-category"><p>Categoria: ${product.category || "Jogo Digital"}</p></div>
    <div class="product-footer">
      <span class="product-price">R$ ${product.price.toFixed(2)}</span>
      <button class="btn primary small add-to-cart" data-id="${product.id}">Comprar</button>
    </div>
  `;
  card.querySelector(".add-to-cart").addEventListener("click", () => addToCart(product.id));
  return card;
}

function loadProducts() {
  // Chamada para carregar AMBOS os carrosséis
  loadDestaquesCarousel(); 
  loadCatalogCarousel();
}

function addToCart(id) {
  const product = productsData.find(p => p.id === id);
  if (!product) return;
  
  // Para chaves digitais, assumimos que 1 item por chave é o padrão.
  const existing = userCart.find(p => p.id === id);
  if (existing) {
    existing.quantity++; 
  } else {
    userCart.push({ ...product, quantity: 1 });
  }
  
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
  let itemCount = 0;

  if (userCart.length === 0) {
    itemsContainer.innerHTML = "<p class='empty-cart-message'>Carrinho vazio.</p>";
    document.getElementById("checkoutBtn").disabled = true;
  } else {
    userCart.forEach(item => {
      const subtotal = item.price * item.quantity;
      total += subtotal;
      itemCount += item.quantity;
      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <span>${item.name} (${item.quantity}x)</span>
        <span>R$ ${subtotal.toFixed(2)}</span>
      `;
      itemsContainer.appendChild(div);
    });
    document.getElementById("checkoutBtn").disabled = false;
  }

  totalSpan.textContent = total.toFixed(2);
  countSpan.textContent = itemCount;
}

function openCartModal() {
    document.getElementById("cartModal")?.classList.remove("hidden");
    updateCart();
}

// FUNÇÃO DE CHECKOUT: APENAS LIMPA O CARRINHO E MOSTRA SUCESSO.
async function handleCheckout() {
    const user = auth.currentUser;
    if (!user) {
        document.getElementById("cartModal")?.classList.add("hidden");
        openAuthModal(new Event('click'), "loginForm"); 
        showToast("É necessário fazer login para finalizar a compra.", "info");
        return;
    }

    if (userCart.length === 0) {
        showToast("Seu carrinho está vazio.", "info");
        return;
    }

    const submitBtn = document.getElementById("checkoutBtn");
    const originalText = submitBtn ? submitBtn.textContent : 'Finalizar Compra';
    
    // Desabilita o botão enquanto processa
    submitBtn.textContent = "Processando...";
    submitBtn.disabled = true;

    try {
        const cartTotal = userCart.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        // Simulação de processamento de pagamento
        await new Promise(resolve => setTimeout(resolve, 1500)); // Espera 1.5s

        // Lógica de Sucesso:
        userCart = [];
        updateCart();
        closeModals();
        showToast(`Compra de R$ ${cartTotal.toFixed(2)} finalizada com sucesso!`, "success");

    } catch (error) {
        console.error("Erro ao finalizar a compra:", error);
        showToast("Erro ao finalizar a compra. Tente novamente.", "error");
    } finally {
        // Restaurar o botão
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// A função handleContactForm usa Web3Forms para o formulário de contato.
async function handleContactForm(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = document.getElementById("submitContactBtn");
    const originalText = submitBtn ? submitBtn.textContent : 'Enviar Mensagem';
    
    if (submitBtn) {
        submitBtn.textContent = "Enviando...";
        submitBtn.disabled = true;
    }

    const formData = new FormData(form);
    formData.append("_subject", "Nova Mensagem de Contato Alt+F4");
    formData.append("access_key", ACCESS_KEY);

    try {
        const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        
        if (data.success) {
            form.reset();
            showToast("Mensagem enviada com sucesso! Em breve entraremos em contato.", "success");
        } else {
            console.error("Web3Forms Error:", data);
            showToast("Erro ao enviar mensagem. Tente novamente mais tarde.", "error");
        }
    } catch (error) {
        console.error("Erro de Rede:", error);
        showToast("Erro ao enviar mensagem. Tente novamente mais tarde.", "error");
    } finally {
        if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
}


// ================================
// INICIALIZAÇÃO E EVENT LISTENERS
// ================================
document.addEventListener("DOMContentLoaded", () => {
    loadProducts(); 
    updateCart(); 
    
    const yearElement = document.getElementById("year");
    if (yearElement) yearElement.textContent = new Date().getFullYear();
    
    handleTabSwitching(); 

    // Eventos de Modais
    document.getElementById("cartBtn")?.addEventListener("click", openCartModal); 
    document.getElementById("closeCart")?.addEventListener("click", closeModals);
    document.getElementById("closeAuthModal")?.addEventListener("click", closeModals);
    document.getElementById("logoutBtn")?.addEventListener("click", handleLogout);
    
    // Eventos do Carrossel (Destaques da Semana)
    document.getElementById("carouselPrev")?.addEventListener("click", () => moveDestaquesCarousel(-1));
    document.getElementById("carouselNext")?.addEventListener("click", () => moveDestaquesCarousel(1));
    
    // Eventos do Carrossel (Catálogo Completo)
    document.getElementById("catalogPrev")?.addEventListener("click", () => moveCatalogCarousel(-1));
    document.getElementById("catalogNext")?.addEventListener("click", () => moveCatalogCarousel(1));
    
    // Eventos de Navegação do Modal (Esqueci Senha e Voltar)
    document.getElementById("forgotPasswordLink")?.addEventListener("click", (e) => openAuthModal(e, "forgotPassForm"));
    document.getElementById("backToLogin")?.addEventListener("click", (e) => openAuthModal(e, "loginForm"));
    
    // Eventos de Formulário (FIREBASE)
    document.getElementById("loginForm")?.addEventListener("submit", handleLoginForm);
    document.getElementById("signupForm")?.addEventListener("submit", handleSignupForm);
    document.getElementById("forgotPassForm")?.addEventListener("submit", handleForgotPassword);
    document.getElementById("contactForm")?.addEventListener("submit", handleContactForm); 
    
    // Eventos de Carrinho
    document.getElementById("checkoutBtn")?.addEventListener("click", handleCheckout); 
    document.getElementById("clearCart")?.addEventListener("click", () => {
        userCart = [];
        updateCart();
        showToast("Carrinho esvaziado.", "info");
    });
});