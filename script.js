// ===================================
// CONFIGURAÇÃO REAL DO FIREBASE
// ===================================
// ** ATENÇÃO: ESSES DADOS FORAM INSERIDOS PELO USUÁRIO **
const firebaseConfig = {
    apiKey: "AIzaSyBUlqntLVnmnH4pY6aXUg2iTJ_yNrsP-44", // <--- SEU API KEY
    authDomain: "altf4-loja.firebaseapp.com", // <--- SEU AUTH DOMAIN
    projectId: "altf4-loja", // <--- SEU PROJECT ID
    storageBucket: "altf4-loja.firebasestorage.app", // <--- SEU STORAGE BUCKET
    messagingSenderId: "53548138975", // <--- SEU SENDER ID
    appId: "1:53548138975:web:794fa01f91510f9321446a" // <--- SEU APP ID
};

// Inicializa o Firebase e serviços
const app = firebase.initializeApp(firebaseConfig);
const auth = app.auth();
const db = app.firestore(); // Mantenha a inicialização do Firestore

// ===================================
// CONFIGURAÇÃO DO WHATSAPP
// 🚨 ATENÇÃO: SUBSTITUA PELO SEU NÚMERO DE WHATSAPP REAL!
// (Formato: Código do País + DDD + Número. Ex: 5541999999999)
// ===================================
const WHATSAPP_NUMBER = "5541999999999"; 


// ===============================
// DADOS FIXOS E VARIÁVEIS GERAIS
// ===============================

const fixedProducts = [
    // CATÁLOGO DE JOGOS ORIGINAL
    // ATENÇÃO À MUDANÇA: 'faixaEtaria' é a nova chave. 'price' foi reintroduzido para o cálculo.
    { id: 1, name: "Grand Theft Auto V", price: 79.99, faixaEtaria: "+18", image: "GTAV.jpg", isFeatured: true, category: "ação" },
    { id: 2, name: "Cyberpunk 2077", price: 199.99, faixaEtaria: "+18", image: "Cyberpunk.jpg", isFeatured: true, category: "rpg" },
    { id: 3, name: "The Witcher 3: Wild Hunt", price: 59.90, faixaEtaria: "+16", image: "Witcher.jpg", isFeatured: true, category: "rpg" },
    { id: 4, name: "Red Dead Redemption 2", price: 149.99, faixaEtaria: "+18", image: "RDR2.jpg", isFeatured: false, category: "ação" },
    { id: 5, name: "Elden Ring", price: 249.90, faixaEtaria: "+16", image: "EldenRing.jpg", isFeatured: false, category: "rpg" },
    { id: 6, name: "Minecraft", price: 89.90, faixaEtaria: "Livre", image: "Minecraft.jpg", isFeatured: false, category: "construção" },
    { id: 7, name: "FIFA 25", price: 349.00, faixaEtaria: "Livre", image: "FIFA.jpg", isFeatured: false, category: "Esportes" },

];

let currentUser = null;
let userCart = JSON.parse(localStorage.getItem("userCart")) || [];

// Variáveis para o Carrossel
let destaquesIndex = 0;
let catalogIndex = 0;
const cardsPerView = 4; // Quantidade de cards visíveis

// ===============================
// TOAST (Notificações)
// ===============================
function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ===============================
// FUNÇÕES DO CARRINHO (CART)
// ===============================

function saveCart() {
    localStorage.setItem("userCart", JSON.stringify(userCart));
}

