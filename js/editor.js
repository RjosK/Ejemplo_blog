/**
 * editor.js - Controlador de la Vista tipo Google Docs
 * Permite redactar, dar formato, subir imágenes, crear gráficas científicas,
 * reordenarlas en el texto y publicar directamente en Artículos o Bitácora.
 */

let activeCharts = {};

document.addEventListener('DOMContentLoaded', () => {
  initEditor();
  checkUrlParamsForEdit();
  updateStats();
});

function initEditor() {
  const sheet = document.getElementById('docsPaperSheet');
  const titleInput = document.getElementById('docTitleInput');

  if (sheet) {
    sheet.addEventListener('input', () => {
      updateStats();
      autoSaveDraft();
    });
  }

  if (titleInput) {
    titleInput.addEventListener('input', autoSaveDraft);
  }

  // Botón guardar borrador
  const draftBtn = document.getElementById('docDraftBtn');
  if (draftBtn) {
    draftBtn.addEventListener('click', () => {
      saveDraftManual();
    });
  }

  // Botón publicar en blog
  const publishBtn = document.getElementById('docPublishBtn');
  if (publishBtn) {
    publishBtn.addEventListener('click', () => {
      publishDocument();
    });
  }

  // Cargar borrador si no viene con parámetros de edición
  const urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.get('editArticle') && !urlParams.get('editNote')) {
    loadDraft();
  }
}

// Ejecutar comandos de texto enriquecido
window.execCmd = function(command, value = null) {
  document.execCommand(command, false, value);
  const sheet = document.getElementById('docsPaperSheet');
  if (sheet) sheet.focus();
  updateStats();
};

window.applyHeading = function(tag) {
  if (tag === 'p') {
    document.execCommand('formatBlock', false, '<p>');
  } else if (tag === 'blockquote') {
    document.execCommand('formatBlock', false, '<blockquote>');
  } else {
    document.execCommand('formatBlock', false, `<${tag}>`);
  }
};

window.applyPaperHighlight = function() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    alert('Por favor selecciona primero el texto que deseas resaltar.');
    return;
  }
  const range = selection.getRangeAt(0);
  const mark = document.createElement('span');
  mark.className = 'paper-mark';
  mark.appendChild(range.extractContents());
  range.insertNode(mark);
  selection.removeAllRanges();
};

// Modales genéricos
window.openModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
};

window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
};

// --- INSERCIÓN DE IMÁGENES (LOCAL O URL) ---
window.openInsertImageModal = function() {
  window.openModal('insertImageModal');
};

window.confirmInsertImage = function() {
  const fileInput = document.getElementById('localImageFileInput');
  const urlInput = document.getElementById('webImageUrlInput');
  const captionInput = document.getElementById('imageCaptionInput');

  const caption = captionInput ? captionInput.value.trim() : '';

  // Si el usuario seleccionó un archivo local
  if (fileInput && fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      insertImageBlock(e.target.result, caption);
      fileInput.value = '';
      if (urlInput) urlInput.value = '';
      if (captionInput) captionInput.value = '';
      window.closeModal('insertImageModal');
    };
    reader.readAsDataURL(file);
    return;
  }

  // Si ingresó una URL web
  const webUrl = urlInput ? urlInput.value.trim() : '';
  if (webUrl) {
    insertImageBlock(webUrl, caption);
    urlInput.value = '';
    if (captionInput) captionInput.value = '';
    window.closeModal('insertImageModal');
  } else {
    alert('Por favor selecciona una imagen local o pega un enlace URL.');
  }
};

