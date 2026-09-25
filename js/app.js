/**
 * app.js - Interfaz general, Renderizado reactivo de Notas y Artículos,
 * Citas académicas y utilidades
 */

document.addEventListener('DOMContentLoaded', () => {
  renderNotesList();
  renderArticlesList();

  // Escuchar eventos reactivos de actualización del store
  window.addEventListener('blog:notes-updated', () => {
    renderNotesList(currentTagFilter, currentSearchTerm);
  });

  window.addEventListener('blog:articles-updated', () => {
    renderArticlesList();
  });

  // Buscador de notas
  const searchInput = document.getElementById('notesSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value;
      renderNotesList(currentTagFilter, currentSearchTerm);
    });
  }

  // Filtros por etiquetas
  document.querySelectorAll('.tag-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tag-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTagFilter = btn.dataset.tag;
      renderNotesList(currentTagFilter, currentSearchTerm);
    });
  });

  // Modal para agregar nota rápida
  const openModalBtn = document.getElementById('openAddNoteBtn');
  const modalOverlay = document.getElementById('addNoteModal');
  const closeModalBtn = document.getElementById('closeAddNoteBtn');
  const cancelModalBtn = document.getElementById('cancelAddNoteBtn');
  const noteForm = document.getElementById('newNoteForm');

  if (openModalBtn && modalOverlay) {
    openModalBtn.addEventListener('click', () => {
      modalOverlay.classList.add('active');
    });
  }

  function closeModal() {
    if (modalOverlay) modalOverlay.classList.remove('active');
  }

  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // Envío del formulario rápido
  if (noteForm) {
    noteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const title = document.getElementById('noteTitleInput').value.trim();
      const category = document.getElementById('noteCategoryInput').value.trim();
      const content = document.getElementById('noteContentInput').value.trim();
      const tagsRaw = document.getElementById('noteTagsInput').value.trim();
      const imageUrl = document.getElementById('noteImageInput').value.trim();
      const imageCaption = document.getElementById('noteCaptionInput').value.trim();
      const refText = document.getElementById('noteRefTextInput').value.trim();
      const refUrl = document.getElementById('noteRefUrlInput').value.trim();

      if (!title || !content) {
        alert('Por favor completa al menos el título y contenido de la nota.');
        return;
      }

      const tags = tagsRaw 
        ? tagsRaw.split(',').map(t => t.trim()).filter(t => t.length > 0)
        : ['Notas Personales'];

      const references = [];
      if (refText) {
        references.push({ text: refText, url: refUrl || '#' });
      }

      const now = new Date();
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

      const newNote = {
        id: 'note-' + Date.now(),
        title,
        date: dateStr,
        category: category || 'Investigación & Notas',
        tags,
        content: `<p>${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`,
        imageUrl,
        imageCaption,
        references
      };

      window.blogStore.saveNote(newNote);
      noteForm.reset();
      closeModal();
      showToast('¡Nota guardada exitosamente en la bitácora!');
    });
  }

  // Botón exportar respaldo
  const exportBtn = document.getElementById('exportNotesBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const backup = window.blogStore.exportBackup();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `respaldo_blog_cesar_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Respaldo exportado en archivo JSON');
    });
  }

  // Botón restaurar
  const resetAllBtn = document.getElementById('resetAllNotesBtn');
  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', () => {
      if (confirm('¿Restablecer el blog a sus datos científicos originales?')) {
        window.blogStore.resetDefaults();
      }
    });
  }
});

let currentTagFilter = 'all';
let currentSearchTerm = '';