function updateCart() {
    const cartItemsContainer = document.getElementById("cartItems");
    const cartTotalElement = document.getElementById("cartTotal");
    let total = 0;

    cartItemsContainer.innerHTML = "";

    if (userCart.length === 0) {
        cartItemsContainer.innerHTML = "<p class='empty-cart'>Seu carrinho está vazio.</p>";
        total = 0;
    } else {
        userCart.forEach((item) => {
            const product = fixedProducts.find(p => p.id === item.id);
            if (!product) return;

            // MUDANÇA: Usando 'product.price' para cálculo do carrinho
            const itemTotal = product.price * item.quantity;
            total += itemTotal;

            const cartItemEl = document.createElement("div");
            cartItemEl.className = "cart-item";
            // A tag <img> aqui se beneficiará do novo estilo em style.css
            cartItemEl.innerHTML = `
                <img src="images/${product.image}" alt="${product.name}">
                <div class="item-details">
                    <p class="item-name">${product.name}</p>
                    <p class="item-price">R$ ${product.price.toFixed(2)}</p>
                </div>
                <div class="item-quantity">
                    <button class="btn small danger remove-item" data-id="${item.id}">-</button>
                    <span>${item.quantity}</span>
                    <button class="btn small primary add-item" data-id="${item.id}">+</button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemEl);
        });
    }

    cartTotalElement.textContent = total.toFixed(2);
    saveCart();
    attachCartItemEvents();
}

function attachCartItemEvents() {
    document.querySelectorAll(".remove-item").forEach(button => {
        button.addEventListener("click", (e) => {
            const id = parseInt(e.target.dataset.id);
            removeItemFromCart(id);
        });
    });

    document.querySelectorAll(".add-item").forEach(button => {
        button.addEventListener("click", (e) => {
            const id = parseInt(e.target.dataset.id);
            addItemToCart(id);
        });
    });
}

function addItemToCart(id) {
    const existingItem = userCart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        userCart.push({ id: id, quantity: 1 });
    }
    const product = fixedProducts.find(p => p.id === id);
    showToast(`${product.name} adicionado ao carrinho!`, "success");
    updateCart();
}

function removeItemFromCart(id) {
    const itemIndex = userCart.findIndex(item => item.id === id);
    if (itemIndex > -1) {
        if (userCart[itemIndex].quantity > 1) {
            userCart[itemIndex].quantity -= 1;
        } else {
            userCart.splice(itemIndex, 1);
        }
        showToast("Item removido do carrinho.", "danger");
    }
    updateCart();
}

function handleAddToCart(e) {
    if (!currentUser) {
        showToast("Você precisa fazer login para adicionar itens ao carrinho.", "danger");
        openModal("loginModal");
        return;
    }
    const id = parseInt(e.target.dataset.id);
    addItemToCart(id);
}

// ------------------- FINALIZAÇÃO DE COMPRA -------------------

function handleCheckout() {
    if (!currentUser) {
        showToast("Você precisa fazer login para finalizar a compra.", "danger");
        openModal("loginModal");
        return;
    }
    if (userCart.length === 0) {
        showToast("Seu carrinho está vazio.", "info");
        return;
    }

    // Fecha o modal do carrinho
    closeModal("cartModal");

    // Abre o modal de confirmação e atualiza o total
    const total = userCart.reduce((sum, item) => {
        const product = fixedProducts.find(p => p.id === item.id);
        // MUDANÇA: Usando 'product.price' para cálculo do total
        return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    document.getElementById("confirmTotal").textContent = total.toFixed(2);
    openModal("confirmationModal");
}

function confirmPurchase() {
    if (!currentUser || userCart.length === 0) {
        showToast("Erro: Carrinho vazio ou usuário não logado.", "danger");
        return;
    }

    const total = document.getElementById("confirmTotal").textContent;
    const itemsList = userCart.map(item => {
        const product = fixedProducts.find(p => p.id === item.id);
        // MUDANÇA: Usando 'product.price' no resumo do pedido
        return `${item.quantity}x ${product.name} (R$ ${product.price.toFixed(2)})`;
    }).join('\n');

    const message = `Olá! Gostaria de finalizar o pedido na loja Alt+F4:\n\n*Itens:*\n${itemsList}\n\n*Total a Pagar:* R$ ${total}\n\n*E-mail de Login:* ${currentUser.email}\n\nPor favor, envie os dados para pagamento (Pix/Transferência) e as chaves dos jogos.`;

    const whatsappURL = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;

    // Limpa o carrinho e fecha o modal
    userCart = [];
    updateCart();
    closeModal("confirmationModal");
    showToast("Pedido Gerado! Redirecionando para o WhatsApp...", "info");

    // Redireciona o usuário
    window.open(whatsappURL, '_blank');
}


// ===============================
// FUNÇÕES DE EXIBIÇÃO
// ===============================

function renderProducts(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // CORREÇÃO APLICADA AQUI: Estrutura HTML do card-content foi limpa para garantir aninhamento correto do card-footer
    container.innerHTML = products.map(product => `
        <div class="product-card" data-id="${product.id}">
            <img src="images/${product.image}" alt="${product.name}">
            <div class="card-content">
                <h3>${product.name}</h3>
                <p class="description">Categoria: ${product.category}</p> 
                <p class="description">Faixa Etária: ${product.faixaEtaria}</p> 
                <div class="card-footer">
                    <span class="price">R$ ${product.price.toFixed(2)}</span> 
                    <button class="btn small primary add-to-cart" data-id="${product.id}" title="Adicionar ao Carrinho">
                        <i class="fas fa-cart-plus" data-id="${product.id}"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Adiciona o evento de clique aos botões
    container.querySelectorAll(".add-to-cart").forEach(button => {
        button.addEventListener("click", handleAddToCart);
    });
}

// ------------------- CARROSSEL -------------------

function moveDestaquesCarousel(step) {
    const carousel = document.getElementById("destaquesCarousel");
    if (!carousel) return;
    const totalItems = document.querySelectorAll("#destaquesCarousel .product-card").length;
    const itemsInView = 4; // Fixado para a seção de destaques

    destaquesIndex += step;

    // Lógica de loop para o carrossel (se necessário)
    if (destaquesIndex >= totalItems - itemsInView + 1) {
        destaquesIndex = totalItems - itemsInView;
    }
    if (destaquesIndex < 0) {
        destaquesIndex = 0;
    }
    
    // Calcula a largura de translação
    const cardWidth = carousel.querySelector('.product-card')?.offsetWidth || 0;
    const gap = parseFloat(getComputedStyle(carousel).gap) || 0;
    const totalMove = (cardWidth + gap) * destaquesIndex;
    
    carousel.style.transform = `translateX(-${totalMove}px)`;

    // Atualiza botões
    document.getElementById("carouselPrev").disabled = destaquesIndex === 0;
    document.getElementById("carouselNext").disabled = destaquesIndex >= totalItems - itemsInView;
}

function moveCatalogCarousel(step) {
    const carousel = document.getElementById("catalogCarousel");
    if (!carousel) return;
    const allProducts = document.querySelectorAll("#catalogCarousel .product-card");
    const totalItems = allProducts.length;
    
    // Calcula a quantidade de items visíveis no container. 
    // É mais robusto usar a largura do container e do item.
    // Vamos manter o fixo 4 para simplificar a lógica de navegação por 'cardsPerView'
    const itemsInView = cardsPerView; 

    catalogIndex += step;

    if (catalogIndex >= totalItems - itemsInView + 1) {
        catalogIndex = totalItems - itemsInView;
    }
    if (catalogIndex < 0) {
        catalogIndex = 0;
    }
    
    const cardWidth = allProducts[0]?.offsetWidth || 0;
    const gap = parseFloat(getComputedStyle(carousel).gap) || 0;
    const totalMove = (cardWidth + gap) * catalogIndex;
    
    carousel.style.transform = `translateX(-${totalMove}px)`;
    
    // Atualiza botões (ajusta a lógica para não quebrar se o total for menor que itemsInView)
    document.getElementById("catalogPrev").disabled = catalogIndex === 0;
    document.getElementById("catalogNext").disabled = catalogIndex >= totalItems - itemsInView;
    if (totalItems <= itemsInView) {
        document.getElementById("catalogPrev").disabled = true;
        document.getElementById("catalogNext").disabled = true;
    }
}


// ===============================
// FUNÇÕES DE MODAL
// ===============================

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove("hidden");
        document.body.classList.add("modal-open");
        // Garante que o estado inicial do modal de login é o de login
        if (id === "loginModal") {
             showLoginContent();
        }
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add("hidden");
        document.body.classList.remove("modal-open");
    }
}


// ===============================
// FUNÇÕES DE AUTENTICAÇÃO (FIREBASE)
// ===============================

// Funções para gerenciar as abas do modal
function showLoginContent() {
    document.getElementById("loginContent").classList.remove("hidden");
    document.getElementById("signupContent").classList.add("hidden");
    document.getElementById("forgotPassContent").classList.add("hidden");
    
    // Atualiza o estado visual dos botões de tab
    document.getElementById("showLoginTab")?.classList.add("active");
    document.getElementById("showSignupTab")?.classList.remove("active");
    
    // Limpa formulários
    document.getElementById("signupForm")?.reset();
    document.getElementById("forgotPassForm")?.reset();
}

function showSignupContent() {
    document.getElementById("loginContent").classList.add("hidden");
    document.getElementById("signupContent").classList.remove("hidden");
    document.getElementById("forgotPassContent").classList.add("hidden");
    
    // Atualiza o estado visual dos botões de tab
    document.getElementById("showLoginTab")?.classList.remove("active");
    document.getElementById("showSignupTab")?.classList.add("active");
    
    // Limpa formulários
    document.getElementById("loginForm")?.reset();
    document.getElementById("forgotPassForm")?.reset();
}

function showForgotPassContent() {
    document.getElementById("loginContent").classList.add("hidden");
    document.getElementById("signupContent").classList.add("hidden");
    document.getElementById("forgotPassContent").classList.remove("hidden");

    // Remove a classe 'active' de todas as tabs principais
    document.getElementById("showLoginTab")?.classList.remove("active");
    document.getElementById("showSignupTab")?.classList.remove("active");
    
    // Limpa formulários
    document.getElementById("loginForm")?.reset();
    document.getElementById("signupForm")?.reset();
}


function handleLoginForm(e) {
    e.preventDefault(); 

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    
    if (!email || !password) {
        showToast("Preencha todos os campos.", "danger");
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Sucesso!
            showToast("Login realizado com sucesso!", "success");
            closeModal("loginModal");
        })
        .catch((error) => {
            let message = "Ocorreu um erro ao tentar fazer login. Verifique suas credenciais e tente novamente.";
            switch (error.code) {
                case 'auth/user-not-found':
                    message = "Usuário não encontrado. Verifique o e-mail.";
                    break;
                case 'auth/wrong-password':
                    message = "Senha incorreta.";
                    break;
                case 'auth/invalid-email':
                    message = "E-mail inválido.";
                    break;
                case 'auth/user-disabled':
                    message = "Esta conta foi desativada.";
                    break;
            }
            showToast(message, "danger");
        });
}