function insertImageBlock(src, caption) {
  const sheet = document.getElementById('docsPaperSheet');
  if (!sheet) return;

  const blockId = 'img_' + Date.now();
  const block = document.createElement('div');
  block.className = 'doc-image-block';
  block.id = blockId;
  block.contentEditable = "false";
  block.innerHTML = `
    <div style="position: relative; display: inline-block; max-width: 100%;">
      <img src="${src}" alt="Figura científica" style="max-height: 400px; display: block; margin: 0 auto;">
      <div style="position: absolute; top: 8px; right: 8px; display: flex; gap: 4px;">
        <button type="button" class="btn btn-tertiary btn-sm" onclick="moveBlockUp('${blockId}')" title="Subir" style="background: rgba(255,255,255,0.9); padding: 2px 6px;">⬆</button>
        <button type="button" class="btn btn-tertiary btn-sm" onclick="moveBlockDown('${blockId}')" title="Bajar" style="background: rgba(255,255,255,0.9); padding: 2px 6px;">⬇</button>
        <button type="button" class="btn btn-tertiary btn-sm" onclick="removeBlock('${blockId}')" title="Eliminar" style="background: rgba(255,255,255,0.9); padding: 2px 6px; color: red;">🗑</button>
      </div>
    </div>
    ${caption ? `<div class="doc-image-caption" contenteditable="true">${caption}</div>` : ''}
  `;

  sheet.appendChild(block);
  // Agregar párrafo nuevo para continuar escribiendo
  const p = document.createElement('p');
  p.innerHTML = '<br>';
  sheet.appendChild(p);
  updateStats();
}

// --- INSERCIÓN Y REORDENAMIENTO DE GRÁFICAS CIENTÍFICAS ---
window.openInsertChartModal = function() {
  window.openModal('insertChartModal');
};

window.confirmInsertChart = function() {
  const title = document.getElementById('chartTitleInput').value.trim() || 'Gráfica Científica';
  const type = document.getElementById('chartTypeSelect').value || 'bar';
  const unit = document.getElementById('chartUnitInput').value.trim() || 'Valores';
  const rawLabels = document.getElementById('chartLabelsInput').value.trim();
  const rawValues = document.getElementById('chartValuesInput').value.trim();

  const labels = rawLabels ? rawLabels.split(',').map(s => s.trim()) : ['Etiqueta A', 'Etiqueta B', 'Etiqueta C'];
  const values = rawValues ? rawValues.split(',').map(s => parseFloat(s.trim()) || 0) : [10, 20, 30];

  insertChartBlock({ title, type, unit, labels, values });
  window.closeModal('insertChartModal');
};

function insertChartBlock(chartData) {
  const sheet = document.getElementById('docsPaperSheet');
  if (!sheet) return;

  const chartId = 'chart_' + Date.now();
  const canvasId = 'canvas_' + chartId;

  const block = document.createElement('div');
  block.className = 'doc-chart-block';
  block.id = chartId;
  block.contentEditable = "false";
  block.dataset.chartConfig = JSON.stringify(chartData);

  block.innerHTML = `
    <div class="doc-block-header">
      <div>
        <strong style="font-family: var(--font-serif); font-size: 1.05rem;">${chartData.title}</strong>
        <span style="font-size: 0.78rem; color: var(--text-muted); margin-left: 6px;">(${chartData.unit})</span>
      </div>
      <div class="doc-block-controls">
        <button type="button" class="btn btn-tertiary btn-sm" onclick="moveBlockUp('${chartId}')" title="Subir posición en el documento" style="padding: 2px 7px;">
          ⬆ Subir
        </button>
        <button type="button" class="btn btn-tertiary btn-sm" onclick="moveBlockDown('${chartId}')" title="Bajar posición en el documento" style="padding: 2px 7px;">
          ⬇ Bajar
        </button>
        <button type="button" class="btn btn-tertiary btn-sm" onclick="removeBlock('${chartId}')" title="Eliminar gráfica" style="padding: 2px 7px; color: #DC2626;">
          🗑
        </button>
      </div>
    </div>
    <div style="height: 280px; position: relative;">
      <canvas id="${canvasId}"></canvas>
    </div>
  `;

  sheet.appendChild(block);

  // Instanciar Chart.js
  setTimeout(() => {
    const ctx = document.getElementById(canvasId);
    if (ctx && typeof Chart !== 'undefined') {
      const colors = [
        'rgba(29, 78, 216, 0.75)',
        'rgba(124, 94, 74, 0.75)',
        'rgba(61, 104, 83, 0.75)',
        'rgba(217, 119, 6, 0.75)',
        'rgba(100, 116, 139, 0.75)'
      ];

      const instance = new Chart(ctx, {
        type: chartData.type,
        data: {
          labels: chartData.labels,
          datasets: [{
            label: chartData.title,
            data: chartData.values,
            backgroundColor: colors.slice(0, chartData.labels.length),
            borderColor: '#1F2328',
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: chartData.type === 'doughnut' }
          }
        }
      });
      activeCharts[canvasId] = instance;
    }
  }, 100);

  // Agregar párrafo debajo
  const p = document.createElement('p');
  p.innerHTML = '<br>';
  sheet.appendChild(p);
  updateStats();
}

