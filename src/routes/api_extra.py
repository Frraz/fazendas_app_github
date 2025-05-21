from flask import Blueprint, jsonify, request
from src.models.fazenda import db, Grupo, Pessoa

# Criar blueprint para rotas adicionais da API
api_bp_extra = Blueprint('api_extra', __name__)

@api_bp_extra.route('/pessoa', methods=['POST'])
def create_pessoa():
    data = request.json
    
    # Criar nova pessoa
    pessoa = Pessoa(
        nome=data.get('nome'),
        email=data.get('email'),
        telefone=data.get('telefone')
    )
    
    db.session.add(pessoa)
    db.session.commit()
    
    return jsonify({'id': pessoa.id, 'message': 'Produtor cadastrado com sucesso'}), 201

@api_bp_extra.route('/pessoa/<int:id>', methods=['PUT'])
def update_pessoa(id):
    data = request.json
    
    # Buscar pessoa existente
    pessoa = Pessoa.query.get(id)
    if not pessoa:
        return jsonify({'error': 'Produtor não encontrado'}), 404
    
    # Atualizar dados
    pessoa.nome = data.get('nome', pessoa.nome)
    pessoa.email = data.get('email', pessoa.email)
    pessoa.telefone = data.get('telefone', pessoa.telefone)
    
    db.session.commit()
    
    return jsonify({'id': pessoa.id, 'message': 'Produtor atualizado com sucesso'})

@api_bp_extra.route('/grupo', methods=['POST'])
def create_grupo():
    data = request.json
    
    # Criar novo grupo
    grupo = Grupo(
        nome=data.get('nome')
    )
    
    db.session.add(grupo)
    db.session.commit()
    
    return jsonify({'id': grupo.id, 'message': 'Grupo cadastrado com sucesso'}), 201

@api_bp_extra.route('/grupo/<int:id>', methods=['PUT'])
def update_grupo(id):
    data = request.json
    
    # Buscar grupo existente
    grupo = Grupo.query.get(id)
    if not grupo:
        return jsonify({'error': 'Grupo não encontrado'}), 404
    
    # Atualizar dados
    grupo.nome = data.get('nome', grupo.nome)
    
    db.session.commit()
    
    return jsonify({'id': grupo.id, 'message': 'Grupo atualizado com sucesso'})

@api_bp_extra.route('/fazenda/<int:id>', methods=['PUT'])
def update_fazenda(id):
    data = request.json
    
    # Buscar fazenda existente
    from src.models.fazenda import Fazenda, Documento, Area
    fazenda = Fazenda.query.get(id)
    if not fazenda:
        return jsonify({'error': 'Fazenda não encontrada'}), 404
    
    # Atualizar dados básicos
    fazenda.nome = data.get('nome', fazenda.nome)
    fazenda.tipo = data.get('tipo', fazenda.tipo)
    fazenda.documento_dominio = data.get('documento_dominio', fazenda.documento_dominio)
    fazenda.matricula = data.get('matricula', fazenda.matricula)
    fazenda.hectares_documento = data.get('hectares_documento', fazenda.hectares_documento)
    fazenda.car_ha = data.get('car_ha', fazenda.car_ha)
    fazenda.area_consolidada_ha = data.get('area_consolidada_ha', fazenda.area_consolidada_ha)
    fazenda.area_uso_contrato = data.get('area_uso_contrato', fazenda.area_uso_contrato)
    fazenda.grupo_id = data.get('grupo_id', fazenda.grupo_id)
    fazenda.pessoa_id = data.get('pessoa_id', fazenda.pessoa_id)
    
    # Atualizar documentos
    documentos_data = data.get('documentos', [])
    
    # Remover documentos existentes
    Documento.query.filter_by(fazenda_id=fazenda.id).delete()
    
    # Adicionar novos documentos
    for doc_data in documentos_data:
        data_vencimento = None
        if doc_data.get('data_vencimento'):
            from datetime import datetime
            try:
                data_vencimento = datetime.strptime(doc_data.get('data_vencimento'), '%Y-%m-%d')
            except:
                pass
        
        data_protocolo = None
        if doc_data.get('data_protocolo'):
            try:
                data_protocolo = datetime.strptime(doc_data.get('data_protocolo'), '%Y-%m-%d')
            except:
                pass
        
        data_ultima_declaracao = None
        if doc_data.get('data_ultima_declaracao'):
            try:
                data_ultima_declaracao = datetime.strptime(doc_data.get('data_ultima_declaracao'), '%Y-%m-%d')
            except:
                pass
        
        documento = Documento(
            tipo=doc_data.get('tipo'),
            numero=doc_data.get('numero'),
            data_vencimento=data_vencimento,
            data_protocolo=data_protocolo,
            data_ultima_declaracao=data_ultima_declaracao,
            fazenda_id=fazenda.id
        )
        db.session.add(documento)
    
    # Atualizar área
    area_data = data.get('area')
    if area_data:
        # Buscar área existente ou criar nova
        area = Area.query.filter_by(fazenda_id=fazenda.id).first()
        if not area:
            area = Area(fazenda_id=fazenda.id)
            db.session.add(area)
        
        # Atualizar dados
        area.inscricao_estadual = area_data.get('inscricao_estadual', area.inscricao_estadual)
        area.area_produtiva_ha = area_data.get('area_produtiva_ha', area.area_produtiva_ha)
        area.capacidade_producao = area_data.get('capacidade_producao', area.capacidade_producao)
        area.prodes = area_data.get('prodes', area.prodes)
        area.hectares_prodes = area_data.get('hectares_prodes', area.hectares_prodes)
        area.embargo = area_data.get('embargo', area.embargo)
        area.hectares_embargo = area_data.get('hectares_embargo', area.hectares_embargo)
    
    db.session.commit()
    
    return jsonify({'id': fazenda.id, 'message': 'Fazenda atualizada com sucesso'})
