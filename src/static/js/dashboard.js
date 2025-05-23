// Dashboard.js - Script para o dashboard interativo

// Variáveis globais
let chartAreas = null;
let chartDocumentos = null;
let dadosFazendas = [];
let dadosVencimentos = [];
let filtroGrupoId = '';
let filtroPessoaId = '';

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Carregar dados iniciais
    carregarGrupos();
    carregarPessoas();
    carregarFazendas();
    carregarVencimentos();
    carregarEstatisticas();
    
    // Configurar eventos
    document.getElementById('aplicarFiltros').addEventListener('click', aplicarFiltros);
    document.getElementById('btnNovaFazenda').addEventListener('click', () => {
        window.location.href = '/cadastro';
    });
    document.getElementById('btnEnviarNotificacao').addEventListener('click', enviarNotificacao);
    document.getElementById('exportarPDF').addEventListener('click', exportarPDF);
    document.getElementById('exportarExcel').addEventListener('click', exportarExcel);
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

function carregarFazendas() {
    let url = '/api/fazendas';
    const params = new URLSearchParams();
    
    if (filtroGrupoId) {
        params.append('grupo_id', filtroGrupoId);
    }
    
    if (filtroPessoaId) {
        params.append('pessoa_id', filtroPessoaId);
    }
    
    if (params.toString()) {
        url += '?' + params.toString();
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            dadosFazendas = data;
            atualizarTabelaFazendas();
            
            // Calcular totais diretamente dos dados da tabela
            const totalFazendas = dadosFazendas.length;
            let totalArea = 0;
            
            dadosFazendas.forEach(fazenda => {
                if (fazenda.hectares_documento) {
                    totalArea += fazenda.hectares_documento;
                }
            });
            
            // Atualizar totalizador final com os dados da tabela
            document.getElementById('totalFazendasFinal').textContent = totalFazendas;
            document.getElementById('areaTotalFinal').textContent = formatarNumero(totalArea);
        })
        .catch(error => console.error('Erro ao carregar fazendas:', error));
}

function carregarVencimentos() {
    fetch('/api/documentos/vencimentos?dias=30')
        .then(response => response.json())
        .then(data => {
            dadosVencimentos = data;
            atualizarTabelaVencimentos();
        })
        .catch(error => console.error('Erro ao carregar vencimentos:', error));
}

function carregarEstatisticas() {
    let url = '/api/estatisticas/areas';
    const params = new URLSearchParams();
    
    if (filtroGrupoId) {
        params.append('grupo_id', filtroGrupoId);
    }
    
    if (filtroPessoaId) {
        params.append('pessoa_id', filtroPessoaId);
    }
    
    if (params.toString()) {
        url += '?' + params.toString();
    }
    
    // Carregar estatísticas de áreas
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log("Dados recebidos da API:", data); // Log para debug
            
            // Verificar se os dados estão no formato esperado
            if (data.total_fazendas !== undefined) {
                // Formato correto com as chaves esperadas
                atualizarResumo(data);
                atualizarGraficoAreas(data);
            } else if (data.documento !== undefined) {
                // Formato antigo, adaptar para o formato esperado
                const dadosAdaptados = {
                    total_fazendas: dadosFazendas.length,
                    total_hectares_documento: data.documento || 0,
                    total_area_produtiva: data.produtiva || 0,
                    total_area_consolidada: data.consolidada || 0,
                    total_area_uso: data.uso_contrato || 0,
                    total_prodes: data.prodes || 0,
                    total_embargo: data.embargo || 0
                };
                atualizarResumo(dadosAdaptados);
                atualizarGraficoAreas(dadosAdaptados);
            } else {
                // Formato desconhecido, usar dados da tabela
                const totalFazendas = dadosFazendas.length;
                let totalArea = 0;
                let totalAreaProdutiva = 0;
                
                dadosFazendas.forEach(fazenda => {
                    if (fazenda.hectares_documento) {
                        totalArea += fazenda.hectares_documento;
                    }
                    if (fazenda.area && fazenda.area.area_produtiva_ha) {
                        totalAreaProdutiva += fazenda.area.area_produtiva_ha;
                    }
                });
                
                const dadosCalculados = {
                    total_fazendas: totalFazendas,
                    total_hectares_documento: totalArea,
                    total_area_produtiva: totalAreaProdutiva
                };
                
                atualizarResumo(dadosCalculados);
            }
            
            // Sempre atualizar o totalizador final com os dados da tabela
            atualizarTotalizadorFinal();
        })
        .catch(error => {
            console.error('Erro ao carregar estatísticas de áreas:', error);
            // Em caso de erro, usar dados da tabela
            atualizarTotalizadorFinal();
        });
    
    // Carregar estatísticas de documentos
    url = '/api/estatisticas/documentos';
    if (params.toString()) {
        url += '?' + params.toString();
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            atualizarGraficoDocumentos(data);
        })
        .catch(error => console.error('Erro ao carregar estatísticas de documentos:', error));
}