// Reordenar bloques en el documento: Subir y Bajar
window.moveBlockUp = function(blockId) {
  const block = document.getElementById(blockId);
  if (!block) return;
  const prev = block.previousElementSibling;
  if (prev) {
    block.parentNode.insertBefore(block, prev);
    updateStats();
  }
};

window.moveBlockDown = function(blockId) {
  const block = document.getElementById(blockId);
  if (!block) return;
  const next = block.nextElementSibling;
  if (next) {
    block.parentNode.insertBefore(next, block);
    updateStats();
  }
};

window.removeBlock = function(blockId) {
  const block = document.getElementById(blockId);
  if (block && confirm('¿Deseas eliminar este bloque del documento?')) {
    block.remove();
    updateStats();
  }
};

// --- INSERCIÓN DE REFERENCIA CIENTÍFICA ---
window.openInsertReferenceModal = function() {
  window.openModal('insertRefModal');
};

window.confirmInsertReference = function() {
  const citation = document.getElementById('refCitationInput').value.trim();
  const link = document.getElementById('refLinkInput').value.trim();

  if (!citation) {
    alert('Por favor escribe la cita o referencia bibliográfica.');
    return;
  }

  const sheet = document.getElementById('docsPaperSheet');
  if (!sheet) return;

  const refBlock = document.createElement('div');
  refBlock.className = 'note-references';
  refBlock.contentEditable = "false";
  refBlock.innerHTML = `
    <div class="note-references-title">Referencia Bibliográfica</div>
    <div>${citation}</div>
    ${link ? `<div><a href="${link}" target="_blank" rel="noopener noreferrer">↗ ${link}</a></div>` : ''}
  `;

  sheet.appendChild(refBlock);
  const p = document.createElement('p');
  p.innerHTML = '<br>';
  sheet.appendChild(p);

  window.closeModal('insertRefModal');
  updateStats();
};

// --- ESTADÍSTICAS DEL DOCUMENTO ---
function updateStats() {
  const sheet = document.getElementById('docsPaperSheet');
  if (!sheet) return;

  const text = sheet.innerText || '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(words / 200));

  const wordEl = document.getElementById('wordCountDisplay');
  const readEl = document.getElementById('readTimeDisplay');

  if (wordEl) wordEl.textContent = `${words} palabra${words === 1 ? '' : 's'}`;
  if (readEl) readEl.textContent = `${readTime} min de lectura`;
}

// --- GUARDADO DE BORRADOR ---
function autoSaveDraft() {
  const title = document.getElementById('docTitleInput').value;
  const content = document.getElementById('docsPaperSheet').innerHTML;
  const target = document.getElementById('publishTargetSelect').value;

  localStorage.setItem('cesar_doc_draft', JSON.stringify({
    title,
    content,
    target,
    savedAt: new Date().toLocaleTimeString()
  }));

  const indicator = document.getElementById('saveStatusIndicator');
  if (indicator) {
    indicator.textContent = '● Borrador sincronizado';
    indicator.style.color = '#22C55E';
    setTimeout(() => {
      indicator.style.color = '#64748B';
    }, 2000);
  }
}

function saveDraftManual() {
  autoSaveDraft();
  showToast('Borrador guardado correctamente.');
}

