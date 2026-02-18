// === SIDEBAR ===
const sidebar = document.getElementById('sidebar');
document.getElementById('sidebarToggle').addEventListener('click', () => sidebar.classList.toggle('collapsed'));

// === TABS ===
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// === FLOATING MENU ===
const floatingMenu = document.getElementById('floatingMenu');
document.getElementById('floatingTrigger').addEventListener('click', e => { e.stopPropagation(); floatingMenu.classList.toggle('open'); });
document.addEventListener('click', () => floatingMenu.classList.remove('open'));
floatingMenu.addEventListener('click', e => e.stopPropagation());

// === MODAL HELPERS ===
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('open'); }));

// === SETTINGS ===
document.getElementById('settingsMenuBtn').addEventListener('click', () => { floatingMenu.classList.remove('open'); openModal('settingsOverlay'); });
document.getElementById('closeSettings').addEventListener('click', () => closeModal('settingsOverlay'));
document.getElementById('avatarBtn').addEventListener('click', () => openModal('settingsOverlay'));
document.querySelectorAll('.settings-nav').forEach(nav => {
  nav.addEventListener('click', () => {
    document.querySelectorAll('.settings-nav').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
    nav.classList.add('active');
    document.getElementById('panel-' + nav.dataset.panel).classList.add('active');
  });
});

// === UPGRADE ===
document.getElementById('upgradeMenuBtn').addEventListener('click', () => { floatingMenu.classList.remove('open'); openModal('upgradeOverlay'); });
document.getElementById('closeUpgrade').addEventListener('click', () => closeModal('upgradeOverlay'));
document.getElementById('usageUpgradeBtn').addEventListener('click', () => { closeModal('settingsOverlay'); openModal('upgradeOverlay'); });

// === FEEDBACK ===
document.getElementById('feedbackMenuBtn').addEventListener('click', () => { floatingMenu.classList.remove('open'); openModal('feedbackOverlay'); });
document.getElementById('closeFeedback').addEventListener('click', () => closeModal('feedbackOverlay'));
document.getElementById('cancelFeedback').addEventListener('click', () => closeModal('feedbackOverlay'));

// === CHAT SETTINGS ===
document.getElementById('chatSettingsBtn').addEventListener('click', () => openModal('chatSettingsOverlay'));
document.getElementById('closeChatSettings').addEventListener('click', () => closeModal('chatSettingsOverlay'));
document.getElementById('resetSettingsBtn').addEventListener('click', () => {
  [['tempSlider','0.7'],['maxTokensSlider','2048'],['topPSlider','0.8'],['topKSlider','20'],['freqSlider','0'],['presSlider','0']]
    .forEach(([id, val]) => { document.getElementById(id).value = val; });
  document.getElementById('systemPromptInput').value = '';
  updateSliders();
});
function updateSliders() {
  [['tempSlider','tempVal'],['maxTokensSlider','maxTokensVal'],['topPSlider','topPVal'],['topKSlider','topKVal'],['freqSlider','freqVal'],['presSlider','presVal']]
    .forEach(([sid, vid]) => { document.getElementById(vid).textContent = document.getElementById(sid).value; });
}
['tempSlider','maxTokensSlider','topPSlider','topKSlider','freqSlider','presSlider'].forEach(id => document.getElementById(id).addEventListener('input', updateSliders));

