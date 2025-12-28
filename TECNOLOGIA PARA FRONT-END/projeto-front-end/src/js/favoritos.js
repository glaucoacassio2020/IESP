// ========================================
// SISTEMA DE FAVORITOS E CARRINHO - MyCloset
// Versão Final - Novembro 2024
// ========================================

let carrinho = {};
let favoritos = {};

window.addEventListener('load', function() {
  carregarDadosSalvos();
  configurarBotoesFavoritos();
  configurarBotoesCarrinho();
  atualizarNumeroCarrinho();
});

// ========================================
// FUNÇÕES DE FAVORITOS
// ========================================

function configurarBotoesFavoritos() {
  let botoesCoracao = document.querySelectorAll('.heart-btn, .product-heart-btn');
  
  for (let i = 0; i < botoesCoracao.length; i++) {
    let botao = botoesCoracao[i];
    
    botao.onclick = function(evento) {
      evento.preventDefault();
      evento.stopPropagation();
      adicionarOuRemoverFavorito(botao);
    };
  }
}

function adicionarOuRemoverFavorito(botao) {
  let card = encontrarCardProduto(botao);
  if (!card) return;
  
  let nomeProduto = pegarNomeProduto(card);
  let precoProduto = pegarPrecoProduto(card);
  let imagemProduto = pegarImagemProduto(card);
  
  if (!nomeProduto || !precoProduto || !imagemProduto) return;
  
  let idProduto = nomeProduto.toLowerCase().replace(/\s+/g, '-');
  
  if (favoritos[idProduto]) {
    // REMOVER dos favoritos
    delete favoritos[idProduto];
    botao.classList.remove('liked');
    
    // REMOVER do carrinho também
    if (carrinho[idProduto]) {
      if (carrinho[idProduto].quantidade > 1) {
        carrinho[idProduto].quantidade--;
      } else {
        delete carrinho[idProduto];
      }
      salvarCarrinho();
    }
  } else {
    // ADICIONAR aos favoritos
    favoritos[idProduto] = {
      id: idProduto,
      nome: nomeProduto,
      preco: precoProduto,
      imagem: imagemProduto,
      quantidade: 1
    };
    
    botao.classList.add('liked');
    
    // ADICIONAR ao carrinho também
    if (carrinho[idProduto]) {
      carrinho[idProduto].quantidade++;
    } else {
      carrinho[idProduto] = {
        id: idProduto,
        nome: nomeProduto,
        preco: precoProduto,
        imagem: imagemProduto,
        quantidade: 1
      };
    }
    salvarCarrinho();
  }
  
  salvarFavoritos();
  animarBotao(botao);
}

// ========================================
// FUNÇÕES DO CARRINHO
// ========================================

function configurarBotoesCarrinho() {
  let botoesCarrinho = document.querySelectorAll('.add-to-cart, .men-cart-btn, .product-cart-btn, .kids-cart-btn, .sport-cart-btn, .shoe-cart-btn, .product-btn');
  
  for (let i = 0; i < botoesCarrinho.length; i++) {
    let botao = botoesCarrinho[i];
    
    // Armazena o texto original como atributo de dados
    if (!botao.hasAttribute('data-texto-original')) {
      botao.setAttribute('data-texto-original', botao.textContent.trim());
    }
    
    botao.onclick = function(evento) {
      evento.preventDefault();
      evento.stopPropagation();
      adicionarAoCarrinho(botao);
    };
  }
}

function adicionarAoCarrinho(botao) {
  let card = encontrarCardProduto(botao);
  if (!card) return;
  
  let botaoCoracao = card.querySelector('.heart-btn, .product-heart-btn');
  
  let nomeProduto = pegarNomeProduto(card);
  let precoProduto = pegarPrecoProduto(card);
  let imagemProduto = pegarImagemProduto(card);
  
  if (!nomeProduto || !precoProduto || !imagemProduto) return;
  
  let idProduto = nomeProduto.toLowerCase().replace(/\s+/g, '-');
  
  // Verificar se já está nos favoritos
  let jaEstaNosFavoritos = favoritos[idProduto] ? true : false;
  
  // Adicionar ao carrinho
  if (carrinho[idProduto]) {
    carrinho[idProduto].quantidade++;
  } else {
    carrinho[idProduto] = {
      id: idProduto,
      nome: nomeProduto,
      preco: precoProduto,
      imagem: imagemProduto,
      quantidade: 1
    };
  }
  
  // Marcar coração como favorito APENAS se ainda não estiver
  if (!jaEstaNosFavoritos) {
    if (botaoCoracao) {
      botaoCoracao.classList.add('liked');
    }
    
    favoritos[idProduto] = {
      id: idProduto,
      nome: nomeProduto,
      preco: precoProduto,
      imagem: imagemProduto,
      quantidade: 1
    };
    salvarFavoritos();
  }
  
  salvarCarrinho();
  mostrarFeedbackBotao(botao);
}

// ========================================
// FUNÇÃO DE FEEDBACK DO BOTÃO
// ========================================

function mostrarFeedbackBotao(botao) {
  // Pega o texto original do atributo data
  let textoOriginal = botao.getAttribute('data-texto-original');
  
  // Se não existir, armazena o texto atual
  if (!textoOriginal) {
    textoOriginal = botao.textContent.trim();
    botao.setAttribute('data-texto-original', textoOriginal);
  }
  
  // Aplica o feedback visual
  botao.classList.add('btn-adicionado');
  botao.textContent = 'Adicionado!';
  animarBotao(botao);
  
  // Remove o feedback após 2 segundos
  setTimeout(function() {
    botao.classList.remove('btn-adicionado');
    botao.textContent = textoOriginal;
  }, 2000);
}

