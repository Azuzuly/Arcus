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
  [['tempSlider','0.7'],['maxTokensSlider','2048'],['topPSlider','0.9'],['topKSlider','0'],['freqSlider','0'],['presSlider','0']]
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
    if (item) { const nodes = item.childNodes; nodes.forEach(n => { if (n.nodeType === 3 && n.textContent.trim()) n.textContent = ' ' + newName + ' '; }); }
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
  item.addEventListener('click', () => { document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active')); item.classList.add('active'); });
  document.getElementById('chatList').prepend(item);
  document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
  item.classList.add('active');
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

// === SEND ===
document.getElementById('sendBtn').addEventListener('click', () => {
  const val = chatInput.value.trim();
  if (!val) return;
  chatInput.value = ''; chatInput.style.height = 'auto';
  console.log('Message sent:', val);
});
