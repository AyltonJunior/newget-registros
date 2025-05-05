// Elementos do DOM
const btnRecarregarTabela = document.getElementById('btnRecarregarTabela');
const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
const btnLimparFiltros = document.getElementById('btnLimparFiltros');
const filtroLoja = document.getElementById('filtroLoja');
const filtroOperacao = document.getElementById('filtroOperacao');
const filtroMaquina = document.getElementById('filtroMaquina');
const dataDe = document.getElementById('dataDe');
const dataAte = document.getElementById('dataAte');

// Referência à coleção no Firestore
const operacoesRef = firebase.firestore().collection('operacoes_logs');

// Variáveis globais
let dataTable;
let equipamentos = [];
let usuarios = []; 
let colecaoRegistros = 'operacoes_logs'; // Nome da coleção principal
let todasLojas = new Set(); // Para armazenar lojas únicas
let todasMaquinas = new Set(); // Para armazenar máquinas únicas
let dadosOriginais = []; // Armazenar todos os registros sem filtro

// Cache de registros para mostrar detalhes
let registrosCache = {};

// Verificar se não encontramos dados úteis, tente recarregar
let tentativasRecarregamento = 0;
const MAX_TENTATIVAS = 3;

// Function to hide the loading spinner
function hideLoadingSpinner() {
    console.log('Attempting to hide loading spinner');
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
        console.log('Loading spinner hidden successfully');
    } else {
        console.error('Loading overlay element not found');
    }
}

// Função para inicializar a página
function inicializarPagina() {
    console.log('Inicializando página de logs...');
    
    // Verificar se a configuração Firebase está ok
    if (!firebase.apps.length) {
        console.error('Firebase não inicializado!');
        alert('Erro: Firebase não inicializado corretamente.');
        hideLoadingSpinner();
        return;
    }
    
    // Garantir que o spinner de carregamento esteja visível
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
    
    // Inicializar componentes da página
    carregarEquipamentos();
    carregarUsuarios();
    configurarTabela();
    configurarFiltros();
    
    // Monitorar coleções para registros recentes
    monitorarColecoes();
    
    // Carregar registros iniciais
    buscarRegistros();
    
    // Definir um tempo limite para esconder o spinner de qualquer maneira
    setTimeout(hideLoadingSpinner, 5000);
}

// Configurar eventos dos filtros
function configurarFiltros() {
    console.log('Configurando filtros...');
    
    // Verificar se os elementos existem
    const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
    const btnLimparFiltros = document.getElementById('btnLimparFiltros');
    const btnExportCsv = document.getElementById('btnExportCsv');
    const btnExportExcel = document.getElementById('btnExportExcel');
    const btnExportPdf = document.getElementById('btnExportPdf');
    const btnExportPrint = document.getElementById('btnExportPrint');
    const filtroPesquisa = document.getElementById('filtroPesquisa');
    const btnPesquisar = document.getElementById('btnPesquisar');
    
    if (!btnAplicarFiltros || !btnLimparFiltros) {
        console.error('Elementos de botões de filtro não encontrados!');
        return;
    }
    
    console.log('Botões de filtro encontrados, configurando eventos...');
    
    // Evento de aplicar filtros
    btnAplicarFiltros.addEventListener('click', function() {
        console.log('Botão Aplicar Filtros clicado');
        aplicarFiltros();
    });
    
    // Evento de limpar filtros
    btnLimparFiltros.addEventListener('click', function() {
        console.log('Botão Limpar Filtros clicado');
        limparFiltros();
    });
    
    // Configurar campo de pesquisa personalizado
    if (filtroPesquisa && btnPesquisar) {
        console.log('Configurando campo de pesquisa personalizado');
        
        // Evento de clique no botão de pesquisa
        btnPesquisar.addEventListener('click', function() {
            const termoPesquisa = filtroPesquisa.value.trim();
            console.log(`Aplicando pesquisa: "${termoPesquisa}"`);
            dataTable.search(termoPesquisa).draw();
        });
        
        // Evento de pressionar Enter no campo de pesquisa
        filtroPesquisa.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const termoPesquisa = filtroPesquisa.value.trim();
                console.log(`Aplicando pesquisa (via Enter): "${termoPesquisa}"`);
                dataTable.search(termoPesquisa).draw();
            }
        });
    }
    
    // Configurar botões de exportação
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', function() {
            // Usar o método correto para acionar a exportação CSV
            var exportButton = dataTable.button('.buttons-csv');
            exportButton.trigger();
        });
    }
    
    if (btnExportExcel) {
        btnExportExcel.addEventListener('click', function() {
            // Usar o método correto para acionar a exportação Excel
            var exportButton = dataTable.button('.buttons-excel');
            exportButton.trigger();
        });
    }
    
    if (btnExportPdf) {
        btnExportPdf.addEventListener('click', function() {
            // Usar o método correto para acionar a exportação PDF
            var exportButton = dataTable.button('.buttons-pdf');
            exportButton.trigger();
        });
    }
    
    if (btnExportPrint) {
        btnExportPrint.addEventListener('click', function() {
            // Usar o método correto para acionar a exportação de impressão
            var exportButton = dataTable.button('.buttons-print');
            exportButton.trigger();
        });
    }
    
    console.log('Eventos dos botões de filtro configurados com sucesso');
}

// Popular seletores de filtro com dados disponíveis
function popularSeletoresFiltro() {
    console.log('Populando seletores de filtro...');
    console.log(`Valores únicos encontrados: ${todasLojas.size} lojas, ${todasMaquinas.size} máquinas`);
    
    // Remover valores vazios, nulos ou undefined
    todasLojas.delete('');
    todasLojas.delete(null);
    todasLojas.delete(undefined);
    
    todasMaquinas.delete('');
    todasMaquinas.delete(null);
    todasMaquinas.delete(undefined);
    
    // Popular seletor de lojas
    filtroLoja.innerHTML = '<option value="">Todas as Lojas</option>';
    [...todasLojas].sort().forEach(loja => {
        const option = document.createElement('option');
        option.value = loja;
        option.textContent = loja;
        filtroLoja.appendChild(option);
    });
    
    console.log(`Adicionadas ${filtroLoja.options.length - 1} opções ao filtro de lojas`);
    
    // Popular seletor de máquinas
    filtroMaquina.innerHTML = '<option value="">Todas as Máquinas</option>';
    [...todasMaquinas].sort().forEach(maquina => {
        const option = document.createElement('option');
        option.value = maquina;
        option.textContent = maquina;
        filtroMaquina.appendChild(option);
    });
    
    console.log(`Adicionadas ${filtroMaquina.options.length - 1} opções ao filtro de máquinas`);
}

// Função para normalizar um timestamp em diversos formatos para um objeto Date
function normalizarTimestamp(timestamp) {
    if (!timestamp) return null;
    
    // Se já for um Date, retorna ele mesmo
    if (timestamp instanceof Date) {
        return timestamp;
    }
    
    // Se for um timestamp do Firestore
    if (typeof timestamp === 'object' && timestamp.seconds !== undefined) {
        return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
    }
    
    // Se for uma string ISO ou timestamp numérico
    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        const data = new Date(timestamp);
        if (!isNaN(data.getTime())) {
            return data;
        }
    }
    
    console.warn("Formato de timestamp não reconhecido:", timestamp);
    return null;
}