function handleSignupForm(e) {
    e.preventDefault();

    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("signupConfirmPassword").value; // ID do campo corrigido

    if (!email || !password || !confirmPassword) {
        showToast("Preencha todos os campos.", "danger");
        return;
    }
    if (password.length < 6) {
        showToast("A senha deve ter pelo menos 6 caracteres.", "danger");
        return;
    }
    if (password !== confirmPassword) {
        showToast("As senhas não coincidem.", "danger");
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Sucesso! O usuário está logado automaticamente
            showToast("Cadastro realizado com sucesso! Bem-vindo(a).", "success");
            closeModal("loginModal");
            document.getElementById("signupForm").reset(); // Limpa o formulário
        })
        .catch((error) => {
            let message = "Ocorreu um erro ao tentar se cadastrar.";
            switch (error.code) {
                case 'auth/email-already-in-use':
                    message = "Este e-mail já está em uso.";
                    break;
                case 'auth/invalid-email':
                    message = "E-mail inválido.";
                    break;
            }
            showToast(message, "danger");
        });
}

function handleForgotPassword(e) {
    e.preventDefault();

    const email = document.getElementById("forgotPassEmail").value; // ID do campo corrigido

    if (!email) {
        showToast("Digite seu e-mail para recuperar a senha.", "danger");
        return;
    }

    auth.sendPasswordResetEmail(email)
        .then(() => {
            showToast("Link de recuperação enviado para seu e-mail!", "success");
            // Não fecha o modal, mas volta para a tela de login
            showLoginContent(); 
            document.getElementById("forgotPassForm").reset();
        })
        .catch((error) => {
            let message = "Erro ao enviar link de recuperação. Verifique o e-mail.";
            if (error.code === 'auth/user-not-found') {
                message = "Nenhuma conta encontrada com este e-mail.";
            }
            showToast(message, "danger");
        });
}

