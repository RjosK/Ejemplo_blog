# Blog Científico & Cuaderno de Campo — César Ruiz-Camou

Sitio web personal, catálogo de publicaciones de **Análisis de Ciclo de Vida (LCA)** y cuaderno de notas científicas desarrollado para **César Ruiz-Camou** (M.Sc. en Ciencias de la Sostenibilidad - UNAM | Sustainability Analyst en EarthShift Global).

El sitio cuenta con un sistema de **3 Modos de Acceso y Roles**, un **Editor de Documentos tipo Google Docs**, integración con **Google Cloud OAuth (Proyecto: `lca-studio-509602`)** y un **Acceso Oculto de Desarrollador**.

---

## 🎭 Las 3 Formas de Visualización y Roles

### 1. Modo Lector Público (Visitantes / Sin Sesión)
- **Vista 100% limpia y de solo lectura:** Los visitantes no ven botones de edición, barras administrativas ni paneles de control.
- Disfrutan de la estética editorial tipo papel cálido, lectura de artículos, visualización de gráficas interactivas del mezcal y el cuaderno de notas.

### 2. Modo César Ruiz-Camou (Escritor / Autor)
- **Barra fija superior de autor:** Aparece discretamente al iniciar sesión con acceso directo al Editor tipo Google Docs y botón para cerrar sesión.
- **Botones de edición contextuales:** En cada artículo y nota aparece un botón `✏ Editar en Docs`.
- **Inicio de sesión:** 
  - Mediante **Google Sign-In** oficial (vinculado a tu proyecto de Google Cloud `lca-studio-509602`).
  - O mediante el botón de acceso directo *"Entrar como César Ruiz-Camou"* en la ventana de acceso.

### 3. Modo Desarrollador (Master / Josue)
- **Acceso completamente oculto e invisible para usuarios comunes.**
- Permite alternar en tiempo real entre:
  - `[Dev Master]`
  - `[Ver como César (Escritor)]`
  - `[Ver como Lector (Público)]`
- Configuración en vivo del **OAuth 2.0 Client ID** de Google Cloud.
- Respaldo, exportación y restauración de datos en JSON.

---

## 🕵️‍♂️ Cómo Entrar al Modo Desarrollador (Acceso Oculto)

Existen dos formas ocultas para abrir el panel maestro:

1. **Atajo de Teclado:**  
   Presiona en cualquier momento:  
   `Ctrl + Shift + D` (en Windows/Linux) o `Cmd + Shift + D` (en Mac).
2. **Triple Clic Secreto:**  
   Haz **triple clic** sobre el texto de copyright del pie de página (*© 2026 César Ruiz-Camou*).

Se desplegará de inmediato el modal secreto de desarrollador para alternar roles, configurar Google OAuth o abrir el editor.

---

## 📝 Editor Científico tipo Google Docs (`editor.html`)

Diseñado especialmente para brindar una experiencia de escritura fluida y amigable:
- **Lienzo tipo hoja de papel:** Centrado con sombra suave, conteo de palabras en vivo y tiempo de lectura.
- **Barra de formato superior:** Títulos (H1, H2, H3), Negrita, Cursiva, Subrayado, Citas y el **Resaltador de papel cálido (`.paper-mark`)**.
- **📷 Subir Imágenes:**
  - Opción A: Cargar directamente desde tu computadora (se procesa y guarda localmente en el navegador).
  - Opción B: Pegar enlace URL con pie de foto científico editable.
- **📊 Crear y Ordenar Gráficas Científicas:**
  - Asistente visual para crear gráficas de Barras, Líneas o Donas (definiendo título, unidad, categorías y valores).
  - **Reordenamiento instantáneo:** Cada bloque de gráfica cuenta con controles **[⬆ Subir]** y **[⬇ Bajar]** para mover la gráfica entre los párrafos según convenga.
- **🔗 Referencias & DOIs:** Inserta citas bibliográficas en cajas formadas con enlaces directos.
- **Publicación directa:** Elige si deseas publicarlo como **Artículo Científico** o como **Nota de Bitácora** y haz clic en `🚀 Publicar en Blog`.

---

## 🔑 Configuración de Google Cloud OAuth (`lca-studio-509602`)

Para conectar el inicio de sesión oficial con Google:
1. Dirígete a la consola de Google Cloud:  
   [Google Cloud Credentials - lca-studio-509602](https://console.cloud.google.com/auth/audience?project=lca-studio-509602)
2. Crea un **ID de cliente de OAuth 2.0** de tipo *Aplicación web*.
3. En *Orígenes autorizados de JavaScript*, añade tu dominio o servidor local:  
   `http://localhost:8080` y `http://127.0.0.1:8080`.
4. Copia el **Client ID** generado.
5. En el blog, abre el panel de desarrollador (`Ctrl + Shift + D`), haz clic en **Configurar OAuth Google** y pega tu Client ID. ¡Listo! El botón oficial de Google quedará activo.

---

## 🚀 Cómo Iniciar la Página

Ejecuta en tu terminal PowerShell:
```powershell
python serve.py
```
Se iniciará en `http://localhost:8080/index.html` y se abrirá automáticamente en tu navegador.
