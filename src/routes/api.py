#api.py

from flask import Blueprint, jsonify, request
from src.models.fazenda import db, Grupo, Pessoa, Fazenda, Documento, Area, Notificacao
from datetime import datetime, timedelta
import logging

api_bp = Blueprint('api', __name__)

@api_bp.route('/grupos', methods=['GET'])
def get_grupos():
    grupos = Grupo.query.all()
    return jsonify([{'id': g.id, 'nome': g.nome} for g in grupos])

@api_bp.route('/pessoas', methods=['GET'])
def get_pessoas():
    pessoas = Pessoa.query.all()
    return jsonify([{'id': p.id, 'nome': p.nome} for p in pessoas])

@api_bp.route('/fazendas', methods=['GET'])
def get_fazendas():
    grupo_id = request.args.get('grupo_id', type=int)
    pessoa_id = request.args.get('pessoa_id', type=int)
    
    query = Fazenda.query
    
    if grupo_id:
        query = query.filter_by(grupo_id=grupo_id)
    if pessoa_id:
        query = query.filter_by(pessoa_id=pessoa_id)
    
    fazendas = query.all()
    
    result = []
    for f in fazendas:
        # Buscar documentos relacionados
        documentos = Documento.query.filter_by(fazenda_id=f.id).all()
        docs_data = []
        for doc in documentos:
            doc_data = {
                'id': doc.id,
                'tipo': doc.tipo,
                'numero': doc.numero,
                'data_vencimento': doc.data_vencimento.strftime('%Y-%m-%d') if doc.data_vencimento else None,
                'dias_para_vencimento': doc.dias_para_vencimento
            }
            docs_data.append(doc_data)
        
        # Buscar área relacionada
        area = Area.query.filter_by(fazenda_id=f.id).first()
        area_data = None
        if area:
            area_data = {
                'id': area.id,
                'inscricao_estadual': area.inscricao_estadual,
                'area_produtiva_ha': area.area_produtiva_ha,
                'capacidade_producao': area.capacidade_producao,
                'prodes': area.prodes,
                'hectares_prodes': area.hectares_prodes,
                'embargo': area.embargo,
                'hectares_embargo': area.hectares_embargo
            }
        
        # Dados da fazenda
        fazenda_data = {
            'id': f.id,
            'nome': f.nome,
            'tipo': f.tipo,
            'documento_dominio': f.documento_dominio,
            'matricula': f.matricula,
            'hectares_documento': f.hectares_documento,
            'car_ha': f.car_ha,
            'area_consolidada_ha': f.area_consolidada_ha,
            'area_uso_contrato': f.area_uso_contrato,
            'grupo_id': f.grupo_id,
            'grupo_nome': f.grupo.nome if f.grupo else None,
            'pessoa_id': f.pessoa_id,
            'pessoa_nome': f.pessoa.nome if f.pessoa else None,
            'documentos': docs_data,
            'area': area_data
        }
        result.append(fazenda_data)
    
    return jsonify(result)

@api_bp.route('/documentos/vencimentos', methods=['GET'])
def get_vencimentos():
    dias = request.args.get('dias', default=30, type=int)
    
    hoje = datetime.now().date()
    data_limite = hoje + timedelta(days=dias)
    
    documentos = Documento.query.filter(
        Documento.data_vencimento.isnot(None),
        Documento.data_vencimento <= data_limite,
        Documento.data_vencimento >= hoje
    ).all()
    
    result = []
    for doc in documentos:
        fazenda = Fazenda.query.get(doc.fazenda_id)
        result.append({
            'id': doc.id,
            'tipo': doc.tipo,
            'numero': doc.numero,
            'data_vencimento': doc.data_vencimento.strftime('%Y-%m-%d'),
            'dias_para_vencimento': doc.dias_para_vencimento,
            'fazenda_id': doc.fazenda_id,
            'fazenda_nome': fazenda.nome if fazenda else None,
            'grupo_nome': fazenda.grupo.nome if fazenda and fazenda.grupo else None,
            'pessoa_nome': fazenda.pessoa.nome if fazenda and fazenda.pessoa else None
        })
    
    return jsonify(result)

