from flask import Blueprint, jsonify, request
from src.models.fazenda import db, Notificacao, Documento, Fazenda
from datetime import datetime, timedelta
import json

# Criar blueprint para rotas de notificações
api_notificacoes = Blueprint('api_notificacoes', __name__)

@api_notificacoes.route('/notificacoes/historico', methods=['GET'])
def get_historico_notificacoes():
    """Retorna o histórico de notificações enviadas"""
    notificacoes = Notificacao.query.order_by(Notificacao.data_envio.desc()).all()
    
    result = []
    for notif in notificacoes:
        documento_data = None
        if notif.documento_id:
            documento = Documento.query.get(notif.documento_id)
            if documento:
                fazenda = Fazenda.query.get(documento.fazenda_id)
                documento_data = {
                    'id': documento.id,
                    'tipo': documento.tipo,
                    'numero': documento.numero,
                    'fazenda_nome': fazenda.nome if fazenda else None
                }
        
        result.append({
            'id': notif.id,
            'tipo': notif.tipo,
            'destinatario': notif.destinatario,
            'assunto': notif.assunto,
            'conteudo': notif.conteudo,
            'data_envio': notif.data_envio.strftime('%Y-%m-%d %H:%M:%S') if notif.data_envio else None,
            'status': notif.status,
            'documento': documento_data
        })
    
    return jsonify(result)

@api_notificacoes.route('/notificacao/email/lote', methods=['POST'])
def enviar_notificacoes_lote():
    """Envia múltiplas notificações por e-mail em lote"""
    notificacoes_data = request.json
    
    if not isinstance(notificacoes_data, list):
        return jsonify({'error': 'Formato inválido. Esperado uma lista de notificações.'}), 400
    
    notificacoes_enviadas = 0
    
    for notif_data in notificacoes_data:
        # Em um ambiente real, aqui seria implementado o envio de e-mail
        # Para este exemplo, apenas registramos a notificação no banco
        
        notificacao = Notificacao(
            tipo='email',
            destinatario=notif_data.get('destinatario'),
            assunto=notif_data.get('assunto'),
            conteudo=notif_data.get('conteudo'),
            data_envio=datetime.now(),
            status='enviado',
            documento_id=notif_data.get('documento_id')
        )
        
        db.session.add(notificacao)
        notificacoes_enviadas += 1
    
    db.session.commit()
    
    return jsonify({
        'enviados': notificacoes_enviadas,
        'total': len(notificacoes_data),
        'message': f'{notificacoes_enviadas} notificações enviadas com sucesso'
    })

@api_notificacoes.route('/configuracoes/lembretes', methods=['POST'])
def salvar_configuracoes_lembretes():
    """Salva as configurações de lembretes automáticos"""
    data = request.json
    
    # Em um ambiente real, essas configurações seriam salvas no banco de dados
    # Para este exemplo, apenas retornamos sucesso
    
    return jsonify({
        'success': True,
        'message': 'Configurações salvas com sucesso'
    })

@api_notificacoes.route('/lembretes/verificar', methods=['GET'])
def verificar_lembretes():
    """Verifica documentos que precisam de lembretes e envia notificações automáticas"""
    # Esta rota seria chamada por um job agendado (cron) para verificar diariamente
    
    # Buscar documentos com vencimento próximo
    hoje = datetime.now().date()
    
    # Documentos que vencem em 30 dias
    data_30_dias = hoje + timedelta(days=30)
    docs_30_dias = Documento.query.filter(
        Documento.data_vencimento == data_30_dias
    ).all()
    
    # Documentos que vencem em 15 dias
    data_15_dias = hoje + timedelta(days=15)
    docs_15_dias = Documento.query.filter(
        Documento.data_vencimento == data_15_dias
    ).all()
    
    # Documentos que vencem em 7 dias
    data_7_dias = hoje + timedelta(days=7)
    docs_7_dias = Documento.query.filter(
        Documento.data_vencimento == data_7_dias
    ).all()
    
    # Documentos que vencem hoje
    docs_hoje = Documento.query.filter(
        Documento.data_vencimento == hoje
    ).all()
    
    # Contadores
    notificacoes_enviadas = 0
    
    # Função para registrar notificação
    def registrar_notificacao(documento, prazo):
        nonlocal notificacoes_enviadas
        
        fazenda = Fazenda.query.get(documento.fazenda_id)
        if not fazenda:
            return
        
        # Em um ambiente real, aqui seria implementado o envio de e-mail
        # Para este exemplo, apenas registramos a notificação no banco
        
        assunto = f"LEMBRETE: Documento {documento.tipo} da fazenda {fazenda.nome} vence em {prazo} dias"
        conteudo = f"""Prezado(a),

Este é um lembrete automático de que o documento {documento.tipo} da fazenda {fazenda.nome} vencerá em {prazo} dias ({documento.data_vencimento.strftime('%d/%m/%Y')}).

Por favor, providencie a renovação o quanto antes.

Atenciosamente,
Sistema de Controle de Documentação de Fazendas"""
        
        notificacao = Notificacao(
            tipo='email',
            destinatario='sistema@exemplo.com',  # Em um ambiente real, seria o e-mail configurado
            assunto=assunto,
            conteudo=conteudo,
            data_envio=datetime.now(),
            status='enviado',
            documento_id=documento.id
        )
        
        db.session.add(notificacao)
        notificacoes_enviadas += 1
    
    # Processar documentos de 30 dias
    for doc in docs_30_dias:
        registrar_notificacao(doc, 30)
    
    # Processar documentos de 15 dias
    for doc in docs_15_dias:
        registrar_notificacao(doc, 15)
    
    # Processar documentos de 7 dias
    for doc in docs_7_dias:
        registrar_notificacao(doc, 7)
    
    # Processar documentos de hoje
    for doc in docs_hoje:
        registrar_notificacao(doc, 0)
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'notificacoes_enviadas': notificacoes_enviadas,
        'documentos_verificados': len(docs_30_dias) + len(docs_15_dias) + len(docs_7_dias) + len(docs_hoje)
    })