function loadDraft() {
  const draftRaw = localStorage.getItem('cesar_doc_draft');
  if (!draftRaw) return;
  try {
    const draft = JSON.parse(draftRaw);
    if (draft.title) document.getElementById('docTitleInput').value = draft.title;
    if (draft.content) document.getElementById('docsPaperSheet').innerHTML = draft.content;
    if (draft.target) document.getElementById('publishTargetSelect').value = draft.target;
  } catch (e) {
    console.error('Error cargando borrador:', e);
  }
}

window.clearDocumentContent = function() {
  if (confirm('¿Vaciar la hoja de trabajo?')) {
    document.getElementById('docsPaperSheet').innerHTML = '<p><br></p>';
    updateStats();
  }
};

// --- PUBLICACIÓN EN EL BLOG ---
function publishDocument() {
  const title = document.getElementById('docTitleInput').value.trim();
  const content = document.getElementById('docsPaperSheet').innerHTML;
  const target = document.getElementById('publishTargetSelect').value;

  if (!title) {
    alert('Por favor escribe un título para la publicación.');
    document.getElementById('docTitleInput').focus();
    return;
  }

  // Generar fecha en español
  const now = new Date();
  const day = now.getDate();
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const dateStr = `${day} ${months[now.getMonth()]} ${now.getFullYear()}`;

  // Extraer excerpt plano
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  const textContent = tempDiv.innerText.replace(/\s+/g, ' ').trim();
  const excerpt = textContent.length > 220 ? textContent.substring(0, 220) + '...' : textContent;

  // Extraer primera imagen si existe
  const firstImg = tempDiv.querySelector('img');
  const imageUrl = firstImg ? firstImg.src : '';

  if (target === 'article') {
    // Guardar como Artículo Científico
    const newArticle = {
      id: 'art-' + Date.now(),
      title: title,
      slug: 'articles.html',
      journal: 'Blog Científico & Cuaderno de Investigación',
      year: now.getFullYear().toString(),
      doi: 'Local-Draft/' + Date.now(),
      badge: 'Publicación César Ruiz-Camou',
      badgeType: 'tag-sage',
      authors: 'César Ruiz-Camou',
      excerpt: excerpt || 'Publicación técnica y científica sobre sostenibilidad y ciclo de vida.',
      content: content,
      kpis: { baseline: 'ACV', optimized: 'Sostenible', reduction: 'Publicado' }
    };

    window.blogStore.saveArticle(newArticle);
    showToast('¡Artículo científico publicado exitosamente!');
    setTimeout(() => {
      window.location.href = 'articles.html';
    }, 1200);

  } else {
    // Guardar como Nota de Bitácora
    const newNote = {
      id: 'note-' + Date.now(),
      title: title,
      date: dateStr,
      category: 'Investigación & Campo',
      tags: ['Sostenibilidad', 'LCA', 'César Ruiz-Camou'],
      content: content,
      imageUrl: imageUrl,
      imageCaption: '',
      references: []
    };

    window.blogStore.saveNote(newNote);
    showToast('¡Nota publicada exitosamente en la Bitácora!');
    setTimeout(() => {
      window.location.href = 'notes.html';
    }, 1200);
  }
}

// Cargar para edición si viene con ?editArticle=ID o ?editNote=ID
function checkUrlParamsForEdit() {
  const urlParams = new URLSearchParams(window.location.search);
  const editArticleId = urlParams.get('editArticle');
  const editNoteId = urlParams.get('editNote');

  if (editArticleId) {
    const art = window.blogStore.getArticleById(editArticleId);
    if (art) {
      document.getElementById('docTitleInput').value = art.title;
      document.getElementById('publishTargetSelect').value = 'article';
      document.getElementById('docsPaperSheet').innerHTML = art.content || art.excerpt;
      showToast(`Editando artículo: "${art.title.substring(0, 30)}..."`);
    }
  } else if (editNoteId) {
    const note = window.blogStore.getNoteById(editNoteId);
    if (note) {
      document.getElementById('docTitleInput').value = note.title;
      document.getElementById('publishTargetSelect').value = 'note';
      document.getElementById('docsPaperSheet').innerHTML = note.content;
      showToast(`Editando nota: "${note.title.substring(0, 30)}..."`);
    }
  }
}
