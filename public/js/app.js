// Sistema simples de senha - adicione no topo do arquivo app.js
(function() {
  // Senha definida (você pode alterar para a que preferir)
  const password = "verilo";
  let authorized = false;
  
  // Verificar se já está autenticado nesta sessão
  if (sessionStorage.getItem('verilo_auth') === 'true') {
    authorized = true;
    return; // Já está autenticado, continuar carregando a aplicação
  }
  
  // Solicitar senha até 3 tentativas ou até acertar
  let attempts = 0;
  while (!authorized && attempts < 3) {
    const inputPassword = prompt("Digite a senha para acessar o Verilo:");
    attempts++;
    
    // Cancelou o prompt ou excedeu as tentativas
    if (inputPassword === null) {
      document.body.innerHTML = '<div style="text-align: center; padding: 50px;">Acesso negado</div>';
      return;
    }
    
    // Senha correta
    if (inputPassword === password) {
      authorized = true;
      sessionStorage.setItem('verilo_auth', 'true');
      break;
    }
    
    // Senha incorreta
    alert(`Senha incorreta. Tentativa ${attempts} de 3.`);
  }
  
  // Se após as tentativas ainda não está autorizado
  if (!authorized) {
    document.body.innerHTML = '<div style="text-align: center; padding: 50px;">Número máximo de tentativas excedido. Recarregue a página para tentar novamente.</div>';
  }
})();

// app.js - Inicializa a aplicação e configura event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar UI
  window.ui.initUI();
  
  // Configurar event listeners
  
  // Enviar mensagem ao clicar no botão ou pressionar Enter
  const sendButton = document.getElementById('sendBtn');
  const messageInput = document.getElementById('messageInput');
  
  sendButton.addEventListener('click', () => {
    const message = messageInput.value;
    window.chat.sendMessage(message);
  });
  
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const message = messageInput.value;
      window.chat.sendMessage(message);
    }
  });
  
  // Nova conversa
  document.getElementById('newChatBtn').addEventListener('click', () => {
    // Carregar conversa nova
    window.ui.loadConversation('new');
  });
  
  // Anexar arquivos
  const attachBtn = document.getElementById('attachBtn');
  const fileInput = document.getElementById('fileInput');
  
  attachBtn.addEventListener('click', () => {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    
    // Limitar a 10 arquivos
    if (window.uiState.attachments.length + files.length > 10) {
      alert('Você pode anexar no máximo 10 arquivos');
      return;
    }
    
    // Adicionar cada arquivo
    files.forEach(file => {
      // Verificar tamanho (limite de 25MB por arquivo)
      if (file.size > 25 * 1024 * 1024) {
        alert(`O arquivo ${file.name} excede o limite de 25MB`);
        return;
      }
      
      // Adicionar ao estado
      window.uiState.attachments.push({
        name: file.name,
        type: file.type,
        file: file
      });
      
      // Adicionar à UI
      const attachmentElement = document.createElement('div');
      attachmentElement.className = 'attachment-item';
      attachmentElement.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
          <polyline points="13 2 13 9 20 9"></polyline>
        </svg>
        ${file.name}
        <div class="attachment-remove" data-name="${file.name}">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
      `;
      
      document.getElementById('attachmentsArea').appendChild(attachmentElement);
    });
    
    // Limpar input de arquivo
    fileInput.value = '';
  });
  
  // Remover anexo
  document.getElementById('attachmentsArea').addEventListener('click', (e) => {
    if (e.target.closest('.attachment-remove')) {
      const name = e.target.closest('.attachment-remove').getAttribute('data-name');
      
      // Remover do estado
      window.uiState.attachments = window.uiState.attachments.filter(a => a.name !== name);
      
      // Remover da UI
      e.target.closest('.attachment-item').remove();
    }
  });
  
  // Botão Whisper
  const whisperBtn = document.getElementById('whisperBtn');
  let mediaRecorder;
  let audioChunks = [];
  
  whisperBtn.addEventListener('click', () => {
    if (window.uiState.recording) {
      // Parar gravação
      mediaRecorder.stop();
      window.uiState.recording = false;
      whisperBtn.innerHTML = `
        <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
        Whisper
      `;
    } else {
      // Iniciar gravação
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          window.uiState.recording = true;
          whisperBtn.innerHTML = `
            <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <rect x="18" y="3" width="4" height="18"></rect>
              <rect x="10" y="8" width="4" height="13"></rect>
              <rect x="2" y="13" width="4" height="8"></rect>
            </svg>
            Gravando...
          `;
          
          mediaRecorder = new MediaRecorder(stream);
          audioChunks = [];
          
          mediaRecorder.addEventListener('dataavailable', event => {
            audioChunks.push(event.data);
          });
          
          mediaRecorder.addEventListener('stop', async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            
            // Transcrever áudio
            const text = await window.chat.transcribeAudio(audioBlob);
            
            if (text) {
              messageInput.value = text;
              messageInput.style.height = 'auto';
              messageInput.style.height = (messageInput.scrollHeight) + 'px';
              messageInput.focus();
            }
            
            // Parar de usar o microfone
            stream.getTracks().forEach(track => track.stop());
          });
          
          mediaRecorder.start();
        })
        .catch(err => {
          console.error('Erro ao acessar o microfone:', err);
          alert('Não foi possível acessar o microfone');
          window.uiState.recording = false;
        });
    }
  });
  
  // Listeners para ações nas mensagens
  document.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('.message-action-btn');
    if (actionBtn) {
      const action = actionBtn.getAttribute('data-action');
      const messageId = actionBtn.getAttribute('data-message-id');
      
      if (action === 'listen') {
        // Encontrar mensagem
        const messageElement = actionBtn.closest('.message');
        const messageContent = messageElement.querySelector('.message-content').textContent;
        
        // Sintetizar voz
        window.chat.textToSpeech(messageContent, messageId);
      } else if (action === 'copy') {
        // Encontrar mensagem
        const messageElement = actionBtn.closest('.message');
        const messageContent = messageElement.querySelector('.message-content').textContent;
        
        // Copiar para a área de transferência
        navigator.clipboard.writeText(messageContent)
          .then(() => {
            // Feedback visual temporário
            actionBtn.innerHTML = `
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Copiado!
            `;
            
            setTimeout(() => {
              actionBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copiar
              `;
            }, 2000);
          })
          .catch(err => {
            console.error('Erro ao copiar texto:', err);
          });
      }
    }
  });
  
  // Dropdown mobile
  const mobileModelSelect = document.getElementById('mobileModelSelect');
  if (mobileModelSelect) {
    mobileModelSelect.addEventListener('change', function() {
      const selectedModel = this.value;
      uiState.activeModel = selectedModel;
      
      // Atualizar modelo visível
      elements.currentModel.textContent = this.options[this.selectedIndex].text;
      
      // Atualizar botões no desktop também
      document.querySelectorAll('.model-button').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-model') === selectedModel);
      });
      
      // Atualizar label do modo avançado
      updateAdvancedModeLabel();
    });
  }
});