// Funções de atualização da interface
function atualizarResumo(data) {
    document.getElementById('totalFazendas').textContent = data.total_fazendas || 0;
    document.getElementById('areaTotal').textContent = formatarNumero(data.total_hectares_documento || 0);
    document.getElementById('areaProdutiva').textContent = formatarNumero(data.total_area_produtiva || 0);
}

// Função para atualizar o totalizador final com base nos dados da tabela
function atualizarTotalizadorFinal() {
    const totalFazendas = dadosFazendas.length;
    let totalArea = 0;
    
    dadosFazendas.forEach(fazenda => {
        if (fazenda.hectares_documento) {
            totalArea += fazenda.hectares_documento;
        }
    });
    
    document.getElementById('totalFazendasFinal').textContent = totalFazendas;
    document.getElementById('areaTotalFinal').textContent = formatarNumero(totalArea);
}

function atualizarTabelaFazendas() {
    const tbody = document.getElementById('tabelaFazendas');
    tbody.innerHTML = '';
    
    dadosFazendas.forEach(fazenda => {
        const tr = document.createElement('tr');
        
        // Nome
        const tdNome = document.createElement('td');
        tdNome.textContent = fazenda.nome;
        tr.appendChild(tdNome);
        
        // Produtor
        const tdProdutor = document.createElement('td');
        tdProdutor.textContent = fazenda.pessoa_nome || '-';
        tr.appendChild(tdProdutor);
        
        // Grupo
        const tdGrupo = document.createElement('td');
        tdGrupo.textContent = fazenda.grupo_nome || '-';
        tr.appendChild(tdGrupo);
        
        // Tipo
        const tdTipo = document.createElement('td');
        tdTipo.textContent = fazenda.tipo || '-';
        tr.appendChild(tdTipo);
        
        // Área
        const tdArea = document.createElement('td');
        tdArea.textContent = fazenda.hectares_documento ? formatarNumero(fazenda.hectares_documento) : '-';
        tr.appendChild(tdArea);
        
        // Área Produtiva
        const tdAreaProdutiva = document.createElement('td');
        if (fazenda.area && fazenda.area.area_produtiva_ha) {
            tdAreaProdutiva.textContent = formatarNumero(fazenda.area.area_produtiva_ha);
        } else {
            tdAreaProdutiva.textContent = '-';
        }
        tr.appendChild(tdAreaProdutiva);
        
        // Ações
        const tdAcoes = document.createElement('td');
        
        // Botão de detalhes
        const btnDetalhes = document.createElement('button');
        btnDetalhes.className = 'btn btn-sm btn-info me-1';
        btnDetalhes.innerHTML = '<i class="bi bi-info-circle"></i>';
        btnDetalhes.title = 'Ver detalhes';
        btnDetalhes.addEventListener('click', () => mostrarDetalhesFazenda(fazenda));
        tdAcoes.appendChild(btnDetalhes);
        
        // Botão de editar
        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn btn-sm btn-warning me-1';
        btnEditar.innerHTML = '<i class="bi bi-pencil"></i>';
        btnEditar.title = 'Editar';
        btnEditar.addEventListener('click', () => {
            window.location.href = `/cadastro?id=${fazenda.id}`;
        });
        tdAcoes.appendChild(btnEditar);
        
        tr.appendChild(tdAcoes);
        
        tbody.appendChild(tr);
    });
    
    // Após atualizar a tabela, atualizar o totalizador final
    atualizarTotalizadorFinal();
}