// Aplicar filtros à tabela
function aplicarFiltros() {
    console.log("Aplicando filtros...");
    
    // Mostrar o spinner de carregamento
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
    
    // Verificar se dadosOriginais existe e tem registros
    if (!dadosOriginais || dadosOriginais.length === 0) {
        console.error("Dados originais não disponíveis ou vazios");
        alert("Não há dados para filtrar. Tente recarregar a página.");
        // Esconder o spinner em caso de erro
        hideLoadingSpinner();
        return;
    }
    
    // Obter os valores selecionados dos filtros - verificando se os elementos existem
    const filtroOperacao = document.getElementById('filtroOperacao');
    const filtroLoja = document.getElementById('filtroLoja');
    const filtroMaquina = document.getElementById('filtroMaquina');
    const filtroData = document.getElementById('filtroData');
    
    if (!filtroOperacao || !filtroLoja || !filtroMaquina) {
        console.error("Elementos de filtro não encontrados!");
        alert("Erro ao aplicar filtros. Elementos não encontrados.");
        // Esconder o spinner em caso de erro
        hideLoadingSpinner();
        return;
    }
    
    const operacaoSelecionada = filtroOperacao.value;
    const lojaSelecionada = filtroLoja.value;
    const maquinaSelecionada = filtroMaquina.value;
    
    // Obter valor da data se o elemento existir
    const dataStr = filtroData ? filtroData.value : '';
    
    console.log(`Filtros selecionados: 
    - Operação: ${operacaoSelecionada} 
    - Loja: ${lojaSelecionada} 
    - Máquina: ${maquinaSelecionada}
    - Data: ${dataStr}`);
    
    // Converter string de data para objeto Date
    let dataFiltro = null;
    let diaFiltro = null;
    let mesFiltro = null;
    let anoFiltro = null;

    if (dataStr) {
        // Obter os componentes da data a partir da string no formato YYYY-MM-DD
        const [ano, mes, dia] = dataStr.split('-').map(Number);
        
        // Armazenar componentes da data para uso na filtragem
        diaFiltro = dia;
        mesFiltro = mes;
        anoFiltro = ano;
        
        // Componentes de data obtidos diretamente da string, sem conversão para Date
        // para evitar problemas de fuso horário
        console.log(`Data selecionada no filtro: ${dia}/${mes}/${ano}`);
    }

    console.log(`Iniciando filtragem de ${dadosOriginais.length} registros...`);
    
    // Filtrar os registros usando dadosOriginais
    const filtrados = dadosOriginais.filter(registro => {
        // Filtro por operação
        if (operacaoSelecionada && operacaoSelecionada !== "") {
            // Extrair todos os possíveis valores de operação do registro
            const camposOperacao = [
                registro.operacao,
                registro.tipo,
                registro.type,
                registro.tipoOperacao,
                registro.dados?.tipo,
                registro.dados?.operacao,
                registro.configuracao?.tipo,
                registro.configuracao?.operacao
            ];
            
            // Verificar strings com possíveis prefixos
            for (const key in registro) {
                if (key.includes('tipo') || key.includes('operacao') || key.includes('type')) {
                    camposOperacao.push(registro[key]);
                }
            }
            
            // Filtrar valores undefined/null e converter para strings para comparação
            const valoresOperacao = camposOperacao
                .filter(valor => valor !== undefined && valor !== null)
                .map(valor => {
                    if (typeof valor === 'object') {
                        return (valor.tipo || valor.name || '').toString().toLowerCase();
                    }
                    return valor.toString().toLowerCase();
                });
            
            // Normalizar a operação selecionada para comparação
            const operacaoNormalizada = normalizarTipoOperacao(operacaoSelecionada).toLowerCase();
            
            console.log(`Comparando operação: "${operacaoSelecionada}" (normalizada: "${operacaoNormalizada}") com valores encontrados:`, valoresOperacao);
            
            // Verificar se a operação normalizada está em algum dos campos
            const operacaoEncontrada = valoresOperacao.some(valor => {
                // Normalizar o valor do registro também
                const valorNormalizado = normalizarTipoOperacao(valor).toLowerCase();
                console.log(`  Comparando: "${valorNormalizado}" com "${operacaoNormalizada}"`);
                return valorNormalizado === operacaoNormalizada;
            });
            
            if (!operacaoEncontrada) {
                return false;
            }
        }
        
        // Filtro por loja
        if (lojaSelecionada && lojaSelecionada !== "") {
            const lojaRegistro = registro.loja || registro.deviceData?.store || registro.store || '';
            console.log(`Comparando loja: "${lojaSelecionada}" com "${lojaRegistro}"`);
            
            // Evitar erro ao chamar toString em null ou undefined
            const lojaStr = lojaRegistro ? lojaRegistro.toString().toLowerCase() : '';
            if (lojaStr !== lojaSelecionada.toLowerCase()) {
                return false;
            }
        }
        
        // Filtro por máquina
        if (maquinaSelecionada && maquinaSelecionada !== "") {
            // Extrair todos os possíveis valores de máquina do registro
            const camposMaquina = [
                registro.maquina,
                registro.machine,
                registro.maquinaId,
                registro.machineId,
                registro.lavadoraId,
                registro.secadoraId,
                registro.dosadoraId,
                registro.dispositivo,
                registro.equipamentoId,
                registro.deviceData?.machine,
                registro.dados?.maquina,
                registro.dados?.machine,
                registro.configuracao?.maquina,
                registro.configuracao?.machine
            ];
            
            // Verificar se o registro tem o campo 'configuracao'
            if (registro.configuracao) {
                camposMaquina.push(registro.configuracao.lavadoraId);
                camposMaquina.push(registro.configuracao.secadoraId);
                camposMaquina.push(registro.configuracao.dosadoraId);
            }
            
            // Verificar se o registro tem o campo 'dados'
            if (registro.dados) {
                camposMaquina.push(registro.dados.lavadoraId);
                camposMaquina.push(registro.dados.secadoraId);
                camposMaquina.push(registro.dados.dosadoraId);
            }
            
            // Filtrar valores undefined/null e converter para strings para comparação
            const valoresMaquina = camposMaquina
                .filter(valor => valor !== undefined && valor !== null)
                .map(valor => {
                    if (typeof valor === 'object') {
                        return (valor.id || valor.codigo || '').toString().toLowerCase();
                    }
                    return valor.toString().toLowerCase();
                });
            
            console.log(`Comparando máquina: "${maquinaSelecionada}" com valores encontrados:`, valoresMaquina);
            
            // Se não encontrarmos a máquina em nenhum dos campos, retornar false
            if (!valoresMaquina.includes(maquinaSelecionada.toLowerCase())) {
                return false;
            }
        }
        
        // Filtro por data única
        if (diaFiltro && mesFiltro && anoFiltro) {
            // Normalizar o timestamp do registro
            const registroTimestamp = normalizarTimestamp(registro.timestamp);
            
            if (!registroTimestamp) {
                console.log(`Registro sem timestamp válido:`, registro);
                return false;
            }
            
            // Extrair dia, mês e ano diretamente do objeto Date do registro
            const diaRegistro = registroTimestamp.getDate();
            const mesRegistro = registroTimestamp.getMonth() + 1; // getMonth() retorna 0-11
            const anoRegistro = registroTimestamp.getFullYear();
            
            console.log(`Comparando datas: ${diaFiltro}/${mesFiltro}/${anoFiltro} com ${diaRegistro}/${mesRegistro}/${anoRegistro}`);
            
            // Verificar se o dia, mês e ano são iguais
            if (diaRegistro !== diaFiltro || mesRegistro !== mesFiltro || anoRegistro !== anoFiltro) {
                return false;
            }
        }
        
        // Se passou por todos os filtros, retorna true
        return true;
    });
    
    console.log(`Registros filtrados: ${filtrados.length} de ${dadosOriginais.length}`);
    
    // Atualizar a exibição com os registros filtrados
    renderizarRegistros(filtrados);
}

// Normalizar tipos de operação para padronizar a filtragem
function normalizarTipoOperacao(tipo) {
    if (!tipo) return '';
    
    // Converter para string para garantir que possamos usar métodos de string
    tipo = String(tipo).toLowerCase().trim();
    
    // Liberação de Lavadora - vários formatos possíveis
    if (tipo.includes('lavadora') || 
        tipo.includes('wash') || 
        tipo === 'wash' || 
        tipo === 'lavagem' || 
        tipo === 'liberacao_lavadora' || 
        tipo === 'liberação_lavadora' || 
        tipo === 'liberacao lavadora' || 
        tipo === 'washing' || 
        tipo === 'wash_cycle' ||
        tipo === 'liberacao lavadora') {
        return 'Lavadora';
    } 
    // Liberação de Secadora - vários formatos possíveis
    else if (tipo.includes('secadora') || 
             tipo.includes('dry') || 
             tipo === 'dry' || 
             tipo === 'secagem' || 
             tipo === 'liberacao_secadora' || 
             tipo === 'liberação_secadora' || 
             tipo === 'liberacao secadora' || 
             tipo === 'drying' || 
             tipo === 'dry_cycle' ||
             tipo === 'liberacao secadora') {
        return 'Secadora';
    } 
    // Acionamento de Dosadora - vários formatos possíveis
    else if (tipo.includes('dosadora') || 
             tipo.includes('dose') || 
             tipo === 'dose' || 
             tipo === 'dosagem' || 
             tipo === 'acionamento_dosadora' || 
             tipo === 'acionamento dosadora' || 
             tipo === 'dosing' || 
             tipo === 'detergent' ||
             tipo === 'acionamento dosadora') {
        return 'Dosadora';
    } 
    // Reset - formatos possíveis
    else if (tipo.includes('reset') || 
             tipo === 'reset' || 
             tipo === 'restart' || 
             tipo === 'reiniciar') {
        return 'Reset';
    } 
    // Login - formatos possíveis
    else if (tipo.includes('login') || 
             tipo === 'login' || 
             tipo === 'logon' || 
             tipo === 'signin') {
        return 'Login';
    } 
    // Logout - formatos possíveis
    else if (tipo.includes('logout') || 
             tipo === 'logout' || 
             tipo === 'logoff' || 
             tipo === 'signout') {
        return 'Logout';
    }
    
    // Se não corresponder a nenhum padrão conhecido, retorna o tipo original
    return tipo;
}

// Limpar todos os filtros
function limparFiltros() {
    console.log('Limpando filtros...');
    
    // Mostrar o spinner de carregamento
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
    
    // Obter referências aos elementos de filtro
    const filtroOperacao = document.getElementById('filtroOperacao');
    const filtroLoja = document.getElementById('filtroLoja');
    const filtroMaquina = document.getElementById('filtroMaquina');
    const filtroData = document.getElementById('filtroData');
    const filtroPesquisa = document.getElementById('filtroPesquisa');
    
    // Restaurar valores padrão se os elementos existirem
    if (filtroOperacao) filtroOperacao.value = '';
    if (filtroLoja) filtroLoja.value = '';
    if (filtroMaquina) filtroMaquina.value = '';
    if (filtroData) filtroData.value = '';
    if (filtroPesquisa) filtroPesquisa.value = '';
    
    // Limpar a pesquisa do DataTable
    if (dataTable) {
        dataTable.search('').draw();
    }
    
    // Recarregar todos os registros na tabela
    renderizarRegistros(dadosOriginais);
    
    console.log('Filtros limpos, exibindo todos os registros');
}

