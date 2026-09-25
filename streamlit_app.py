"""
streamlit_app.py - Despliegue en Streamlit Community Cloud
Permite previsualizar el Blog Científico de César Ruiz-Camou en https://share.streamlit.io
"""
import streamlit as st
import streamlit.components.v1 as components
import os

st.set_page_config(
    page_title="César Ruiz-Camou | Blog Científico & ACV",
    page_icon="🌱",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Ocultar barra superior y márgenes de Streamlit para pantalla completa
st.markdown("""
<style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    [data-testid="stHeader"] {display: none;}
    .block-container {
        padding: 0rem !important;
        margin: 0rem !important;
        max-width: 100% !important;
    }
    iframe {
        border: none !important;
        width: 100vw !important;
        height: 100vh !important;
        overflow: auto;
    }
</style>
""", unsafe_allow_html=True)

# Leer archivo index.html
current_dir = os.path.dirname(os.path.abspath(__file__))
index_path = os.path.join(current_dir, "index.html")

try:
    with open(index_path, "r", encoding="utf-8") as f:
        html_content = f.read()
    
    # Reemplazar rutas relativas para que CSS y JS funcionen adecuadamente en Streamlit
    css_path = os.path.join(current_dir, "css", "style.css")
    with open(css_path, "r", encoding="utf-8") as f:
        css_content = f.read()

    store_js_path = os.path.join(current_dir, "js", "store.js")
    with open(store_js_path, "r", encoding="utf-8") as f:
        store_js_content = f.read()

    auth_js_path = os.path.join(current_dir, "js", "auth.js")
    with open(auth_js_path, "r", encoding="utf-8") as f:
        auth_js_content = f.read()

    charts_js_path = os.path.join(current_dir, "js", "charts.js")
    with open(charts_js_path, "r", encoding="utf-8") as f:
        charts_js_content = f.read()

    app_js_path = os.path.join(current_dir, "js", "app.js")
    with open(app_js_path, "r", encoding="utf-8") as f:
        app_js_content = f.read()

    # Inyectar estilos y scripts inline para que el iframe de Streamlit sea completamente autocontenido
    html_content = html_content.replace(
        '<link rel="stylesheet" href="css/style.css">',
        f'<style>{css_content}</style>'
    )
    
    scripts_bundle = f"""
    <script>{store_js_content}</script>
    <script>{auth_js_content}</script>
    <script>{charts_js_content}</script>
    <script>{app_js_content}</script>
    """

    html_content = html_content.replace(
        '<script src="js/store.js"></script>',
        scripts_bundle
    ).replace(
        '<script src="js/auth.js"></script>',
        ''
    ).replace(
        '<script src="js/charts.js"></script>',
        ''
    ).replace(
        '<script src="js/app.js"></script>',
        ''
    )

    components.html(html_content, height=1200, scrolling=True)

except Exception as e:
    st.error(f"Error cargando la vista web: {e}")
