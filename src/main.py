#main.py

import os
from flask import Flask, render_template, jsonify, request, redirect, url_for
from datetime import datetime, timedelta

# Inicialização da aplicação Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'fazendas_app_secret_key')

# Caminho para os arquivos JSON
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

# Funções para carregar dados
def carregar_grupos():
    import json
    with open(os.path.join(DATA_DIR, 'grupos.json'), 'r', encoding='utf-8') as f:
        return json.load(f)

def carregar_pessoas():
    import json
    with open(os.path.join(DATA_DIR, 'pessoas.json'), 'r', encoding='utf-8') as f:
        return json.load(f)

def carregar_fazendas():
    import json
    with open(os.path.join(DATA_DIR, 'fazendas.json'), 'r', encoding='utf-8') as f:
        return json.load(f)

def carregar_documentos():
    import json
    with open(os.path.join(DATA_DIR, 'documentos.json'), 'r', encoding='utf-8') as f:
        return json.load(f)

def carregar_areas():
    import json
    with open(os.path.join(DATA_DIR, 'areas.json'), 'r', encoding='utf-8') as f:
        return json.load(f)

# Rotas da API
@app.route('/api/grupos')
def api_grupos():
    return jsonify(carregar_grupos())

@app.route('/api/pessoas')
def api_pessoas():
    return jsonify(carregar_pessoas())

@app.route('/api/fazendas')
def api_fazendas():
    import json
    fazendas = carregar_fazendas()
    grupos = {grupo['id']: grupo for grupo in carregar_grupos()}
    pessoas = {pessoa['id']: pessoa for pessoa in carregar_pessoas()}
    
    # Enriquecer fazendas com nomes de grupo e pessoa
    for fazenda in fazendas:
        if fazenda.get('grupo_id'):
            grupo = grupos.get(fazenda['grupo_id'])
            fazenda['grupo_nome'] = grupo['nome'] if grupo else None
        else:
            fazenda['grupo_nome'] = None
            
        if fazenda.get('pessoa_id'):
            pessoa = pessoas.get(fazenda['pessoa_id'])
            fazenda['pessoa_nome'] = pessoa['nome'] if pessoa else None
        else:
            fazenda['pessoa_nome'] = None
    
    return jsonify(fazendas)

@app.route('/api/fazendas/<int:fazenda_id>')
def api_fazenda(fazenda_id):
    import json
    fazendas = carregar_fazendas()
    for fazenda in fazendas:
        if fazenda['id'] == fazenda_id:
            return jsonify(fazenda)
    return jsonify({'error': 'Fazenda não encontrada'}), 404

@app.route('/api/documentos')
def api_documentos():
    import json
    documentos = carregar_documentos()
    fazendas = {fazenda['id']: fazenda for fazenda in carregar_fazendas()}
    
    # Enriquecer documentos com informações da fazenda
    for doc in documentos:
        if doc.get('fazenda_id'):
            fazenda = fazendas.get(doc['fazenda_id'])
            if fazenda:
                doc['fazenda_nome'] = fazenda['nome']
                doc['grupo_id'] = fazenda.get('grupo_id')
                doc['pessoa_id'] = fazenda.get('pessoa_id')
    
    return jsonify(documentos)

@app.route('/api/areas')
def api_areas():
    import json
    areas = carregar_areas()
    fazendas = {fazenda['id']: fazenda for fazenda in carregar_fazendas()}
    
    # Enriquecer áreas com informações da fazenda
    for area in areas:
        if area.get('fazenda_id'):
            fazenda = fazendas.get(area['fazenda_id'])
            if fazenda:
                area['fazenda_nome'] = fazenda['nome']
                area['grupo_id'] = fazenda.get('grupo_id')
                area['pessoa_id'] = fazenda.get('pessoa_id')
    
    return jsonify(areas)