@api_bp.route('/estatisticas/areas', methods=['GET'])
def get_estatisticas_areas():
    grupo_id = request.args.get('grupo_id', type=int)
    pessoa_id = request.args.get('pessoa_id', type=int)
    
    # Base query para fazendas
    query = db.session.query(Fazenda)
    
    if grupo_id:
        query = query.filter(Fazenda.grupo_id == grupo_id)
    if pessoa_id:
        query = query.filter(Fazenda.pessoa_id == pessoa_id)
    
    fazendas = query.all()
    
    # Coletar dados para estatísticas
    total_hectares_documento = 0
    total_area_produtiva = 0
    total_area_consolidada = 0
    total_area_uso = 0
    total_prodes = 0
    total_embargo = 0
    
    fazenda_ids = [f.id for f in fazendas]
    
    # Somar áreas das fazendas
    for f in fazendas:
        if f.hectares_documento:
            total_hectares_documento += f.hectares_documento
        if f.area_consolidada_ha:
            total_area_consolidada += f.area_consolidada_ha
        if f.area_uso_contrato:
            total_area_uso += f.area_uso_contrato
    
    # Buscar áreas produtivas, prodes e embargo
    areas = Area.query.filter(Area.fazenda_id.in_(fazenda_ids)).all()
    for a in areas:
        if a.area_produtiva_ha:
            total_area_produtiva += a.area_produtiva_ha
        if a.hectares_prodes:
            total_prodes += a.hectares_prodes
        if a.hectares_embargo:
            total_embargo += a.hectares_embargo
    
    return jsonify({
        'total_fazendas': len(fazendas),
        'total_hectares_documento': total_hectares_documento,
        'total_area_produtiva': total_area_produtiva,
        'total_area_consolidada': total_area_consolidada,
        'total_area_uso': total_area_uso,
        'total_prodes': total_prodes,
        'total_embargo': total_embargo
    })

@api_bp.route('/estatisticas/documentos', methods=['GET'])
def get_estatisticas_documentos():
    grupo_id = request.args.get('grupo_id', type=int)
    pessoa_id = request.args.get('pessoa_id', type=int)
    
    # Base query para fazendas
    query = db.session.query(Fazenda)
    
    if grupo_id:
        query = query.filter(Fazenda.grupo_id == grupo_id)
    if pessoa_id:
        query = query.filter(Fazenda.pessoa_id == pessoa_id)
    
    fazendas = query.all()
    fazenda_ids = [f.id for f in fazendas]
    
    # Buscar documentos
    documentos = Documento.query.filter(Documento.fazenda_id.in_(fazenda_ids)).all()
    
    # Contagem por tipo
    tipos_count = {'ITR': 0, 'CCIR': 0, 'LAR': 0}
    
    # Contagem por status de vencimento
    vencimento_count = {
        'vencidos': 0,
        'a_vencer_30_dias': 0,
        'a_vencer_60_dias': 0,
        'a_vencer_90_dias': 0,
        'validos': 0
    }
    
    hoje = datetime.now().date()
    
    for doc in documentos:
        # Contagem por tipo
        if doc.tipo in tipos_count:
            tipos_count[doc.tipo] += 1
        
        # Contagem por status de vencimento
        if doc.data_vencimento:
            dias = (doc.data_vencimento.date() - hoje).days
            if dias < 0:
                vencimento_count['vencidos'] += 1
            elif dias <= 30:
                vencimento_count['a_vencer_30_dias'] += 1
            elif dias <= 60:
                vencimento_count['a_vencer_60_dias'] += 1
            elif dias <= 90:
                vencimento_count['a_vencer_90_dias'] += 1
            else:
                vencimento_count['validos'] += 1
    
    return jsonify({
        'tipos': tipos_count,
        'vencimentos': vencimento_count
    })

#####################################################################################################################################################

