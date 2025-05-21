from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Grupo(db.Model):
    __tablename__ = 'grupos'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    
    fazendas = db.relationship('Fazenda', backref='grupo', lazy=True)
    
    def __repr__(self):
        return f'<Grupo {self.nome}>'

class Pessoa(db.Model):
    __tablename__ = 'pessoas'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100))
    telefone = db.Column(db.String(20))
    
    fazendas = db.relationship('Fazenda', backref='pessoa', lazy=True)
    
    def __repr__(self):
        return f'<Pessoa {self.nome}>'

class Fazenda(db.Model):
    __tablename__ = 'fazendas'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    tipo = db.Column(db.String(50))
    documento_dominio = db.Column(db.String(50))
    matricula = db.Column(db.String(50))
    hectares_documento = db.Column(db.Float)
    car_ha = db.Column(db.String(50))
    area_consolidada_ha = db.Column(db.Float)
    area_uso_contrato = db.Column(db.Float)
    
    # Chaves estrangeiras
    grupo_id = db.Column(db.Integer, db.ForeignKey('grupos.id'))
    pessoa_id = db.Column(db.Integer, db.ForeignKey('pessoas.id'))
    
    # Relacionamentos
    documentos = db.relationship('Documento', backref='fazenda', lazy=True)
    areas = db.relationship('Area', backref='fazenda', lazy=True)
    
    def __repr__(self):
        return f'<Fazenda {self.nome}>'

class Documento(db.Model):
    __tablename__ = 'documentos'
    
    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.String(50), nullable=False)  # ITR, CCIR, LAR
    numero = db.Column(db.String(100))
    data_emissao = db.Column(db.DateTime)
    data_vencimento = db.Column(db.DateTime)
    data_protocolo = db.Column(db.DateTime)
    data_ultima_declaracao = db.Column(db.DateTime)
    status = db.Column(db.String(100))
    observacoes = db.Column(db.Text)
    
    # Chave estrangeira
    fazenda_id = db.Column(db.Integer, db.ForeignKey('fazendas.id'), nullable=False)
    
    def __repr__(self):
        return f'<Documento {self.tipo} - {self.numero}>'
    
    @property
    def dias_para_vencimento(self):
        if self.data_vencimento:
            hoje = datetime.now().date()
            return (self.data_vencimento.date() - hoje).days
        return None

class Area(db.Model):
    __tablename__ = 'areas'
    
    id = db.Column(db.Integer, primary_key=True)
    inscricao_estadual = db.Column(db.String(100))
    area_produtiva_ha = db.Column(db.Float)
    capacidade_producao = db.Column(db.String(100))
    prodes = db.Column(db.String(10))
    hectares_prodes = db.Column(db.Float)
    embargo = db.Column(db.String(10))
    hectares_embargo = db.Column(db.Float)
    
    # Chave estrangeira
    fazenda_id = db.Column(db.Integer, db.ForeignKey('fazendas.id'), nullable=False)
    
    def __repr__(self):
        return f'<Area {self.inscricao_estadual}>'

class Notificacao(db.Model):
    __tablename__ = 'notificacoes'
    
    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.String(50), nullable=False)  # email, sistema
    destinatario = db.Column(db.String(100))
    assunto = db.Column(db.String(200))
    conteudo = db.Column(db.Text)
    data_envio = db.Column(db.DateTime)
    status = db.Column(db.String(50))  # pendente, enviado, erro
    
    # Chave estrangeira
    documento_id = db.Column(db.Integer, db.ForeignKey('documentos.id'))
    
    documento = db.relationship('Documento', backref='notificacoes', lazy=True)
    
    def __repr__(self):
        return f'<Notificacao {self.tipo} - {self.assunto}>'