// Monitorar coleções para novos registros
function monitorarColecoes() {
    console.log('Monitorando coleções para novos registros...');
    
    // Monitorar a coleção de operações_logs para novas entradas
    const unsubscribe = firebase.firestore().collection('operacoes_logs')
        .orderBy('timestamp', 'desc')
        .limit(5)
        .onSnapshot(snapshot => {
            // Verificar se temos alterações
            if (!snapshot.empty && snapshot.docChanges().length > 0) {
                console.log('Novos registros ou alterações detectadas:', snapshot.docChanges().length);
                
                let novoRegistroEncontrado = false;
                
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        novoRegistroEncontrado = true;
                        const dados = change.doc.data();
                        console.log('Novo registro adicionado:', change.doc.id);
                        
                        // Verificar e possivelmente criar dados de equipamento
                        verificarOuCriarEquipamento(dados);
                        
                        // Verificar e possivelmente criar dados de usuário
                        verificarOuCriarUsuario(dados);
                    }
                });
                
                // Recarregar a tabela para mostrar os novos registros
                if (novoRegistroEncontrado) {
                    setTimeout(() => {
                        console.log('Recarregando tabela para mostrar novos registros...');
                        buscarRegistros();
                    }, 1000);
                }
            }
        }, error => {
            console.error('Erro ao monitorar coleção:', error);
        });
        
    // Registrar o unsubscribe para limpar quando necessário
    window.unsubscribeMonitor = unsubscribe;
}