function atualizarTabelaVencimentos() {
    const tbody = document.getElementById('tabelaVencimentos');
    tbody.innerHTML = '';
    
    dadosVencimentos.forEach(doc => {
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
        
        if (diasRestantes <= 7) {
            tdDias.className = 'status-vencido';
        } else if (diasRestantes <= 15) {
            tdDias.className = 'status-proximo';
        } else {
            tdDias.className = 'status-ok';
        }
        
        tr.appendChild(tdDias);
        
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

function atualizarGraficoAreas(data) {
    const ctx = document.getElementById('graficoAreas').getContext('2d');
    
    // Destruir gráfico existente se houver
    if (chartAreas) {
        chartAreas.destroy();
    }
    
    // Dados para o gráfico
    const dados = {
        labels: ['Documento', 'Consolidada', 'Produtiva', 'Uso/Contrato', 'Prodes', 'Embargo'],
        datasets: [{
            label: 'Área (ha)',
            data: [
                data.total_hectares_documento || 0,
                data.total_area_consolidada || 0,
                data.total_area_produtiva || 0,
                data.total_area_uso || 0,
                data.total_prodes || 0,
                data.total_embargo || 0
            ],
            backgroundColor: [
                'rgba(54, 162, 235, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 99, 132, 0.6)',
                'rgba(255, 159, 64, 0.6)'
            ],
            borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
        }]
    };
    
    // Configurações do gráfico
    const config = {
        type: 'bar',
        data: dados,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    };
    
    // Criar novo gráfico
    chartAreas = new Chart(ctx, config);
}

function atualizarGraficoDocumentos(data) {
    const ctx = document.getElementById('graficoDocumentos').getContext('2d');
    
    // Destruir gráfico existente se houver
    if (chartDocumentos) {
        chartDocumentos.destroy();
    }
    
    // Dados para o gráfico
    const dados = {
        labels: ['Vencidos', 'A vencer (30 dias)', 'A vencer (60 dias)', 'A vencer (90 dias)', 'Válidos'],
        datasets: [{
            label: 'Documentos',
            data: [
                data.vencimentos.vencidos,
                data.vencimentos.a_vencer_30_dias,
                data.vencimentos.a_vencer_60_dias,
                data.vencimentos.a_vencer_90_dias,
                data.vencimentos.validos
            ],
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(255, 159, 64, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(54, 162, 235, 0.6)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(54, 162, 235, 1)'
            ],
            borderWidth: 1
        }]
    };
    
    // Configurações do gráfico
    const config = {
        type: 'pie',
        data: dados,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false
                }
            }
        }
    };
    
    // Criar novo gráfico
    chartDocumentos = new Chart(ctx, config);
}

// Funções de interação
function aplicarFiltros() {
    filtroGrupoId = document.getElementById('filtroGrupo').value;
    filtroPessoaId = document.getElementById('filtroPessoa').value;
    
    carregarFazendas();
    carregarEstatisticas();
}

