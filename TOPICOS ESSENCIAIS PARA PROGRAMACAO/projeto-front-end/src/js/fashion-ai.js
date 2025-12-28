let uploadedImages = [];
const maxImages = 6;

// Inicializar quando a página carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  createChatContainer();
  attachEventListeners();
}

function createChatContainer() {
  const isRootPage = window.location.pathname === '/' || 
                     window.location.pathname.endsWith('index.html') ||
                     !window.location.pathname.includes('/pages/');
  
  const imgPath = isRootPage ? 'src/img/ia/fashion-ai.png' : '../img/ia/fashion-ai.png';
  
  const chatHTML = `
    <div class="ai-chat-container" id="aiChatContainer">
      <div class="ai-chat-header">
        <h3>Fashion AI</h3>
        <button class="ai-chat-close" id="aiChatClose">×</button>
      </div>
      
      <div class="ai-chat-body" id="aiChatBody">
        <div class="ai-welcome-message" id="aiWelcomeMessage">
          <p>Pode me enviar suas fotos? Assim consigo criar um look lindo e totalmente personalizado para a ocasião que você quiser.</p>
        </div>
        <div class="ai-preview-grid" id="aiPreviewGrid"></div>
        <div class="ai-results" id="aiResults">
          <div class="ai-results-grid" id="aiResultsGrid"></div>
        </div>
      </div>

      <div class="ai-input-area">
        <div style="width: 100%;">
          <textarea 
            class="ai-textarea" 
            id="aiTextarea" 
            placeholder="Descreva o look que deseja criar..."
            rows="1"></textarea>
          <div class="ai-disclaimer">FashionAI pode cometer erros. Verifique as informações.</div>
          <div class="ai-button-row">
            <div class="ai-action-buttons">
              <label class="ai-upload-btn" for="aiFileInput" title="Adicionar fotos">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                </svg>
              </label>
              <input type="file" id="aiFileInput" accept="image/*" multiple hidden>
              <button class="ai-send-btn" id="aiSendBtn" title="Gerar look">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <button class="ai-fab" id="aiFab">
      <img src="${imgPath}" alt="AI">
    </button>
  `;

  document.body.insertAdjacentHTML('beforeend', chatHTML);
}

function attachEventListeners() {
  const fab = document.getElementById('aiFab');
  const closeBtn = document.getElementById('aiChatClose');
  const fileInput = document.getElementById('aiFileInput');
  const sendBtn = document.getElementById('aiSendBtn');
  const textarea = document.getElementById('aiTextarea');

  fab.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleChat();
  });

  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeChat();
  });

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  });

  sendBtn.addEventListener('click', () => generateLooks());
  
  textarea.addEventListener('input', (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  });

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateLooks();
    }
  });
}

function toggleChat() {
  document.getElementById('aiChatContainer').classList.toggle('active');
}

function closeChat() {
  document.getElementById('aiChatContainer').classList.remove('active');
  clearAll();
}

function clearAll() {
  uploadedImages = [];
  renderPreview();
  
  const textarea = document.getElementById('aiTextarea');
  if (textarea) {
    textarea.value = '';
    textarea.style.height = 'auto';
  }
  
  const resultsSection = document.getElementById('aiResults');
  const resultsGrid = document.getElementById('aiResultsGrid');
  if (resultsSection) resultsSection.classList.remove('visible');
  if (resultsGrid) resultsGrid.innerHTML = '';
  
  const welcomeMsg = document.getElementById('aiWelcomeMessage');
  if (welcomeMsg) welcomeMsg.style.display = 'block';
}

function handleFiles(files) {
  if (!files || files.length === 0) return;

  const currentCount = uploadedImages.length;
  const remaining = maxImages - currentCount;

  if (remaining <= 0) {
    alert(`Máximo de ${maxImages} imagens.`);
    return;
  }

  const newFiles = Array.from(files)
    .filter(file => file.type.startsWith('image/'))
    .slice(0, remaining);

  if (newFiles.length === 0) {
    alert('Apenas imagens são permitidas.');
    return;
  }

  newFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImages.push({
        id: Date.now() + Math.random(),
        src: e.target.result,
        file: file
      });
      renderPreview();
    };
    reader.readAsDataURL(file);
  });
}

function renderPreview() {
  const grid = document.getElementById('aiPreviewGrid');
  const welcomeMsg = document.getElementById('aiWelcomeMessage');
  
  if (uploadedImages.length > 0 && welcomeMsg) {
      welcomeMsg.style.display = 'none';
  } else if (uploadedImages.length === 0 && welcomeMsg) {
    welcomeMsg.style.display = 'block';
  }
  
  grid.innerHTML = '';

  uploadedImages.forEach(img => {
    const div = document.createElement('div');
    div.className = 'ai-preview-item';
    div.innerHTML = `
      <img src="${img.src}" alt="Preview">
      <button class="ai-preview-remove" data-id="${img.id}">×</button>
    `;

    div.querySelector('.ai-preview-remove').addEventListener('click', () => {
      removeImage(img.id);
    });

    grid.appendChild(div);
  });
}

function removeImage(id) {
  uploadedImages = uploadedImages.filter(img => img.id !== id);
  renderPreview();
}

async function generateLooks() {
  const description = document.getElementById('aiTextarea').value.trim();
  const sendBtn = document.getElementById('aiSendBtn');
  const resultsSection = document.getElementById('aiResults');
  const resultsGrid = document.getElementById('aiResultsGrid');
  const welcomeMsg = document.getElementById('aiWelcomeMessage');

  if (uploadedImages.length === 0 && !description) {
    alert('Adicione fotos ou escreva uma descrição.');
    return;
  }

  if (welcomeMsg) welcomeMsg.style.display = 'none';

  sendBtn.disabled = true;
  resultsSection.classList.add('visible');
  resultsGrid.innerHTML = '<div class="ai-loading"><div class="ai-spinner"></div><p>Gerando looks...</p></div>';

  try {
    const formData = new FormData();
    uploadedImages.forEach(img => formData.append('images', img.file));
    formData.append('descricao', description);

    const response = await fetch('http://localhost:3000/generate-outfit', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.generated_looks && data.generated_looks.length > 0) {
      displayResults(data.generated_looks);
    } else {
      throw new Error('Nenhum look foi gerado');
    }

  } catch (error) {
    let errorMessage = 'Erro ao gerar look.';
    
    if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Erro de conexão. Verifique se o servidor está rodando.';
    } else {
      errorMessage = error.message;
    }
    
    alert(errorMessage);
    resultsGrid.innerHTML = `<div class="ai-loading"><p style="color: #e67e22;">${errorMessage}</p></div>`;
  } finally {
    sendBtn.disabled = false;
  }
}

function displayResults(looks) {
  const resultsGrid = document.getElementById('aiResultsGrid');

  if (!looks || looks.length === 0) {
    resultsGrid.innerHTML = '<div class="ai-loading"><p>Nenhum look gerado.</p></div>';
    return;
  }

  resultsGrid.innerHTML = '';

  looks.forEach((look, index) => {
    const card = document.createElement('div');
    card.className = 'ai-result-card';
    
    card.innerHTML = `
      <img src="${look.image_url}" alt="Look ${index + 1}" loading="lazy">
      <div class="ai-result-card-info">
        <h4>${look.description || `Look ${index + 1}`}</h4>
        <p>${look.style || 'Estilo'} ${look.is_recommended ? '⭐' : ''}</p>
      </div>
    `;
    
    resultsGrid.appendChild(card);
  });
}