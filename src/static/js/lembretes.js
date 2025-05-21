// Lembretes.js - Script para a central de lembretes

// Variáveis globais
let lembretes = [];
let historico = [];
let filtroGrupoId = '';
let filtroPessoaId = '';
let filtroTipoDocumento = '';
let filtroPrazo = '30';

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Carregar dados iniciais
    carregarGrupos();
    carregarPessoas();
    carregarLembretes();
    carregarHistorico();
    
    // Configurar eventos
    document.getElementById('aplicarFiltros').addEventListener('click', aplicarFiltros);
    document.getElementById('btnConfigurarLembretes').addEventListener('click', abrirModalConfiguracao);
    document.getElementById('btnSalvarConfiguracao').addEventListener('click', salvarConfiguracao);
    document.getElementById('btnEnviarTodosLembretes').addEventListener('click', enviarTodosLembretes);
    document.getElementById('btnEnviarNotificacao').addEventListener('click', enviarNotificacao);
    
    // Carregar configurações salvas
    carregarConfiguracoes();
});

// Funções de carregamento de dados
function carregarGrupos() {
    fetch('/api/grupos')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('filtroGrupo');
            data.forEach(grupo => {
                const option = document.createElement('option');
                option.value = grupo.id;
                option.textContent = grupo.nome;
                select.appendChild(option);
            });
        })
        .catch(error => console.error('Erro ao carregar grupos:', error));
}

function carregarPessoas() {
    fetch('/api/pessoas')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('filtroPessoa');
            data.forEach(pessoa => {
                const option = document.createElement('option');
                option.value = pessoa.id;
                option.textContent = pessoa.nome;
                select.appendChild(option);
            });
        })
        .catch(error => console.error('Erro ao carregar pessoas:', error));
}

function carregarLembretes() {
    let url = '/api/documentos/vencimentos';
    const params = new URLSearchParams();
    
    params.append('dias', filtroPrazo === '-1' ? '0' : filtroPrazo);
    
    if (filtroGrupoId) {
        params.append('grupo_id', filtroGrupoId);
    }
    
    if (filtroPessoaId) {
        params.append('pessoa_id', filtroPessoaId);
    }
    
    if (filtroTipoDocumento) {
        params.append('tipo', filtroTipoDocumento);
    }
    
    url += '?' + params.toString();
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            lembretes = data;
            
            // Filtrar por vencidos se necessário
            if (filtroPrazo === '-1') {
                lembretes = lembretes.filter(doc => doc.dias_para_vencimento < 0);
            }
            
            atualizarTabelaLembretes();
        })
        .catch(error => console.error('Erro ao carregar lembretes:', error));
}

function carregarHistorico() {
    fetch('/api/notificacoes/historico')
        .then(response => response.json())
        .then(data => {
            historico = data;
            atualizarTabelaHistorico();
        })
        .catch(error => console.error('Erro ao carregar histórico:', error));
}

// Funções de atualização da interface
function atualizarTabelaLembretes() {
    const tbody = document.getElementById('tabelaLembretes');
    tbody.innerHTML = '';
    
    lembretes.forEach(doc => {
        const tr = document.createElement('tr');
        
        // Fazenda
        const tdFazenda = document.createElement('td');
        tdFazenda.textContent = doc.fazenda_nome || '-';
        tr.appendChild(tdFazenda);
        
        // Produtor
        const tdProdutor = document.createElement('td');
        tdProdutor.textContent = doc.pessoa_nome || '-';
        tr.appendChild(tdProdutor);
        
        // Grupo
        const tdGrupo = document.createElement('td');
        tdGrupo.textContent = doc.grupo_nome || '-';
        tr.appendChild(tdGrupo);
        
        // Documento
        const tdDocumento = document.createElement('td');
        tdDocumento.textContent = `${doc.tipo} - ${doc.numero}`;
        tr.appendChild(tdDocumento);
        
        // Vencimento
        const tdVencimento = document.createElement('td');
        tdVencimento.textContent = formatarData(doc.data_vencimento);
        tr.appendChild(tdVencimento);
        
        // Dias Restantes
        const tdDias = document.createElement('td');
        const diasRestantes = doc.dias_para_vencimento;
        tdDias.textContent = diasRestantes;
        
        if (diasRestantes < 0) {
            tdDias.className = 'status-vencido';
        } else if (diasRestantes <= 7) {
            tdDias.className = 'status-proximo';
        } else if (diasRestantes <= 30) {
            tdDias.className = 'status-proximo';
        } else {
            tdDias.className = 'status-ok';
        }
        
        tr.appendChild(tdDias);
        
        // Status
        const tdStatus = document.createElement('td');
        if (diasRestantes < 0) {
            tdStatus.textContent = 'Vencido';
            tdStatus.className = 'status-vencido';
        } else if (diasRestantes <= 7) {
            tdStatus.textContent = 'Crítico';
            tdStatus.className = 'status-vencido';
        } else if (diasRestantes <= 30) {
            tdStatus.textContent = 'Atenção';
            tdStatus.className = 'status-proximo';
        } else {
            tdStatus.textContent = 'Regular';
            tdStatus.className = 'status-ok';
        }
        tr.appendChild(tdStatus);
        
        // Ações
        const tdAcoes = document.createElement('td');
        
        // Botão de notificação
        const btnNotificar = document.createElement('button');
        btnNotificar.className = 'btn btn-sm btn-primary';
        btnNotificar.innerHTML = '<i class="bi bi-envelope"></i>';
        btnNotificar.title = 'Enviar notificação';
        btnNotificar.addEventListener('click', () => abrirModalNotificacao(doc));
        tdAcoes.appendChild(btnNotificar);
        
        tr.appendChild(tdAcoes);
        
        tbody.appendChild(tr);
    });
}