function handleLogout() {
    auth.signOut().then(() => {
        showToast("Logout realizado com sucesso!", "info");
    }).catch((error) => {
        showToast("Erro ao fazer logout.", "danger");
    });
}

// ------------------- CONTATO -------------------

function handleContactForm(e) {
    e.preventDefault(); 
    
    // Simula o envio do formulário de contato
    const name = document.getElementById("contactName").value;
    const email = document.getElementById("contactEmail").value;
    const message = document.getElementById("contactMessage").value;

    if (!name || !email || !message) {
        showToast("Por favor, preencha todos os campos do contato.", "danger");
        return;
    }

    // Lógica de envio simulada
    // Você pode integrar um serviço de formulário aqui (ex: Formspree, Firebase Functions)
    console.log(`Mensagem de Contato Recebida:\nNome: ${name}\nEmail: ${email}\nMensagem: ${message}`);

    showToast("Sua mensagem foi enviada com sucesso! Retornaremos em breve.", "success");
    document.getElementById("contactForm").reset(); 
}


// ===============================
// ATUALIZAÇÃO DE INTERFACE (UI)
// ===============================

// Garante que a UI (botões de carrinho/checkout) reflita o status de login
function setAuthDependentUI(user) {
  const allAddToCartBtns = document.querySelectorAll(".add-to-cart");
  
  allAddToCartBtns.forEach(btn => {
    if (user) {
      btn.disabled = false;
      btn.classList.remove("disabled");
      btn.title = "Adicionar ao Carrinho";
    } else {
      btn.disabled = true;
      btn.classList.add("disabled");
      btn.title = "Faça login para adicionar ao carrinho";
    }
  });

  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) {
    // A lógica original já estava boa, apenas garantindo que user.email exista
    const userLoggedIn = user && user.email;
    const cartHasItems = userCart.length > 0;
    
    if (userLoggedIn && cartHasItems) {
      checkoutBtn.disabled = false;
      checkoutBtn.title = "Finalizar compra";
    } else if (userLoggedIn && !cartHasItems) {
      checkoutBtn.disabled = true;
      checkoutBtn.title = "Seu carrinho está vazio";
    } else { // Not logged in
      checkoutBtn.disabled = true;
      checkoutBtn.title = "Faça login para finalizar a compra";
    }
  }
}