@app.route('/api/documentos/vencimentos')
def api_vencimentos():
    import json
    documentos = carregar_documentos()
    fazendas = {fazenda['id']: fazenda for fazenda in carregar_fazendas()}
    grupos = {grupo['id']: grupo for grupo in carregar_grupos()}
    pessoas = {pessoa['id']: pessoa for pessoa in carregar_pessoas()}
    
    # Filtros
    grupo_id = request.args.get('grupo_id')
    pessoa_id = request.args.get('pessoa_id')
    tipo = request.args.get('tipo')
    dias = request.args.get('dias', '30')
    
    try:
        dias = int(dias)
    except:
        dias = 30
    
    hoje = datetime.now().date()
    data_limite = hoje + timedelta(days=dias)
    
    resultado = []
    
    for doc in documentos:
        # Verificar data de vencimento
        if not doc.get('data_vencimento'):
            continue
        
        try:
            data_vencimento = datetime.strptime(doc['data_vencimento'], '%Y-%m-%d').date()
        except:
            continue
        
        # Calcular dias para vencimento
        dias_para_vencimento = (data_vencimento - hoje).days
        
        # Filtrar por prazo
        if dias > 0 and (dias_para_vencimento < 0 or dias_para_vencimento > dias):
            continue
        
        # Obter informações da fazenda
        fazenda = fazendas.get(doc.get('fazenda_id'))
        if not fazenda:
            continue
        
        # Filtrar por grupo
        if grupo_id and str(fazenda.get('grupo_id')) != grupo_id:
            continue
        
        # Filtrar por pessoa
        if pessoa_id and str(fazenda.get('pessoa_id')) != pessoa_id:
            continue
        
        # Filtrar por tipo de documento
        if tipo and doc.get('tipo') != tipo:
            continue
        
        # Adicionar informações adicionais
        doc_info = doc.copy()
        doc_info['fazenda_nome'] = fazenda.get('nome')
        
        if fazenda.get('grupo_id'):
            grupo = grupos.get(fazenda['grupo_id'])
            doc_info['grupo_nome'] = grupo['nome'] if grupo else None
        else:
            doc_info['grupo_nome'] = None
            
        if fazenda.get('pessoa_id'):
            pessoa = pessoas.get(fazenda['pessoa_id'])
            doc_info['pessoa_nome'] = pessoa['nome'] if pessoa else None
        else:
            doc_info['pessoa_nome'] = None
        
        doc_info['dias_para_vencimento'] = dias_para_vencimento
        
        resultado.append(doc_info)
    
    # Ordenar por dias para vencimento
    resultado.sort(key=lambda x: x['dias_para_vencimento'])
    
    return jsonify(resultado)

# Corrigindo as rotas de estatísticas para o dashboard
@app.route('/api/estatisticas/areas')
def api_estatisticas_areas():
    import json
    fazendas = carregar_fazendas()
    areas = carregar_areas()
    
    # Filtros
    grupo_id = request.args.get('grupo_id')
    pessoa_id = request.args.get('pessoa_id')
    
    # Aplicar filtros
    if grupo_id:
        fazendas = [f for f in fazendas if str(f.get('grupo_id')) == grupo_id]
    
    if pessoa_id:
        fazendas = [f for f in fazendas if str(f.get('pessoa_id')) == pessoa_id]
    
    # IDs das fazendas filtradas
    fazenda_ids = [f['id'] for f in fazendas]
    
    # Filtrar áreas
    areas_filtradas = [a for a in areas if a.get('fazenda_id') in fazenda_ids]
    
    # Calcular totais
    total_documento = 0
    total_consolidada = 0
    total_produtiva = 0
    total_uso_contrato = 0
    total_prodes = 0
    total_embargo = 0
    
    for fazenda in fazendas:
        if fazenda.get('hectares_documento'):
            total_documento += fazenda['hectares_documento']
        if fazenda.get('area_consolidada_ha'):
            total_consolidada += fazenda['area_consolidada_ha']
        if fazenda.get('area_uso_contrato'):
            total_uso_contrato += fazenda['area_uso_contrato']
    
    for area in areas_filtradas:
        if area.get('area_produtiva_ha'):
            total_produtiva += area['area_produtiva_ha']
        if area.get('hectares_prodes'):
            total_prodes += area['hectares_prodes']
        if area.get('hectares_embargo'):
            total_embargo += area['hectares_embargo']
    
    return jsonify({
        'documento': total_documento,
        'consolidada': total_consolidada,
        'produtiva': total_produtiva,
        'uso_contrato': total_uso_contrato,
        'prodes': total_prodes,
        'embargo': total_embargo
    })