function atualizarTabelaHistorico() {
    const tbody = document.getElementById('tabelaHistorico');
    tbody.innerHTML = '';
    
    historico.forEach(notificacao => {
        const tr = document.createElement('tr');
        
        // Data
        const tdData = document.createElement('td');
        tdData.textContent = formatarDataHora(notificacao.data_envio);
        tr.appendChild(tdData);
        
        // Destinatário
        const tdDestinatario = document.createElement('td');
        tdDestinatario.textContent = notificacao.destinatario;
        tr.appendChild(tdDestinatario);
        
        // Assunto
        const tdAssunto = document.createElement('td');
        tdAssunto.textContent = notificacao.assunto;
        tr.appendChild(tdAssunto);
        
        // Documento
        const tdDocumento = document.createElement('td');
        if (notificacao.documento) {
            tdDocumento.textContent = `${notificacao.documento.tipo} - ${notificacao.documento.fazenda_nome}`;
        } else {
            tdDocumento.textContent = '-';
        }
        tr.appendChild(tdDocumento);
        
        // Status
        const tdStatus = document.createElement('td');
        tdStatus.textContent = notificacao.status;
        if (notificacao.status === 'enviado') {
            tdStatus.className = 'status-ok';
        } else if (notificacao.status === 'erro') {
            tdStatus.className = 'status-vencido';
        } else {
            tdStatus.className = 'status-proximo';
        }
        tr.appendChild(tdStatus);
        
        // Ações
        const tdAcoes = document.createElement('td');
        
        // Botão de visualizar
        const btnVisualizar = document.createElement('button');
        btnVisualizar.className = 'btn btn-sm btn-info';
        btnVisualizar.innerHTML = '<i class="bi bi-eye"></i>';
        btnVisualizar.title = 'Visualizar conteúdo';
        btnVisualizar.addEventListener('click', () => visualizarNotificacao(notificacao));
        tdAcoes.appendChild(btnVisualizar);
        
        tr.appendChild(tdAcoes);
        
        tbody.appendChild(tr);
    });
}

// Funções de interação
function aplicarFiltros() {
    filtroGrupoId = document.getElementById('filtroGrupo').value;
    filtroPessoaId = document.getElementById('filtroPessoa').value;
    filtroTipoDocumento = document.getElementById('filtroTipoDocumento').value;
    filtroPrazo = document.getElementById('filtroPrazo').value;
    
    carregarLembretes();
}

function abrirModalConfiguracao() {
    const modal = new bootstrap.Modal(document.getElementById('modalConfiguracao'));
    modal.show();
}

function abrirModalNotificacao(documento) {
    // Preencher campos do modal
    document.getElementById('documentoId').value = documento.id;
    
    // Buscar e-mail do produtor ou usar e-mail padrão
    const emailPadrao = localStorage.getItem('emailPadrao') || '';
    document.getElementById('emailDestinatario').value = emailPadrao;
    
    document.getElementById('assuntoEmail').value = `Aviso de Vencimento: ${documento.tipo} - ${documento.fazenda_nome}`;
    
    const conteudo = `Prezado(a),

Informamos que o documento ${documento.tipo} da fazenda ${documento.fazenda_nome} vencerá em ${documento.dias_para_vencimento} dias (${formatarData(documento.data_vencimento)}).

Por favor, providencie a renovação o quanto antes.

Atenciosamente,
Sistema de Controle de Documentação de Fazendas`;
    
    document.getElementById('conteudoEmail').value = conteudo;
    
    // Exibir modal
    const modal = new bootstrap.Modal(document.getElementById('modalNotificacao'));
    modal.show();
}

