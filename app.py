import streamlit as st
import json
import pandas as pd
from datetime import datetime, date
from database import DatabaseManager

# Configuration de la page
st.set_page_config(
    page_title="Workflow Manager - Premium",
    page_icon="✨",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialisation de la base de données
@st.cache_resource
def get_db():
    return DatabaseManager()

db = get_db()

# Initialisation de l'état de session
if 'tasks' not in st.session_state:
    st.session_state.tasks = []
if 'columns' not in st.session_state:
    st.session_state.columns = []
if 'workflows' not in st.session_state:
    st.session_state.workflows = []
if 'theme' not in st.session_state:
    st.session_state.theme = 'dark'

# Fonction pour rafraîchir les données
def refresh_data():
    st.session_state.tasks = db.get_all_tasks()
    st.session_state.columns = db.get_all_columns()
    st.session_state.workflows = db.get_all_workflows()

# Rafraîchissement initial
refresh_data()

# CSS - Thème sombre global (texte blanc sur fond sombre)
st.markdown("""
    <style>
    /* === FORCE DARK THEME EVERYWHERE === */
    
    /* Main area */
    .main, [data-testid="stAppViewContainer"], [data-testid="stApp"] {
        background: radial-gradient(ellipse at bottom, #1a1a1a 0%, #0f0f0f 100%) !important;
        color: #ffffff !important;
    }
    
    /* Sidebar - dark theme */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%) !important;
        border-right: 1px solid rgba(0, 245, 255, 0.3) !important;
        backdrop-filter: blur(15px) !important;
    }
    
    /* ALL text white */
    [data-testid="stSidebar"] *,
    [data-testid="stSidebar"] .stMarkdown, 
    [data-testid="stSidebar"] .stRadio label,
    [data-testid="stSidebar"] h1, 
    [data-testid="stSidebar"] h2, 
    [data-testid="stSidebar"] h3,
    [data-testid="stSidebar"] p,
    [data-testid="stSidebar"] span,
    [data-testid="stSidebar"] [data-testid="stMetricValue"],
    [data-testid="stSidebar"] [data-testid="stMetricLabel"] {
        color: #ffffff !important;
    }
    
    /* Global text - force white everywhere */
    .stMarkdown, .stMarkdown p, .stMarkdown span,
    .stMetric, p, h1, h2, h3, h4, h5, h6, 
    label, .stCaption, span,
    [data-testid="stMetricValue"],
    [data-testid="stMetricLabel"],
    [data-testid="stMetricDelta"],
    .stTabs [data-baseweb="tab"],
    .stRadio label,
    .stSelectbox label,
    .stTextInput label,
    .stTextArea label,
    .stDateInput label,
    .stCheckbox label,
    .stExpander summary,
    .stExpander summary span,
    [data-testid="stExpanderToggleDetails"],
    .row-widget label,
    div[data-testid="stMarkdownContainer"] p,
    div[data-testid="stMarkdownContainer"] h1,
    div[data-testid="stMarkdownContainer"] h2,
    div[data-testid="stMarkdownContainer"] h3,
    div[data-testid="stMarkdownContainer"] strong,
    div[data-testid="stMarkdownContainer"] em,
    div[data-testid="stMarkdownContainer"] li,
    div[data-testid="stCaptionContainer"] *,
    .stSubheader {
        color: #ffffff !important;
    }
    
    /* Metric cards */
    [data-testid="stMetricValue"] {
        color: #ffffff !important;
        font-weight: 800 !important;
    }
    
    /* Form labels and inputs */
    .stTextInput > div > div > input,
    .stTextArea > div > div > textarea,
    .stSelectbox > div > div,
    .stDateInput > div > div > input {
        background: rgba(255, 255, 255, 0.1) !important;
        color: #ffffff !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
    }
    
    /* Tabs */
    .stTabs [data-baseweb="tab"] {
        color: rgba(255, 255, 255, 0.7) !important;
    }
    .stTabs [aria-selected="true"] {
        color: #00f5ff !important;
    }
    
    /* Info/Warning/Error boxes */
    .stAlert > div {
        color: #ffffff !important;
    }
    
    /* Progress bar labels */
    .stProgress > div > div > div > div {
        color: #ffffff !important;
    }
    
    /* Table/DataFrame */
    .stDataFrame, .stDataFrame th, .stDataFrame td {
        color: #ffffff !important;
    }
    </style>
""", unsafe_allow_html=True)

# CSS statique pour le reste de l'application
st.markdown("""
    <style>
    /* Arrière-plan étoilé animé */
    .main {
        background: radial-gradient(ellipse at bottom, #1a1a1a 0%, #0f0f0f 100%);
        min-height: 100vh;
        position: relative;
        overflow-x: hidden;
        padding: 2rem;
    }
    
    /* Animation des étoiles */
    @keyframes twinkle {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.2); }
    }
    
    @keyframes shooting-star {
        0% { transform: translateX(-100px) translateY(100px); opacity: 0; }
        10% { opacity: 1; }
        100% { transform: translateX(100vw) translateY(-100px); opacity: 0; }
    }
    
    /* Étoiles fixes */
    .star {
        position: absolute;
        background: white;
        border-radius: 50%;
        animation: twinkle 2s infinite;
        pointer-events: none;
    }
    
    /* Étoiles filantes */
    .shooting-star {
        position: fixed;
        width: 2px;
        height: 2px;
        background: linear-gradient(45deg, #fff, transparent);
        border-radius: 50%;
        animation: shooting-star 3s linear infinite;
        z-index: -1;
        pointer-events: none;
    }
    
    /* Génération des étoiles avec JavaScript */
    .star-field {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
        pointer-events: none;
    }
    
    /* Card styling - Liquid Glass */
    .css-1v0mbdj {  /* Conteneur principal */
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        box-shadow: 
            0 8px 32px 0 rgba(0, 0, 0, 0.37),
            0 4px 6px 0 rgba(0, 0, 0, 0.2);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }
    
    .css-1v0mbdj::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
        );
        transition: 0.5s;
    }
    
    .css-1v0mbdj:hover::before {
        left: 100%;
    }
    
    /* Header styling - Métal/Or */
    .css-10trblm {  /* Titres */
        font-size: 3rem;
        font-weight: 800;
        background: linear-gradient(135deg, #d4af37, #ffffff, #b8860b);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: 
            0 0 10px rgba(212, 175, 55, 0.5),
            0 0 20px rgba(212, 175, 55, 0.3),
            0 0 30px rgba(184, 134, 11, 0.5),
            0 0 40px rgba(184, 134, 11, 0.3);
        animation: gold-flicker 2s infinite;
        letter-spacing: 2px;
    }
    
    @keyframes gold-flicker {
        0%, 100% { text-shadow: 0 0 10px rgba(212, 175, 55, 0.5), 0 0 20px rgba(212, 175, 55, 0.3), 0 0 30px rgba(184, 134, 11, 0.5), 0 0 40px rgba(184, 134, 11, 0.3); }
        50% { text-shadow: 0 0 5px rgba(212, 175, 55, 0.2), 0 0 10px rgba(212, 175, 55, 0.1), 0 0 15px rgba(184, 134, 11, 0.2), 0 0 20px rgba(184, 134, 11, 0.1); }
    }
    
    @keyframes neon-flicker {
        0%, 100% { text-shadow: 0 0 10px rgba(0, 245, 255, 0.5), 0 0 20px rgba(0, 245, 255, 0.3), 0 0 30px rgba(255, 0, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.3); }
        50% { text-shadow: 0 0 5px rgba(0, 245, 255, 0.2), 0 0 10px rgba(0, 245, 255, 0.1), 0 0 15px rgba(255, 0, 255, 0.2), 0 0 20px rgba(255, 0, 255, 0.1); }
    }
    

    
    /* Bouton styling - Néon */
    .stButton > button {
        border-radius: 8px;
        padding: 0.75rem 1.5rem;
        font-weight: 700;
        font-size: 1rem;
        border: 2px solid transparent;
        background: linear-gradient(135deg, #00f5ff, #ff00ff) padding-box, 
                    linear-gradient(135deg, #00f5ff, #ff00ff) border-box;
        color: white;
        text-transform: uppercase;
        letter-spacing: 1px;
        box-shadow: 
            0 0 15px rgba(0, 245, 255, 0.3),
            0 0 30px rgba(255, 0, 255, 0.3),
            inset 0 0 10px rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }
    
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 
            0 5px 25px rgba(0, 245, 255, 0.5),
            0 10px 40px rgba(255, 0, 255, 0.5),
            inset 0 0 20px rgba(255, 255, 255, 0.2);
    }
    
    .stButton > button:active {
        transform: translateY(0);
    }
    
    /* Input styling - Liquid Glass */
    .stTextInput > div > div > input,
    .stSelectbox > div > div > select,
    .stDateInput > div > div > input {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 8px;
        padding: 0.75rem;
        box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
    }
    
    .stTextInput > div > div > input::placeholder,
    .stSelectbox > div > div > select::placeholder {
        color: rgba(255, 255, 255, 0.5);
    }
    
    /* Kanban column styling - Premium */
    .css-1v3fvcr {  /* Colonnes Kanban */
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 1.5rem;
        min-height: 250px;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }
    
    .css-1v3fvcr:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        border-color: rgba(0, 245, 255, 0.3);
    }
    
    /* Task card styling - Liquid Glass */
    .css-1n76uvr {  /* Cartes de tâches */
        background: rgba(255, 255, 255, 0.05) !important;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        border-radius: 10px;
        padding: 1.25rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        position: relative;
    }
    
    .css-1n76uvr:hover {
        transform: translateX(5px);
        border-color: #00f5ff !important;
        box-shadow: 0 8px 25px rgba(0, 245, 255, 0.2);
    }
    
    /* Metrics styling - Néon */
    .stMetric {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        transition: all 0.3s ease;
    }
    
    .stMetric:hover {
        transform: translateY(-3px);
        border-color: rgba(0, 245, 255, 0.3);
        box-shadow: 0 12px 40px rgba(0, 245, 255, 0.2);
    }
    
    /* Text styling */
    .css-1v3fvcr h3 {  /* Titres de colonnes */
        color: #d4af37;
        text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
        text-transform: uppercase;
        letter-spacing: 2px;
    }
    
    .css-1n76uvr .task-title {  /* Titres de tâches */
        color: white;
        font-size: 1.1rem;
    }
    
    .css-1n76uvr .task-meta {  /* Métadonnées de tâches */
        color: rgba(255, 255, 255, 0.7);
    }
    
    /* Priority badges */
    .priority-badge {
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
    }
    
    /* Effet de bordure néon */
    .neon-border {
        box-shadow: 
            0 0 10px rgba(0, 245, 255, 0.3),
            0 0 20px rgba(0, 245, 255, 0.2),
            0 0 30px rgba(0, 245, 255, 0.1);
        border-color: rgba(0, 245, 255, 0.5);
    }
    
    /* Scrollbar styling */
    ::-webkit-scrollbar {
        width: 10px;
    }
    
    ::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-left: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    ::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #00f5ff, #ff00ff);
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 245, 255, 0.3);
    }
    
    ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, #ff00ff, #00f5ff);
    }
    </style>
    
    <!-- Génération des étoiles avec JavaScript -->
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        const starField = document.createElement('div');
        starField.className = 'star-field';
        document.body.appendChild(starField);
        
        // Créer des étoiles
        for(let i = 0; i < 200; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.width = (Math.random() * 3) + 'px';
            star.style.height = star.style.width;
            star.style.animationDelay = Math.random() * 2 + 's';
            starField.appendChild(star);
        }
        
        // Créer des étoiles filantes
        function createShootingStar() {
            const shootingStar = document.createElement('div');
            shootingStar.className = 'shooting-star';
            shootingStar.style.top = Math.random() * 100 + '%';
            shootingStar.style.animationDuration = (Math.random() * 3 + 2) + 's';
            starField.appendChild(shootingStar);
            
            setTimeout(() => {
                shootingStar.remove();
            }, 5000);
        }
        
        // Lancer des étoiles filantes toutes les 2-5 secondes
        setInterval(createShootingStar, Math.random() * 3000 + 2000);
    });
    </script>
    """, unsafe_allow_html=True)
    
    # Arrière-plan d'étoiles
st.markdown('<div class="star-field"></div>', unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.title("📋 Workflow Manager")
    
    # Navigation
    page = st.radio(
        "Navigation",
        ["Tableau de board", "Kanban", "Workflows", "Statistiques", "Paramètres"],
        label_visibility="collapsed"
    )
    
    st.divider()
    
    # Statistiques rapides
    st.metric("Tâches", len(st.session_state.tasks))
    st.metric("Colonnes", len(st.session_state.columns))
    st.metric("Workflows", len(st.session_state.workflows))

# ===== PAGE TABLEAU DE BOARD =====
if page == "Tableau de bord":
    st.title("📊 Tableau de bord")
    
    # Statistiques
    stats = db.get_statistics()
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Total des tâches", stats['total'])
    with col2:
        st.metric("Tâches terminées", stats['completed'])
    with col3:
        st.metric("En attente", stats['pending'])
    with col4:
        st.metric("En retard", stats['overdue'])
    
    st.divider()
    
    # Tâches récentes
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Tâches récentes")
        if st.session_state.tasks:
            recent_tasks = sorted(st.session_state.tasks, key=lambda x: x.get('created_at', ''), reverse=True)[:5]
            for task in recent_tasks:
                with st.container():
                    st.markdown(f"**{task['title']}**")
                    col_a, col_b = st.columns([3, 1])
                    with col_a:
                        st.caption(f"Priorité: {task.get('priority', 'medium')}")
                    with col_b:
                        if task.get('due_date'):
                            st.caption(f"Échéance: {task['due_date'][:10]}")
                    st.divider()
    
    with col2:
        st.subheader("Répartition par colonne")
        if stats['byColumn']:
            for item in stats['byColumn']:
                percentage = (item['count'] / stats['total'] * 100) if stats['total'] > 0 else 0
                st.progress(percentage / 100)
                st.caption(f"{item['title']}: {item['count']} ({percentage:.1f}%)")
    
    # Tâches par priorité
    st.divider()
    st.subheader("Tâches par priorité")
    
    if stats['byPriority']:
        cols = st.columns(3)
        priority_colors = {'high': '🔴', 'medium': '🟡', 'low': '🟢'}
        priority_labels = {'high': 'Urgent', 'medium': 'Moyen', 'low': 'Faible'}
        
        for i, item in enumerate(stats['byPriority']):
            with cols[i]:
                icon = priority_colors.get(item['priority'], '⚪')
                label = priority_labels.get(item['priority'], item['priority'])
                percentage = (item['count'] / stats['total'] * 100) if stats['total'] > 0 else 0
                st.metric(f"{icon} {label}", item['count'], f"{percentage:.1f}%")

# ===== PAGE KANBAN =====
elif page == "Kanban":
    st.title("📋 Tableau Kanban")
    
    # Bouton pour ajouter une tâche
    with st.expander("➕ Nouvelle tâche"):
        with st.form("new_task_form"):
            col1, col2 = st.columns(2)
            with col1:
                title = st.text_input("Titre *", key="task_title")
                description = st.text_area("Description", key="task_desc")
            with col2:
                priority = st.selectbox("Priorité", ["low", "medium", "high"], key="task_priority")
                due_date = st.date_input("Date d'échéance", key="task_due_date", value=None)
            
            column_options = {col['id']: col['title'] for col in st.session_state.columns}
            selected_column = st.selectbox("Colonne", options=list(column_options.keys()), format_func=lambda x: column_options[x])
            
            tags = st.text_input("Étiquettes (séparées par des virgules)", key="task_tags")
            
            submitted = st.form_submit_button("Créer la tâche", type="primary")
            
            if submitted and title:
                task_data = {
                    'title': title,
                    'description': description,
                    'status': selected_column,
                    'priority': priority,
                    'dueDate': due_date.isoformat() if due_date else None,
                    'tags': [tag.strip() for tag in tags.split(',') if tag.strip()],
                    'columnId': selected_column
                }
                db.create_task(task_data)
                st.success("Tâche créée avec succès !")
                refresh_data()
                st.rerun()
    
    # Afficher le tableau Kanban
    if st.session_state.columns:
        kanban_cols = st.columns(len(st.session_state.columns))
        
        for i, column in enumerate(st.session_state.columns):
            with kanban_cols[i]:
                st.markdown(f"### {column['title']}")
                
                # Tâches dans cette colonne
                column_tasks = [t for t in st.session_state.tasks if t.get('column_id') == column['id']]
                
                for task in column_tasks:
                    with st.container():
                        st.markdown(f"**{task['title']}**")
                        
                        if task.get('description'):
                            st.caption(task['description'][:100] + "..." if len(task.get('description', '')) > 100 else task['description'])
                        
                        # Métadonnées
                        cols = st.columns(2)
                        with cols[0]:
                            priority_emoji = {'high': '🔴', 'medium': '🟡', 'low': '🟢'}.get(task.get('priority', 'medium'), '⚪')
                            st.caption(f"{priority_emoji}")
                        with cols[1]:
                            if task.get('due_date'):
                                try:
                                    due_date = datetime.fromisoformat(task['due_date'])
                                    days_left = (due_date.date() - datetime.now().date()).days
                                    if days_left < 0:
                                        st.error(f"⚠️ {abs(days_left)}j de retard")
                                    elif days_left == 0:
                                        st.warning("⚠️ Aujourd'hui")
                                    else:
                                        st.caption(f"📅 {days_left}j restants")
                                except:
                                    st.caption(f"📅 {task['due_date'][:10]}")
                        
                        # Affichage des étiquettes (Tags)
                        if task.get('tags'):
                            st.markdown('<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;">' + 
                                "".join([f'<span style="background: rgba(0, 245, 255, 0.1); color: #00f5ff; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; border: 1px solid rgba(0, 245, 255, 0.3);">{tag}</span>' for tag in task['tags']]) + 
                                '</div>', unsafe_allow_html=True)
                        
                        # Boutons d'action
                        col1, col2 = st.columns(2)
                        with col1:
                            # Menu pour déplacer vers une autre colonne
                            new_column = st.selectbox(
                                "Déplacer",
                                options=[c['id'] for c in st.session_state.columns],
                                format_func=lambda x: next(c['title'] for c in st.session_state.columns if c['id'] == x),
                                key=f"move_{task['id']}",
                                index=next((i for i, c in enumerate(st.session_state.columns) if c['id'] == column['id']), 0)
                            )
                            if new_column != column['id']:
                                if st.button("→", key=f"move_btn_{task['id']}"):
                                    db.update_task(task['id'], {'columnId': new_column, 'status': new_column})
                                    st.success("Tâche déplacée !")
                                    refresh_data()
                                    st.rerun()
                        
                        with col2:
                            if st.button("🗑️", key=f"delete_{task['id']}"):
                                db.delete_task(task['id'])
                                st.success("Tâche supprimée !")
                                refresh_data()
                                st.rerun()
                        
                        st.divider()
                
                # Bouton pour ajouter une tâche directement dans cette colonne
                if st.button(f"+ Ajouter à '{column['title']}'", key=f"add_to_{column['id']}"):
                    st.session_state.selected_column_for_new_task = column['id']
                    st.rerun()

# ===== PAGE WORKFLOWS =====
elif page == "Workflows":
    st.title("⚡ Workflows")
    
    col1, col2 = st.columns([3, 1])
    with col1:
        st.caption(f"{sum(1 for w in st.session_state.workflows if w.get('enabled'))} workflows actifs sur {len(st.session_state.workflows)}")
    with col2:
        if st.button("➕ Nouveau workflow", type="primary"):
            st.session_state.show_workflow_modal = True
    
    if not st.session_state.workflows:
        st.info("Aucun workflow configuré. Créez votre premier workflow pour automatiser vos tâches !")
    else:
        for workflow in st.session_state.workflows:
            with st.expander(f"{'🟢' if workflow.get('enabled') else '🔴'} {workflow['name']}", expanded=False):
                col1, col2 = st.columns([3, 1])
                
                with col1:
                    st.markdown(f"**Déclencheur:** {workflow.get('trigger', {}).get('type', 'N/A')}")
                    
                    if workflow.get('actions'):
                        actions_str = ", ".join([a.get('type', '') for a in workflow['actions']])
                        st.markdown(f"**Actions:** {actions_str}")
                    
                    st.caption(f"Créé le: {workflow.get('created_at', 'N/A')[:10] if workflow.get('created_at') else 'N/A'}")
                
                with col2:
                    # Toggle activ/désactivé
                    enabled = st.toggle("Actif", value=bool(workflow.get('enabled')), key=f"toggle_{workflow['id']}")
                    if enabled != bool(workflow.get('enabled')):
                        db.toggle_workflow(workflow['id'], enabled)
                        st.success("Workflow mis à jour !")
                        refresh_data()
                        st.rerun()
                    
                    if st.button("🗑️", key=f"delete_wf_{workflow['id']}"):
                        db.delete_workflow(workflow['id'])
                        st.success("Workflow supprimé !")
                        refresh_data()
                        st.rerun()
    
    # Formulaire de création de workflow
    if st.session_state.get('show_workflow_modal'):
        with st.form("workflow_form"):
            st.subheader("Nouveau workflow")
            
            name = st.text_input("Nom du workflow *")
            
            trigger_type = st.selectbox(
                "Type de déclencheur",
                ["taskCreated", "taskUpdated", "taskCompleted", "time"]
            )
            
            trigger_value = None
            if trigger_type == "time":
                trigger_value = st.text_input("Expression cron", placeholder="0 9 * * 1 (Tous les lundis à 9h)")
            
            st.subheader("Actions")
            action_type = st.selectbox(
                "Type d'action",
                ["moveTask", "changePriority", "addTag", "sendNotification", "createTask"]
            )
            
            # Paramètres selon le type d'action
            action_params = {}
            if action_type == "moveTask":
                column_id = st.selectbox(
                    "Colonne de destination",
                    options=[c['id'] for c in st.session_state.columns],
                    format_func=lambda x: next(c['title'] for c in st.session_state.columns if c['id'] == x)
                )
                action_params['columnId'] = column_id
            elif action_type == "changePriority":
                action_params['priority'] = st.selectbox("Priorité", ["low", "medium", "high"])
            elif action_type == "addTag":
                action_params['tag'] = st.text_input("Étiquette")
            elif action_type == "sendNotification":
                action_params['title'] = st.text_input("Titre de la notification")
                action_params['body'] = st.text_area("Message")
            elif action_type == "createTask":
                action_params['title'] = st.text_input("Titre de la tâche")
                action_params['columnId'] = st.selectbox(
                    "Colonne",
                    options=[c['id'] for c in st.session_state.columns],
                    format_func=lambda x: next(c['title'] for c in st.session_state.columns if c['id'] == x)
                )
            
            enabled = st.checkbox("Activer ce workflow immédiatement", value=True)
            
            submitted = st.form_submit_button("Créer le workflow", type="primary")
            
            if submitted and name:
                workflow_data = {
                    'name': name,
                    'trigger': {
                        'type': trigger_type,
                        'value': trigger_value
                    },
                    'conditions': [],
                    'actions': [{
                        'type': action_type,
                        'params': action_params
                    }],
                    'enabled': enabled
                }
                db.create_workflow(workflow_data)
                st.success("Workflow créé avec succès !")
                st.session_state.show_workflow_modal = False
                refresh_data()
                st.rerun()
            
            if st.form_submit_button("Annuler"):
                st.session_state.show_workflow_modal = False
                st.rerun()

# ===== PAGE STATISTIQUES =====
elif page == "Statistiques":
    st.title("📈 Statistiques")
    
    stats = db.get_statistics()
    
    # Onglets
    tab1, tab2, tab3 = st.tabs(["Vue d'ensemble", "Détail des tâches", "Tendances"])
    
    with tab1:
        # Cartes de statistiques
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("Total des tâches", stats['total'])
        with col2:
            st.metric("Tâches terminées", stats['completed'], f"{(stats['completed']/stats['total']*100) if stats['total'] > 0 else 0:.1f}%")
        with col3:
            st.metric("En attente", stats['pending'])
        with col4:
            st.metric("En retard", stats['overdue'], delta_color="inverse")
        
        st.divider()
        
        # Répartition par priorité et par colonne
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Par priorité")
            if stats['byPriority']:
                priority_data = pd.DataFrame(stats['byPriority'])
                st.bar_chart(priority_data.set_index('priority')['count'])
        
        with col2:
            st.subheader("Par colonne")
            if stats['byColumn']:
                column_data = pd.DataFrame(stats['byColumn'])
                st.bar_chart(column_data.set_index('title')['count'])
    
    with tab2:
        st.subheader("Liste des tâches")
        
        if st.session_state.tasks:
            # Créer un DataFrame
            df_tasks = pd.DataFrame(st.session_state.tasks)
            
            # Sélectionner les colonnes à afficher
            display_cols = ['title', 'status', 'priority', 'due_date', 'tags']
            df_display = df_tasks[display_cols].head(20)
            
            # Formater l'affichage
            df_display.columns = ['Titre', 'Statut', 'Priorité', 'Échéance', 'Étiquettes']
            
            st.dataframe(df_display, use_container_width=True)
            
            if len(st.session_state.tasks) > 20:
                st.caption(f"Affichage de 20 tâches sur {len(st.session_state.tasks)}")
        else:
            st.info("Aucune tâche pour le moment.")
    
    with tab3:
        st.subheader("Activité des 7 derniers jours")
        
        # Calculer les tâches par jour
        from datetime import timedelta
        
        days = []
        for i in range(6, -1, -1):
            day_date = datetime.now() - timedelta(days=i)
            day_str = day_date.strftime('%Y-%m-%d')
            
            created_count = sum(1 for t in st.session_state.tasks if t.get('created_at', '')[:10] == day_str)
            completed_count = sum(1 for t in st.session_state.tasks if t.get('status') == 'done' and t.get('updated_at', '')[:10] == day_str)
            
            days.append({
                'date': day_date.strftime('%a %d'),
                'created': created_count,
                'completed': completed_count
            })
        
        df_days = pd.DataFrame(days)
        df_days = df_days.set_index('date')
        
        st.bar_chart(df_days)

# ===== PAGE PARAMÈTRES =====
elif page == "Paramètres":
    st.title("⚙️ Paramètres")
    
    # Section Données
    st.subheader("💾 Données")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Tâches", len(st.session_state.tasks))
    with col2:
        st.metric("Colonnes", len(st.session_state.columns))
    with col3:
        st.metric("Workflows", len(st.session_state.workflows))
    
    st.divider()
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        # Export
        if st.button("📥 Exporter les données", use_container_width=True):
            data = db.export_data()
            json_str = json.dumps(data, indent=2, ensure_ascii=False)
            st.download_button(
                label="Télécharger le fichier JSON",
                data=json_str,
                file_name=f"workflow_manager_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                mime="application/json"
            )
    
    with col2:
        # Import
        uploaded_file = st.file_uploader("📤 Importer des données", type=['json'])
        if uploaded_file:
            if st.button("Importer", use_container_width=True):
                data = json.load(uploaded_file)
                if db.import_data(data):
                    st.success("Données importées avec succès !")
                    refresh_data()
                    st.rerun()
                else:
                    st.error("Erreur lors de l'import des données.")
    
    with col3:
        # Réinitialiser
        if st.button("🗑️ Réinitialiser", use_container_width=True, type="secondary"):
            st.warning("Cette action est irréversible !")
            if st.checkbox("Je comprends que toutes les données seront supprimées"):
                if st.button("Confirmer la réinitialisation", type="primary"):
                    # Supprimer la base de données et recréer
                    import os
                    if os.path.exists(db.db_path):
                        os.remove(db.db_path)
                    st.session_state.tasks = []
                    st.session_state.columns = []
                    st.session_state.workflows = []
                    st.success("Base de données réinitialisée !")
                    st.rerun()
    
    st.divider()
    
    # Section Informations
    st.subheader("ℹ️ Informations")
    
    st.markdown("""
    - **Version:** 1.0.0
    - **Framework:** Streamlit
    - **Base de données:** SQLite
    - **Langage:** Python
    """)

# Footer
st.divider()
st.caption("Workflow Manager v1.0.0 - Développé avec Streamlit")