@app.route('/api/estatisticas/documentos')
def api_estatisticas_documentos():
    import json
    documentos = carregar_documentos()
    fazendas = carregar_fazendas()
    
    # Filtros
    grupo_id = request.args.get('grupo_id')
    pessoa_id = request.args.get('pessoa_id')
    
    # Filtrar fazendas
    if grupo_id:
        fazendas = [f for f in fazendas if str(f.get('grupo_id')) == grupo_id]
    
    if pessoa_id:
        fazendas = [f for f in fazendas if str(f.get('pessoa_id')) == pessoa_id]
    
    # IDs das fazendas filtradas
    fazenda_ids = [f['id'] for f in fazendas]
    
    # Filtrar documentos
    documentos_filtrados = [d for d in documentos if d.get('fazenda_id') in fazenda_ids]
    
    # Calcular status dos documentos
    hoje = datetime.now().date()
    
    vencidos = 0
    a_vencer_30 = 0
    a_vencer_60 = 0
    a_vencer_90 = 0
    validos = 0
    
    for doc in documentos_filtrados:
        if not doc.get('data_vencimento'):
            continue
        
        try:
            data_vencimento = datetime.strptime(doc['data_vencimento'], '%Y-%m-%d').date()
        except:
            continue
        
        dias_para_vencimento = (data_vencimento - hoje).days
        
        if dias_para_vencimento < 0:
            vencidos += 1
        elif dias_para_vencimento <= 30:
            a_vencer_30 += 1
        elif dias_para_vencimento <= 60:
            a_vencer_60 += 1
        elif dias_para_vencimento <= 90:
            a_vencer_90 += 1
        else:
            validos += 1
    
    return jsonify({
        'vencidos': vencidos,
        'a_vencer_30': a_vencer_30,
        'a_vencer_60': a_vencer_60,
        'a_vencer_90': a_vencer_90,
        'validos': validos
    })

@app.route('/api/dashboard/resumo')
def api_dashboard_resumo():
    import json
    fazendas = carregar_fazendas()
    areas = carregar_areas()
    
    # Filtros
    grupo_id = request.args.get('grupo_id')
    pessoa_id = request.args.get('pessoa_id')
    
    # Aplicar filtros
    if grupo_id:
        fazendas = [f for f in fazendas if str(f.get('grupo_id')) == grupo_id]
    
    if pessoa_id:
        fazendas = [f for f in fazendas if str(f.get('pessoa_id')) == pessoa_id]
    
    # IDs das fazendas filtradas
    fazenda_ids = [f['id'] for f in fazendas]
    
    # Filtrar áreas
    areas_filtradas = [a for a in areas if a.get('fazenda_id') in fazenda_ids]
    
    # Calcular totais
    total_fazendas = len(fazendas)
    
    area_total = 0
    for fazenda in fazendas:
        if fazenda.get('hectares_documento'):
            area_total += fazenda['hectares_documento']
    
    area_produtiva = 0
    for area in areas_filtradas:
        if area.get('area_produtiva_ha'):
            area_produtiva += area['area_produtiva_ha']
    
    return jsonify({
        'total_fazendas': total_fazendas,
        'area_total': area_total,
        'area_produtiva': area_produtiva
    })

@app.route('/api/notificacoes/historico')
def api_notificacoes_historico():
    # Em um ambiente real, isso viria do banco de dados
    # Para este exemplo, retornamos uma lista vazia
    return jsonify([])

@app.route('/api/notificacao/email', methods=['POST'])
def api_enviar_notificacao():
    # Em um ambiente real, isso enviaria um e-mail
    # Para este exemplo, apenas retornamos sucesso
    return jsonify({'success': True, 'message': 'Notificação enviada com sucesso'})

@app.route('/api/notificacao/email/lote', methods=['POST'])
def api_enviar_notificacoes_lote():
    # Em um ambiente real, isso enviaria múltiplos e-mails
    # Para este exemplo, apenas retornamos sucesso
    return jsonify({
        'enviados': len(request.json) if request.json else 0,
        'total': len(request.json) if request.json else 0,
        'message': 'Notificações enviadas com sucesso'
    })

@app.route('/api/configuracoes/lembretes', methods=['POST'])
def api_configuracoes_lembretes():
    # Em um ambiente real, isso salvaria as configurações
    # Para este exemplo, apenas retornamos sucesso
    return jsonify({'success': True, 'message': 'Configurações salvas com sucesso'})

# Rotas da web
@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/cadastro')
def cadastro():
    return render_template('cadastro.html')

@app.route('/lembretes')
def lembretes():
    return render_template('lembretes.html')

# Rota principal
@app.route('/')
def index():
    return redirect(url_for('dashboard'))

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
