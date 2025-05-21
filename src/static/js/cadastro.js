// Cadastro.js - Script para a central de cadastro

// Variáveis globais
let editandoFazendaId = null;
let editandoProdutorId = null;
let editandoGrupoId = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Carregar dados iniciais
    carregarGrupos();
    carregarPessoas();
    
    // Configurar eventos
    document.getElementById('btnVoltar').addEventListener('click', () => {
        window.location.href = '/dashboard';
    });
    
    // Eventos do formulário de fazenda
    document.getElementById('formFazenda').addEventListener('submit', salvarFazenda);
    document.getElementById('btnLimparFazenda').addEventListener('click', limparFormularioFazenda);
    
    // Eventos do formulário de produtor
    document.getElementById('formProdutor').addEventListener('submit', salvarProdutor);
    document.getElementById('btnLimparProdutor').addEventListener('click', limparFormularioProdutor);
    
    // Eventos do formulário de grupo
    document.getElementById('formGrupo').addEventListener('submit', salvarGrupo);
    document.getElementById('btnLimparGrupo').addEventListener('click', limparFormularioGrupo);
    
    // Verificar se há ID na URL para edição
    const urlParams = new URLSearchParams(window.location.search);
    const fazendaId = urlParams.get('id');
    if (fazendaId) {
        carregarFazenda(fazendaId);
    }
});

// Funções de carregamento de dados
function carregarGrupos() {
    fetch('/api/grupos')
        .then(response => response.json())
        .then(data => {
            // Preencher select de grupos no formulário de fazenda
            const selectGrupo = document.getElementById('fazendaGrupo');
            selectGrupo.innerHTML = '<option value="">Selecione...</option>';
            
            data.forEach(grupo => {
                const option = document.createElement('option');
                option.value = grupo.id;
                option.textContent = grupo.nome;
                selectGrupo.appendChild(option);
            });
            
            // Preencher tabela de grupos
            const tbody = document.getElementById('tabelaGrupos');
            tbody.innerHTML = '';
            
            data.forEach(grupo => {
                const tr = document.createElement('tr');
                
                // Nome
                const tdNome = document.createElement('td');
                tdNome.textContent = grupo.nome;
                tr.appendChild(tdNome);
                
                // Ações
                const tdAcoes = document.createElement('td');
                
                // Botão de editar
                const btnEditar = document.createElement('button');
                btnEditar.className = 'btn btn-sm btn-warning me-1';
                btnEditar.innerHTML = '<i class="bi bi-pencil"></i>';
                btnEditar.title = 'Editar';
                btnEditar.addEventListener('click', () => editarGrupo(grupo));
                tdAcoes.appendChild(btnEditar);
                
                tr.appendChild(tdAcoes);
                
                tbody.appendChild(tr);
            });
        })
        .catch(error => console.error('Erro ao carregar grupos:', error));
}

function carregarPessoas() {
    fetch('/api/pessoas')
        .then(response => response.json())
        .then(data => {
            // Preencher select de pessoas no formulário de fazenda
            const selectPessoa = document.getElementById('fazendaPessoa');
            selectPessoa.innerHTML = '<option value="">Selecione...</option>';
            
            data.forEach(pessoa => {
                const option = document.createElement('option');
                option.value = pessoa.id;
                option.textContent = pessoa.nome;
                selectPessoa.appendChild(option);
            });
            
            // Preencher tabela de produtores
            const tbody = document.getElementById('tabelaProdutores');
            tbody.innerHTML = '';
            
            data.forEach(pessoa => {
                const tr = document.createElement('tr');
                
                // Nome
                const tdNome = document.createElement('td');
                tdNome.textContent = pessoa.nome;
                tr.appendChild(tdNome);
                
                // E-mail
                const tdEmail = document.createElement('td');
                tdEmail.textContent = pessoa.email || '-';
                tr.appendChild(tdEmail);
                
                // Telefone
                const tdTelefone = document.createElement('td');
                tdTelefone.textContent = pessoa.telefone || '-';
                tr.appendChild(tdTelefone);
                
                // Ações
                const tdAcoes = document.createElement('td');
                
                // Botão de editar
                const btnEditar = document.createElement('button');
                btnEditar.className = 'btn btn-sm btn-warning me-1';
                btnEditar.innerHTML = '<i class="bi bi-pencil"></i>';
                btnEditar.title = 'Editar';
                btnEditar.addEventListener('click', () => editarProdutor(pessoa));
                tdAcoes.appendChild(btnEditar);
                
                tr.appendChild(tdAcoes);
                
                tbody.appendChild(tr);
            });
        })
        .catch(error => console.error('Erro ao carregar pessoas:', error));
}