// === MODEL SELECTOR ===
const modelDropdown = document.getElementById('modelDropdown');
document.getElementById('modelSelectorBtn').addEventListener('click', e => { e.stopPropagation(); modelDropdown.classList.toggle('open'); });
document.addEventListener('click', e => { if (!modelDropdown.contains(e.target)) modelDropdown.classList.remove('open'); });
document.querySelectorAll('.model-item').forEach(item => {
  item.addEventListener('click', () => {
    const badge = item.querySelector('.model-badge');
    if (badge && badge.classList.contains('pro')) { modelDropdown.classList.remove('open'); openModal('proUpsellOverlay'); return; }
    document.querySelectorAll('.model-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    document.getElementById('selectedModel').textContent = item.dataset.model;
    window.currentModel = item.dataset.modelId || 'qwen/qwen3.5-397b-a17b';
    modelDropdown.classList.remove('open');
  });
});
document.getElementById('modelSearch').addEventListener('input', function() {
  const v = this.value.toLowerCase();
  document.querySelectorAll('.model-item').forEach(item => { item.style.display = item.textContent.toLowerCase().includes(v) ? '' : 'none'; });
});

// === RENAME MODAL ===
let renameChatId = null;
window.openRenameModal = function(id, name) { renameChatId = id; document.getElementById('renameInput').value = name; openModal('renameOverlay'); };
document.getElementById('cancelRename').addEventListener('click', () => closeModal('renameOverlay'));
document.getElementById('confirmRename').addEventListener('click', () => {
  const newName = document.getElementById('renameInput').value.trim();
  if (newName && renameChatId) {
    const item = document.querySelector(`.chat-item[data-id="${renameChatId}"]`);
    if (item) { item.childNodes.forEach(n => { if (n.nodeType === 3 && n.textContent.trim()) n.textContent = ' ' + newName + ' '; }); }
  }
  closeModal('renameOverlay');
});

// === DELETE MODAL ===
let deleteChatId = null;
window.openDeleteModal = function(id, name) { deleteChatId = id; document.getElementById('deleteDesc').textContent = `This will delete ${name}.`; openModal('deleteOverlay'); };
document.getElementById('cancelDelete').addEventListener('click', () => closeModal('deleteOverlay'));
document.getElementById('confirmDelete').addEventListener('click', () => {
  if (deleteChatId) { const item = document.querySelector(`.chat-item[data-id="${deleteChatId}"]`); if (item) item.remove(); }
  closeModal('deleteOverlay');
});

// === NEW CHAT ===
let chatCounter = 10;
document.getElementById('newChatBtn').addEventListener('click', () => {
  const id = chatCounter++;
  const item = document.createElement('div');
  item.className = 'chat-item active';
  item.dataset.id = id;
  item.innerHTML = `<span class="chat-icon">&#128172;</span> New Chat <div class="chat-item-actions"><button class="chat-action-btn" onclick="openRenameModal(${id},'New Chat')">&#9998;</button><button class="chat-action-btn" onclick="openDeleteModal(${id},'New Chat')">&#128465;</button></div>`;
  item.addEventListener('click', () => { document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active')); item.classList.add('active'); window.conversationHistory = []; clearChatArea(); });
  document.getElementById('chatList').prepend(item);
  document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
  item.classList.add('active');
  window.conversationHistory = [];
  clearChatArea();
});
document.querySelectorAll('.chat-item').forEach(item => item.addEventListener('click', () => { document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active')); item.classList.add('active'); }));

// === PRO UPSELL ===
document.getElementById('closeProUpsell').addEventListener('click', () => closeModal('proUpsellOverlay'));
document.getElementById('upsellUpgradeBtn').addEventListener('click', () => { closeModal('proUpsellOverlay'); openModal('upgradeOverlay'); });

// === UPGRADE BANNER ===
document.getElementById('closeBanner').addEventListener('click', () => document.getElementById('upgradeBanner').classList.add('hidden'));

// === UPLOAD POPUP ===
const uploadPopup = document.getElementById('uploadPopup');
document.getElementById('uploadBtn').addEventListener('click', e => { e.stopPropagation(); uploadPopup.classList.toggle('open'); });
document.getElementById('closeUploadPopup').addEventListener('click', () => uploadPopup.classList.remove('open'));
document.addEventListener('click', e => { if (!uploadPopup.contains(e.target) && e.target.id !== 'uploadBtn') uploadPopup.classList.remove('open'); });
document.getElementById('fileInput').addEventListener('change', function() {
  const container = document.getElementById('uploadedFiles');
  Array.from(this.files).forEach(f => { const d = document.createElement('div'); d.className = 'uploaded-file-item'; d.textContent = '📄 ' + f.name; container.appendChild(d); });
});

// === TEXTAREA AUTO-RESIZE ===
const chatInput = document.getElementById('chatInput');
chatInput.addEventListener('input', function() { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 180) + 'px'; });
chatInput.addEventListener('keydown', function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); document.getElementById('sendBtn').click(); } });

// ============================================================
// === NVIDIA API STREAMING CHAT ===
// ============================================================

window.conversationHistory = [];
window.currentModel = 'qwen/qwen3.5-397b-a17b';
window.isStreaming = false;

// The API key is read from the settings panel input
function getApiKey() {
  return (document.getElementById('apiKeyInput') && document.getElementById('apiKeyInput').value.trim()) || '';
}

function getSettings() {
  return {
    max_tokens: parseInt(document.getElementById('maxTokensSlider').value) || 16384,
    temperature: parseFloat(document.getElementById('tempSlider').value) || 0.70,
    top_p: parseFloat(document.getElementById('topPSlider').value) || 0.80,
    top_k: parseInt(document.getElementById('topKSlider').value) || 20,
    presence_penalty: parseFloat(document.getElementById('presSlider').value) || 0,
    repetition_penalty: 1 + parseFloat(document.getElementById('freqSlider').value) || 1,
    system_prompt: document.getElementById('systemPromptInput').value.trim()
  };
}

function clearChatArea() {
  const area = document.getElementById('chatArea');
  if (area) area.innerHTML = '';
  // Show hero again
  const hero = document.getElementById('heroSection');
  if (hero) hero.style.display = 'flex';
  const chatAreaWrap = document.getElementById('chatAreaWrap');
  if (chatAreaWrap) chatAreaWrap.style.display = 'none';
}

function showChatArea() {
  const hero = document.getElementById('heroSection');
  if (hero) hero.style.display = 'none';
  const chatAreaWrap = document.getElementById('chatAreaWrap');
  if (chatAreaWrap) chatAreaWrap.style.display = 'flex';
}

function appendMessage(role, content) {
  showChatArea();
  const area = document.getElementById('chatArea');
  const msg = document.createElement('div');
  msg.className = 'chat-message ' + role;
  if (role === 'user') {
    msg.innerHTML = `<div class="msg-bubble user-bubble">${escapeHtml(content)}</div>`;
  } else {
    msg.innerHTML = `<div class="msg-bubble assistant-bubble"><span class="msg-content"></span></div>`;
  }
  area.appendChild(msg);
  area.scrollTop = area.scrollHeight;
  return msg;
}

function escapeHtml(text) {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;').replace(/\n/g,'<br>');
}

function formatMarkdown(text) {
  // Basic markdown: code blocks, bold, italic, inline code
  return text
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

async function sendToNvidia(userMessage) {
  const apiKey = getApiKey();
  if (!apiKey) {
    showError('Please enter your NVIDIA API key in Settings → API Key.');
    return;
  }

  if (window.isStreaming) return;
  window.isStreaming = true;

  const settings = getSettings();

  // Build messages array
  const messages = [];
  if (settings.system_prompt) {
    messages.push({ role: 'system', content: settings.system_prompt });
  }
  window.conversationHistory.forEach(m => messages.push(m));
  messages.push({ role: 'user', content: userMessage });
  window.conversationHistory.push({ role: 'user', content: userMessage });

  // Show user message
  appendMessage('user', userMessage);

  // Show assistant bubble
  const assistantMsg = appendMessage('assistant', '');
  const contentEl = assistantMsg.querySelector('.msg-content');
  const sendBtn = document.getElementById('sendBtn');
  sendBtn.disabled = true;
  sendBtn.innerHTML = `<svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`;

  // Stop button logic
  let abortController = new AbortController();
  sendBtn.onclick = () => { abortController.abort(); };

  let fullText = '';

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        model: window.currentModel,
        messages: messages,
        max_tokens: settings.max_tokens,
        temperature: settings.temperature,
        top_p: settings.top_p,
        top_k: settings.top_k,
        presence_penalty: settings.presence_penalty,
        repetition_penalty: settings.repetition_penalty,
        stream: true,
        chat_template_kwargs: { enable_thinking: false }
      }),
      signal: abortController.signal
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content || '';
            if (delta) {
              fullText += delta;
              contentEl.innerHTML = formatMarkdown(fullText);
              document.getElementById('chatArea').scrollTop = document.getElementById('chatArea').scrollHeight;
            }
          } catch (_) {}
        }
      }
    }

    window.conversationHistory.push({ role: 'assistant', content: fullText });

  } catch (err) {
    if (err.name === 'AbortError') {
      contentEl.innerHTML += '<span class="stopped-label"> [stopped]</span>';
    } else {
      contentEl.innerHTML = `<span class="error-msg">Error: ${escapeHtml(err.message)}</span>`;
      window.conversationHistory.pop();
    }
  } finally {
    window.isStreaming = false;
    sendBtn.disabled = false;
    sendBtn.innerHTML = `<svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`;
    sendBtn.onclick = () => document.getElementById('sendBtn').dispatchEvent(new Event('click'));
    // Re-bind send
    bindSend();
  }
}

function showError(msg) {
  showChatArea();
  const area = document.getElementById('chatArea');
  const d = document.createElement('div');
  d.className = 'chat-message assistant';
  d.innerHTML = `<div class="msg-bubble assistant-bubble"><span class="error-msg">${escapeHtml(msg)}</span></div>`;
  area.appendChild(d);
}

function bindSend() {
  const sendBtn = document.getElementById('sendBtn');
  sendBtn.onclick = () => {
    const val = chatInput.value.trim();
    if (!val || window.isStreaming) return;
    chatInput.value = ''; chatInput.style.height = 'auto';
    sendToNvidia(val);
  };
}
bindSend();

chatInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const val = chatInput.value.trim();
    if (!val || window.isStreaming) return;
    chatInput.value = ''; chatInput.style.height = 'auto';
    sendToNvidia(val);
  }
});