function updateUI(user) {
  const loginLink = document.getElementById("loginLink");
  const logoutBtn = document.getElementById("logoutBtn");

  if (user) {
    currentUser = user;
    loginLink.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
  } else {
    currentUser = null;
    loginLink.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
  }

  setAuthDependentUI(user);
  updateCart();
}

// Monitora o estado de autenticação (IMPORTANTE)
auth.onAuthStateChanged(updateUI);

// ===============================
// INICIALIZAÇÃO E EVENTOS
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    // Renderiza os produtos
    const destaques = fixedProducts.filter(p => p.isFeatured);
    const catalogo = fixedProducts.filter(p => !p.isFeatured);
    
    renderProducts(destaques, "destaquesCarousel");
    renderProducts(catalogo, "catalogCarousel");

    // Inicializa carrosséis
    moveDestaquesCarousel(0);
    moveCatalogCarousel(0);
    
    // Eventos de Modal
    document.getElementById("loginLink")?.addEventListener("click", (e) => {
        e.preventDefault();
        openModal("loginModal");
    });
    document.getElementById("closeLogin")?.addEventListener("click", () => closeModal("loginModal"));
    document.getElementById("closeCart")?.addEventListener("click", () => closeModal("cartModal"));
    document.getElementById("openCart")?.addEventListener("click", () => {
        updateCart(); // Garante que o carrinho está atualizado ao abrir
        openModal("cartModal");
    });
    
    // ----------------------------------------------------
    // CORREÇÕES: EVENTOS DE NAVEGAÇÃO ENTRE ABAS DO MODAL
    // ----------------------------------------------------
    document.getElementById("showLoginTab")?.addEventListener("click", showLoginContent);
    document.getElementById("showSignupTab")?.addEventListener("click", showSignupContent);
    
    document.getElementById("showForgotPass")?.addEventListener("click", (e) => {
        e.preventDefault();
        showForgotPassContent();
    });
    
    document.getElementById("backToLoginFromSignup")?.addEventListener("click", (e) => {
        e.preventDefault();
        showLoginContent();
    });
    
    document.getElementById("backToLoginFromForgotPass")?.addEventListener("click", (e) => {
        e.preventDefault();
        showLoginContent();
    });
    // ----------------------------------------------------

    document.getElementById("closeConfirmModal")?.addEventListener("click", () => closeModal("confirmationModal"));

    // Eventos do Carrossel 
    document.getElementById("carouselPrev")?.addEventListener("click", () => moveDestaquesCarousel(-1));
    document.getElementById("carouselNext")?.addEventListener("click", () => moveDestaquesCarousel(1));
    document.getElementById("catalogPrev")?.addEventListener("click", () => moveCatalogCarousel(-1));
    document.getElementById("catalogNext")?.addEventListener("click", () => moveCatalogCarousel(1));
    
    // Eventos de Formulário
    document.getElementById("loginForm")?.addEventListener("submit", handleLoginForm);
    document.getElementById("signupForm")?.addEventListener("submit", handleSignupForm);
    document.getElementById("forgotPassForm")?.addEventListener("submit", handleForgotPassword);
    document.getElementById("contactForm")?.addEventListener("submit", handleContactForm); 
    
    // Eventos de Carrinho e Login/Logout
    document.getElementById("logoutBtn")?.addEventListener("click", handleLogout);
    document.getElementById("checkoutBtn")?.addEventListener("click", handleCheckout); 
    document.getElementById("confirmPurchaseBtn")?.addEventListener("click", confirmPurchase); 
    document.getElementById("clearCart")?.addEventListener("click", () => {
        userCart = [];
        updateCart();
        showToast("Carrinho esvaziado.", "info");
    });
    
    // Reinicia o carrossel ao redimensionar
    window.addEventListener('resize', () => {
        destaquesIndex = 0;
        catalogIndex = 0;
        moveDestaquesCarousel(0); 
        moveCatalogCarousel(0); 
    });
});