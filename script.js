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
const WHATSAPP_NUMBER = "5561999999999"; 

// ===================================
// VARIÁVEIS GLOBAIS
// ===================================
let currentUser = null;
let userCart = [];

// Lista de Erros do Firebase em Português
const authErrors = {
    'auth/invalid-email': 'O endereço de email é inválido.',
    'auth/user-not-found': 'Usuário não encontrado. Verifique o email ou registre-se.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/email-already-in-use': 'Este email já está em uso.',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
    'auth/operation-not-allowed': 'Operação não permitida.',
    'auth/requires-recent-login': 'Você precisa fazer login novamente para executar esta ação.'
};


// ===================================
// GERAL & UTILITÁRIOS
// ===================================

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).classList.remove("hidden");
    document.body.classList.add("modal-open");
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add("hidden");
    document.body.classList.remove("modal-open");
}

// Toast Notification
function showToast(message, type = "info", duration = 3000) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove("hidden");
    setTimeout(() => {
        toast.classList.add("hidden");
    }, duration);
}

// Format currency
function formatCurrency(value) {
    return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


// ===================================
// LÓGICA DE FIREBASE E AUTENTICAÇÃO
// ===================================

// Garante que a UI (botões de carrinho/checkout) reflita o status de login
function setAuthDependentUI(user) {
    const loginLink = document.getElementById("loginLink");
    const logoutBtn = document.getElementById("logoutBtn");
    const allAddToCartBtns = document.querySelectorAll(".add-to-cart");

    if (user) {
        loginLink?.classList.add("hidden");
        logoutBtn?.classList.remove("hidden");
    } else {
        loginLink?.classList.remove("hidden");
        logoutBtn?.classList.add("hidden");
    }
    
    // Configura botões "Adicionar ao Carrinho"
    allAddToCartBtns.forEach(btn => {
        if (user) {
            btn.disabled = false;
            btn.classList.remove("disabled");
            btn.title = "Adicionar ao Carrinho";
        } else {
            // Deixe o botão 'add-to-cart' CLICÁVEL (disabled=false), mas mude o estilo para indicar
            // que o login é necessário. O handleAddToCart fará o resto.
            btn.disabled = false; 
            btn.classList.add("disabled"); 
            btn.title = "Faça login para adicionar ao carrinho";
        }
    });

    const checkoutBtn = document.getElementById("checkoutBtn");
    if (checkoutBtn) {
        const userLoggedIn = user && user.email;
        const cartHasItems = userCart.length > 0;

        // Lógica do Checkout (desabilitado se NÃO Logado E Tem Itens)
        checkoutBtn.disabled = !(userLoggedIn && cartHasItems);

        if (!userLoggedIn) {
            checkoutBtn.title = "Faça login para finalizar a compra";
        } else if (!cartHasItems) {
            checkoutBtn.title = "Seu carrinho está vazio";
        } else {
            checkoutBtn.title = "Finalizar compra";
        }
    }
}

// Estado de Autenticação
auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    setAuthDependentUI(user);

    if (user) {
        await loadCart(user.uid);
    } else {
        userCart = [];
        updateCart();
    }
});


// Funções de Formulário

function handleLoginForm(e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const passwordInput = document.getElementById("loginPassword");
    const password = passwordInput.value;

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            closeModal("loginModal");
            showToast(`Bem-vindo de volta, ${email}!`, "success");
        })
        .catch(error => {
            showToast(`Erro ao fazer login: ${authErrors[error.code] || error.message}`, "danger");
        })
        .finally(() => {
            // ✅ SEGURANÇA: Limpa o campo de senha após a tentativa
            passwordInput.value = ''; 
        });
}