// Verificar se o equipamento existe, caso contrário criar
function verificarOuCriarEquipamento(dados) {
    const idEquipamento = dados.dispositivo || dados.equipamentoId;
    
    if (!idEquipamento) {
        console.log('Não foi possível identificar o ID do equipamento');
        return;
    }
    
    console.log(`Verificando se equipamento ${idEquipamento} existe...`);
    
    // Verificar na coleção de equipamentos
    firebase.firestore().collection('equipamentos')
        .doc(idEquipamento)
        .get()
        .then(doc => {
            if (doc.exists) {
                console.log(`Equipamento ${idEquipamento} já existe:`, doc.data());
            } else {
                console.log(`Equipamento ${idEquipamento} não encontrado, criando novo...`);
                
                // Criar novo equipamento
                const novoEquipamento = {
                    nome: `Dispositivo ${idEquipamento}`,
                    tipo: dados.tipo === 'secadora' || dados.tipo === 'liberacao_secadora' || dados.tipo === 'DRY' ? 'secadora' : 
                          dados.tipo === 'lavadora' || dados.tipo === 'liberacao_lavadora' || dados.tipo === 'WASH' ? 'lavadora' : 
                          dados.tipo === 'dosadora' || dados.tipo === 'acionamento_dosadora' || dados.tipo === 'DOSE' ? 'dosadora' : 'desconhecido',
                    status: 'ativo',
                    dataCriacao: firebase.firestore.FieldValue.serverTimestamp(),
                    ultimaAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // Salvar no Firestore
                firebase.firestore().collection('equipamentos')
                    .doc(idEquipamento)
                    .set(novoEquipamento)
                    .then(() => {
                        console.log(`Equipamento ${idEquipamento} criado com sucesso:`, novoEquipamento);
                        // Atualizar a lista de equipamentos
                        carregarEquipamentos();
                    })
                    .catch(erro => {
                        console.error(`Erro ao criar equipamento ${idEquipamento}:`, erro);
                    });
            }
        })
        .catch(erro => {
            console.error(`Erro ao verificar equipamento ${idEquipamento}:`, erro);
        });
}

// Verificar se o usuário existe, caso contrário criar
function verificarOuCriarUsuario(dados) {
    const idUsuario = dados.usuario || dados.usuarioId;
    
    if (!idUsuario) {
        console.log('Não foi possível identificar o ID do usuário');
        return;
    }
    
    console.log(`Verificando se usuário ${idUsuario} existe...`);
    
    // Verificar na coleção de usuários
    firebase.firestore().collection('usuarios')
        .doc(idUsuario)
        .get()
        .then(doc => {
            if (doc.exists) {
                console.log(`Usuário ${idUsuario} já existe:`, doc.data());
            } else {
                console.log(`Usuário ${idUsuario} não encontrado, criando novo...`);
                
                // Criar novo usuário
                const novoUsuario = {
                    nome: `Usuário ${idUsuario}`,
                    email: `usuario-${idUsuario}@exemplo.com`,
                    tipo: 'operador',
                    status: 'ativo',
                    dataCriacao: firebase.firestore.FieldValue.serverTimestamp(),
                    ultimaAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // Salvar no Firestore
                firebase.firestore().collection('usuarios')
                    .doc(idUsuario)
                    .set(novoUsuario)
                    .then(() => {
                        console.log(`Usuário ${idUsuario} criado com sucesso:`, novoUsuario);
                        // Atualizar a lista de usuários
                        carregarUsuarios();
                    })
                    .catch(erro => {
                        console.error(`Erro ao criar usuário ${idUsuario}:`, erro);
                    });
            }
        })
        .catch(erro => {
            console.error(`Erro ao verificar usuário ${idUsuario}:`, erro);
        });
}

// Carregar equipamentos
function carregarEquipamentos() {
    console.log('Carregando lista de equipamentos...');
    
    firebase.firestore().collection('equipamentos')
        .get()
        .then(snapshot => {
            if (!snapshot.empty) {
                equipamentos = snapshot.docs.map(doc => {
                    return {
                    id: doc.id,
                        ...doc.data()
                    };
                });
                
                console.log(`${equipamentos.length} equipamentos carregados`);
            } else {
                console.log('Nenhum equipamento encontrado, tentando buscar de operações');
                buscarDispositivosOperacoesLogs();
            }
        })
        .catch(error => {
            console.error('Erro ao carregar equipamentos:', error);
            buscarDispositivosOperacoesLogs();
        });
        
    // Função para buscar dispositivos a partir de registros de operações
    function buscarDispositivosOperacoesLogs() {
        firebase.firestore().collection('operacoes_logs')
            .limit(100)
            .get()
            .then(snapshot => {
                if (!snapshot.empty) {
                    const dispositivosUnicos = new Set();
                
                    snapshot.docs.forEach(doc => {
                    const dados = doc.data();
                        const idDispositivo = dados.dispositivo || dados.equipamentoId;
                        
                        if (idDispositivo) {
                            dispositivosUnicos.add(idDispositivo);
                        }
                    });
                    
                    console.log(`Encontrados ${dispositivosUnicos.size} dispositivos únicos em operações`);
                } else {
                    console.log('Nenhum registro de operação encontrado para extrair dispositivos');
                }
            })
            .catch(error => {
                console.error('Erro ao buscar dispositivos de operações:', error);
            });
    }
}

// Carregar usuários
function carregarUsuarios() {
    console.log('Carregando lista de usuários...');
    
    firebase.firestore().collection('usuarios')
        .get()
        .then(snapshot => {
            if (!snapshot.empty) {
                usuarios = snapshot.docs.map(doc => {
                    return {
                    id: doc.id,
                        ...doc.data()
                    };
                });
                
                console.log(`${usuarios.length} usuários carregados`);
            } else {
                console.log('Nenhum usuário encontrado, tentando buscar de operações');
                buscarUsuariosOperacoesLogs();
            }
        })
        .catch(error => {
            console.error('Erro ao carregar usuários:', error);
            buscarUsuariosOperacoesLogs();
        });
        
    // Função para buscar usuários a partir de registros de operações
    function buscarUsuariosOperacoesLogs() {
        firebase.firestore().collection('operacoes_logs')
            .limit(100)
            .get()
            .then(snapshot => {
                if (!snapshot.empty) {
                    const usuariosUnicos = new Set();
                    
                    snapshot.docs.forEach(doc => {
                    const dados = doc.data();
                        const idUsuario = dados.usuario || dados.usuarioId;
                        
                        if (idUsuario) {
                            usuariosUnicos.add(idUsuario);
                        }
                    });
                    
                    console.log(`Encontrados ${usuariosUnicos.size} usuários únicos em operações`);
                } else {
                    console.log('Nenhum registro de operação encontrado para extrair usuários');
                }
            })
            .catch(error => {
                console.error('Erro ao buscar usuários de operações:', error);
            });
    }
}

// Gerar badge para tipo de operação
function gerarBadgeOperacao(tipo) {
    if (!tipo) return 'N/A';
    
    // Processar o tipo para uma versão normalizada
    const tipoNormalizado = String(tipo).toUpperCase();
    
    // Definir a classe baseada no tipo de operação
    let classe = '';
    let textoExibicao = '';
    
    if (tipoNormalizado.includes('WASH') || 
        tipoNormalizado.includes('LAVADORA') || 
        tipoNormalizado.includes('LAVAGEM') ||
        tipoNormalizado.includes('LIBERACAO_LAVADORA')) {
        classe = 'badge-primary';
        textoExibicao = 'Lavadora';
    } else if (tipoNormalizado.includes('DRY') || 
             tipoNormalizado.includes('SECADORA') || 
             tipoNormalizado.includes('SECAGEM') ||
             tipoNormalizado.includes('LIBERACAO_SECADORA')) {
        classe = 'badge-warning';
        textoExibicao = 'Secadora';
    } else if (tipoNormalizado.includes('DOSE') || 
             tipoNormalizado.includes('DOSADORA') || 
             tipoNormalizado.includes('DETERGENT') ||
             tipoNormalizado.includes('ACIONAMENTO') ||
             tipoNormalizado.includes('ACIONAMENTO_DOSADORA')) {
        classe = 'badge-info';
        textoExibicao = 'Dosadora';
    } else if (tipoNormalizado.includes('RESET')) {
        classe = 'badge-danger';
        textoExibicao = 'Reset';
    } else if (tipoNormalizado.includes('LOGIN')) {
        classe = 'badge-success';
        textoExibicao = 'Login';
    } else if (tipoNormalizado.includes('LOGOUT')) {
        classe = 'badge-secondary';
        textoExibicao = 'Logout';
    } else {
        classe = 'badge-secondary';
        textoExibicao = tipo;
    }
    
    return `<span class="badge ${classe}">${textoExibicao}</span>`;
}

// Configurar a tabela DataTable
function configurarTabela() {
    console.log('Configurando tabela de registros...');
    
    const tabelaElement = document.getElementById('logsTable');
    
    if (!tabelaElement) {
        console.error('Elemento da tabela não encontrado!');
        return;
    }
    
    try {
        // Adicionar método de ordenação personalizado para datas no formato brasileiro
        $.extend($.fn.dataTableExt.oSort, {
            "date-br-pre": function(a) {
                if (a === 'N/A' || a === '') return 0;
                const brDate = a.split('/');
                return new Date(brDate[2], brDate[1]-1, brDate[0]).getTime();
            },
            "date-br-asc": function(a, b) {
                return a - b;
            },
            "date-br-desc": function(a, b) {
                return b - a;
            }
        });
        
        // Inicializar o DataTable com opções
        dataTable = $(tabelaElement).DataTable({
            responsive: true,
            order: [[0, 'desc'], [1, 'desc']], // Ordenar por data e hora decrescente
            pageLength: 10, // Definido para 10 registros por página
            lengthMenu: [10, 25, 50, 100], // Opções de quantidade por página
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.24/i18n/Portuguese-Brasil.json'
            },
            dom: 'Brtip', // Adicionado 'B' para os botões de exportação
            scrollX: false, // Desativa rolagem horizontal
            autoWidth: true, // Ajusta automaticamente a largura das colunas
            "ordering": true, // Habilitar ordenação
            "orderCellsTop": true, // Otimização de ordenação
            "orderClasses": false, // Desativar classes de ordenação para melhor desempenho
            buttons: [
                {
                    extend: 'csv',
                    text: 'CSV',
                    className: 'buttons-csv d-none',
                    exportOptions: { columns: ':visible' }
                },
                {
                    extend: 'excel',
                    text: 'Excel',
                    className: 'buttons-excel d-none',
                    exportOptions: { columns: ':visible' }
                },
                {
                    extend: 'pdf',
                    text: 'PDF',
                    className: 'buttons-pdf d-none',
                    exportOptions: { columns: ':visible' }
                },
                {
                    extend: 'print',
                    text: 'Imprimir',
                    className: 'buttons-print d-none',
                    exportOptions: { columns: ':visible' }
                }
            ],
            columnDefs: [
                { type: 'date-br', targets: 0 } // Aplicar ordenação de data brasileira à primeira coluna
            ],
            initComplete: function() {
                // Após a inicialização, carregar registros
                buscarRegistros();
            }
        });
        
        // Adicionar evento para clique nas linhas da tabela
        $('#logsTable tbody').on('click', 'tr', function() {
            const data = dataTable.row(this).data();
            if (data) {
                const dataHora = `${data[0]} ${data[1]}`;
                mostrarDetalhes(dataHora);
            }
        });
        
        console.log('Tabela inicializada com sucesso');
    } catch (erro) {
        console.error('Erro ao inicializar tabela:', erro);
    }
}

// Função para buscar registros de operações do Firestore
function buscarRegistros() {
    console.log('Buscando registros...');
    
    // Limpar as coleções de valores únicos para os filtros
    todasLojas.clear();
    todasMaquinas.clear();
    
    // Criar uma query base ordenada por timestamp decrescente e limitada a 10 registros
    let query = firebase.firestore().collection(colecaoRegistros)
        .orderBy('timestamp', 'desc')
        .limit(10);  // Alterado para 10 registros
    
    // Executar a query
    query.get()
        .then(snapshot => {
            if (!snapshot.empty) {
                console.log(`Encontrados ${snapshot.size} registros`);
                
                // Processar os dados da query
                const registros = snapshot.docs.map(doc => {
                    const dados = doc.data();
                    dados.id = doc.id;
                    
                    // Armazenar no cache para uso posterior
                    registrosCache[doc.id] = dados;
                    
                    return dados;
                });
                
                // Armazenar todos os registros sem filtro
                dadosOriginais = registros;
                
                // Extrair valores únicos para os filtros
                registros.forEach(registro => {
                    // Extrair todas as possíveis lojas
                    const lojasExtrair = [
                        registro.lojaId,
                        registro.storeId,
                        registro.loja,
                        registro.store
                    ];
                    
                    // Verificar campos aninhados
                    if (registro.dados) {
                        lojasExtrair.push(registro.dados.lojaId);
                        lojasExtrair.push(registro.dados.loja);
                        lojasExtrair.push(registro.dados.store);
                    }
                    
                    if (registro.configuracao) {
                        lojasExtrair.push(registro.configuracao.lojaId);
                        lojasExtrair.push(registro.configuracao.loja);
                    }
                    
                    // Para loja como objeto
                    if (typeof registro.store === 'object' && registro.store !== null) {
                        lojasExtrair.push(registro.store.id);
                        lojasExtrair.push(registro.store.name);
                    }
                    
                    // Adicionar valores válidos ao Set
                    lojasExtrair
                        .filter(item => item !== undefined && item !== null && item !== '')
                        .forEach(item => {
                            if (typeof item === 'object') {
                                // Para objetos, extrair propriedades úteis
                                if (item.id) todasLojas.add(item.id);
                                if (item.name) todasLojas.add(item.name);
            } else {
                                todasLojas.add(String(item));
                            }
                        });
                    
                    // Extrair todas as possíveis máquinas
                    const maquinasExtrair = [
                        registro.maquina,
                        registro.machine,
                        registro.maquinaId,
                        registro.machineId,
                        registro.lavadoraId,
                        registro.secadoraId,
                        registro.dosadoraId,
                        registro.dispositivo,
                        registro.equipamentoId,
                        registro.deviceData?.machine,
                        registro.dados?.maquina,
                        registro.dados?.machine,
                        registro.configuracao?.maquina,
                        registro.configuracao?.machine
                    ];
                    
                    // Verificar campos aninhados
                    if (registro.dados) {
                        maquinasExtrair.push(registro.dados.maquina);
                        maquinasExtrair.push(registro.dados.machine);
                    }
                    
                    // Para máquina como objeto
                    if (typeof registro.maquina === 'object' && registro.maquina !== null) {
                        maquinasExtrair.push(registro.maquina.id);
                        maquinasExtrair.push(registro.maquina.codigo);
                    }
                    
                    if (typeof registro.machine === 'object' && registro.machine !== null) {
                        maquinasExtrair.push(registro.machine.id);
                        maquinasExtrair.push(registro.machine.codigo);
                    }
                    
                    // Adicionar valores válidos ao Set
                    maquinasExtrair
                        .filter(item => item !== undefined && item !== null && item !== '')
                        .forEach(item => {
                            if (typeof item === 'object') {
                                // Para objetos, extrair propriedades úteis
                                if (item.id) todasMaquinas.add(item.id);
                                if (item.codigo) todasMaquinas.add(item.codigo);
                            } else {
                                todasMaquinas.add(String(item));
                            }
                        });
                });
                
                console.log(`Extraídos ${todasLojas.size} valores de loja e ${todasMaquinas.size} valores de máquina`);
                
                // Popular os seletores de filtro
                popularSeletoresFiltro();
                
                // Processar e exibir os registros na tabela
                const registrosProcessados = processarRegistros(registros);
                
                // Renderizar os registros
                renderizarRegistros(registrosProcessados);
                
                tentativasRecarregamento = 0;
                
                // Adicionar botão "Carregar Mais" se não existir
                adicionarBotaoCarregarMais();
            } else {
                console.log('Nenhum registro encontrado');
                if (tentativasRecarregamento < MAX_TENTATIVAS) {
                    tentativasRecarregamento++;
                    setTimeout(buscarRegistros, 1000);
                } else {
                    alert('Não foi possível encontrar registros de operações.');
                }
            }
        })
        .catch(error => {
            console.error('Erro ao buscar registros:', error);
            alert(`Erro ao buscar registros: ${error.message}`);
        });
}

// Função para adicionar botão "Carregar Mais"
function adicionarBotaoCarregarMais() {
    // Remover botão existente se houver
    const botaoExistente = document.getElementById('btnCarregarMais');
    if (botaoExistente) {
        botaoExistente.remove();
    }

    // Criar novo botão
    const div = document.createElement('div');
    div.className = 'text-center mt-3 mb-3';
    div.innerHTML = `
        <button id="btnCarregarMais" class="btn btn-outline-primary">
            <i class="fas fa-sync-alt me-1"></i>Carregar Mais Registros
        </button>
    `;

    // Adicionar após a tabela
    const tabela = document.getElementById('logsTable');
    tabela.parentNode.insertAdjacentElement('afterend', div);

    // Adicionar evento de clique
    document.getElementById('btnCarregarMais').addEventListener('click', carregarMaisRegistros);
}

// Função para carregar mais registros
function carregarMaisRegistros() {
    const ultimoRegistro = dadosOriginais[dadosOriginais.length - 1];
    if (!ultimoRegistro || !ultimoRegistro.timestamp) {
        console.error('Não foi possível determinar o último registro');
        return;
    }

    // Mostrar loading no botão
    const btnCarregarMais = document.getElementById('btnCarregarMais');
    const btnTextoOriginal = btnCarregarMais.innerHTML;
    btnCarregarMais.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Carregando...';
    btnCarregarMais.disabled = true;

    // Buscar próximos 10 registros
    firebase.firestore().collection(colecaoRegistros)
        .orderBy('timestamp', 'desc')
        .startAfter(ultimoRegistro.timestamp)
        .limit(10)
        .get()
        .then(snapshot => {
            if (!snapshot.empty) {
                const novosRegistros = snapshot.docs.map(doc => {
                    const dados = doc.data();
                    dados.id = doc.id;
                    registrosCache[doc.id] = dados;
                    return dados;
                });

                // Adicionar novos registros aos existentes
                dadosOriginais = [...dadosOriginais, ...novosRegistros];

                // Atualizar filtros e tabela
                novosRegistros.forEach(registro => {
                    if (registro.loja) todasLojas.add(registro.loja);
                    if (registro.store) todasLojas.add(registro.store);
                    if (registro.maquina) todasMaquinas.add(registro.maquina);
                    if (registro.machine) todasMaquinas.add(registro.machine);
                });

                popularSeletoresFiltro();
                const todosRegistrosProcessados = processarRegistros(dadosOriginais);
                renderizarRegistros(todosRegistrosProcessados);

                // Restaurar botão
                btnCarregarMais.innerHTML = btnTextoOriginal;
                btnCarregarMais.disabled = false;

                // Se não houver mais registros, remover o botão
                if (snapshot.size < 10) {
                    btnCarregarMais.remove();
                }
            } else {
                // Não há mais registros
                btnCarregarMais.remove();
            }
        })
        .catch(error => {
            console.error('Erro ao carregar mais registros:', error);
            btnCarregarMais.innerHTML = btnTextoOriginal;
            btnCarregarMais.disabled = false;
            alert('Erro ao carregar mais registros. Tente novamente.');
        });
}

// Função para eliminar registros duplicados
function eliminarDuplicados(registros) {
    console.log('Eliminando registros duplicados...');
    
    // Se houver poucos registros, não eliminar duplicatas
    if (registros.length <= 20) {
        console.log('Poucos registros encontrados, pulando eliminação de duplicatas');
        return registros;
    }
    
    // Usar um Map para agrupar registros por uma chave única
    const registrosMap = new Map();
    
    registros.forEach(registro => {
        // Criar uma chave mais específica para identificar duplicatas verdadeiras
        // Combinamos timestamp + dispositivo + tipo + machine/maquina + usuario
        
        let timestamp = '';
        if (registro.timestamp) {
            if (registro.timestamp instanceof Date) {
                timestamp = registro.timestamp.getTime();
            } else if (typeof registro.timestamp === 'object' && registro.timestamp.seconds) {
                timestamp = registro.timestamp.seconds * 1000;
        } else {
                timestamp = new Date(registro.timestamp).getTime();
            }
        }
        
        const dispositivo = registro.dispositivo || registro.equipamentoId || '';
        const tipo = registro.tipo || registro.type || '';
        const maquina = registro.maquina || registro.machine || '';
        const usuario = registro.usuario || registro.user || '';
        
        // Somente considerar duplicados se todos esses campos forem iguais
        // e a diferença de timestamp for menor que 1 segundo (1000ms)
        const chave = `${tipo}-${dispositivo}-${maquina}-${usuario}`;
        
        let adicionar = true;
        
        // Verificar se já existe um registro similar com timestamp próximo
        for (const [existingKey, existingReg] of registrosMap.entries()) {
            if (existingKey.startsWith(chave)) {
                const existingTime = existingReg._timestamp || 0;
                if (Math.abs(timestamp - existingTime) < 1000) {
                    // Registros são realmente duplicados, manter o mais completo
                    if (Object.keys(registro).length > Object.keys(existingReg).length) {
                        registrosMap.delete(existingKey);
                        adicionar = true;
                        break;
                    } else {
                        adicionar = false;
                        break;
                    }
                }
            }
        }
        
        if (adicionar) {
            // Armazenar o timestamp para comparação
            registro._timestamp = timestamp;
            registrosMap.set(`${chave}-${timestamp}`, registro);
        }
    });
    
    // Converter o Map de volta para um array
    return Array.from(registrosMap.values());
}

// Função para processar os registros antes de exibi-los
function processarRegistros(registros) {
    console.log(`Processando ${registros.length} registros...`);
    
    // Eliminar duplicatas baseado em algum critério
    const registrosUnicos = eliminarDuplicados(registros);
    console.log(`Registros após remoção de duplicatas: ${registrosUnicos.length}`);
    
    // Processar e normalizar os dados para exibição
    const registrosProcessados = registrosUnicos.map(registro => {
        // Normalizar timestamp usando a função robusta normalizarTimestamp
        if (registro.timestamp) {
            registro.timestamp = normalizarTimestamp(registro.timestamp);
        }
        
        // Normalizar campos para facilitar filtragem
        if (registro.tipo) {
            registro.operacao = normalizarTipoOperacao(registro.tipo);
        } else if (registro.type) {
            registro.operacao = normalizarTipoOperacao(registro.type);
        }
        
        // Extrair outros dados que possam estar em campos aninhados
        const dadosExtras = extrairDadosEmbutidos(registro);
        if (dadosExtras) {
            // Mesclar dados extras com o registro principal
            Object.assign(registro, dadosExtras);
        }
        
        return registro;
    });
    
    // Não chamar renderizarRegistros aqui pois será chamado por buscarRegistros
    
    return registrosProcessados;
}

// Renderizar registros na tabela DataTable
function renderizarRegistros(registros) {
    console.log(`Renderizando ${registros.length} registros na tabela...`);
    
    if (!dataTable) {
        console.error('DataTable não inicializada');
        // Esconder o spinner em caso de erro
        hideLoadingSpinner();
        return;
    }
    
    // Limpar a tabela existente
    dataTable.clear();
    
    // Verificar se temos registros para exibir
    if (registros.length === 0) {
        console.log('Nenhum registro para exibir');
        dataTable.draw();
        // Esconder o spinner mesmo se não houver registros
        hideLoadingSpinner();
        return;
    }
    
    // Log de debug para verificar a estrutura dos registros
    console.log('Exemplo de registro:', registros[0]);
    
    // Adicionar os novos dados
    registros.forEach(registro => {
        // Formatar os dados para exibição
        let dataFormatada = 'N/A';
        let horarioFormatado = 'N/A';
        
        try {
            // Garantir que timestamp seja processado corretamente
            if (registro.timestamp) {
                if (registro.timestamp instanceof Date) {
                    dataFormatada = formatarData(registro.timestamp);
                    horarioFormatado = formatarHorario(registro.timestamp);
                } else if (typeof registro.timestamp === 'object' && registro.timestamp.seconds) {
                    const data = new Date(registro.timestamp.seconds * 1000);
                    dataFormatada = formatarData(data);
                    horarioFormatado = formatarHorario(data);
                } else {
                    const data = new Date(registro.timestamp);
                    dataFormatada = formatarData(data);
                    horarioFormatado = formatarHorario(data);
                }
            }
        } catch (e) {
            console.error('Erro ao processar timestamp:', e);
        }
        
        // Extrair todas as possíveis informações para cada campo
        // Loja/Store (priorizar lojaId conforme solicitado)
        let loja = '';
        if (registro.lojaId) {
            loja = registro.lojaId;
        } else if (registro.storeId) {
            loja = registro.storeId;
        } else if (registro.dados && registro.dados.lojaId) {
            loja = registro.dados.lojaId;
        } else if (registro.store && registro.store.id) {
            loja = registro.store.id;
        } else if (registro.loja) {
            loja = registro.loja;
        } else if (registro.store) {
            loja = typeof registro.store === 'object' ? registro.store.name || JSON.stringify(registro.store) : registro.store;
        } else if (registro.dados && registro.dados.loja) {
            loja = registro.dados.loja;
        } else if (registro.dados && registro.dados.store) {
            loja = registro.dados.store;
        } else if (registro.configuracao && registro.configuracao.loja) {
            loja = registro.configuracao.loja;
        }
        
        // Usuário (priorizar displayName conforme solicitado)
        let usuario = '';
        if (registro.displayName) {
            usuario = registro.displayName;
        } else if (registro.user && registro.user.displayName) {
            usuario = registro.user.displayName;
        } else if (registro.usuario && registro.usuario.displayName) {
            usuario = registro.usuario.displayName;
        } else if (registro.dados && registro.dados.displayName) {
            usuario = registro.dados.displayName;
        } else if (registro.configuracao && registro.configuracao.displayName) {
            usuario = registro.configuracao.displayName;
        } else if (registro.usuario) {
            usuario = registro.usuario;
        } else if (registro.user) {
            usuario = typeof registro.user === 'object' ? registro.user.name || JSON.stringify(registro.user) : registro.user;
        } else if (registro.usuarioId) {
            usuario = registro.usuarioId;
        } else if (registro.userId) {
            usuario = registro.userId;
        } else if (registro.dados && registro.dados.usuario) {
            usuario = registro.dados.usuario;
        } else if (registro.criador) {
            usuario = registro.criador;
        }
        
        // Tipo de operação
        let operacao = '';
        if (registro.operacao) {
            operacao = registro.operacao;
        } else if (registro.tipo) {
            operacao = normalizarTipoOperacao(registro.tipo);
        } else if (registro.type) {
            operacao = normalizarTipoOperacao(registro.type);
        } else if (registro.tipoOperacao) {
            operacao = normalizarTipoOperacao(registro.tipoOperacao);
        } else if (registro.dados && registro.dados.tipo) {
            operacao = normalizarTipoOperacao(registro.dados.tipo);
        } else if (registro.dados && registro.dados.operacao) {
            operacao = registro.dados.operacao;
        }
        
        // Máquina - apenas o código, sem textos adicionais
        let maquina = '';
        if (registro.maquinaId) {
            maquina = registro.maquinaId;
        } else if (registro.machineId) {
            maquina = registro.machineId;
        } else if (registro.lavadoraId) {
            maquina = registro.lavadoraId;
        } else if (registro.secadoraId) {
            maquina = registro.secadoraId;
        } else if (registro.dosadoraId) {
            maquina = registro.dosadoraId;
        } else if (registro.maquina) {
            // Se for um string, usar diretamente
            if (typeof registro.maquina === 'string') {
                maquina = registro.maquina;
            }
            // Se for um objeto, tentar obter o ID
            else if (typeof registro.maquina === 'object' && registro.maquina !== null) {
                maquina = registro.maquina.id || registro.maquina.codigo || JSON.stringify(registro.maquina);
            }
        } else if (registro.machine) {
            // Mesmo tratamento para machine
            if (typeof registro.machine === 'string') {
                maquina = registro.machine;
            } else if (typeof registro.machine === 'object' && registro.machine !== null) {
                maquina = registro.machine.id || registro.machine.codigo || JSON.stringify(registro.machine);
            }
        } else if (registro.dispositivo) {
            maquina = registro.dispositivo;
        } else if (registro.equipamentoId) {
            maquina = registro.equipamentoId;
        }
        
        // Produto
        const produto = obterProduto(registro) || '';
        
        // Dosagem - converter para "Simples" ou "Dupla"
        let dosagem = '';
        let valorDosagem = null;
        
        // Se o produto for "sem amaciante", não mostrar a dosagem
        if (produto.toLowerCase() === 'sem amaciante') {
            dosagem = '-';
        } else {
            // Obter o valor bruto da dosagem
            if (registro.dose !== undefined) {
                valorDosagem = registro.dose;
            } else if (registro.dosagem !== undefined) {
                valorDosagem = registro.dosagem;
            } else if (registro.configuracao && registro.configuracao.dosagem !== undefined) {
                valorDosagem = registro.configuracao.dosagem;
            } else if (registro.dados && registro.dados.dosagem !== undefined) {
                valorDosagem = registro.dados.dosagem;
            }
            
            // Converter para o formato desejado
            if (valorDosagem !== null) {
                // Converter para número se for string
                if (typeof valorDosagem === 'string') {
                    valorDosagem = valorDosagem.trim();
                    valorDosagem = isNaN(valorDosagem) ? valorDosagem : Number(valorDosagem);
                }
                
                // Formatar conforme solicitado
                if (valorDosagem === 1 || valorDosagem === '1') {
                        dosagem = 'Simples';
                } else if (valorDosagem === 2 || valorDosagem === '2') {
                        dosagem = 'Dupla';
                } else {
                    dosagem = valorDosagem.toString();
                }
            }
        }
        
        // Tempo
        let tempo = '';
        if (registro.tempo !== undefined) {
            tempo = registro.tempo;
        } else if (registro.tempoLiberacao !== undefined) {
            tempo = registro.tempoLiberacao;
        } else if (registro.time !== undefined) {
            tempo = registro.time;
        } else if (registro.duracao !== undefined) {
            tempo = registro.duracao;
        } else if (registro.configuracao && registro.configuracao.tempo !== undefined) {
            tempo = registro.configuracao.tempo;
        } else if (registro.dados && registro.dados.tempo !== undefined) {
            tempo = registro.dados.tempo;
        }
        
        // Adicionar linha à tabela
        try {
            dataTable.row.add([
                dataFormatada,
                horarioFormatado,
                loja,
                usuario,
                operacao,
                maquina,
                produto,
                dosagem,
                tempo
            ]);
        } catch (e) {
            console.error('Erro ao adicionar linha à tabela:', e);
        }
    });
    
    try {
        // Redesenhar a tabela completa
        dataTable.draw();
        
        // Garantir ordenação por data mais recente (ordem decrescente)
        setTimeout(function() {
            dataTable.order([0, 'desc']).draw();
            console.log('Ordenação por data mais recente aplicada');
            
            // Esconder o spinner após a tabela ser carregada
            hideLoadingSpinner();
        }, 100);
        
        console.log('Tabela atualizada com sucesso');
    } catch (e) {
        console.error('Erro ao redesenhar tabela:', e);
        // Esconder o spinner mesmo em caso de erro
        hideLoadingSpinner();
    }
}

// Exibir detalhes do registro
function exibirDetalhes(registro) {
    console.log("Exibindo detalhes:", registro);
    
    // Limpar conteúdo anterior
    const detalhesConteudo = document.getElementById('detalhesConteudo');
    detalhesConteudo.innerHTML = '';
    
    // Processar cada campo do registro
    for (const [chave, valor] of Object.entries(registro)) {
        if (chave === 'store' || chave === 'user') {
            // Processar objetos aninhados
            if (valor && typeof valor === 'object') {
                const subLista = document.createElement('ul');
                subLista.className = 'list-group list-group-flush';
                
                for (const [subChave, subValor] of Object.entries(valor)) {
                    const subItem = document.createElement('li');
                    subItem.className = 'list-group-item';
                    subItem.textContent = `${subChave}: ${subValor}`;
                    subLista.appendChild(subItem);
                }
                
                const item = document.createElement('li');
                item.className = 'list-group-item';
                
                const titulo = document.createElement('strong');
                titulo.textContent = chave;
                
                item.appendChild(titulo);
                item.appendChild(document.createElement('br'));
                item.appendChild(subLista);
                
                detalhesConteudo.appendChild(item);
            }
        } else if (chave !== 'timestamp') {
            // Exibir outros campos, exceto timestamp (já mostrado como data/hora)
            const item = document.createElement('li');
            item.className = 'list-group-item';
            
            // Verificar se o valor é um objeto
            if (valor && typeof valor === 'object' && !(valor instanceof Date)) {
                item.innerHTML = `<strong>${chave}:</strong> ${JSON.stringify(valor)}`;
            } else {
                item.innerHTML = `<strong>${chave}:</strong> ${valor}`;
            }
            
            detalhesConteudo.appendChild(item);
        }
    }
}

// Formatar data
function formatarData(timestamp) {
    if (!timestamp) return 'Indefinido';
    
    const data = timestamp instanceof Date ? timestamp : new Date(timestamp);
    
    return data.toLocaleDateString('pt-BR');
}

// Formatar horário
function formatarHorario(timestamp) {
    if (!timestamp) return 'Indefinido';
    
    const data = timestamp instanceof Date ? timestamp : new Date(timestamp);
    
    return data.toLocaleTimeString('pt-BR');
}

// Função para obter o produto
function obterProduto(registro) {
    // Verificar valores de bomba
    if (registro.bomba === 1 || registro.bomba === '1') return 'Sabão';
    if (registro.bomba === 2 || registro.bomba === '2') return 'Floral';
    if (registro.bomba === 3 || registro.bomba === '3') return 'Sport';
    
    // Verificar valores de amaciante
    if (registro.amaciante === 0 || registro.amaciante === '0') return 'Sem amaciante';
    if (registro.amaciante === 1 || registro.amaciante === '1') return 'Floral';
    if (registro.amaciante === 2 || registro.amaciante === '2') return 'Sport';
    
    // Verificar nos dados aninhados
    if (registro.configuracao) {
        if (registro.configuracao.bomba === 1 || registro.configuracao.bomba === '1') return 'Sabão';
        if (registro.configuracao.bomba === 2 || registro.configuracao.bomba === '2') return 'Floral';
        if (registro.configuracao.bomba === 3 || registro.configuracao.bomba === '3') return 'Sport';
        
        if (registro.configuracao.amaciante === 0 || registro.configuracao.amaciante === '0') return 'Sem amaciante';
        if (registro.configuracao.amaciante === 1 || registro.configuracao.amaciante === '1') return 'Floral';
        if (registro.configuracao.amaciante === 2 || registro.configuracao.amaciante === '2') return 'Sport';
    }
    
    if (registro.dados) {
        if (registro.dados.bomba === 1 || registro.dados.bomba === '1') return 'Sabão';
        if (registro.dados.bomba === 2 || registro.dados.bomba === '2') return 'Floral';
        if (registro.dados.bomba === 3 || registro.dados.bomba === '3') return 'Sport';
        
        if (registro.dados.amaciante === 0 || registro.dados.amaciante === '0') return 'Sem amaciante';
        if (registro.dados.amaciante === 1 || registro.dados.amaciante === '1') return 'Floral';
        if (registro.dados.amaciante === 2 || registro.dados.amaciante === '2') return 'Sport';
    }
    
    // Verificar se temos valores explícitos de produto
    if (registro.produto) return registro.produto;
    if (registro.product) return registro.product;
    if (registro.dados && registro.dados.produto) return registro.dados.produto;
    
    return '';
}

// Função para mostrar detalhes do registro
function mostrarDetalhes(dataHora) {
    // Encontrar o registro pelo timestamp formatado ou outros campos
    let registroEncontrado = null;
    
    // Verificar se temos registros no cache
    if (Object.keys(registrosCache).length === 0) {
        console.error('Cache de registros vazio');
        alert('Não foi possível encontrar o registro. Tente recarregar a página.');
        return;
    }
    
    // Iterar sobre o cache para encontrar o registro por data/hora
    for (const id in registrosCache) {
        const registro = registrosCache[id];
        const data = registro.timestamp instanceof Date ? 
                    registro.timestamp : 
                    new Date(registro.timestamp);
        
        const dataFormatada = formatarData(data);
        const horaFormatada = formatarHorario(data);
        
        if (`${dataFormatada} ${horaFormatada}` === dataHora) {
            registroEncontrado = registro;
            break;
        }
    }
    
    if (!registroEncontrado) {
        console.error('Registro não encontrado para dataHora:', dataHora);
        alert('Registro não encontrado. Tente recarregar a página.');
        return;
    }
    
    // Armazenar o registro para uso na função de exibir dados brutos
    window.currentRegistro = registroEncontrado;
    
    // Extrair informações de loja (priorizar lojaId)
    let lojaInfo = '';
    if (registroEncontrado.lojaId) {
        lojaInfo = registroEncontrado.lojaId;
    } else if (registroEncontrado.storeId) {
        lojaInfo = registroEncontrado.storeId;
    } else if (registroEncontrado.loja) {
        lojaInfo = registroEncontrado.loja;
    } else if (registroEncontrado.store) {
        lojaInfo = typeof registroEncontrado.store === 'object' ? 
                 (registroEncontrado.store.id || registroEncontrado.store.name || JSON.stringify(registroEncontrado.store)) : 
                 registroEncontrado.store;
    }
    
    // Extrair informações de usuário (priorizar displayName)
    let userInfo = '';
    if (registroEncontrado.displayName) {
        userInfo = registroEncontrado.displayName;
    } else if (registroEncontrado.user && registroEncontrado.user.displayName) {
        userInfo = registroEncontrado.user.displayName;
    } else if (registroEncontrado.usuario && registroEncontrado.usuario.displayName) {
        userInfo = registroEncontrado.usuario.displayName;
    } else if (registroEncontrado.usuario) {
        userInfo = registroEncontrado.usuario;
    } else if (registroEncontrado.user) {
        userInfo = typeof registroEncontrado.user === 'object' ? 
                 (registroEncontrado.user.name || JSON.stringify(registroEncontrado.user)) : 
                 registroEncontrado.user;
    } else if (registroEncontrado.usuarioId) {
        userInfo = registroEncontrado.usuarioId;
    } else if (registroEncontrado.userId) {
        userInfo = registroEncontrado.userId;
    }
    
    // Extrair código da máquina (apenas o código, sem texto adicional)
    let maquinaInfo = '';
    if (registroEncontrado.maquinaId) {
        maquinaInfo = registroEncontrado.maquinaId;
    } else if (registroEncontrado.machineId) {
        maquinaInfo = registroEncontrado.machineId;
    } else if (registroEncontrado.lavadoraId) {
        maquinaInfo = registroEncontrado.lavadoraId;
    } else if (registroEncontrado.secadoraId) {
        maquinaInfo = registroEncontrado.secadoraId;
    } else if (registroEncontrado.dosadoraId) {
        maquinaInfo = registroEncontrado.dosadoraId;
    } else if (registroEncontrado.maquina) {
        if (typeof registroEncontrado.maquina === 'string') {
            maquinaInfo = registroEncontrado.maquina;
        } else if (typeof registroEncontrado.maquina === 'object' && registroEncontrado.maquina !== null) {
            maquinaInfo = registroEncontrado.maquina.id || registroEncontrado.maquina.codigo || JSON.stringify(registroEncontrado.maquina);
        }
    } else if (registroEncontrado.machine) {
        if (typeof registroEncontrado.machine === 'string') {
            maquinaInfo = registroEncontrado.machine;
        } else if (typeof registroEncontrado.machine === 'object' && registroEncontrado.machine !== null) {
            maquinaInfo = registroEncontrado.machine.id || registroEncontrado.machine.codigo || JSON.stringify(registroEncontrado.machine);
        }
    } else if (registroEncontrado.dispositivo) {
        maquinaInfo = registroEncontrado.dispositivo;
    } else if (registroEncontrado.equipamentoId) {
        maquinaInfo = registroEncontrado.equipamentoId;
    }
    
    // Extrair e formatar informações de dosagem
    let dosagemInfo = '';
    let valorDosagem = null;
    
    // Obter valor bruto da dosagem
    if (registroEncontrado.dose !== undefined) {
        valorDosagem = registroEncontrado.dose;
    } else if (registroEncontrado.dosagem !== undefined) {
        valorDosagem = registroEncontrado.dosagem;
    } else if (registroEncontrado.configuracao && registroEncontrado.configuracao.dosagem !== undefined) {
        valorDosagem = registroEncontrado.configuracao.dosagem;
    } else if (registroEncontrado.dados && registroEncontrado.dados.dosagem !== undefined) {
        valorDosagem = registroEncontrado.dados.dosagem;
    }
    
    // Formatar dosagem
    if (valorDosagem !== null) {
        // Converter para número se for string
        if (typeof valorDosagem === 'string') {
            valorDosagem = valorDosagem.trim();
            valorDosagem = isNaN(valorDosagem) ? valorDosagem : Number(valorDosagem);
        }
        
        // Aplicar formatação
        if (valorDosagem === 1 || valorDosagem === '1') {
            dosagemInfo = 'Simples';
        } else if (valorDosagem === 2 || valorDosagem === '2') {
            dosagemInfo = 'Dupla';
        } else {
            dosagemInfo = valorDosagem.toString();
        }
    }
    
    // Preencher modal com dados do registro
    $('#detalheId').text(registroEncontrado.id);
    $('#detalheDataHora').text(`${formatarData(registroEncontrado.timestamp)} ${formatarHorario(registroEncontrado.timestamp)}`);
    $('#detalheEquipamento').text(extrairDispositivo(registroEncontrado));
    $('#detalheUsuario').text(userInfo);
    $('#detalheTipo').html(gerarBadgeOperacao(registroEncontrado.tipo || registroEncontrado.tipoOperacao || registroEncontrado.type || ''));
    $('#detalheMaquina').text(maquinaInfo);
    $('#detalheDescricao').text(registroEncontrado.descricao || registroEncontrado.mensagem || registroEncontrado.message || '');
    
    // Adicionar informação de loja se não estiver presente no HTML original
    if ($('#detalheLoja').length === 0) {
        $('#detalheUsuario').parent().before(`
            <li class="list-group-item">
                <span class="field-name">Loja:</span>
                <span class="field-value" id="detalheLoja">${lojaInfo}</span>
            </li>
        `);
    } else {
        $('#detalheLoja').text(lojaInfo);
    }
    
    // Adicionar informação de dosagem se não estiver presente no HTML original
    if ($('#detalheDosagem').length === 0 && dosagemInfo) {
        $('#detalheMaquina').parent().after(`
            <li class="list-group-item">
                <span class="field-name">Dosagem:</span>
                <span class="field-value" id="detalheDosagem">${dosagemInfo}</span>
            </li>
        `);
    } else if ($('#detalheDosagem').length > 0) {
        $('#detalheDosagem').text(dosagemInfo);
    }
    
    // Formatar JSON para melhor visualização
    const dadosJson = JSON.stringify(registroEncontrado, null, 2)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>')
        .replace(/ /g, '&nbsp;');
    
    $('#detalhesDados').html(`<pre>${dadosJson}</pre>`);
    
    // Adicionar botão para visualizar dados brutos completos, se ainda não existir
    if ($('#btnVerDadosBrutos').length === 0) {
        $('#modalDetalhes .modal-footer').prepend(`
            <button type="button" class="btn btn-info" id="btnVerDadosBrutos">
                <i class="fas fa-code me-1"></i>Ver Dados Brutos
            </button>
        `);
        
        // Adicionar evento ao botão
        $('#btnVerDadosBrutos').on('click', function() {
            mostrarDadosBrutos();
        });
    }
    
    // Exibir modal
    $('#modalDetalhes').modal('show');
}

// Função para mostrar os dados brutos de um registro
function mostrarDadosBrutos() {
    if (!window.currentRegistro) {
        console.error('Nenhum registro selecionado');
        return;
    }
    
    // Formatação bonita do JSON para exibição
    const dadosFormatados = JSON.stringify(window.currentRegistro, replacer, 2);
    
    // Exibir no modal
    $('#dadosBrutosJson').text(dadosFormatados);
    
    // Fechar o modal de detalhes e abrir o de dados brutos
    $('#modalDetalhes').modal('hide');
    $('#dadosBrutosModal').modal('show');
}

// Função auxiliar para melhorar a exibição de JSON
function replacer(key, value) {
    // Converter objetos Firebase Timestamp para string legível
    if (value && typeof value === 'object' && value.seconds !== undefined && value.nanoseconds !== undefined) {
        return `Timestamp: ${new Date(value.seconds * 1000).toISOString()}`;
    }
    return value;
}

// Extrair dados que podem estar em campos aninhados
function extrairDadosEmbutidos(registro) {
    // Extrai campos como tempo de secagem, tipo de dosagem, tipo de produto, etc.
    
    // Busca em múltiplos níveis (registro direto, configuracao, dados)
    if (registro.configuracao) {
        // Extrai dados da configuração
        if (registro.configuracao.tempo) {
            registro.tempoLiberacao = registro.configuracao.tempo;
        }
        
        if (registro.configuracao.amaciante !== undefined) {
            registro.amaciante = registro.configuracao.amaciante;
        }
        
        if (registro.configuracao.dosagem !== undefined) {
            registro.dosagem = registro.configuracao.dosagem;
        }
        
        if (registro.configuracao.bomba !== undefined) {
            registro.bomba = registro.configuracao.bomba;
        }
        
        if (registro.configuracao.temperaturaAC !== undefined) {
            registro.temperaturaAC = registro.configuracao.temperaturaAC;
        }
    }
    
    // Verificar também no campo 'dados' se existir
    if (registro.dados) {
        if (registro.dados.tempo && !registro.tempoLiberacao) {
            registro.tempoLiberacao = registro.dados.tempo;
        }
        
        if (registro.dados.amaciante !== undefined && registro.amaciante === undefined) {
            registro.amaciante = registro.dados.amaciante;
        }
        
        if (registro.dados.dosagem !== undefined && registro.dosagem === undefined) {
            registro.dosagem = registro.dados.dosagem;
        }
        
        if (registro.dados.bomba !== undefined && registro.bomba === undefined) {
            registro.bomba = registro.dados.bomba;
        }
        
        if (registro.dados.temperaturaAC !== undefined && registro.temperaturaAC === undefined) {
            registro.temperaturaAC = registro.dados.temperaturaAC;
        }
    }
    
    return registro;
}

// Extrair informações do dispositivo do registro
function extrairDispositivo(registro) {
    // Tentar diversos campos possíveis para identificar o dispositivo
    return registro.dispositivo || 
           registro.equipamentoId || 
           registro.deviceId || 
           registro.idDispositivo || 
           registro.id || 
           'Dispositivo desconhecido';
}

// Função para carregar todos os registros sem eliminar duplicatas
function carregarTodosRegistros() {
    console.log('Carregando todos os registros sem eliminação de duplicatas...');
    
    // Atualizar aparência do botão
    const btnCarregarTodos = document.getElementById('btnCarregarTodos');
    if (btnCarregarTodos) {
        btnCarregarTodos.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Carregando...';
        btnCarregarTodos.disabled = true;
    }
    
    // Limpar as coleções de valores únicos para os filtros
    todasLojas.clear();
    todasMaquinas.clear();
    
    // Criar uma query para buscar todos os registros
    let query = firebase.firestore().collection(colecaoRegistros)
        .orderBy('timestamp', 'desc')
        .limit(500);
    
    // Executar a query
    query.get()
        .then(snapshot => {
            if (!snapshot.empty) {
                console.log(`Encontrados ${snapshot.size} registros brutos`);
                
                const registros = snapshot.docs.map(doc => {
                    const dados = doc.data();
                    dados.id = doc.id;
                    registrosCache[doc.id] = dados;
                    return dados;
                });
                
                // Armazenar registros originais
                dadosOriginais = registros;
                
                // Extrair valores únicos para os filtros, sem eliminar duplicatas
                registros.forEach(registro => {
                    if (registro.loja) todasLojas.add(registro.loja);
                    if (registro.store) todasLojas.add(registro.store);
                    if (registro.maquina) todasMaquinas.add(registro.maquina);
                    if (registro.machine) todasMaquinas.add(registro.machine);
                });
                
                // Popular os seletores de filtro
                popularSeletoresFiltro();
                
                // Processar registros sem eliminar duplicatas
                const registrosProcessados = registros.map(registro => {
                    // Normalizar timestamp
                    if (registro.timestamp && !(registro.timestamp instanceof Date)) {
                        if (typeof registro.timestamp === 'object' && registro.timestamp.seconds) {
                            registro.timestamp = new Date(registro.timestamp.seconds * 1000);
                        } else if (typeof registro.timestamp === 'string') {
                            registro.timestamp = new Date(registro.timestamp);
                        } else if (typeof registro.timestamp === 'number') {
                            registro.timestamp = new Date(registro.timestamp);
                        }
                    }
                    
                    // Normalizar tipo de operação
                    if (registro.tipo) {
                        registro.operacao = normalizarTipoOperacao(registro.tipo);
                    } else if (registro.type) {
                        registro.operacao = normalizarTipoOperacao(registro.type);
                    }
                    
                    return registro;
                });
                
                // Renderizar todos os registros processados
                renderizarRegistros(registrosProcessados);
                
                // Restaurar aparência do botão
                if (btnCarregarTodos) {
                    btnCarregarTodos.innerHTML = '<i class="fas fa-list-alt me-1"></i>Mostrar Todos Registros';
                    btnCarregarTodos.disabled = false;
                }
                
                console.log(`Exibindo todos os ${registrosProcessados.length} registros sem filtragem`);
            } else {
                console.log('Nenhum registro encontrado');
                alert('Não foram encontrados registros no Firestore.');
                
                // Restaurar aparência do botão
                if (btnCarregarTodos) {
                    btnCarregarTodos.innerHTML = '<i class="fas fa-list-alt me-1"></i>Mostrar Todos Registros';
                    btnCarregarTodos.disabled = false;
                }
            }
        })
        .catch(error => {
            console.error('Erro ao buscar registros:', error);
            alert(`Erro ao buscar registros: ${error.message}`);
            
            // Restaurar aparência do botão
            if (btnCarregarTodos) {
                btnCarregarTodos.innerHTML = '<i class="fas fa-list-alt me-1"></i>Mostrar Todos Registros';
                btnCarregarTodos.disabled = false;
            }
        });
}

// Inicializar a página quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Fallback para garantir que o spinner seja ocultado após um tempo limite
    setTimeout(function() {
        hideLoadingSpinner();
    }, 3000); // 3 segundos de tempo limite
    
    // Também adicionar click event handler para forçar a ocultação do spinner 
    // caso o usuário precise clicar para removê-lo
    document.body.addEventListener('click', function() {
        hideLoadingSpinner();
    }, { once: true }); // Executa apenas uma vez
    
    // Verificar autenticação do usuário
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log('Usuário autenticado:', user.email);
            
            // Atualizar elementos da interface com informações do usuário
            const currentUserElements = document.querySelectorAll('#currentUser');
            const currentUserNameElements = document.querySelectorAll('#currentUserName');
            const currentUserEmailElements = document.querySelectorAll('#currentUserEmail');
            
            // Nome a ser exibido (priorizar displayName, se não disponível usar email)
            const displayName = user.displayName || user.email.split('@')[0] || 'Usuário';
            const userEmail = user.email || '';
            
            // Atualizar todos os elementos com o nome do usuário
            currentUserElements.forEach(el => {
                el.textContent = displayName;
            });
            
            // Atualizar todos os elementos com o nome completo do usuário
            currentUserNameElements.forEach(el => {
                el.textContent = displayName;
            });
            
            // Atualizar todos os elementos com o email do usuário
            currentUserEmailElements.forEach(el => {
                el.textContent = userEmail;
            });
            
            inicializarPagina();
        } else {
            console.log('Usuário não autenticado, redirecionando para login...');
            window.location.href = 'login.html';
        }
    });
    
    // Configurar botão de logout
    document.getElementById('btnLogout').addEventListener('click', function() {
        firebase.auth().signOut()
            .then(() => {
                window.location.href = 'login.html';
            })
            .catch(error => {
                console.error('Erro ao fazer logout:', error);
                alert('Erro ao fazer logout. Tente novamente.');
            });
    });
    
    // Configurar botão para carregar todos os registros
    const btnCarregarTodos = document.getElementById('btnCarregarTodos');
    if (btnCarregarTodos) {
        btnCarregarTodos.addEventListener('click', carregarTodosRegistros);
    }

    // Adicionar evento ao botão de recarregar tabela
    btnRecarregarTabela.addEventListener('click', () => {
        console.log('Solicitada recarga manual da tabela');
        buscarRegistros();
    });
});