@api_bp.route('/fazenda', methods=['POST'])
def create_fazenda():
    try:
        data = request.json
        
        # Validação de dados obrigatórios
        if not data.get('nome'):
            return jsonify({'error': 'O nome da fazenda é obrigatório'}), 400
        
        # Validação de chaves estrangeiras
        if data.get('grupo_id'):
            grupo = Grupo.query.get(data.get('grupo_id'))
            if not grupo:
                return jsonify({'error': 'Grupo não encontrado'}), 400
        
        if data.get('pessoa_id'):
            pessoa = Pessoa.query.get(data.get('pessoa_id'))
            if not pessoa:
                return jsonify({'error': 'Produtor não encontrado'}), 400
        
        # Conversão de tipos para campos numéricos
        try:
            hectares_documento = float(data.get('hectares_documento')) if data.get('hectares_documento') else None
            area_consolidada_ha = float(data.get('area_consolidada_ha')) if data.get('area_consolidada_ha') else None
            area_uso_contrato = float(data.get('area_uso_contrato')) if data.get('area_uso_contrato') else None
        except ValueError:
            return jsonify({'error': 'Valores numéricos inválidos nos campos de área'}), 400
        
        # Criar nova fazenda com valores convertidos
        fazenda = Fazenda(
            nome=data.get('nome'),
            tipo=data.get('tipo'),
            documento_dominio=data.get('documento_dominio'),
            matricula=data.get('matricula'),
            hectares_documento=hectares_documento,
            car_ha=data.get('car_ha'),
            area_consolidada_ha=area_consolidada_ha,
            area_uso_contrato=area_uso_contrato,
            grupo_id=data.get('grupo_id'),
            pessoa_id=data.get('pessoa_id')
        )
        
        db.session.add(fazenda)
        
        try:
            db.session.flush()  # Tenta obter o ID da fazenda
        except Exception as e:
            db.session.rollback()
            # Log do erro para depuração
            print(f"Erro ao criar fazenda: {str(e)}")
            return jsonify({'error': 'Erro ao criar fazenda. Verifique se já existe uma fazenda com o mesmo nome.'}), 400
        
        # Criar documentos
        documentos_data = data.get('documentos', [])
        for doc_data in documentos_data:
            data_vencimento = None
            if doc_data.get('data_vencimento'):
                try:
                    data_vencimento = datetime.strptime(doc_data.get('data_vencimento'), '%Y-%m-%d')
                except ValueError:
                    # Continua sem a data, mas registra o erro
                    print(f"Formato de data inválido: {doc_data.get('data_vencimento')}")
            
            documento = Documento(
                tipo=doc_data.get('tipo'),
                numero=doc_data.get('numero'),
                data_vencimento=data_vencimento,
                fazenda_id=fazenda.id
            )
            db.session.add(documento)
        
        # Criar área
        area_data = data.get('area')
        if area_data:
            try:
                area_produtiva_ha = float(area_data.get('area_produtiva_ha')) if area_data.get('area_produtiva_ha') else None
                hectares_prodes = float(area_data.get('hectares_prodes')) if area_data.get('hectares_prodes') else None
                hectares_embargo = float(area_data.get('hectares_embargo')) if area_data.get('hectares_embargo') else None
            except ValueError:
                return jsonify({'error': 'Valores numéricos inválidos nos campos de área produtiva, prodes ou embargo'}), 400
            
            area = Area(
                inscricao_estadual=area_data.get('inscricao_estadual'),
                area_produtiva_ha=area_produtiva_ha,
                capacidade_producao=area_data.get('capacidade_producao'),
                prodes=area_data.get('prodes'),
                hectares_prodes=hectares_prodes,
                embargo=area_data.get('embargo'),
                hectares_embargo=hectares_embargo,
                fazenda_id=fazenda.id
            )
            db.session.add(area)
        
        # Tenta realizar o commit com tratamento de exceção
        try:
            db.session.commit()
            return jsonify({'id': fazenda.id, 'message': 'Fazenda criada com sucesso'}), 201
        except Exception as e:
            db.session.rollback()
            # Log do erro para depuração
            print(f"Erro ao salvar fazenda: {str(e)}")
            return jsonify({'error': 'Erro ao salvar fazenda. Por favor, verifique os dados e tente novamente.'}), 500
    
    except Exception as e:
        # Tratamento de exceções gerais
        db.session.rollback()
        # Log do erro para depuração
        print(f"Erro não tratado: {str(e)}")
        return jsonify({'error': 'Ocorreu um erro inesperado. Por favor, tente novamente.'}), 500

    
#####################################################################################################################################################
    

@api_bp.route('/notificacao/email', methods=['POST'])
def enviar_notificacao_email():
    data = request.json
    
    # Em um ambiente real, aqui seria implementado o envio de e-mail
    # Para este exemplo, apenas registramos a notificação no banco
    
    notificacao = Notificacao(
        tipo='email',
        destinatario=data.get('destinatario'),
        assunto=data.get('assunto'),
        conteudo=data.get('conteudo'),
        data_envio=datetime.now(),
        status='enviado',
        documento_id=data.get('documento_id')
    )
    
    db.session.add(notificacao)
    db.session.commit()
    
    return jsonify({'id': notificacao.id, 'message': 'Notificação registrada com sucesso'}), 201

# Configuração de logging
logging.basicConfig(
    filename='app.log',
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)