function handleSignupForm(e) {
    e.preventDefault();
    
    // Captura os elementos do formulário
    const emailInput = document.getElementById("signupEmail");
    const passwordInput = document.getElementById("signupPassword");
    const confirmPasswordInput = document.getElementById("signupConfirmPassword");

    const email = emailInput.value;
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (password !== confirmPassword) {
        showToast("As senhas não coincidem.", "danger");
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // 1. O Firebase loga automaticamente. Vamos deslogar forçadamente.
            auth.signOut();
            
            // 2. Mostra mensagem de sucesso
            showToast("Conta criada! Por favor, faça login.", "success");

            // 3. Muda a aba para "Login"
            showTab("loginContent");

            // --- ALTERAÇÃO: Removido o preenchimento automático do email no login ---
            
            // 4. Foca no campo de senha do login (opcional, pode focar no email se preferir)
            const loginEmailInput = document.getElementById("loginEmail");
            if (loginEmailInput) {
                loginEmailInput.focus();
            }

            // 5. Limpa o campo de e-mail do registro para evitar duplicação visual
            emailInput.value = "";
        })
        .catch(error => {
            showToast(`Erro ao registrar: ${authErrors[error.code] || error.message}`, "danger");
        })
        .finally(() => {
            // Limpa os campos de senha do registro por segurança
            passwordInput.value = '';
            confirmPasswordInput.value = '';
        });
}

function handleForgotPassword(e) {
    e.preventDefault();
    
    // Pega o valor e remove espaços em branco extras
    const emailInput = document.getElementById("forgotPassEmail");
    const email = emailInput.value.trim();

    if (!email) {
        showToast("Por favor, digite seu e-mail.", "danger");
        return;
    }

    auth.sendPasswordResetEmail(email)
        .then(() => {
            // Sucesso
            showToast("Email enviado! Verifique sua caixa de entrada e spam.", "success", 5000);
            // Retorna visualmente para a aba de login para facilitar o acesso
            showTab("loginContent");
        })
        .catch(error => {
            console.error("Erro ao recuperar senha:", error);
            // Verifica erros comuns
            let errorMessage = authErrors[error.code];
            
            if (!errorMessage) {
                errorMessage = "Erro ao enviar e-mail. Verifique se o endereço está correto.";
            }
            
            showToast(errorMessage, "danger");
        });
}

function handleLogout() {
    auth.signOut()
        .then(() => {
            showToast("Você foi desconectado com sucesso!", "info");
            userCart = []; // Limpa o carrinho local
            updateCart(); // Atualiza a UI
            
            // --- ALTERAÇÃO: Limpa os formulários ao sair ---
            document.getElementById("loginForm").reset();
            document.getElementById("signupForm").reset();
        })
        .catch(error => {
            showToast(`Erro ao fazer logout: ${error.message}`, "danger");
        });
}

// ** Funções de aba do Modal de Login/Registro **
function showTab(tabId) {
    document.getElementById('loginContent').classList.add('hidden');
    document.getElementById('signupContent').classList.add('hidden');
    document.getElementById('forgotPassContent').classList.add('hidden');
    
    document.getElementById(tabId).classList.remove('hidden');
}


// ===================================
// LÓGICA DO CARRINHO (Firestore)
// ===================================

