/**
 * store.js - Repositorio de Datos Unificado y Persistente
 * Maneja Artículos, Notas de Bitácora, Estado de Sesión y Configuración de Google OAuth
 */

const STORAGE_KEYS = {
  ARTICLES: 'cesar_blog_articles_v2',
  NOTES: 'cesar_blog_notes_v2',
  AUTH: 'cesar_blog_auth_v2',
  CONFIG: 'cesar_blog_config_v2'
};

// Artículos científicos iniciales
const initialArticles = [
  {
    id: 'art-mezcal-lca',
    title: 'Evaluating the environmental performance of mezcal production in Michoacán, México: A life cycle assessment approach',
    slug: 'article-mezcal.html',
    journal: 'The International Journal of Life Cycle Assessment (Springer)',
    year: '2023',
    doi: '10.1007/s11367-023-02220-4',
    badge: 'Artículo Arbitrado JCR',
    badgeType: 'tag-sage',
    authors: 'César Ruiz-Camou, José Núñez, Ricardo Musule',
    excerpt: 'Evaluación integral de impactos ambientales (cambio climático, eutrofización y consumo de agua) en la producción artesanal con Agave cupreata. Modela alternativas para aprovechar vinazas y bagazo reduciendo hasta un 55% de la huella de carbono.',
    content: `
      <h2>1. Introducción y Contexto Socioambiental</h2>
      <p>El mezcal tradicional de Michoacán es un destilado con profunda identidad biocultural, elaborado a partir del maguey papalote o chino (<em>Agave cupreata</em>). A diferencia del tequila industrializado, las vinatas operan en escalas artesanales con consumo intensivo de leña y vertido de vinazas sin tratamiento.</p>
      <h2>2. Límites del Sistema y Resultados</h2>
      <p>Se cuantificó la unidad funcional de 1 litro de mezcal al 48% alc. vol. La sustitución de leña por biogás de vinaza y la pirólisis de bagazo en biochar permite mitigar más del 55% del impacto de calentamiento global.</p>
    `,
    kpis: {
      baseline: '7.90 kg CO₂ eq',
      optimized: '3.55 kg CO₂ eq',
      reduction: '-55.1%'
    },
    updatedAt: '2024-01-15'
  },
  {
    id: 'art-indium-recycling',
    title: 'Reciclaje de indio mediante lixiviación ácida a partir de LCD de residuos electrónicos (RAEE)',
    slug: 'article-indium.html',
    journal: 'UNAM • ENES Unidad Morelia',
    year: '2020',
    doi: 'TESIUNAM/502931',
    badge: 'Tesis de Grado UNAM',
    badgeType: 'tag-terracotta',
    authors: 'César Rodrigo Ruiz Camou',
    excerpt: 'Estudio experimental para la recuperación hidrometalúrgica de indio a partir de electrodos transparentes (ITO) de pantallas descartadas. Análisis cinético y propuesta para economía circular de metales críticos en México.',
    content: `
      <h2>1. Problemática de los Metales Críticos</h2>
      <p>El indio es un recurso estratégico esencial en optoelectrónica. Mediante lixiviación ácida controlada con HCl y H₂SO₄ a temperaturas de 60-80°C, se lograron recuperaciones superiores al 88% de indio disuelto.</p>
    `,
    kpis: {
      baseline: 'Pérdida en RAEE',
      optimized: '> 88% Pureza',
      reduction: 'Recuperación Alta'
    },
    updatedAt: '2023-11-20'
  },
  {
    id: 'art-temas-selectos',
    title: 'Temas Selectos en Ciencia de Materiales y Nanotecnología',
    slug: 'articles.html#temas-selectos',
    journal: 'Instituto de Investigaciones en Materiales (IIM), UNAM',
    year: '2023',
    doi: 'UNAM-IIM-2023-08',
    badge: 'Capítulo de Libro',
    badgeType: 'tag-blue',
    authors: 'José Núñez González, César Rodrigo Ruiz Camou, Joaquín De la Torre Medina',
    excerpt: 'Capítulo dedicado a los marcos de toma de decisiones para la integración de materiales sostenibles en aplicaciones industriales y componentes de nueva generación.',
    content: `
      <h2>Toma de decisiones multicriterio para materiales sustentables</h2>
      <p>Integración de matrices de ciclo de vida con factores de desempeño mecánico y disponibilidad regional de materias primas secundarias.</p>
    `,
    kpis: {
      baseline: 'Evaluación Lineal',
      optimized: 'Marco Multicriterio',
      reduction: 'Optimizado'
    },
    updatedAt: '2023-09-10'
  }
];

