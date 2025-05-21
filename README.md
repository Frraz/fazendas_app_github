# 🌾 Fazendas App

Aplicação web para gerenciamento de fazendas, permitindo o cadastro e visualização de propriedades agrícolas.

## 🚀 Demonstração

Acesse a aplicação em funcionamento: [https://fazendas-d01731008967.herokuapp.com/dashboard](https://fazendas-d01731008967.herokuapp.com/dashboard)

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Python
- **Hospedagem**: Heroku

## 📁 Estrutura do Projeto

- `src/`: Contém os arquivos-fonte da aplicação.
- `requirements.txt`: Lista de dependências do projeto.
- `Procfile`: Arquivo de configuração para o Heroku.
- `.gitignore`: Arquivos e pastas ignorados pelo Git.

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