// Funções de Persistência
async function saveCart(userId) {
    try {
        await db.collection("carts").doc(userId).set({
            items: userCart,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error("Erro ao salvar carrinho:", error);
    }
}

async function loadCart(userId) {
    try {
        const doc = await db.collection("carts").doc(userId).get();
        if (doc.exists) {
            userCart = doc.data().items || [];
        } else {
            userCart = [];
        }
        updateCart();
    } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
        userCart = [];
        updateCart();
    }
}

// Lógica de Atualização da UI do Carrinho
function updateCart() {
    const cartItemsContainer = document.getElementById("cartItems");
    const cartTotalElement = document.getElementById("cartTotal");
    const cartIcon = document.getElementById("cartIcon");
    let total = 0;

    if (!cartItemsContainer || !cartTotalElement) return;

    cartItemsContainer.innerHTML = ''; 

    if (userCart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-center muted-color">Seu carrinho está vazio. Adicione um jogo!</p>';
    } else {
        userCart.forEach((item, index) => {
            total += item.price;
            const cartItemEl = document.createElement("div");
            cartItemEl.className = "cart-item";
            cartItemEl.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-price">R$ ${formatCurrency(item.price)}</span>
                </div>
                <button class="remove-from-cart btn danger small" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            cartItemsContainer.appendChild(cartItemEl);
        });
        attachCartItemEvents();
    }

    cartTotalElement.textContent = formatCurrency(total);
    document.getElementById("confirmTotal").textContent = formatCurrency(total); // Atualiza modal de confirmação
    
    // Atualiza o contador de itens no ícone do carrinho
    const itemCountSpan = document.getElementById("cartItemCount");
    if (itemCountSpan) {
        itemCountSpan.textContent = userCart.length;
        if (userCart.length > 0) {
             itemCountSpan.classList.add('visible');
        } else {
             itemCountSpan.classList.remove('visible');
        }
    }
    
    setAuthDependentUI(currentUser); 
    
    if (currentUser) {
        saveCart(currentUser.uid); // Salva no Firestore
    }
}

function attachCartItemEvents() {
    document.querySelectorAll(".remove-from-cart").forEach(button => {
        button.addEventListener("click", (e) => {
            const index = parseInt(e.currentTarget.getAttribute("data-index"));
            userCart.splice(index, 1);
            updateCart();
            showToast("Item removido do carrinho.", "info");
        });
    });
}

// Função de Adicionar ao Carrinho
function handleAddToCart(e) {
    if (!currentUser) {
        showToast("Você precisa fazer login para adicionar itens ao carrinho.", "danger");
        openModal("loginModal");
        return;
    }
    
    const productEl = e.currentTarget.closest(".product-card");
    const name = productEl.getAttribute("data-name");
    const price = parseFloat(productEl.getAttribute("data-price"));
    const image = productEl.querySelector("img").src;

    // Verifica se o item já está no carrinho (previne duplicação do mesmo jogo)
    const isDuplicate = userCart.some(item => item.name === name);
    if (isDuplicate) {
        showToast(`${name} já está no seu carrinho.`, "info");
        return;
    }

    userCart.push({ name, price, image });
    updateCart();
    showToast(`${name} adicionado ao carrinho!`, "success");
}


// ===================================
// LÓGICA DE CHECKOUT E WHATSAPP
// ===================================

function handleCheckout() {
    if (!currentUser) {
        showToast("Você precisa fazer login para finalizar a compra.", "danger");
        openModal("loginModal");
        return;
    }
    if (userCart.length === 0) {
        showToast("Seu carrinho está vazio.", "danger");
        return;
    }

    // Abre o modal de confirmação
    openModal("confirmationModal");
}

function confirmPurchase() {
    if (userCart.length === 0) {
        showToast("Seu carrinho está vazio. Não é possível finalizar a compra.", "danger");
        return;
    }

    const total = userCart.reduce((sum, item) => sum + item.price, 0);
    const cartList = userCart.map(item => `* ${item.name} (R$ ${formatCurrency(item.price)})`).join('\n');
    
    const message = `
Olá! Gostaria de finalizar o meu pedido na Alt+F4.

Meu email: ${currentUser.email}
Total da Compra: R$ ${formatCurrency(total)}

Itens:
${cartList}

Por favor, me informe os dados para pagamento (PIX/Transferência).
    `.trim();

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

    // Limpar o carrinho e a UI após gerar o link
    userCart = [];
    updateCart(); 
    closeModal("confirmationModal");
    showToast("Compra iniciada! Redirecionando para o WhatsApp...", "success", 5000);

    // Redireciona o usuário
    window.open(whatsappUrl, '_blank');
}


// ===================================
// LÓGICA DE CARROSSEL
// ===================================

let destaquesIndex = 0;
let catalogIndex = 0;

function moveDestaquesCarousel(direction) {
    const carouselInner = document.querySelector("#destaquesCarousel");
    const cards = carouselInner.querySelectorAll(".product-card");
    if (cards.length === 0) return;

    // Calcula a largura de um card + margin (se houver, ajuste este valor se necessário)
    const cardWidth = cards[0].offsetWidth + 20; // 20px de gap/margin entre cards
    const cardsPerView = Math.floor(carouselInner.parentElement.offsetWidth / cardWidth);

    destaquesIndex += direction;

    // Limites de Destaques
    const maxIndex = cards.length - cardsPerView;
    if (destaquesIndex > maxIndex) {
        destaquesIndex = maxIndex > 0 ? maxIndex : 0;
    }
    if (destaquesIndex < 0) {
        destaquesIndex = 0;
    }
    
    // Garante que a translação pare no início/fim, mesmo com poucos cards
    const translateX = destaquesIndex * cardWidth;

    carouselInner.style.transform = `translateX(-${translateX}px)`;
}

function moveCatalogCarousel(direction) {
    const carouselInner = document.querySelector("#catalogCarousel");
    const cards = carouselInner.querySelectorAll(".product-card");
    if (cards.length === 0) return;
    
    // Calcula a largura de um card + margin (se houver, ajuste este valor se necessário)
    const cardWidth = cards[0].offsetWidth + 20; // 20px de gap/margin entre cards
    const cardsPerView = Math.floor(carouselInner.parentElement.offsetWidth / cardWidth);

    catalogIndex += direction;

    // Limites de Catálogo
    const maxIndex = cards.length - cardsPerView;
    if (catalogIndex > maxIndex) {
        catalogIndex = maxIndex > 0 ? maxIndex : 0;
    }
    if (catalogIndex < 0) {
        catalogIndex = 0;
    }
    
    // Garante que a translação pare no início/fim, mesmo com poucos cards
    const translateX = catalogIndex * cardWidth;

    carouselInner.style.transform = `translateX(-${translateX}px)`;
}

// Ação de Formulário de Contato (Simples, apenas notifica)
function handleContactForm(e) {
    e.preventDefault();
    showToast("Mensagem enviada! Entraremos em contato em breve.", "success");
    e.target.reset(); // Limpa o formulário
}


// ===================================
// EVENTOS E INICIALIZAÇÃO
// ===================================

document.addEventListener("DOMContentLoaded", () => {
    // Carrega dados iniciais do carrinho (será sobreescrito pelo loadCart)
    updateCart();

    // Fecha Modals
    document.querySelectorAll(".close").forEach(button => {
        button.addEventListener("click", (e) => {
            closeModal(e.currentTarget.closest(".modal").id);
        });
    });

    // Abre Modals e gerencia abas
    document.getElementById("loginLink")?.addEventListener("click", (e) => {
        e.preventDefault();
        
        // --- ALTERAÇÃO: Limpa o formulário sempre que abrir o modal de login ---
        document.getElementById("loginForm").reset();
        
        openModal("loginModal");
        showTab("loginContent"); // Garante que a aba de login seja mostrada
    });
    
    // Gerenciamento de abas dentro do Modal de Login
    document.getElementById("showLoginTab")?.addEventListener("click", () => showTab("loginContent"));
    document.getElementById("showSignupTab")?.addEventListener("click", () => showTab("signupContent"));
    
    document.getElementById("showForgotPass")?.addEventListener("click", (e) => {
        e.preventDefault();
        showTab("forgotPassContent");
    });
    document.getElementById("backToLoginFromSignup")?.addEventListener("click", () => showTab("loginContent"));
    document.getElementById("backToLoginFromForgotPass")?.addEventListener("click", () => showTab("loginContent"));

    // Eventos de Carrinho
    // Usamos o #openCart que existe no HTML
    document.getElementById("openCart")?.addEventListener("click", () => {
        openModal("cartModal");
    });
    document.getElementById("closeCart")?.addEventListener("click", () => {
        closeModal("cartModal");
    });
    document.getElementById("closeConfirmModal")?.addEventListener("click", () => {
        closeModal("confirmationModal");
    });

    // Eventos de Botão Add to Cart (Anexados aqui e em updateCart)
    document.querySelectorAll(".add-to-cart").forEach(button => {
        button.addEventListener("click", handleAddToCart);
    });

    // Eventos de Carrossel
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