// Renderizado de lista de notas
function renderNotesList(filterTag = 'all', searchTerm = '') {
  const container = document.getElementById('notesContainer');
  if (!container) return;

  const auth = window.blogStore.getAuth();
  const isPrivileged = auth.role === 'author' || auth.role === 'developer';
  const notes = window.blogStore.getNotes();

  const filtered = notes.filter(n => {
    const matchesTag = (filterTag === 'all') || 
      n.tags.some(t => t.toLowerCase() === filterTag.toLowerCase()) ||
      n.category.toLowerCase().includes(filterTag.toLowerCase());

    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term ||
      n.title.toLowerCase().includes(term) ||
      n.content.toLowerCase().includes(term) ||
      n.category.toLowerCase().includes(term) ||
      n.tags.some(t => t.toLowerCase().includes(term));

    return matchesTag && matchesSearch;
  });

  const countBadge = document.getElementById('notesCountDisplay');
  if (countBadge) {
    countBadge.textContent = `${filtered.length} nota${filtered.length === 1 ? '' : 's'}`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="background: #FFFFFF; border: 1px dashed var(--border-medium); border-radius: var(--radius-md); padding: 3rem; text-align: center;">
        <h3 style="margin-bottom: 0.5rem; color: var(--text-muted); font-family: var(--font-serif);">No se encontraron notas</h3>
        <p style="color: var(--text-faint); margin-bottom: 1.5rem;">Intenta con otro término de búsqueda o categoría.</p>
        <button class="btn btn-secondary btn-sm" onclick="resetNoteFilters()">Restablecer filtros</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(note => {
    const tagsHtml = note.tags.map(t => `<span class="tag tag-sage">${escapeHtml(t)}</span>`).join(' ');
    
    let imgHtml = '';
    if (note.imageUrl && note.imageUrl.trim() !== '') {
      imgHtml = `
        <div class="note-image-preview">
          <img src="${escapeHtml(note.imageUrl)}" alt="${escapeHtml(note.title)}" loading="lazy" onerror="this.parentElement.style.display='none'">
          ${note.imageCaption ? `<div class="note-caption">${escapeHtml(note.imageCaption)}</div>` : ''}
        </div>
      `;
    }

    let refsHtml = '';
    if (note.references && note.references.length > 0) {
      const refItems = note.references.map(r => `
        <li>
          <a href="${escapeHtml(r.url || '#')}" target="_blank" rel="noopener noreferrer">
            ↗ ${escapeHtml(r.text)}
          </a>
        </li>
      `).join('');
      refsHtml = `
        <div class="note-references">
          <div class="note-references-title">Referencias & Vínculos Científicos</div>
          <ul>${refItems}</ul>
        </div>
      `;
    }

    // Botones de edición exclusivos para César o Desarrollador
    const editActionsHtml = isPrivileged ? `
      <div style="display: flex; gap: 0.4rem; align-items: center;">
        <a href="editor.html?editNote=${note.id}" class="btn btn-tertiary btn-sm auth-edit-btn" title="Editar en vista tipo Google Docs" style="padding: 2px 7px; font-size: 0.75rem; color: #1D4ED8; border-color: #93C5FD;">
          ✏ Editar (Docs)
        </a>
        <button class="btn btn-tertiary btn-sm auth-edit-btn" onclick="deleteNote('${note.id}')" title="Eliminar nota" style="padding: 2px 7px; font-size: 0.75rem; color: #DC2626; border-color: #FCA5A5;">
          ✕ Eliminar
        </button>
      </div>
    ` : '';

    return `
      <article class="note-entry-card" id="${note.id}">
        <div class="note-entry-meta">
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <span class="note-date">${escapeHtml(note.date)}</span>
            <span style="color: var(--border-medium);">•</span>
            <span class="tag tag-terracotta">${escapeHtml(note.category)}</span>
          </div>
          ${editActionsHtml}
        </div>

        <h3 class="note-title">${escapeHtml(note.title)}</h3>

        <div class="note-body">
          ${note.content}
        </div>

        ${imgHtml}
        ${refsHtml}

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px dashed var(--border-subtle);">
          <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
            ${tagsHtml}
          </div>
          <button class="btn btn-tertiary btn-sm" onclick="copyNoteLink('${note.id}')" style="font-size: 0.78rem;">
            🔗 Enlace directo
          </button>
        </div>
      </article>
    `;
  }).join('');
}

// Renderizado de artículos dinámicos en articles.html o index.html
function renderArticlesList() {
  const dynamicContainer = document.getElementById('dynamicArticlesContainer');
  if (!dynamicContainer) return;

  const auth = window.blogStore.getAuth();
  const isPrivileged = auth.role === 'author' || auth.role === 'developer';
  const articles = window.blogStore.getArticles();

  dynamicContainer.innerHTML = articles.map(art => {
    const editActionsHtml = isPrivileged ? `
      <div style="display: flex; gap: 0.4rem; align-items: center;">
        <a href="editor.html?editArticle=${art.id}" class="btn btn-tertiary btn-sm auth-edit-btn" style="color: #1D4ED8; border-color: #93C5FD; font-size: 0.75rem; padding: 2px 7px;">
          ✏ Editar en Docs
        </a>
      </div>
    ` : '';

    return `
      <article class="note-entry-card" style="margin-bottom: 2.5rem; padding: 2.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <span class="tag ${art.badgeType || 'tag-sage'}">${art.badge || 'Artículo Científico'}</span>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-family: var(--font-mono); font-size: 0.82rem; color: var(--earth-bark);">${art.journal} • ${art.year}</span>
            ${editActionsHtml}
          </div>
        </div>

        <h2 style="font-family: var(--font-serif); font-size: 1.65rem; line-height: 1.3; margin-bottom: 0.75rem;">
          <a href="${art.slug}" style="color: var(--text-primary); text-decoration: none;">
            ${art.title}
          </a>
        </h2>

        <div style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1.25rem;">
          <strong>Autores:</strong> ${art.authors}<br>
          <strong>Identificador / DOI:</strong> ${art.doi}
        </div>

        <div class="note-body">
          <p>${art.excerpt}</p>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1.25rem; border-top: 1px solid var(--border-subtle); flex-wrap: wrap; gap: 0.75rem;">
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-tertiary btn-sm" onclick="copyBibtexCitation('${art.id}')">
              Copiar BibTeX
            </button>
            <button class="btn btn-tertiary btn-sm" onclick="copyApaCitation('${art.id}')">
              Copiar APA
            </button>
          </div>

          <a href="${art.slug}" class="btn btn-blue btn-sm">
            Ver Estudio Completo →
          </a>
        </div>
      </article>
    `;
  }).join('');
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.deleteNote = function(id) {
  if (!confirm('¿Deseas eliminar esta entrada de la bitácora?')) return;
  window.blogStore.deleteNote(id);
  showToast('Entrada eliminada.');
};

window.copyNoteLink = function(id) {
  const url = `${window.location.origin}${window.location.pathname}#${id}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast('Enlace de la nota copiado al portapapeles');
  }).catch(() => {
    showToast('Nota ID: ' + id);
  });
};

window.resetNoteFilters = function() {
  currentTagFilter = 'all';
  currentSearchTerm = '';
  const searchInput = document.getElementById('notesSearchInput');
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.tag-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tag === 'all');
  });
  renderNotesList('all', '');
};

function showToast(message) {
  let toast = document.getElementById('toastNotice');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotice';
    toast.className = 'toast-msg';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>✔</span> <span>${escapeHtml(message)}</span>`;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

// Citas BibTeX y APA universales
window.copyBibtexCitation = function(typeOrId) {
  const art = window.blogStore.getArticleById(typeOrId);
  let bibtex = '';
  if (art) {
    bibtex = `@article{${art.id},
  title={${art.title}},
  author={${art.authors}},
  journal={${art.journal}},
  year={${art.year}},
  doi={${art.doi}}
}`;
  } else if (typeOrId === 'mezcal' || typeOrId === 'art-mezcal-lca') {
    bibtex = `@article{ruizcamou2023evaluating,
  title={Evaluating the environmental performance of mezcal production in Michoac\\'an, M\\'exico: A life cycle assessment approach},
  author={Ruiz-Camou, C\\'esar and N\\'u\\~nez, Jos\\'e and Musule, Ricardo},
  journal={The International Journal of Life Cycle Assessment},
  year={2023},
  publisher={Springer},
  doi={10.1007/s11367-023-02220-4}
}`;
  } else if (typeOrId === 'indium' || typeOrId === 'art-indium-recycling') {
    bibtex = `@thesis{ruizcamou2020indio,
  title={Reciclaje de indio mediante lixiviaci\\'on \\'acida a partir de LCD de RAEE},
  author={Ruiz Camou, C\\'esar Rodrigo},
  school={Escuela Nacional de Estudios Superiores Unidad Morelia, Universidad Nacional Aut\\'onoma de M\\'exico (UNAM)},
  year={2020},
  type={Tesis de Licenciatura en Ciencia de Materiales Sustentables}
}`;
  } else {
    bibtex = `@incollection{nunez2023temas,
  title={Temas Selectos en Ciencia de Materiales y Nanotecnolog\\'ia},
  author={N\\'u\\~nez Gonz\\'alez, Jos\\'e and Ruiz Camou, C\\'esar Rodrigo and De la Torre Medina, Joaqu\\'in},
  booktitle={Investigaciones en Materiales Avanzados y Sustentabilidad},
  publisher={Universidad Nacional Aut\\'onoma de M\\'exico (UNAM)},
  year={2023}
}`;
  }

  navigator.clipboard.writeText(bibtex).then(() => {
    showToast('Cita BibTeX copiada al portapapeles');
  });
};

window.copyApaCitation = function(typeOrId) {
  const art = window.blogStore.getArticleById(typeOrId);
  let apa = '';
  if (art) {
    apa = `${art.authors} (${art.year}). ${art.title}. ${art.journal}. ${art.doi}`;
  } else if (typeOrId === 'mezcal' || typeOrId === 'art-mezcal-lca') {
    apa = 'Ruiz-Camou, C., Núñez, J., & Musule, R. (2023). Evaluating the environmental performance of mezcal production in Michoacán, México: A life cycle assessment approach. The International Journal of Life Cycle Assessment, Springer. https://doi.org/10.1007/s11367-023-02220-4';
  } else if (typeOrId === 'indium' || typeOrId === 'art-indium-recycling') {
    apa = 'Ruiz Camou, C. R. (2020). Reciclaje de indio mediante lixiviación ácida a partir de LCD de RAEE [Tesis de Licenciatura, Universidad Nacional Autónoma de México (UNAM)]. Repositorio TESIUNAM.';
  } else {
    apa = 'Núñez González, J., Ruiz Camou, C. R., & De la Torre Medina, J. (2023). Temas Selectos en Ciencia de Materiales y Nanotecnología. Universidad Nacional Autónoma de México (UNAM).';
  }

  navigator.clipboard.writeText(apa).then(() => {
    showToast('Cita APA copiada al portapapeles');
  });
};