function enviarNotificacao() {
    const documentoId = document.getElementById('documentoId').value;
    const destinatario = document.getElementById('emailDestinatario').value;
    const assunto = document.getElementById('assuntoEmail').value;
    const conteudo = document.getElementById('conteudoEmail').value;
    
    // Validar campos
    if (!destinatario || !assunto || !conteudo) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    // Enviar notificação
    fetch('/api/notificacao/email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            documento_id: documentoId,
            destinatario: destinatario,
            assunto: assunto,
            conteudo: conteudo
        })
    })
    .then(response => response.json())
    .then(data => {
        alert('Notificação enviada com sucesso!');
        
        // Fechar modal
        const modalElement = document.getElementById('modalNotificacao');
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal.hide();
        
        // Atualizar histórico
        carregarHistorico();
    })
    .catch(error => {
        console.error('Erro ao enviar notificação:', error);
        alert('Erro ao enviar notificação. Por favor, tente novamente.');
    });
}

function enviarTodosLembretes() {
    if (lembretes.length === 0) {
        alert('Não há lembretes para enviar.');
        return;
    }
    
    if (!confirm(`Deseja enviar notificações para todos os ${lembretes.length} documentos listados?`)) {
        return;
    }
    
    // Obter e-mail padrão
    const emailPadrao = localStorage.getItem('emailPadrao') || '';
    if (!emailPadrao) {
        alert('Por favor, configure um e-mail padrão para notificações em massa.');
        abrirModalConfiguracao();
        return;
    }
    
    // Preparar notificações
    const notificacoes = lembretes.map(doc => {
        return {
            documento_id: doc.id,
            destinatario: emailPadrao,
            assunto: `Aviso de Vencimento: ${doc.tipo} - ${doc.fazenda_nome}`,
            conteudo: `Prezado(a),

Informamos que o documento ${doc.tipo} da fazenda ${doc.fazenda_nome} vencerá em ${doc.dias_para_vencimento} dias (${formatarData(doc.data_vencimento)}).

Por favor, providencie a renovação o quanto antes.

Atenciosamente,
Sistema de Controle de Documentação de Fazendas`
        };
    });
    
    // Enviar notificações em lote
    fetch('/api/notificacao/email/lote', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificacoes)
    })
    .then(response => response.json())
    .then(data => {
        alert(`${data.enviados} notificações enviadas com sucesso!`);
        
        // Atualizar histórico
        carregarHistorico();
    })
    .catch(error => {
        console.error('Erro ao enviar notificações em lote:', error);
        alert('Erro ao enviar notificações. Por favor, tente novamente.');
    });
}

function visualizarNotificacao(notificacao) {
    alert(`Assunto: ${notificacao.assunto}\n\nConteúdo:\n${notificacao.conteudo}`);
}

function salvarConfiguracao() {
    const emailPadrao = document.getElementById('emailPadrao').value;
    const lembrete30dias = document.getElementById('lembrete30dias').checked;
    const lembrete15dias = document.getElementById('lembrete15dias').checked;
    const lembrete7dias = document.getElementById('lembrete7dias').checked;
    const lembreteVencido = document.getElementById('lembreteVencido').checked;
    
    // Salvar configurações no localStorage
    localStorage.setItem('emailPadrao', emailPadrao);
    localStorage.setItem('lembrete30dias', lembrete30dias);
    localStorage.setItem('lembrete15dias', lembrete15dias);
    localStorage.setItem('lembrete7dias', lembrete7dias);
    localStorage.setItem('lembreteVencido', lembreteVencido);
    
    // Enviar configurações para o servidor
    fetch('/api/configuracoes/lembretes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email_padrao: emailPadrao,
            lembrete_30_dias: lembrete30dias,
            lembrete_15_dias: lembrete15dias,
            lembrete_7_dias: lembrete7dias,
            lembrete_vencido: lembreteVencido
        })
    })
    .then(response => response.json())
    .then(data => {
        alert('Configurações salvas com sucesso!');
        
        // Fechar modal
        const modalElement = document.getElementById('modalConfiguracao');
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal.hide();
    })
    .catch(error => {
        console.error('Erro ao salvar configurações:', error);
        alert('Erro ao salvar configurações. Por favor, tente novamente.');
    });
}

function carregarConfiguracoes() {
    // Carregar configurações do localStorage
    const emailPadrao = localStorage.getItem('emailPadrao') || '';
    const lembrete30dias = localStorage.getItem('lembrete30dias') === 'true';
    const lembrete15dias = localStorage.getItem('lembrete15dias') === 'true';
    const lembrete7dias = localStorage.getItem('lembrete7dias') === 'true';
    const lembreteVencido = localStorage.getItem('lembreteVencido') === 'true';
    
    // Preencher formulário
    document.getElementById('emailPadrao').value = emailPadrao;
    document.getElementById('lembrete30dias').checked = lembrete30dias;
    document.getElementById('lembrete15dias').checked = lembrete15dias;
    document.getElementById('lembrete7dias').checked = lembrete7dias;
    document.getElementById('lembreteVencido').checked = lembreteVencido;
}

// Funções auxiliares
function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

function formatarDataHora(dataString) {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR');
}
