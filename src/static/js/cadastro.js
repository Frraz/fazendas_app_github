// cadastro.js - Script para a central de cadastro

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
        console.log(`Carregando fazenda com ID: ${fazendaId}`);
        carregarFazenda(fazendaId);
    }
});

document.getElementById('fazendaNome').addEventListener('input', function() {
    const nome = this.value;
    const feedbackElement = document.getElementById('fazendaNomeFeedback');
    if (!nome) {
        this.classList.add('is-invalid');
        feedbackElement.textContent = 'O nome da fazenda é obrigatório';
    } else {
        this.classList.remove('is-invalid');
        this.classList.add('is-valid');
        feedbackElement.textContent = '';
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
    console.log(`Iniciando carregamento da fazenda ID: ${id}`);
    
    // Garantir que o ID seja tratado como número
    const fazendaId = parseInt(id, 10);
    if (isNaN(fazendaId)) {
        console.error(`ID inválido: ${id}`);
        return;
    }
    
    const url = `/api/fazendas?id=${fazendaId}`;
    console.log(`Fazendo requisição para: ${url}`);
    
    fetch(url)
        .then(response => {
            console.log(`Status da resposta: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log(`Dados recebidos:`, data);
            console.log(`Número de fazendas retornadas: ${data.length}`);
            
            if (data.length > 0) {
                const fazenda = data[0];
                console.log(`Preenchendo formulário com fazenda ID: ${fazenda.id}, Nome: ${fazenda.nome}`);
                preencherFormularioFazenda(fazenda);
            } else {
                console.error(`Nenhuma fazenda encontrada com ID: ${fazendaId}`);
                alert(`Fazenda com ID ${fazendaId} não encontrada.`);
            }
        })
        .catch(error => {
            console.error(`Erro ao carregar fazenda ID ${fazendaId}:`, error);
            alert(`Erro ao carregar dados da fazenda: ${error.message}`);
        });
}

// Funções de manipulação de formulários
function preencherFormularioFazenda(fazenda) {
    console.log(`Preenchendo formulário com fazenda:`, fazenda);
    
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
    document.getElementById('formFazenda').reset();
    document.getElementById('fazendaId').value = '';
    editandoFazendaId = null;
}

function limparFormularioProdutor() {
    document.getElementById('tituloFormProdutor').textContent = 'Novo Produtor';
    document.getElementById('formProdutor').reset();
    document.getElementById('produtorId').value = '';
    editandoProdutorId = null;
}

function limparFormularioGrupo() {
    document.getElementById('tituloFormGrupo').textContent = 'Novo Grupo';
    document.getElementById('formGrupo').reset();
    document.getElementById('grupoId').value = '';
    editandoGrupoId = null;
}

// Funções de edição
function editarGrupo(grupo) {
    document.getElementById('tituloFormGrupo').textContent = `Editar Grupo: ${grupo.nome}`;
    document.getElementById('grupoNome').value = grupo.nome;
    document.getElementById('grupoId').value = grupo.id;
    editandoGrupoId = grupo.id;
    
    // Mudar para a aba de grupo
    const grupoTab = document.getElementById('grupo-tab');
    bootstrap.Tab.getOrCreateInstance(grupoTab).show();
}

function editarProdutor(pessoa) {
    document.getElementById('tituloFormProdutor').textContent = `Editar Produtor: ${pessoa.nome}`;
    document.getElementById('produtorNome').value = pessoa.nome;
    document.getElementById('produtorEmail').value = pessoa.email || '';
    document.getElementById('produtorTelefone').value = pessoa.telefone || '';
    document.getElementById('produtorId').value = pessoa.id;
    editandoProdutorId = pessoa.id;
    
    // Mudar para a aba de produtor
    const produtorTab = document.getElementById('produtor-tab');
    bootstrap.Tab.getOrCreateInstance(produtorTab).show();
}

// Funções de salvamento
function salvarFazenda(event) {
    event.preventDefault();
    
    // Validação básica
    const nome = document.getElementById('fazendaNome').value;
    if (!nome) {
        alert('O nome da fazenda é obrigatório');
        return;
    }
    
    // Coletar dados do formulário
    const fazendaData = {
        nome: nome,
        tipo: document.getElementById('fazendaTipo').value,
        grupo_id: document.getElementById('fazendaGrupo').value || null,
        pessoa_id: document.getElementById('fazendaPessoa').value || null,
        documento_dominio: document.getElementById('fazendaDocumentoDominio').value,
        matricula: document.getElementById('fazendaMatricula').value,
        hectares_documento: document.getElementById('fazendaHectaresDocumento').value,
        car_ha: document.getElementById('fazendaCarHa').value,
        area_consolidada_ha: document.getElementById('fazendaAreaConsolidada').value,
        area_uso_contrato: document.getElementById('fazendaAreaUso').value,
        documentos: [],
        area: {
            inscricao_estadual: document.getElementById('fazendaInscricaoEstadual').value,
            area_produtiva_ha: document.getElementById('fazendaAreaProdutiva').value,
            capacidade_producao: document.getElementById('fazendaCapacidadeProducao').value,
            prodes: document.getElementById('fazendaProdes').value,
            hectares_prodes: document.getElementById('fazendaHectaresProdes').value,
            embargo: document.getElementById('fazendaEmbargo').value,
            hectares_embargo: document.getElementById('fazendaHectaresEmbargo').value
        }
    };
    
    // Adicionar documentos
    // ITR
    const itrNumero = document.getElementById('fazendaITR').value;
    const itrVencimento = document.getElementById('fazendaVencimentoITR').value;
    if (itrNumero || itrVencimento) {
        fazendaData.documentos.push({
            tipo: 'ITR',
            numero: itrNumero,
            data_vencimento: itrVencimento
        });
    }
    
    // CCIR
    const ccirNumero = document.getElementById('fazendaCCIR').value;
    const ccirVencimento = document.getElementById('fazendaVencimentoCCIR').value;
    if (ccirNumero || ccirVencimento) {
        fazendaData.documentos.push({
            tipo: 'CCIR',
            numero: ccirNumero,
            data_vencimento: ccirVencimento
        });
    }
    
    // LAR
    const larNumero = document.getElementById('fazendaLAR').value;
    const larVencimento = document.getElementById('fazendaVencimentoLAR').value;
    const larProtocolo = document.getElementById('fazendaProtocoloLAR').value;
    const larDeclaracao = document.getElementById('fazendaDeclaracaoTramitacao').value;
    if (larNumero || larVencimento || larProtocolo || larDeclaracao) {
        fazendaData.documentos.push({
            tipo: 'LAR',
            numero: larNumero,
            data_vencimento: larVencimento,
            data_protocolo: larProtocolo,
            data_ultima_declaracao: larDeclaracao
        });
    }
    
    // Enviar dados para o servidor
    fetch('/api/fazenda', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(fazendaData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(`Erro: ${data.error}`);
        } else {
            alert('Fazenda salva com sucesso!');
            window.location.href = '/dashboard';
        }
    })
    .catch(error => {
        console.error('Erro ao salvar fazenda:', error);
        alert('Erro ao salvar fazenda. Por favor, tente novamente.');
    });
}

function salvarProdutor(event) {
    event.preventDefault();
    
    // Validação básica
    const nome = document.getElementById('produtorNome').value;
    if (!nome) {
        alert('O nome do produtor é obrigatório');
        return;
    }
    
    // Coletar dados do formulário
    const produtorData = {
        nome: nome,
        email: document.getElementById('produtorEmail').value,
        telefone: document.getElementById('produtorTelefone').value
    };
    
    // Se estiver editando, adicionar o ID
    if (editandoProdutorId) {
        produtorData.id = editandoProdutorId;
    }
    
    // Enviar dados para o servidor
    fetch('/api/pessoa', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(produtorData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(`Erro: ${data.error}`);
        } else {
            alert('Produtor salvo com sucesso!');
            limparFormularioProdutor();
            carregarPessoas();
        }
    })
    .catch(error => {
        console.error('Erro ao salvar produtor:', error);
        alert('Erro ao salvar produtor. Por favor, tente novamente.');
    });
}

function salvarGrupo(event) {
    event.preventDefault();
    
    // Validação básica
    const nome = document.getElementById('grupoNome').value;
    if (!nome) {
        alert('O nome do grupo é obrigatório');
        return;
    }
    
    // Coletar dados do formulário
    const grupoData = {
        nome: nome
    };
    
    // Se estiver editando, adicionar o ID
    if (editandoGrupoId) {
        grupoData.id = editandoGrupoId;
    }
    
    // Enviar dados para o servidor
    fetch('/api/grupo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(grupoData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(`Erro: ${data.error}`);
        } else {
            alert('Grupo salvo com sucesso!');
            limparFormularioGrupo();
            carregarGrupos();
        }
    })
    .catch(error => {
        console.error('Erro ao salvar grupo:', error);
        alert('Erro ao salvar grupo. Por favor, tente novamente.');
    });
}

// Funções utilitárias
function formatarDataParaInput(dataString) {
    if (!dataString) return '';
    
    // Assumindo que dataString está no formato 'YYYY-MM-DD'
    return dataString;
}