function mostrarDetalhesFazenda(fazenda) {
    // Atualizar título do modal
    document.getElementById('modalTitulo').textContent = `Detalhes da Fazenda: ${fazenda.nome}`;
    
    // Preencher tabela de detalhes gerais
    const tabelaDetalhesGerais = document.getElementById('tabelaDetalhesGerais');
    tabelaDetalhesGerais.innerHTML = '';
    
    adicionarLinhaTabelaDetalhes(tabelaDetalhesGerais, 'Grupo', fazenda.grupo_nome || '-');
    adicionarLinhaTabelaDetalhes(tabelaDetalhesGerais, 'Produtor', fazenda.pessoa_nome || '-');
    adicionarLinhaTabelaDetalhes(tabelaDetalhesGerais, 'Tipo', fazenda.tipo || '-');
    adicionarLinhaTabelaDetalhes(tabelaDetalhesGerais, 'Documento de Domínio', fazenda.documento_dominio || '-');
    adicionarLinhaTabelaDetalhes(tabelaDetalhesGerais, 'Matrícula', fazenda.matricula || '-');
    adicionarLinhaTabelaDetalhes(tabelaDetalhesGerais, 'Hectares (Documento)', fazenda.hectares_documento ? formatarNumero(fazenda.hectares_documento) : '-');
    adicionarLinhaTabelaDetalhes(tabelaDetalhesGerais, 'CAR (há)', fazenda.car_ha || '-');
    adicionarLinhaTabelaDetalhes(tabelaDetalhesGerais, 'Área Consolidada (há)', fazenda.area_consolidada_ha ? formatarNumero(fazenda.area_consolidada_ha) : '-');
    adicionarLinhaTabelaDetalhes(tabelaDetalhesGerais, 'Área de Uso/Contrato', fazenda.area_uso_contrato ? formatarNumero(fazenda.area_uso_contrato) : '-');
    
    if (fazenda.area) {
        adicionarLinhaTabelaDetalhes(tabelaDetalhesGerais, 'Inscrição Estadual', fazenda.area.inscricao_estadual || '-');
        adicionarLinhaTabelaDetalhes(tabelaDetalhesGerais, 'Área Produtiva (há)', fazenda.area.area_produtiva_ha ? formatarNumero(fazenda.area.area_produtiva_ha) : '-');
        adicionarLinhaTabelaDetalhes(tabelaDetalhesGerais, 'Capacidade de Produção', fazenda.area.capacidade_producao || '-');
        adicionarLinhaTabelaDetalhes(tabelaDetalhesGerais, 'Prodes', fazenda.area.prodes || '-');
        adicionarLinhaTabelaDetalhes(tabelaDetalhesGerais, 'Hectares de Prodes', fazenda.area.hectares_prodes ? formatarNumero(fazenda.area.hectares_prodes) : '-');
        adicionarLinhaTabelaDetalhes(tabelaDetalhesGerais, 'Embargo', fazenda.area.embargo || '-');
        adicionarLinhaTabelaDetalhes(tabelaDetalhesGerais, 'Hectares de Embargo', fazenda.area.hectares_embargo ? formatarNumero(fazenda.area.hectares_embargo) : '-');
    }
    
    // Preencher tabela de documentos
    const tabelaDetalhesDocumentos = document.getElementById('tabelaDetalhesDocumentos');
    tabelaDetalhesDocumentos.innerHTML = '';
    
    if (fazenda.documentos && fazenda.documentos.length > 0) {
        fazenda.documentos.forEach(doc => {
            adicionarLinhaTabelaDetalhes(tabelaDetalhesDocumentos, `${doc.tipo}`, doc.numero || '-');
            adicionarLinhaTabelaDetalhes(tabelaDetalhesDocumentos, `Vencimento ${doc.tipo}`, doc.data_vencimento ? formatarData(doc.data_vencimento) : '-');
            
            if (doc.data_vencimento) {
                const diasRestantes = doc.dias_para_vencimento;
                let status = 'Válido';
                let classe = 'status-ok';
                
                if (diasRestantes < 0) {
                    status = 'Vencido';
                    classe = 'status-vencido';
                } else if (diasRestantes <= 30) {
                    status = 'A vencer';
                    classe = 'status-proximo';
                }
                
                adicionarLinhaTabelaDetalhes(tabelaDetalhesDocumentos, `Status ${doc.tipo}`, `<span class="${classe}">${status}</span>`);
            }
        });
    } else {
        adicionarLinhaTabelaDetalhes(tabelaDetalhesDocumentos, 'Documentos', 'Nenhum documento cadastrado');
    }
    
    // Exibir modal
    const modal = new bootstrap.Modal(document.getElementById('modalDetalhesFazenda'));
    modal.show();
}

function adicionarLinhaTabelaDetalhes(tabela, label, valor) {
    const tr = document.createElement('tr');
    
    const tdLabel = document.createElement('td');
    tdLabel.innerHTML = `<strong>${label}:</strong>`;
    tr.appendChild(tdLabel);
    
    const tdValor = document.createElement('td');
    tdValor.innerHTML = valor;
    tr.appendChild(tdValor);
    
    tabela.appendChild(tr);
}

function abrirModalNotificacao(documento) {
    document.getElementById('documentoId').value = documento.id;
    
    // Preencher campos do formulário com valores padrão
    document.getElementById('emailDestinatario').value = '';
    document.getElementById('assuntoEmail').value = `Lembrete de Vencimento: ${documento.tipo} - ${documento.fazenda_nome}`;
    
    const conteudo = `Prezado(a),

Informamos que o documento ${documento.tipo} (${documento.numero}) da fazenda ${documento.fazenda_nome} vencerá em ${documento.dias_para_vencimento} dias (${formatarData(documento.data_vencimento)}).

Por favor, providencie a renovação do documento com antecedência para evitar problemas.

Atenciosamente,
Equipe de Controle de Documentação`;
    
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
    })
    .catch(error => {
        console.error('Erro ao enviar notificação:', error);
        alert('Erro ao enviar notificação. Por favor, tente novamente.');
    });
}

// Funções de exportação
function exportarPDF() {
    alert('Funcionalidade de exportação para PDF em desenvolvimento.');
}

function exportarExcel() {
    alert('Funcionalidade de exportação para Excel em desenvolvimento.');
}

// Funções utilitárias
function formatarNumero(numero) {
    if (numero === null || numero === undefined) {
        return '-';
    }
    
    return numero.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatarData(dataString) {
    if (!dataString) {
        return '-';
    }
    
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}