// ========================================
// FUNÇÕES AUXILIARES (AJUDANTES)
// ========================================

function encontrarCardProduto(botao) {
  let elemento = botao;
  
  while (elemento) {
    if (elemento.classList.contains('product-card') || 
        elemento.classList.contains('men-item') || 
        elemento.classList.contains('product-item') ||
        elemento.classList.contains('kids-item') ||
        elemento.classList.contains('sport-item') ||
        elemento.classList.contains('shoe-item') ||
        elemento.tagName === 'ARTICLE') {
      return elemento;
    }
    elemento = elemento.parentElement;
  }
  
  return null;
}

function pegarNomeProduto(card) {
  let titulo = card.querySelector('h3, .men-title, .product-title, .kids-title, .sport-title, .shoe-title');
  return titulo ? titulo.textContent.trim() : null;
}

function pegarPrecoProduto(card) {
  let preco = card.querySelector('.current, .men-price, .product-price, .kids-price, .sport-price, .shoe-price');
  return preco ? preco.textContent.trim() : null;
}

function pegarImagemProduto(card) {
  let img = card.querySelector('img');
  return img ? img.src : null;
}

function salvarFavoritos() {
  localStorage.setItem('favoritos', JSON.stringify(favoritos));
}

function salvarCarrinho() {
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  atualizarNumeroCarrinho();
}

function carregarDadosSalvos() {
  let carrinhoSalvo = localStorage.getItem('carrinho');
  if (carrinhoSalvo) {
    carrinho = JSON.parse(carrinhoSalvo);
  }
  
  let favoritosSalvos = localStorage.getItem('favoritos');
  if (favoritosSalvos) {
    favoritos = JSON.parse(favoritosSalvos);
  }
  
  marcarCoracoesFavoritos();
}

function marcarCoracoesFavoritos() {
  let botoesCoracao = document.querySelectorAll('.heart-btn, .product-heart-btn');
  
  for (let i = 0; i < botoesCoracao.length; i++) {
    let botao = botoesCoracao[i];
    let card = encontrarCardProduto(botao);
    if (!card) continue;
    
    let nomeProduto = pegarNomeProduto(card);
    if (!nomeProduto) continue;
    
    let idProduto = nomeProduto.toLowerCase().replace(/\s+/g, '-');
    
    if (favoritos[idProduto]) {
      botao.classList.add('liked');
    }
  }
}

function atualizarNumeroCarrinho() {
  let totalProdutos = Object.keys(carrinho).length;
  
  let botaoCarrinho = document.querySelector('.cart-btn');
  
  if (botaoCarrinho) {
    let badge = botaoCarrinho.querySelector('.cart-badge');
    
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'cart-badge';
      botaoCarrinho.appendChild(badge);
    }
    
    badge.textContent = totalProdutos;
    badge.style.display = totalProdutos > 0 ? 'flex' : 'none';
  }
}

function animarBotao(botao) {
  botao.style.animation = 'none';
  
  setTimeout(function() {
    botao.style.animation = 'pulse 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
  }, 10);
}

// ========================================
// ESTILOS CSS
// ========================================

let estilos = document.createElement('style');
estilos.textContent = `
  @keyframes pulse {
    25% { transform: scale(1.05); }
    50% { transform: scale(1.02); }
  }
  
  .cart-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #ff6b6b;
    color: white;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
  }
  
  .cart-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .heart-btn,
  .product-heart-btn {
    position: absolute !important;
    top: 12px !important;
    right: 12px !important;
    background: transparent !important;
    border: none !important;
    border-radius: 50% !important;
    width: 40px !important;
    height: 40px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    z-index: 999 !important;
    transition: all 0.3s ease !important;
  }
  
  .heart-btn:hover,
  .product-heart-btn:hover {
    transform: scale(1.2) !important;
  }
  
  .heart-btn svg,
  .product-heart-btn svg {
    width: 24px !important;
    height: 24px !important;
    stroke: #2c2c2c !important;
    fill: none !important;
    transition: all 0.3s ease !important;
    pointer-events: none !important;
  }
  
  .heart-btn.liked svg,
  .product-heart-btn.liked svg {
    fill: #ff6b6b !important;
    stroke: #ff6b6b !important;
  }
  
  .add-to-cart,
  .men-cart-btn,
  .product-cart-btn,
  .kids-cart-btn,
  .sport-cart-btn,
  .shoe-cart-btn,
  .product-btn {
    transition: all 0.3s ease !important;
  }
  
  .add-to-cart.btn-adicionado,
  .men-cart-btn.btn-adicionado,
  .product-cart-btn.btn-adicionado,
  .kids-cart-btn.btn-adicionado,
  .sport-cart-btn.btn-adicionado,
  .shoe-cart-btn.btn-adicionado,
  .product-btn.btn-adicionado {
    background-color: #2c2c2c !important;
    color: #ffffff !important;
    border: 2px solid #2c2c2c !important;
  }
  
  .add-to-cart.btn-adicionado:hover,
  .men-cart-btn.btn-adicionado:hover,
  .product-cart-btn.btn-adicionado:hover,
  .kids-cart-btn.btn-adicionado:hover,
  .sport-cart-btn.btn-adicionado:hover,
  .shoe-cart-btn.btn-adicionado:hover,
  .product-btn.btn-adicionado:hover {
    background-color: #1a1a1a !important;
    border-color: #1a1a1a !important;
    transform: translateY(0) !important;
  }
`;

document.head.appendChild(estilos);