// Notas de bitácora iniciales
const initialNotes = [
  {
    id: 'note-1',
    title: 'Visita de campo a vinatas tradicionales en Etúcuaro: el reto de las vinazas ácidas',
    date: '18 Nov 2024',
    category: 'Campo & Mezcal',
    tags: ['LCA', 'Mezcal', 'Michoacán', 'Vinazas'],
    content: `
      <p>Durante el recorrido por tres destilerías artesanales en la región de Etúcuaro (Michoacán), comprobamos in situ que por cada litro de mezcal de <em>Agave cupreata</em> se generan entre <span class="paper-mark">10 y 12 litros de vinaza</span> con pH inferior a 4.2 y una Demanda Química de Oxígeno (DQO) que supera con creces los 40,000 mg/L.</p>
      <p>La gran mayoría de los maestros mezcaleros aún carece de infraestructura de contención, por lo que el vertido directo a arroyos estacionales genera hipoxia severa en suelos y cuerpos de agua. Dialogamos con las cooperativas sobre la viabilidad técnica de biodigestores anaeróbicos de bajo costo acoplados con lechos de biofiltro de bagazo pre-tratado. La aceptación es muy alta si se demuestra el ahorro en leña para los alambiques.</p>
    `,
    imageUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1000&q=80',
    imageCaption: 'Plantación y corte tradicional de piñas de agave en laderas volcánicas de Michoacán.',
    references: [
      { text: 'Ruiz-Camou, C. et al. (2023). Evaluating the environmental performance of mezcal production in Michoacán, México: A LCA approach. Int J Life Cycle Assess.', url: 'https://link.springer.com' },
      { text: 'Red de Vinateros Tradicionales de Michoacán - Proyectos de Sustentabilidad', url: 'https://mujeresdelagave.com.mx' }
    ]
  },
  {
    id: 'note-2',
    title: 'Recuperación de Indio (In) a partir de pantallas LCD desechadas: reflexiones de lixiviación ácida',
    date: '04 Jun 2024',
    category: 'Materiales & RAEE',
    tags: ['RAEE', 'Metales Críticos', 'UNAM', 'Economía Circular'],
    content: `
      <p>Revisando las curvas cinéticas de mi trabajo de tesis en la ENES Morelia sobre lixiviación de óxido de indio y estaño (ITO). La optimización con concentraciones estequiométricas controladas de ácido clorhídrico y sulfúrico permite alcanzar recuperaciones por encima del <span class="paper-mark">88% de indio</span> sin necesidad de calcinación térmica extrema.</p>
      <p>El gran cuello de botella no es la disolución química en laboratorio, sino la recolección inversa municipal de televisores y monitores descompuestos. Mientras no existan esquemas de responsabilidad extendida del productor (EPR) fiscalizados en México, el reciclaje hidrometalúrgico seguirá limitado por escala de acopio.</p>
    `,
    imageUrl: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=1000&q=80',
    imageCaption: 'Módulos y paneles de circuito impreso y pantallas en estudio de reciclaje de RAEE.',
    references: [
      { text: 'Ruiz Camou, C. R. (2020). Reciclaje de indio mediante lixiviación ácida a partir de LCD de RAEE. Tesis de Licenciatura, UNAM ENES Morelia.', url: 'https://repositorio.unam.mx' },
      { text: 'USGS Indium Mineral Commodity Summaries (2023)', url: 'https://pubs.usgs.gov' }
    ]
  },
  {
    id: 'note-3',
    title: '¿Por qué el software de ACV debe incorporar incertidumbre espacial en cadenas biogénicas?',
    date: '22 Feb 2024',
    category: 'Metodología ACV',
    tags: ['LCA', 'SimaPro', 'openLCA', 'Huella de Carbono'],
    content: `
      <p>En análisis de ciclo de vida para bioenergía y productos agrícolas mexicanos, confiar ciegamente en factores de emisión genéricos de bases de datos europeas (como Ecoinvent 3.9) distorsiona los resultados hasta en un 40%. La densidad del suelo en zonas semiáridas, la tasa de recarga de acuíferos y la quema de biomasa nativa requieren inventarios de ciclo de vida (LCI) contextualizados a nivel cuenca.</p>
      <p>Herramientas como openLCA combinadas con modelos de dispersión geoespacial en Python son el futuro para evaluaciones rigurosas en el sector agroindustrial latinoamericano.</p>
    `,
    imageUrl: '',
    imageCaption: '',
    references: [
      { text: 'ISO 14040/14044: Environmental management — Life cycle assessment — Principles and framework', url: 'https://www.iso.org' },
      { text: 'EarthShift Global - Software & Sustainability Analytics', url: 'https://www.earthshiftglobal.com' }
    ]
  },
  {
    id: 'note-4',
    title: 'Biochar de bagazo de agave como sumidero permanente de carbono en suelo degradado',
    date: '15 Ene 2024',
    category: 'Divulgación & Suelo',
    tags: ['Biochar', 'Suelo', 'Michoacán', 'Captura C'],
    content: `
      <p>La pirólisis lenta (450-550°C) del bagazo seco residual convierte un desecho que típicamente genera metano por fermentación espontánea en un carbón poroso con área superficial de hasta <span class="paper-mark">280 m²/g</span>. Aplicado al suelo de cultivo de agaveros, no solo retiene humedad en sequías severas sino que bloquea el carbono por cientos de años, logrando un balance neto de emisiones negativo en el análisis de ciclo de vida de la botella de mezcal.</p>
    `,
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80',
    imageCaption: 'Micrografía y estructura de biomasa porosa tratada térmicamente.',
    references: [
      { text: 'International Biochar Initiative (IBI) Standards', url: 'https://biochar-international.org' }
    ]
  }
];

