# 🌾 Fazendas App

Aplicação web para gerenciamento de fazendas, permitindo o cadastro e visualização de propriedades agrícolas.

## 🚀 Demonstração

Acesse a aplicação em funcionamento: [https://fazendas-d01731008967.herokuapp.com/dashboard](https://fazendas-d01731008967.herokuapp.com/dashboard)

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Python
- **Hospedagem**: Heroku

## 📁 Estrutura do Projeto

```plaintext
fazendas_app_github/
│
├── SCR/                                                 # Código-fonte principal
│   ├── __pycache__/
│   │   └── __init__.cpython-311.pyc
│   │
│   ├── data/                                            # Dados de exemplo (mock JSON)
│   │   ├── areas.json
│   │   ├── documentos.json
│   │   ├── fazendas.json
│   │   ├── grupos.json
│   │   └── pessoas.json
│   │
│   ├── models/                                          # Modelos de dados (ex: fazenda, usuário)
│   │   ├── __pycache__/
│   │   │   └── fazenda.cpython-311.pyc
│   │   ├── fazenda.py
│   │   └── user.py
│   │
│   ├── routes/                                          # Rotas da aplicação (API e views)
│   │   ├── __pycache__/
│   │   │   ├── api.cpython-311.pyc
│   │   │   ├── api_extra.cpython-311.pyc
│   │   │   ├── api_notificacoes.cpython-311.pyc
│   │   │   └── web.cpython-311.pyc
│   │   ├── api.py
│   │   ├── api_extra.py
│   │   ├── api_notificacoes.py
│   │   ├── user.py
│   │   └── web.py
│   │
│   ├── static/                                          # Arquivos estáticos (CSS, JS, HTML)
│   │   ├── css/
│   │   │   └── styles.css
│   │   ├── js/
│   │   │   ├── cadastro.js
│   │   │   ├── dashboard.js
│   │   │   └── lembretes.js
│   │   └── index.html
│   │
│   └── templates/                                       # Templates HTML (Jinja2)
│       ├── cadastro.html
│       ├── dashboard.html
│       └── lembretes.html
│
├── __init__.py                                          # Inicialização do pacote
├── main.py                                              # Ponto de entrada da aplicação
├── venv/                                                # Ambiente virtual (opcional)
├── Procfile                                             # Configuração para o Heroku
├── README.md                                            # Documentação do projeto
└── requirements.txt                                     # Dependências da aplicação

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/Frraz/fazendas_app_github.git
cd fazendas_app_github

# (Opcional) Crie e ative um ambiente virtual
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate

# Instale as dependências
pip install -r requirements.txt

# Execute a aplicação
python src/app.py