function carregarFazenda(id) {
    fetch(`/api/fazendas?id=${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const fazenda = data[0];
                preencherFormularioFazenda(fazenda);
            }
        })
        .catch(error => console.error('Erro ao carregar fazenda:', error));
}

// Funções de manipulação de formulários
function preencherFormularioFazenda(fazenda) {
    // Atualizar título e ID
    document.getElementById('tituloFormFazenda').textContent = `Editar Fazenda: ${fazenda.nome}`;
    document.getElementById('fazendaId').value = fazenda.id;
    editandoFazendaId = fazenda.id;
    
    // Preencher campos básicos
    document.getElementById('fazendaNome').value = fazenda.nome || '';
    document.getElementById('fazendaTipo').value = fazenda.tipo || '';
    document.getElementById('fazendaGrupo').value = fazenda.grupo_id || '';
    document.getElementById('fazendaPessoa').value = fazenda.pessoa_id || '';
    document.getElementById('fazendaDocumentoDominio').value = fazenda.documento_dominio || '';
    document.getElementById('fazendaMatricula').value = fazenda.matricula || '';
    document.getElementById('fazendaHectaresDocumento').value = fazenda.hectares_documento || '';
    document.getElementById('fazendaCarHa').value = fazenda.car_ha || '';
    document.getElementById('fazendaAreaConsolidada').value = fazenda.area_consolidada_ha || '';
    document.getElementById('fazendaAreaUso').value = fazenda.area_uso_contrato || '';
    
    // Preencher documentos
    if (fazenda.documentos && fazenda.documentos.length > 0) {
        fazenda.documentos.forEach(doc => {
            if (doc.tipo === 'ITR') {
                document.getElementById('fazendaITR').value = doc.numero || '';
                if (doc.data_vencimento) {
                    document.getElementById('fazendaVencimentoITR').value = formatarDataParaInput(doc.data_vencimento);
                }
            } else if (doc.tipo === 'CCIR') {
                document.getElementById('fazendaCCIR').value = doc.numero || '';
                if (doc.data_vencimento) {
                    document.getElementById('fazendaVencimentoCCIR').value = formatarDataParaInput(doc.data_vencimento);
                }
            } else if (doc.tipo === 'LAR') {
                document.getElementById('fazendaLAR').value = doc.numero || '';
                if (doc.data_vencimento) {
                    document.getElementById('fazendaVencimentoLAR').value = formatarDataParaInput(doc.data_vencimento);
                }
                if (doc.data_protocolo) {
                    document.getElementById('fazendaProtocoloLAR').value = formatarDataParaInput(doc.data_protocolo);
                }
                if (doc.data_ultima_declaracao) {
                    document.getElementById('fazendaDeclaracaoTramitacao').value = formatarDataParaInput(doc.data_ultima_declaracao);
                }
            }
        });
    }
    
    // Preencher área
    if (fazenda.area) {
        document.getElementById('fazendaInscricaoEstadual').value = fazenda.area.inscricao_estadual || '';
        document.getElementById('fazendaAreaProdutiva').value = fazenda.area.area_produtiva_ha || '';
        document.getElementById('fazendaCapacidadeProducao').value = fazenda.area.capacidade_producao || '';
        document.getElementById('fazendaProdes').value = fazenda.area.prodes || '';
        document.getElementById('fazendaHectaresProdes').value = fazenda.area.hectares_prodes || '';
        document.getElementById('fazendaEmbargo').value = fazenda.area.embargo || '';
        document.getElementById('fazendaHectaresEmbargo').value = fazenda.area.hectares_embargo || '';
    }
}

function limparFormularioFazenda() {
    document.getElementById('tituloFormFazenda').textContent = 'Nova Fazenda';
    document.getElementById('fazendaId').value = '';
    document.getElementById('formFazenda').reset();
    editandoFazendaId = null;
}

function limparFormularioProdutor() {
    document.getElementById('tituloFormProdutor').textContent = 'Novo Produtor';
    document.getElementById('produtorId').value = '';
    document.getElementById('formProdutor').reset();
    editandoProdutorId = null;
}

function limparFormularioGrupo() {
    document.getElementById('tituloFormGrupo').textContent = 'Novo Grupo';
    document.getElementById('grupoId').value = '';
    document.getElementById('formGrupo').reset();
    editandoGrupoId = null;
}

function editarProdutor(pessoa) {
    document.getElementById('tituloFormProdutor').textContent = `Editar Produtor: ${pessoa.nome}`;
    document.getElementById('produtorId').value = pessoa.id;
    document.getElementById('produtorNome').value = pessoa.nome || '';
    document.getElementById('produtorEmail').value = pessoa.email || '';
    document.getElementById('produtorTelefone').value = pessoa.telefone || '';
    editandoProdutorId = pessoa.id;
    
    // Mudar para a aba de produtor
    const produtorTab = document.getElementById('produtor-tab');
    bootstrap.Tab.getOrCreateInstance(produtorTab).show();
}

function editarGrupo(grupo) {
    document.getElementById('tituloFormGrupo').textContent = `Editar Grupo: ${grupo.nome}`;
    document.getElementById('grupoId').value = grupo.id;
    document.getElementById('grupoNome').value = grupo.nome || '';
    editandoGrupoId = grupo.id;
    
    // Mudar para a aba de grupo
    const grupoTab = document.getElementById('grupo-tab');
    bootstrap.Tab.getOrCreateInstance(grupoTab).show();
}

// Funções de salvamento
function salvarFazenda(event) {
    event.preventDefault();
    
    // Coletar dados do formulário
    const fazendaData = {
        nome: document.getElementById('fazendaNome').value,
        tipo: document.getElementById('fazendaTipo').value,
        grupo_id: document.getElementById('fazendaGrupo').value || null,
        pessoa_id: document.getElementById('fazendaPessoa').value || null,
        documento_dominio: document.getElementById('fazendaDocumentoDominio').value,
        matricula: document.getElementById('fazendaMatricula').value,
        hectares_documento: parseFloat(document.getElementById('fazendaHectaresDocumento').value) || null,
        car_ha: document.getElementById('fazendaCarHa').value,
        area_consolidada_ha: parseFloat(document.getElementById('fazendaAreaConsolidada').value) || null,
        area_uso_contrato: parseFloat(document.getElementById('fazendaAreaUso').value) || null,
        documentos: []
    };
    
    // Adicionar documentos
    // ITR
    const itrNumero = document.getElementById('fazendaITR').value;
    const itrVencimento = document.getElementById('fazendaVencimentoITR').value;
    if (itrNumero) {
        fazendaData.documentos.push({
            tipo: 'ITR',
            numero: itrNumero,
            data_vencimento: itrVencimento || null
        });
    }
    
    // CCIR
    const ccirNumero = document.getElementById('fazendaCCIR').value;
    const ccirVencimento = document.getElementById('fazendaVencimentoCCIR').value;
    if (ccirNumero) {
        fazendaData.documentos.push({
            tipo: 'CCIR',
            numero: ccirNumero,
            data_vencimento: ccirVencimento || null
        });
    }
    
    // LAR
    const larNumero = document.getElementById('fazendaLAR').value;
    const larVencimento = document.getElementById('fazendaVencimentoLAR').value;
    const larProtocolo = document.getElementById('fazendaProtocoloLAR').value;
    const larDeclaracao = document.getElementById('fazendaDeclaracaoTramitacao').value;
    if (larNumero) {
        fazendaData.documentos.push({
            tipo: 'LAR',
            numero: larNumero,
            data_vencimento: larVencimento || null,
            data_protocolo: larProtocolo || null,
            data_ultima_declaracao: larDeclaracao || null
        });
    }
    
    // Adicionar área
    fazendaData.area = {
        inscricao_estadual: document.getElementById('fazendaInscricaoEstadual').value,
        area_produtiva_ha: parseFloat(document.getElementById('fazendaAreaProdutiva').value) || null,
        capacidade_producao: document.getElementById('fazendaCapacidadeProducao').value,
        prodes: document.getElementById('fazendaProdes').value,
        hectares_prodes: parseFloat(document.getElementById('fazendaHectaresProdes').value) || null,
        embargo: document.getElementById('fazendaEmbargo').value,
        hectares_embargo: parseFloat(document.getElementById('fazendaHectaresEmbargo').value) || null
    };
    
    // Enviar dados para o servidor
    const url = editandoFazendaId ? `/api/fazenda/${editandoFazendaId}` : '/api/fazenda';
    const method = editandoFazendaId ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(fazendaData)
    })
    .then(response => response.json())
    .then(data => {
        alert(editandoFazendaId ? 'Fazenda atualizada com sucesso!' : 'Fazenda cadastrada com sucesso!');
        limparFormularioFazenda();
        window.location.href = '/dashboard';
    })
    .catch(error => {
        console.error('Erro ao salvar fazenda:', error);
        alert('Erro ao salvar fazenda. Por favor, tente novamente.');
    });
}

function salvarProdutor(event) {
    event.preventDefault();
    
    // Coletar dados do formulário
    const produtorData = {
        nome: document.getElementById('produtorNome').value,
        email: document.getElementById('produtorEmail').value,
        telefone: document.getElementById('produtorTelefone').value
    };
    
    // Enviar dados para o servidor
    const url = editandoProdutorId ? `/api/pessoa/${editandoProdutorId}` : '/api/pessoa';
    const method = editandoProdutorId ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(produtorData)
    })
    .then(response => response.json())
    .then(data => {
        alert(editandoProdutorId ? 'Produtor atualizado com sucesso!' : 'Produtor cadastrado com sucesso!');
        limparFormularioProdutor();
        carregarPessoas();
    })
    .catch(error => {
        console.error('Erro ao salvar produtor:', error);
        alert('Erro ao salvar produtor. Por favor, tente novamente.');
    });
}

function salvarGrupo(event) {
    event.preventDefault();
    
    // Coletar dados do formulário
    const grupoData = {
        nome: document.getElementById('grupoNome').value
    };
    
    // Enviar dados para o servidor
    const url = editandoGrupoId ? `/api/grupo/${editandoGrupoId}` : '/api/grupo';
    const method = editandoGrupoId ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(grupoData)
    })
    .then(response => response.json())
    .then(data => {
        alert(editandoGrupoId ? 'Grupo atualizado com sucesso!' : 'Grupo cadastrado com sucesso!');
        limparFormularioGrupo();
        carregarGrupos();
    })
    .catch(error => {
        console.error('Erro ao salvar grupo:', error);
        alert('Erro ao salvar grupo. Por favor, tente novamente.');
    });
}

// Funções auxiliares
function formatarDataParaInput(dataString) {
    const data = new Date(dataString);
    return data.toISOString().split('T')[0];
}