// Configuración predeterminada de Google Cloud & Auth
const initialConfig = {
  googleProjectId: 'lca-studio-509602',
  googleClientId: '968718859059-81u6bj6l4op1e0dsnblqg73ego8ns59j.apps.googleusercontent.com',
  developerEmail: 'josuearenteriaz09@gmail.com',
  authorEmail: 'cesar.ruizcamou@gmail.com'
};

const initialAuth = {
  role: 'guest', // 'guest' | 'author' | 'developer'
  user: null     // { name, email, picture, role }
};

class BlogStore {
  constructor() {
    this.initStore();
  }

  initStore() {
    if (!localStorage.getItem(STORAGE_KEYS.ARTICLES)) {
      localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(initialArticles));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTES)) {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(initialNotes));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(initialConfig));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUTH)) {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(initialAuth));
    }
  }

  // --- ARTÍCULOS ---
  getArticles() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ARTICLES)) || initialArticles;
    } catch (e) {
      return initialArticles;
    }
  }

  getArticleById(id) {
    const list = this.getArticles();
    return list.find(a => a.id === id) || null;
  }

  saveArticle(article) {
    const list = this.getArticles();
    const index = list.findIndex(a => a.id === article.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...article, updatedAt: new Date().toISOString().split('T')[0] };
    } else {
      list.unshift({ ...article, id: article.id || 'art-' + Date.now(), updatedAt: new Date().toISOString().split('T')[0] });
    }
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('blog:articles-updated', { detail: list }));
    return list;
  }

  deleteArticle(id) {
    const list = this.getArticles().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('blog:articles-updated', { detail: list }));
    return list;
  }

  // --- NOTAS ---
  getNotes() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES)) || initialNotes;
    } catch (e) {
      return initialNotes;
    }
  }

  getNoteById(id) {
    const list = this.getNotes();
    return list.find(n => n.id === id) || null;
  }

  saveNote(note) {
    const list = this.getNotes();
    const index = list.findIndex(n => n.id === note.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...note };
    } else {
      list.unshift({ ...note, id: note.id || 'note-' + Date.now() });
    }
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('blog:notes-updated', { detail: list }));
    return list;
  }

  deleteNote(id) {
    const list = this.getNotes().filter(n => n.id !== id);
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('blog:notes-updated', { detail: list }));
    return list;
  }

  // --- CONFIGURACIÓN ---
  getConfig() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CONFIG)) || initialConfig;
    } catch (e) {
      return initialConfig;
    }
  }

  saveConfig(conf) {
    const current = this.getConfig();
    const updated = { ...current, ...conf };
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('blog:config-updated', { detail: updated }));
    return updated;
  }

  // --- AUTENTICACIÓN & ROLES ---
  getAuth() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH)) || initialAuth;
    } catch (e) {
      return initialAuth;
    }
  }

  setRole(role, user = null) {
    const auth = {
      role: role, // 'guest' | 'author' | 'developer'
      user: user || (role === 'author' 
        ? { name: 'César Ruiz-Camou', email: 'cesar.ruizcamou@gmail.com', avatar: 'CR' }
        : role === 'developer'
        ? { name: 'Desarrollador / Admin', email: 'dev@lca-studio.local', avatar: 'DEV' }
        : null)
    };
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(auth));
    window.dispatchEvent(new CustomEvent('blog:auth-changed', { detail: auth }));
    return auth;
  }

  logout() {
    return this.setRole('guest', null);
  }

  // Respaldo y Restauración
  exportBackup() {
    return {
      version: 2,
      exportedAt: new Date().toISOString(),
      articles: this.getArticles(),
      notes: this.getNotes(),
      config: this.getConfig()
    };
  }

  importBackup(jsonString) {
    try {
      const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      if (data.articles) localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(data.articles));
      if (data.notes) localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(data.notes));
      if (data.config) localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(data.config));
      window.dispatchEvent(new CustomEvent('blog:articles-updated', { detail: this.getArticles() }));
      window.dispatchEvent(new CustomEvent('blog:notes-updated', { detail: this.getNotes() }));
      return true;
    } catch (e) {
      console.error('Error importando respaldo:', e);
      return false;
    }
  }

  resetDefaults() {
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(initialArticles));
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(initialNotes));
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(initialConfig));
    this.logout();
    window.location.reload();
  }
}

// Instancia global
window.blogStore = new BlogStore();
