import requests
import json

# URL base da aplicação
BASE_URL = "https://fazendas-d01731008967.herokuapp.com"

# Função para testar a busca de fazenda por ID
def testar_busca_fazenda_por_id(fazenda_id):
    print(f"\n=== Testando busca da fazenda com ID {fazenda_id} ===")
    
    # Construir a URL com o parâmetro id
    url = f"{BASE_URL}/api/fazendas?id={fazenda_id}"
    
    # Fazer a requisição GET
    print(f"Fazendo requisição para: {url}")
    response = requests.get(url)
    
    # Verificar o status da resposta
    print(f"Status da resposta: {response.status_code}")
    
    # Analisar o conteúdo da resposta
    if response.status_code == 200:
        data = response.json()
        print(f"Número de fazendas retornadas: {len(data)}")
        
        if len(data) > 0:
            for i, fazenda in enumerate(data):
                print(f"Fazenda {i+1}:")
                print(f"  ID: {fazenda.get('id')}")
                print(f"  Nome: {fazenda.get('nome')}")
        else:
            print("Nenhuma fazenda retornada.")
    else:
        print(f"Erro na requisição: {response.text}")

# Testar com diferentes IDs
testar_busca_fazenda_por_id(1)  # ID que sempre funciona
testar_busca_fazenda_por_id(59)  # ID que o usuário mencionou ter problemas
