// Referência ao banco de dados do Firebase
const database = firebase.database();

// Elementos do DOM
const lojasTableBody = document.getElementById('lojas-table-body');
const loadingRow = document.getElementById('loading-row');
const lojaRowTemplate = document.getElementById('loja-row-template');
const searchInput = document.getElementById('search-input');
const regionFilter = document.getElementById('region-filter');
const stateFilter = document.getElementById('state-filter');
const statusFilter = document.getElementById('status-filter');
const totemFilter = document.getElementById('totem-filter');
const clearFiltersBtn = document.getElementById('clear-filters');
const storeCountElement = document.getElementById('store-count');
const confirmBatchResetBtn = document.getElementById('confirm-batch-reset');

// Elementos das listas de problemas
const lojasOfflineBadge = document.getElementById('lojas-offline-badge');
const lojasOfflineList = document.getElementById('lojas-offline-list');
const noLojasOffline = document.getElementById('no-lojas-offline');
const totemsOfflineBadge = document.getElementById('totems-offline-badge');
const totemsOfflineList = document.getElementById('totems-offline-list');
const noTotemsOffline = document.getElementById('no-totems-offline');

// Elementos de filtro das listas de problemas
const lojasOfflineRegiao = document.getElementById('lojas-offline-regiao');
const lojasOfflineEstado = document.getElementById('lojas-offline-estado');
const totemsOfflineRegiao = document.getElementById('totems-offline-regiao');
const totemsOfflineEstado = document.getElementById('totems-offline-estado');

// Elementos de Abas
const cardsTab = document.getElementById('cards-tab');
const tableTab = document.getElementById('table-tab');
const cardsView = document.getElementById('cards-view');
const tableView = document.getElementById('table-view');

// Elementos para estatísticas de lojas
const lojasOnlineCount = document.getElementById('lojas-online-count');
const lojasOnlinePercent = document.getElementById('lojas-online-percent');
const lojasOfflineCount = document.getElementById('lojas-offline-count');
const lojasOfflinePercent = document.getElementById('lojas-offline-percent');
const lojasOnlineProgress = document.getElementById('lojas-online-progress');

// Elementos para estatísticas de totems
const totemsOnlineCount = document.getElementById('totems-online-count');
const totemsOnlinePercent = document.getElementById('totems-online-percent');
const totemsOfflineCount = document.getElementById('totems-offline-count');
const totemsOfflinePercent = document.getElementById('totems-offline-percent');
const totemsOnlineProgress = document.getElementById('totems-online-progress');

// Elementos para o modal de reset em lote
const resetScopeFiltered = document.getElementById('resetScopeFiltered');
const resetScopeRegion = document.getElementById('resetScopeRegion');
const resetScopeState = document.getElementById('resetScopeState');
const resetRegionContainer = document.getElementById('resetRegionContainer');
const resetStateContainer = document.getElementById('resetStateContainer');
const resetRegion = document.getElementById('resetRegion');
const resetState = document.getElementById('resetState');
const resetType = document.getElementById('resetType');
const affectedStoresCount = document.getElementById('affected-stores-count');

// Armazenar todas as lojas para filtrar
let todasLojas = [];
let lojasFiltradas = [];
let lojasTable; // Para a instância do DataTable

// Mapa de regiões e estados do Brasil
const estadosPorRegiao = {
    'norte': ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO'],
    'nordeste': ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
    'centro-oeste': ['DF', 'GO', 'MT', 'MS'],
    'sudeste': ['ES', 'MG', 'RJ', 'SP'],
    'sul': ['PR', 'RS', 'SC']
};

// Coordenadas para posicionar os marcadores no mapa
const coordenadasEstados = {
    // Norte
    'AC': [-9.0238, -70.812],
    'AM': [-3.4168, -65.8561],
    'AP': [1.4136, -51.7979],
    'PA': [-3.9784, -52.8151],
    'RO': [-10.9443, -62.8277],
    'RR': [1.9981, -61.3947],
    'TO': [-10.1753, -48.2982],
    // Nordeste
    'AL': [-9.5713, -36.7819],
    'BA': [-12.5797, -41.7007],
    'CE': [-5.4984, -39.3206],
    'MA': [-5.2927, -45.6166],
    'PB': [-7.0577, -36.5703],
    'PE': [-8.4117, -37.5919],
    'PI': [-7.7183, -42.7289],
    'RN': [-5.8122, -36.5389],
    'SE': [-10.6809, -37.4346],
    // Centro-Oeste
    'DF': [-15.83, -47.86],
    'GO': [-15.827, -49.8362],
    'MT': [-12.6819, -56.9211],
    'MS': [-20.4428, -54.6466],
    // Sudeste
    'ES': [-19.1834, -40.3089],
    'MG': [-18.512, -44.555],
    'RJ': [-22.9068, -43.1729],
    'SP': [-23.5505, -46.6333],
    // Sul
    'PR': [-25.2521, -52.0215],
    'RS': [-30.0346, -51.2177],
    'SC': [-27.2423, -50.2189]
};

const estadosNomes = {
    'AC': 'Acre',
    'AL': 'Alagoas',
    'AM': 'Amazonas',
    'AP': 'Amapá',
    'BA': 'Bahia',
    'CE': 'Ceará',
    'DF': 'Distrito Federal',
    'ES': 'Espírito Santo',
    'GO': 'Goiás',
    'MA': 'Maranhão',
    'MG': 'Minas Gerais',
    'MS': 'Mato Grosso do Sul',
    'MT': 'Mato Grosso',
    'PA': 'Pará',
    'PB': 'Paraíba',
    'PE': 'Pernambuco',
    'PI': 'Piauí',
    'PR': 'Paraná',
    'RJ': 'Rio de Janeiro',
    'RN': 'Rio Grande do Norte',
    'RO': 'Rondônia',
    'RR': 'Roraima',
    'RS': 'Rio Grande do Sul',
    'SC': 'Santa Catarina',
    'SE': 'Sergipe',
    'SP': 'São Paulo',
    'TO': 'Tocantins'
};

// Variável global para o mapa Leaflet
let brasilMap;
// Variável para os marcadores no mapa
let mapMarkers = [];

// Função para formatar a data
function formatarData(timestamp) {
    console.log("formatarData (app.js) - Valor original:", timestamp, typeof timestamp);
    
    try {
        // Se for uma string, converter para número
        if (typeof timestamp === 'string') {
            timestamp = Number(timestamp);
            console.log("Convertido de string para número:", timestamp);
        }
        
        // Se não for um número, tentar converter
        if (typeof timestamp !== 'number') {
            timestamp = parseInt(timestamp);
        }
        
        // Verificar se é NaN após conversão
        if (isNaN(timestamp)) {
            console.error("Timestamp inválido (NaN):", timestamp);
            return "Data inválida";
        }
        
        // Se o timestamp for pequeno demais ou grande demais, é provavelmente inválido
        if (timestamp <= 0) {
            console.error("Timestamp negativo ou zero:", timestamp);
            return "Data inválida";
        }
        
        // Verificar formato (segundos vs milissegundos)
        const timestampDate = new Date(timestamp);
        const timestampYear = timestampDate.getFullYear();
        
        console.log(`Convertido para data: ${timestampDate}, ano: ${timestampYear}`);
        
        // Se o ano for 1970 ou uma data inválida, provavelmente está em segundos
        if (timestampYear === 1970 || timestampYear < 2010 || timestampYear > 2050) {
            // Tentar multiplicar por 1000 para converter de segundos para ms
            timestamp = timestamp * 1000;
            console.log("Timestamp ajustado para ms:", timestamp);
            const newDate = new Date(timestamp);
            console.log("Nova data após ajuste:", newDate);
            
            // Se ainda estiver em 1970, está realmente inválido
            if (newDate.getFullYear() < 2010) {
                console.error("Timestamp inválido mesmo após ajuste");
                return "Data inválida";
            }
            
            return formatarDataAjustada(newDate);
        }
        
        return formatarDataAjustada(timestampDate);
    } catch (error) {
        console.error("Erro ao formatar data:", error, "para timestamp:", timestamp);
        return "Data inválida";
    }
}

// Função auxiliar para formatação de datas
function formatarDataAjustada(data) {
    const hoje = new Date();
    
    // Verifica se é hoje
    if (data.toDateString() === hoje.toDateString()) {
        return `Hoje, ${data.getHours().toString().padStart(2, '0')}:${data.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Verifica se é ontem
    const ontem = new Date();
    ontem.setDate(hoje.getDate() - 1);
    if (data.toDateString() === ontem.toDateString()) {
        return `Ontem, ${data.getHours().toString().padStart(2, '0')}:${data.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Caso contrário, retorna a data completa
    return `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}/${data.getFullYear()} ${data.getHours().toString().padStart(2, '0')}:${data.getMinutes().toString().padStart(2, '0')}`;
}

// Função para determinar o status da loja
function determinarStatus(loja) {
    // Verifica se existe o nó de status
    if (loja.pc_status && loja.pc_status.timestamp) {
        let ultimaAtualizacao = loja.pc_status.timestamp;
        console.log("determinarStatus (app.js) - timestamp original:", ultimaAtualizacao, typeof ultimaAtualizacao);
        
        // Se for uma string, converter para número
        if (typeof ultimaAtualizacao === 'string') {
            ultimaAtualizacao = Number(ultimaAtualizacao);
            console.log("Convertido de string para número:", ultimaAtualizacao);
        }
        
        // Se não for um número, tentar converter
        if (typeof ultimaAtualizacao !== 'number') {
            ultimaAtualizacao = parseInt(ultimaAtualizacao);
            if (isNaN(ultimaAtualizacao)) {
                console.error("Timestamp inválido em determinarStatus:", ultimaAtualizacao);
                return { status: "Offline", classe: "bg-danger", indicador: "status-offline" };
            }
        }
        
        // CORREÇÃO PARA DATAS EM SEGUNDOS VS MILISSEGUNDOS:
        const timestampDate = new Date(ultimaAtualizacao);
        const timestampYear = timestampDate.getFullYear();
        
        // Se o ano da data for antes de 2010 ou após 2050, provavelmente está no formato errado
        if (timestampYear < 2010 || timestampYear > 2050) {
            // Multiplicamos por 1000 para converter de segundos para ms
            ultimaAtualizacao = ultimaAtualizacao * 1000;
            console.log("Timestamp ajustado em determinarStatus:", ultimaAtualizacao);
        }
        
        const agora = Date.now();
        const diferenca = agora - ultimaAtualizacao;
        
        console.log("Timestamp atual:", agora, "Diferença:", diferenca, "ms", Math.floor(diferenca/1000/60), "minutos");
        
        // Se a última atualização foi há menos de 1 minuto, considera online
        if (diferenca < 1 * 60 * 1000) {
            return { status: "Online", classe: "bg-success", indicador: "status-online" };
        } 
        // Caso contrário, considera offline
        else {
            return { status: "Offline", classe: "bg-danger", indicador: "status-offline" };
        }
    }
    
    return { status: "Offline", classe: "bg-danger", indicador: "status-offline" };
}

// Função para contar dispositivos
function contarDispositivos(loja, tipo) {
    if (!loja || !loja[tipo]) return 0;
    
    // Para o caso de ar_condicionado, que pode ser um objeto simples
    if (tipo === 'ar_condicionado') {
        return Object.keys(loja[tipo]).length > 0 ? 1 : 0;
    }
    
    // Caso especial para secadoras (para não contar duplicados com diferentes tempos)
    if (tipo === 'secadoras') {
        // Obtém chaves das secadoras (que incluem ID_tempo, como "765_15", "765_30", etc)
        const keys = Object.keys(loja[tipo]);
        // Extrai apenas os IDs únicos (parte inicial antes do underscore)
        const uniqueIds = new Set();
        
        keys.forEach(key => {
            // Extrai o ID base da secadora (parte antes de "_")
            const baseId = key.split('_')[0];
            uniqueIds.add(baseId);
        });
        
        return uniqueIds.size; // Retorna a quantidade de IDs únicos
    }
    
    // Para outros tipos (lavadoras, dosadora_01)
    return Object.keys(loja[tipo]).length;
}

// Função para obter a região e estado de uma loja
function getLojaRegionAndState(codigo) {
    // Exemplo de código: "SP05-001" (onde SP é o estado)
    const match = codigo.match(/^([A-Z]{2})/);
    if (match && match[1]) {
        const estado = match[1];
        
        // Encontrar a região com base no estado
        for (const [regiao, estados] of Object.entries(estadosPorRegiao)) {
            if (estados.includes(estado)) {
                return { regiao, estado };
            }
        }
    }
    
    // Padrão se não conseguir extrair estado
    return { regiao: 'indefinida', estado: 'indefinido' };
}

// Função para criar um card de loja
function criarCardLoja(codigo, loja) {
    // Clona o template
    const card = lojaCardTemplate.content.cloneNode(true);
    
    // Preenche os dados
    card.querySelector('.loja-codigo').textContent = codigo;
    
    // Status
    const statusInfo = determinarStatus(loja);
    const statusTexto = card.querySelector('.loja-status');
    
    // Última atualização
    const timestamp = loja.pc_status ? loja.pc_status.timestamp : null;
    const dataFormatada = formatarData(timestamp);
    card.querySelector('.loja-atualizacao').textContent = dataFormatada;
    
    // Atualiza o status baseado na verificação
    const cardElement = card.querySelector('.card');
    
    if (statusInfo.status === "Online") {
        statusTexto.textContent = "Online";
        statusTexto.className = "text-success fw-medium loja-status small-text";
        
        // Atualiza o indicador de status
        const statusIndicator = card.querySelector('.status-indicator');
        statusIndicator.classList.add('status-online');
    } else {
        statusTexto.textContent = "Offline";
        statusTexto.className = "text-danger fw-medium loja-status small-text";
        
        // Atualiza o indicador de status
        const statusIndicator = card.querySelector('.status-indicator');
        statusIndicator.classList.add('status-offline');
        
        // Adiciona classe para destacar card com status offline
        if (cardElement) {
            cardElement.classList.add('card-offline');
        }
    }
    
    // Status da Motherboard (agora Totem)
    const motherboardStatusText = card.querySelector('.motherboard-status');
    const motherboardIndicator = card.querySelector('.motherboard-indicator');
    
    // Se a loja estiver offline, exibir "indisponível" para o status do totem
    if (statusInfo.status === "Offline") {
        motherboardStatusText.textContent = "Totem: indisponível";
        motherboardStatusText.className = "text-muted fw-medium motherboard-status small-text";
    } else if (loja.status_motherboard) {
        const isMotherboardOn = loja.status_motherboard === 'ON';
        motherboardStatusText.textContent = `Totem: ${isMotherboardOn ? 'ON' : 'OFF'}`;
        motherboardStatusText.className = `${isMotherboardOn ? 'text-success' : 'text-danger'} fw-medium motherboard-status small-text`;
        
        // Adiciona classe para o indicador de status do totem
        if (isMotherboardOn) {
            motherboardIndicator.classList.add('status-online');
        } else {
            motherboardIndicator.classList.add('status-offline');
            
            // Adiciona classe para destacar card com totem offline (se ainda não tiver a classe card-offline)
            if (cardElement && !cardElement.classList.contains('card-offline')) {
                cardElement.classList.add('totem-offline');
            }
        }
    } else {
        motherboardStatusText.textContent = 'Totem: --';
        motherboardStatusText.className = 'text-muted fw-medium motherboard-status small-text';
    }
    
    // Extrair região e estado do código da loja
    const { regiao, estado } = getLojaRegionAndState(codigo);
    
    // Adiciona o código da loja como atributo data para facilitar atualizações
    if (cardElement) {
        cardElement.dataset.loja = codigo;
        cardElement.dataset.regiao = regiao;
        cardElement.dataset.estado = estado;
    }
    
    // Configura o botão de acesso
    const btnAcessar = card.querySelector('.btn-acessar');
    btnAcessar.href = `loja.html?id=${codigo}`;
    
    // Desabilitar botão se a loja estiver offline
    if (statusInfo.status === "Offline") {
        btnAcessar.classList.remove('btn-outline-primary');
        btnAcessar.classList.add('btn-outline-secondary');
        btnAcessar.disabled = true;
        btnAcessar.style.pointerEvents = "none"; // Impede completamente a interação
    }
    
    return card;
}

// Função para atualizar o status de uma loja existente no DOM
function atualizarStatusLoja(codigo, loja) {
    const cardElement = document.querySelector(`.card[data-loja="${codigo}"]`);
    if (!cardElement) return;
    
    // Atualiza o timestamp de última atualização
    const timestamp = loja.pc_status ? loja.pc_status.timestamp : null;
    const dataFormatada = formatarData(timestamp);
    const atualizacaoElement = cardElement.querySelector('.loja-atualizacao');
    if (atualizacaoElement) {
        atualizacaoElement.textContent = dataFormatada;
    }
    
    // Primeiro, remove todas as classes de destaque
    cardElement.classList.remove('card-offline', 'totem-offline');
    
    // Atualiza o status baseado na verificação
    const statusInfo = determinarStatus(loja);
    const statusTexto = cardElement.querySelector('.loja-status');
    
    // Status da loja
    if (statusTexto) {
        if (statusInfo.status === "Online") {
            statusTexto.textContent = "Online";
            statusTexto.className = "text-success fw-medium loja-status small-text";
            
            // Atualiza o indicador de status
            const statusIndicator = cardElement.querySelector('.status-indicator');
            statusIndicator.classList.remove('status-offline');
            statusIndicator.classList.add('status-online');
            
            // Atualiza o botão
            const btnAcessar = cardElement.querySelector('.btn-acessar');
            if (btnAcessar) {
                btnAcessar.classList.remove('btn-outline-secondary');
                btnAcessar.classList.remove('disabled');
                btnAcessar.classList.add('btn-outline-primary');
                btnAcessar.removeAttribute('disabled');
                btnAcessar.style.pointerEvents = "";
            }
        } else {
            statusTexto.textContent = "Offline";
            statusTexto.className = "text-danger fw-medium loja-status small-text";
            
            // Atualiza o indicador de status
            const statusIndicator = cardElement.querySelector('.status-indicator');
            statusIndicator.classList.remove('status-online');
            statusIndicator.classList.add('status-offline');
            
            // Adiciona classe para destacar card com status offline
            cardElement.classList.add('card-offline');
            
            // Atualiza o botão
            const btnAcessar = cardElement.querySelector('.btn-acessar');
            if (btnAcessar) {
                btnAcessar.classList.remove('btn-outline-primary');
                btnAcessar.classList.add('btn-outline-secondary');
                btnAcessar.classList.add('disabled');
                btnAcessar.setAttribute('disabled', 'disabled');
                btnAcessar.style.pointerEvents = "none";
            }
        }
    }
    
    // Status do totem
    const motherboardStatusText = cardElement.querySelector('.motherboard-status');
    const motherboardIndicator = cardElement.querySelector('.motherboard-indicator');
    
    if (motherboardStatusText && motherboardIndicator) {
        // Se a loja estiver offline, exibir "indisponível" para o status do totem
        if (statusInfo.status === "Offline") {
            motherboardStatusText.textContent = "Totem: indisponível";
            motherboardStatusText.className = "text-muted fw-medium motherboard-status small-text";
            motherboardIndicator.classList.remove('status-online', 'status-offline');
        } else if (loja.status_motherboard) {
            const isMotherboardOn = loja.status_motherboard === 'ON';
            motherboardStatusText.textContent = `Totem: ${isMotherboardOn ? 'ON' : 'OFF'}`;
            motherboardStatusText.className = `${isMotherboardOn ? 'text-success' : 'text-danger'} fw-medium motherboard-status small-text`;
            
            // Atualiza o indicador de status do totem
            motherboardIndicator.classList.remove('status-online', 'status-offline');
            if (isMotherboardOn) {
                motherboardIndicator.classList.add('status-online');
            } else {
                motherboardIndicator.classList.add('status-offline');
                
                // Adiciona classe para destacar card com totem offline (se ainda não tiver a classe card-offline)
                if (!cardElement.classList.contains('card-offline')) {
                    cardElement.classList.add('totem-offline');
                }
            }
        }
    }
}

// Função para criar uma linha da tabela para a loja
function criarLinhaLoja(codigo, loja) {
    // Clona o template
    const row = lojaRowTemplate.content.cloneNode(true);
    
    // Preenche os dados
    row.querySelector('.loja-codigo').textContent = codigo;
    
    // Região e Estado
    const { regiao, estado } = getLojaRegionAndState(codigo);
    row.querySelector('.loja-regiao').textContent = regiao.charAt(0).toUpperCase() + regiao.slice(1); // Capitaliza
    row.querySelector('.loja-estado').textContent = estado;
    
    // Status
    const statusInfo = determinarStatus(loja);
    const statusTexto = row.querySelector('.loja-status');
    
    // Última atualização
    const timestamp = loja.pc_status ? loja.pc_status.timestamp : null;
    const dataFormatada = formatarData(timestamp);
    row.querySelector('.loja-atualizacao').textContent = dataFormatada;
    
    // Atualiza o status baseado na verificação
    const rowElement = row.querySelector('tr');
    
    if (statusInfo.status === "Online") {
        statusTexto.textContent = "Online";
        statusTexto.className = "text-success fw-medium loja-status";
        
        // Atualiza o indicador de status
        const statusIndicator = row.querySelector('.status-indicator');
        statusIndicator.classList.add('status-online');
    } else {
        statusTexto.textContent = "Offline";
        statusTexto.className = "text-danger fw-medium loja-status";
        
        // Atualiza o indicador de status
        const statusIndicator = row.querySelector('.status-indicator');
        statusIndicator.classList.add('status-offline');
        
        // Destaca a linha como offline
        if (rowElement) {
            rowElement.classList.add('table-danger');
        }
    }
    
    // Status do Totem
    const motherboardStatusText = row.querySelector('.motherboard-status');
    const motherboardIndicator = row.querySelector('.motherboard-indicator');
    
    // Se a loja estiver offline, exibir "indisponível" para o status do totem
    if (statusInfo.status === "Offline") {
        motherboardStatusText.textContent = "indisponível";
        motherboardStatusText.className = "text-muted fw-medium motherboard-status";
    } else if (loja.status_motherboard) {
        const isMotherboardOn = loja.status_motherboard === 'ON';
        motherboardStatusText.textContent = isMotherboardOn ? 'ON' : 'OFF';
        motherboardStatusText.className = `${isMotherboardOn ? 'text-success' : 'text-danger'} fw-medium motherboard-status`;
        
        // Adiciona classe para o indicador de status do totem
        if (isMotherboardOn) {
            motherboardIndicator.classList.add('status-online');
        } else {
            motherboardIndicator.classList.add('status-offline');
            
            // Se a linha não está marcada como offline, marca com um destaque para o totem
            if (rowElement && !rowElement.classList.contains('table-danger')) {
                rowElement.classList.add('totem-offline-row');
            }
        }
    } else {
        motherboardStatusText.textContent = '--';
        motherboardStatusText.className = 'text-muted fw-medium motherboard-status';
    }
    
    // Configura o botão de acesso
    const btnAcessar = row.querySelector('.btn-acessar');
    btnAcessar.href = `loja.html?id=${codigo}`;
    
    // Desabilitar botão se a loja estiver offline
    if (statusInfo.status === "Offline") {
        btnAcessar.classList.remove('btn-outline-primary');
        btnAcessar.classList.add('btn-outline-secondary');
        btnAcessar.disabled = true;
        btnAcessar.style.pointerEvents = "none"; // Impede completamente a interação
    }
    
    // Adiciona o código da loja como atributo data para facilitar atualizações
    if (rowElement) {
        rowElement.dataset.loja = codigo;
        rowElement.dataset.regiao = regiao;
        rowElement.dataset.estado = estado;
    }
    
    return row;
}

// Função para atualizar o status de uma linha de loja existente no DOM
function atualizarStatusLinhaLoja(codigo, loja) {
    const rowElement = document.querySelector(`#lojas-table-body tr[data-loja="${codigo}"]`);
    if (!rowElement) return;
    
    // Atualiza o status
    const statusInfo = determinarStatus(loja);
    const statusTexto = rowElement.querySelector('.loja-status');
    
    // Atualiza a última atualização
    const timestamp = loja.pc_status ? loja.pc_status.timestamp : null;
    const dataFormatada = formatarData(timestamp);
    const atualizacaoElement = rowElement.querySelector('.loja-atualizacao');
    if (atualizacaoElement) {
        atualizacaoElement.textContent = dataFormatada;
    }
    
    // Primeiro, remove todas as classes de destaque
    rowElement.classList.remove('table-danger', 'totem-offline-row');
    
    if (statusTexto) {
        // Atualiza o texto e a classe baseado no status
        if (statusInfo.status === "Online") {
            statusTexto.textContent = "Online";
            statusTexto.className = "text-success fw-medium loja-status";
            
            // Atualiza o indicador de status
            const statusIndicator = rowElement.querySelector('.status-indicator');
            statusIndicator.classList.remove('status-offline');
            statusIndicator.classList.add('status-online');
            
            // Atualiza o botão
            const btnAcessar = rowElement.querySelector('.btn-acessar');
            if (btnAcessar) {
                btnAcessar.classList.remove('btn-outline-secondary');
                btnAcessar.classList.add('btn-outline-primary');
                btnAcessar.disabled = false;
                btnAcessar.style.pointerEvents = "";
            }
        } else {
            statusTexto.textContent = "Offline";
            statusTexto.className = "text-danger fw-medium loja-status";
            
            // Atualiza o indicador de status
            const statusIndicator = rowElement.querySelector('.status-indicator');
            statusIndicator.classList.remove('status-online');
            statusIndicator.classList.add('status-offline');
            
            // Adiciona classe para destacar linha com status offline
            rowElement.classList.add('table-danger');
            
            // Atualiza o botão
            const btnAcessar = rowElement.querySelector('.btn-acessar');
            if (btnAcessar) {
                btnAcessar.classList.remove('btn-outline-primary');
                btnAcessar.classList.add('btn-outline-secondary');
                btnAcessar.disabled = true;
                btnAcessar.style.pointerEvents = "none";
            }
        }
    }
    
    // Atualiza o status do totem
    const motherboardStatusText = rowElement.querySelector('.motherboard-status');
    const motherboardIndicator = rowElement.querySelector('.motherboard-indicator');
    
    if (motherboardStatusText && motherboardIndicator) {
        // Se a loja estiver offline, exibir "indisponível" para o status do totem
        if (statusInfo.status === "Offline") {
            motherboardStatusText.textContent = "indisponível";
            motherboardStatusText.className = "text-muted fw-medium motherboard-status";
            motherboardIndicator.classList.remove('status-online', 'status-offline');
            // Remove classe de destaque de totem offline
            rowElement.classList.remove('totem-offline-row');
        } else if (loja.status_motherboard) {
            const isMotherboardOn = loja.status_motherboard === 'ON';
            motherboardStatusText.textContent = isMotherboardOn ? 'ON' : 'OFF';
            motherboardStatusText.className = `${isMotherboardOn ? 'text-success' : 'text-danger'} fw-medium motherboard-status`;
            
            // Atualiza o indicador de status do totem
            motherboardIndicator.classList.remove('status-online', 'status-offline');
            if (isMotherboardOn) {
                motherboardIndicator.classList.add('status-online');
                
                // Remove classe de destaque de totem offline
                rowElement.classList.remove('totem-offline-row');
            } else {
                motherboardIndicator.classList.add('status-offline');
                
                // Adiciona classe de destaque se não estiver offline
                if (!rowElement.classList.contains('table-danger')) {
                    rowElement.classList.add('totem-offline-row');
                }
            }
        }
    }
}

// Função para filtrar lojas com base na pesquisa, região e estado
function filtrarLojas() {
    console.time('filtro-lojas'); // Para medir o desempenho
    
    // Obter os valores dos filtros com verificação de nulo
    const termoPesquisa = searchInput?.value?.toLowerCase().trim() || '';
    const regiaoSelecionada = regionFilter?.value || '';
    const estadoSelecionado = stateFilter?.value || '';
    const statusSelecionado = statusFilter?.value || '';
    const totemSelecionado = totemFilter?.value || '';
    
    // Mostrar indicador de carregamento durante a filtragem
    if (lojasTableBody) {
        lojasTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-2">
                    <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                        <span class="visually-hidden">Filtrando...</span>
                    </div>
                    Aplicando filtros...
                </td>
            </tr>
        `;
    }
    
    // Usar setTimeout para não bloquear a UI durante o processamento
    setTimeout(() => {
        try {
    // Filtrar lojas com base nos critérios
    lojasFiltradas = todasLojas.filter(loja => {
        const codigo = loja.codigo.toLowerCase();
        const { regiao, estado } = getLojaRegionAndState(loja.codigo);
        
        // Filtro de texto
        const passaFiltroTexto = termoPesquisa === '' || codigo.includes(termoPesquisa);
        
        // Filtro de região
        const passaFiltroRegiao = regiaoSelecionada === '' || regiao === regiaoSelecionada;
        
        // Filtro de estado
        const passaFiltroEstado = estadoSelecionado === '' || estado === estadoSelecionado;
        
        // Filtro de status da loja
        let passaFiltroStatus = true;
        if (statusSelecionado !== '') {
            const statusInfo = determinarStatus(loja.dados);
            passaFiltroStatus = (statusSelecionado === 'online' && statusInfo.status === 'Online') || 
                                (statusSelecionado === 'offline' && statusInfo.status === 'Offline');
        }
        
        // Filtro de status do totem
        let passaFiltroTotem = true;
        if (totemSelecionado !== '') {
            if (loja.dados.status_motherboard) {
                passaFiltroTotem = (totemSelecionado === 'on' && loja.dados.status_motherboard === 'ON') || 
                                  (totemSelecionado === 'off' && loja.dados.status_motherboard === 'OFF');
            } else {
                // Se não tiver status do totem, não passa no filtro de totem ON ou OFF
                passaFiltroTotem = false;
            }
        }
        
        // Retorna true apenas se passar por todos os filtros
        return passaFiltroTexto && passaFiltroRegiao && passaFiltroEstado && passaFiltroStatus && passaFiltroTotem;
    });
    
            // Limitar o número de resultados para não sobrecarregar o navegador
            const resultadosMaximos = 100;
            const resultadosLimitados = lojasFiltradas.length > resultadosMaximos;
            
            if (resultadosLimitados) {
                console.log(`Filtragem limitada a ${resultadosMaximos} resultados para melhor desempenho`);
                lojasFiltradas = lojasFiltradas.slice(0, resultadosMaximos);
            }
            
            // Atualizar contador de lojas com verificação de nulo
            if (storeCountElement) {
                storeCountElement.textContent = `${lojasFiltradas.length} lojas encontradas${resultadosLimitados ? ' (mostrando primeiras 100)' : ''}`;
            }
            
            // Se já existe uma instância do DataTable, destrua-a
            if (lojasTable) {
                lojasTable.clear().destroy();
            }
            
            // Verificar se o elemento da tabela existe
            if (!lojasTableBody) {
                console.warn("Elemento lojasTableBody não encontrado no DOM.");
                return;
            }
            
            // Limpar a tabela
    lojasTableBody.innerHTML = '';
    
    // Se não encontrou nenhuma loja, mostrar mensagem
    if (lojasFiltradas.length === 0) {
        // Mensagem para visualização em tabela
        lojasTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="alert alert-info mb-0">
                        <i class="fas fa-info-circle me-2"></i>
                        Nenhuma loja encontrada com os filtros selecionados.
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
            // Criar um fragmento de documento para melhorar o desempenho
            const fragmento = document.createDocumentFragment();
            
            // Adicionar as lojas filtradas à tabela
    lojasFiltradas.forEach(loja => {
        // Adicionar à visualização em tabela
                fragmento.appendChild(criarLinhaLoja(loja.codigo, loja.dados));
            });
            
            // Adicionar o fragmento completo à tabela de uma só vez (melhora o desempenho)
            lojasTableBody.appendChild(fragmento);
            
            // Verificar se o jQuery e DataTables estão disponíveis
            if (typeof $ === 'function' && typeof $.fn.DataTable === 'function') {
                try {
                    // Inicializar o DataTable com as novas linhas e configurações para otimizar o desempenho
                    lojasTable = $('#lojas-table').DataTable({
                        pageLength: 25, // Aumentar para 25 itens por página para menos reloads
                        lengthMenu: [10, 25, 50, 100],
                        language: {
                            sEmptyTable: "Nenhum registro encontrado",
                            sInfo: "Mostrando de _START_ até _END_ de _TOTAL_ registros",
                            sInfoEmpty: "Mostrando 0 até 0 de 0 registros",
                            sInfoFiltered: "(Filtrados de _MAX_ registros)",
                            sInfoPostFix: "",
                            sInfoThousands: ".",
                            sLengthMenu: "_MENU_ resultados por página",
                            sLoadingRecords: "Carregando...",
                            sProcessing: "Processando...",
                            sZeroRecords: "Nenhum registro encontrado",
                            sSearch: "Pesquisar",
                            oPaginate: {
                                sNext: "Próximo",
                                sPrevious: "Anterior",
                                sFirst: "Primeiro",
                                sLast: "Último"
                            },
                            oAria: {
                                sSortAscending: ": Ordenar colunas de forma ascendente",
                                sSortDescending: ": Ordenar colunas de forma descendente"
                            }
                        },
                        order: [[0, 'asc']], // Ordenar por código de loja (primeira coluna)
                        columnDefs: [
                            { orderable: false, targets: 6 } // Desabilitar ordenação para a coluna de ações
                        ],
                        responsive: true,
                        deferRender: true, // Renderização mais rápida
                        processing: true, // Mostrar indicador de processamento
                        dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
                             '<"row"<"col-sm-12"tr>>' +
                             '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>'
                    });
                } catch (error) {
                    console.error("Erro ao inicializar DataTable:", error);
                }
            }
    
    // Atualizar contagem de lojas afetadas no modal de reset
            try {
    atualizarContadorLojasAfetadas();
            } catch (error) {
                console.error("Erro ao atualizar contador de lojas afetadas:", error);
            }
            
            console.timeEnd('filtro-lojas');
        } catch (error) {
            console.error("Erro ao filtrar lojas:", error);
            if (lojasTableBody) {
                lojasTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-4">
                            <div class="alert alert-danger">
                                <i class="fas fa-exclamation-circle me-2"></i>
                                Erro ao filtrar lojas: ${error.message}
                            </div>
                        </td>
                    </tr>
                `;
            }
        }
    }, 0); // O timeout 0 permite a atualização da UI antes de processar
}

// Função para preencher o select de estados com base na região selecionada
function preencherSelectEstados(selectElement, regiao) {
    // Limpar select de estados
    selectElement.innerHTML = '<option value="">Todos os Estados</option>';
    
    // Se não tiver região selecionada, mostrar todos os estados
    if (!regiao) {
        const todosEstados = Object.keys(estadosNomes).sort();
        todosEstados.forEach(estado => {
            const option = document.createElement('option');
            option.value = estado;
            option.textContent = `${estado} - ${estadosNomes[estado]}`;
            selectElement.appendChild(option);
        });
        return;
    }
    
    // Pegar estados da região selecionada
    const estados = estadosPorRegiao[regiao] || [];
    
    // Adicionar opções de estados
    estados.forEach(estado => {
        const option = document.createElement('option');
        option.value = estado;
        option.textContent = `${estado} - ${estadosNomes[estado]}`;
        selectElement.appendChild(option);
    });
}

// Função para atualizar o contador de lojas afetadas no modal de reset
function atualizarContadorLojasAfetadas() {
    // Verificar se os elementos necessários existem
    if (!resetScopeFiltered || !resetScopeRegion || !resetScopeState) {
        console.warn("Elementos de escopo de reset não encontrados no DOM.");
        return [];
    }

    let lojasAfetadas = [];
    
    // Verificar o escopo selecionado
    if (resetScopeFiltered.checked) {
        // Usar as lojas filtradas atuais
        lojasAfetadas = lojasFiltradas;
    } else if (resetScopeRegion.checked) {
        // Filtrar por região
        const regiao = resetRegion?.value || '';
        lojasAfetadas = todasLojas.filter(loja => {
            const { regiao: lojaRegiao } = getLojaRegionAndState(loja.codigo);
            return lojaRegiao === regiao;
        });
    } else if (resetScopeState.checked) {
        // Filtrar por estado
        const estado = resetState?.value || '';
        lojasAfetadas = todasLojas.filter(loja => {
            const { estado: lojaEstado } = getLojaRegionAndState(loja.codigo);
            return lojaEstado === estado;
        });
    }
    
    // Atualizar o contador
    affectedStoresCount.textContent = `${lojasAfetadas.length} lojas`;
    
    return lojasAfetadas;
}

// Função para executar o reset em lote
async function executarResetEmLote() {
    const lojasAfetadas = atualizarContadorLojasAfetadas();
    const tipoReset = resetType.value;
    
    if (lojasAfetadas.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'Nenhuma loja selecionada',
            text: 'Selecione pelo menos uma loja para realizar o reset.',
            confirmButtonColor: '#0d6efd'
        });
        return;
    }
    
    // Confirmar a operação com SweetAlert2
    const resultado = await Swal.fire({
        icon: 'warning',
        title: tipoReset === 'restart' ? 'Reiniciar Lojas' : 'Desligar Lojas',
        html: tipoReset === 'restart' 
            ? `<div class="text-start">
                 <p>Tem certeza que deseja <strong>reiniciar ${lojasAfetadas.length} lojas</strong>?</p>
                 <p class="mt-3 mb-0">O processo consiste em:</p>
                 <ol class="mt-2">
                   <li>Desligar (2)</li>
                   <li>Aguardar retorno para (0)</li>
                   <li>Esperar 20s</li>
                   <li>Ligar (1)</li>
                 </ol>
               </div>`
            : `<p>Tem certeza que deseja <strong>desligar ${lojasAfetadas.length} lojas</strong>?</p>`,
        showCancelButton: true,
        confirmButtonText: tipoReset === 'restart' ? 'Sim, reiniciar' : 'Sim, desligar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: tipoReset === 'restart' ? '#0d6efd' : '#dc3545',
        cancelButtonColor: '#6c757d',
        reverseButtons: true
    });
    
    if (!resultado.isConfirmed) {
        return;
    }
    
    // Preparar dados para registro no Firestore
    const codigosLojas = lojasAfetadas.map(loja => loja.codigo);
    let escopo = '';
    
    if (resetScopeFiltered.checked) {
        escopo = 'filtradas';
    } else if (resetScopeRegion.checked) {
        escopo = `região: ${resetRegion.value}`;
    } else if (resetScopeState.checked) {
        escopo = `estado: ${resetState.value}`;
    }
    
    // Registrar a operação no Firestore
    try {
        const configuracao = {
            escopo: escopo,
            tipoReset: tipoReset,
            quantidadeLojas: lojasAfetadas.length,
            lojasAfetadas: codigosLojas
        };
        await registrarResetEmLote(configuracao);
        console.log('Operação de reset em lote registrada no Firestore');
    } catch (error) {
        console.error('Erro ao registrar reset em lote no Firestore:', error);
    }
    
    // Mostrar loading com SweetAlert2
    const loadingSwal = Swal.fire({
        title: tipoReset === 'restart' ? 'Reiniciando lojas...' : 'Desligando lojas...',
        html: `<div class="text-center">
                <p class="mb-3">Processando <strong>0%</strong> concluído</p>
                <div class="progress">
                  <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <p class="mt-3 small text-muted">Aguarde enquanto processamos sua solicitação</p>
              </div>`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    // Desabilitar o botão no modal original também
    confirmBatchResetBtn.disabled = true;
    
    // Contador de operações concluídas
    let operacoesConcluidas = 0;
    let sucessos = 0;
    let falhas = 0;
    
    // Processar cada loja
    const promessas = lojasAfetadas.map(async (loja) => {
        try {
            // Construir caminho para o comando reset no Firebase
            const resetPath = `/${loja.codigo}/reset`;
            
            if (tipoReset === 'restart') {
                // 1. Enviar comando para desligar (2)
                await database.ref(resetPath).set(2);
                console.log(`Comando de desligamento (2) enviado para loja ${loja.codigo}`);
                
                // Atualizar indicador de progresso específico para esta loja
                const porcentagemEtapa = Math.round((operacoesConcluidas / lojasAfetadas.length) * 100) + 
                    (1 / (lojasAfetadas.length * 4)) * 100;
                atualizarProgressoSweetAlert(porcentagemEtapa);
                
                // 2. Aguardar até que o valor volte para 0
                console.log(`Aguardando retorno para valor 0 após comando de desligamento para loja ${loja.codigo}`);
                
                await new Promise((resolve, reject) => {
                    // Definir um timeout para o caso de não receber resposta
                    const timeoutId = setTimeout(() => {
                        database.ref(resetPath).off('value', onValueChange);
                        reject(new Error("Timeout ao aguardar retorno para 0 após comando de desligamento"));
                    }, 60000); // 60 segundos de timeout
                    
                    // Listener para aguardar o retorno a 0
                    const onValueChange = database.ref(resetPath).on('value', (snapshot) => {
                        const valor = snapshot.val();
                        console.log(`Loja ${loja.codigo} - Valor atual do reset após comando 2: ${valor}`);
                        
                        if (valor === 0) {
                            clearTimeout(timeoutId);
                            database.ref(resetPath).off('value', onValueChange);
                            console.log(`Loja ${loja.codigo} - Reset retornou para 0 após comando de desligamento`);
                            resolve();
                        }
                    });
                });
                
                // Atualizar progresso após receber retorno 0
                const porcentagemEtapa2 = Math.round((operacoesConcluidas / lojasAfetadas.length) * 100) + 
                    (2 / (lojasAfetadas.length * 4)) * 100;
                atualizarProgressoSweetAlert(porcentagemEtapa2);
                
                // 3. Aguardar 20 segundos após o valor ter retornado para 0
                console.log(`Iniciando espera de 20 segundos para loja ${loja.codigo}`);
                await new Promise(resolve => setTimeout(resolve, 20000));
                console.log(`Espera de 20 segundos concluída para loja ${loja.codigo}`);
                
                // Atualizar progresso após espera de 20s
                const porcentagemEtapa3 = Math.round((operacoesConcluidas / lojasAfetadas.length) * 100) + 
                    (3 / (lojasAfetadas.length * 4)) * 100;
                atualizarProgressoSweetAlert(porcentagemEtapa3);
                
                // 4. Enviar comando para ligar (1)
                await database.ref(resetPath).set(1);
                console.log(`Comando de ligação (1) enviado para loja ${loja.codigo}`);
                
                // 5. Aguardar a confirmação final (valor 0 novamente)
                console.log(`Aguardando confirmação final (0) para loja ${loja.codigo}`);
                
                await new Promise((resolve, reject) => {
                    // Definir um timeout para o caso de não receber resposta
                    const timeoutId = setTimeout(() => {
                        database.ref(resetPath).off('value', onValueChange);
                        reject(new Error("Timeout ao aguardar confirmação final"));
                    }, 60000); // 60 segundos de timeout
                    
                    // Listener para aguardar o retorno a 0
                    const onValueChange = database.ref(resetPath).on('value', (snapshot) => {
                        const valor = snapshot.val();
                        console.log(`Loja ${loja.codigo} - Valor atual do reset após comando 1: ${valor}`);
                        
                        if (valor === 0) {
                            clearTimeout(timeoutId);
                            database.ref(resetPath).off('value', onValueChange);
                            console.log(`Loja ${loja.codigo} - Reset concluído com sucesso (retornou para 0)`);
                            resolve();
                        }
                    });
                });
                
                sucessos++;
                console.log(`Reinicialização completa confirmada para loja ${loja.codigo}`);
            } else {
                // Apenas desligar (2)
                await database.ref(resetPath).set(2);
                sucessos++;
                console.log(`Comando de desligamento enviado para loja ${loja.codigo}`);
            }
        } catch (error) {
            falhas++;
            console.error(`Erro ao processar reset para loja ${loja.codigo}:`, error);
            
            // Garantir que não há listeners pendentes
            try {
                database.ref(`/${loja.codigo}/reset`).off();
            } catch (e) {
                console.error(`Erro ao remover listeners para loja ${loja.codigo}:`, e);
            }
        } finally {
            operacoesConcluidas++;
            
            // Atualizar texto do botão e barra de progresso
            const porcentagem = Math.round((operacoesConcluidas / lojasAfetadas.length) * 100);
            confirmBatchResetBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Processando... ${porcentagem}%`;
            
            atualizarProgressoSweetAlert(porcentagem);
        }
    });
    
    // Função para atualizar o progresso no SweetAlert2
    function atualizarProgressoSweetAlert(porcentagem) {
        const progressBar = Swal.getHtmlContainer().querySelector('.progress-bar');
        const progressText = Swal.getHtmlContainer().querySelector('p strong');
        if (progressBar && progressText) {
            progressBar.style.width = `${porcentagem}%`;
            progressBar.setAttribute('aria-valuenow', porcentagem);
            progressText.textContent = `${porcentagem}%`;
            
            // Atualizar o título com o progresso também
            Swal.getTitle().textContent = `${tipoReset === 'restart' ? 'Reiniciando' : 'Desligando'} lojas... (${porcentagem}%)`;
        }
    }
    
    // Aguardar todas as operações terminarem
    try {
        await Promise.all(promessas);
    } catch (error) {
        console.error("Erro durante o processamento em lote:", error);
    }
    
    // Fechar o loading SweetAlert
    Swal.close();
    
    // Restaurar botão
    confirmBatchResetBtn.disabled = false;
    confirmBatchResetBtn.innerHTML = '<i class="fas fa-power-off me-2"></i>Executar Reset';
    
    // Mostrar resultado com SweetAlert2
    Swal.fire({
        icon: sucessos > 0 ? (falhas === 0 ? 'success' : 'warning') : 'error',
        title: 'Operação concluída',
        html: `<div class="text-start">
                <p class="mb-3">Resumo da operação:</p>
                <ul class="list-unstyled">
                  <li><i class="fas fa-check-circle text-success me-2"></i> <strong>${sucessos}</strong> ${sucessos === 1 ? 'loja processada' : 'lojas processadas'} com sucesso</li>
                  ${falhas > 0 ? `<li class="mt-2"><i class="fas fa-times-circle text-danger me-2"></i> <strong>${falhas}</strong> ${falhas === 1 ? 'falha' : 'falhas'} durante o processo</li>` : ''}
                </ul>
              </div>`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#0d6efd'
    });
    
    // Fechar modal
    const batchResetModal = bootstrap.Modal.getInstance(document.getElementById('batchResetModal'));
    batchResetModal.hide();
}

// Função para atualizar as estatísticas de lojas e totems
function atualizarEstatisticas() {
    // Inicializa contadores
    let totalLojas = todasLojas.length;
    let lojasOnline = 0;
    let lojasOffline = 0;
    let totemsOn = 0;
    let totemsOff = 0;
    let totalTotemsMonitorados = 0;
    
    // Arrays para armazenar lojas com problemas
    let lojasComProblema = [];
    let totemsDesligados = [];
    
    // Conta lojas online/offline e totems on/off
    todasLojas.forEach(loja => {
        // Verifica status da loja
        const statusInfo = determinarStatus(loja.dados);
        if (statusInfo.status === "Online") {
            lojasOnline++;
        } else {
            lojasOffline++;
            lojasComProblema.push({
                codigo: loja.codigo,
                ultimaAtualizacao: loja.dados.pc_status ? loja.dados.pc_status.timestamp : null,
                regiao: getLojaRegionAndState(loja.codigo).regiao,
                estado: getLojaRegionAndState(loja.codigo).estado
            });
        }
        
        // Verifica status do totem
        if (loja.dados.status_motherboard) {
            totalTotemsMonitorados++;
            if (loja.dados.status_motherboard === 'ON') {
                totemsOn++;
            } else {
                totemsOff++;
                // Apenas adiciona à lista de totems desligados se a loja estiver online
                if (statusInfo.status === "Online") {
                    totemsDesligados.push({
                        codigo: loja.codigo,
                        ultimaAtualizacao: loja.dados.pc_status ? loja.dados.pc_status.timestamp : null,
                        regiao: getLojaRegionAndState(loja.codigo).regiao,
                        estado: getLojaRegionAndState(loja.codigo).estado
                    });
                }
            }
        }
    });
    
    // Calcula porcentagens
    const percentLojasOnline = totalLojas > 0 ? Math.round((lojasOnline / totalLojas) * 100) : 0;
    const percentLojasOffline = totalLojas > 0 ? Math.round((lojasOffline / totalLojas) * 100) : 0;
    
    const percentTotemsOn = totalTotemsMonitorados > 0 ? Math.round((totemsOn / totalTotemsMonitorados) * 100) : 0;
    const percentTotemsOff = totalTotemsMonitorados > 0 ? Math.round((totemsOff / totalTotemsMonitorados) * 100) : 0;
    
    // Atualiza contadores de lojas
    if (lojasOnlineCount) lojasOnlineCount.textContent = lojasOnline;
    if (lojasOnlinePercent) lojasOnlinePercent.textContent = `${percentLojasOnline}%`;
    if (lojasOfflineCount) lojasOfflineCount.textContent = lojasOffline;
    if (lojasOfflinePercent) lojasOfflinePercent.textContent = `${percentLojasOffline}%`;
    
    // Atualiza o contador total
    const totalLojasElement = document.getElementById('total-lojas');
    if (totalLojasElement) totalLojasElement.textContent = totalLojas;
    
    // Atualiza barras de progresso das lojas
    if (lojasOnlineProgress) {
        lojasOnlineProgress.style.width = `${percentLojasOnline}%`;
        lojasOnlineProgress.setAttribute('aria-valuenow', percentLojasOnline);
    }
    
    // Atualiza a barra de progresso offline
    const lojasOfflineProgress = document.getElementById('lojas-offline-progress');
    if (lojasOfflineProgress) {
        lojasOfflineProgress.style.width = `${percentLojasOffline}%`;
        lojasOfflineProgress.setAttribute('aria-valuenow', percentLojasOffline);
    }
    
    // Atualiza contadores de totems
    if (totemsOnlineCount) totemsOnlineCount.textContent = totemsOn;
    if (totemsOnlinePercent) totemsOnlinePercent.textContent = `${percentTotemsOn}%`;
    if (totemsOfflineCount) totemsOfflineCount.textContent = totemsOff;
    if (totemsOfflinePercent) totemsOfflinePercent.textContent = `${percentTotemsOff}%`;
    
    // Atualiza barra de progresso dos totems
    if (totemsOnlineProgress) {
        totemsOnlineProgress.style.width = `${percentTotemsOn}%`;
        totemsOnlineProgress.setAttribute('aria-valuenow', percentTotemsOn);
    }
    
    // Atualiza listas de lojas com problemas
    if (lojasOfflineBadge && lojasOfflineList) {
        // Obter valores dos filtros
        const regiaoFiltro = lojasOfflineRegiao ? lojasOfflineRegiao.value : '';
        const estadoFiltro = lojasOfflineEstado ? lojasOfflineEstado.value : '';
        
        // Filtrar lojas offline com base na região e estado
        let lojasComProblemaFiltradas = lojasComProblema;
        
        if (regiaoFiltro) {
            lojasComProblemaFiltradas = lojasComProblemaFiltradas.filter(loja => loja.regiao === regiaoFiltro);
        }
        
        if (estadoFiltro) {
            lojasComProblemaFiltradas = lojasComProblemaFiltradas.filter(loja => loja.estado === estadoFiltro);
        }
        
        // Atualiza o badge com o número de lojas offline (total sem filtro)
        lojasOfflineBadge.textContent = lojasComProblema.length;
        
        // Limpa a lista atual
        while (lojasOfflineList.firstChild) {
            if (lojasOfflineList.firstChild.id === 'no-lojas-offline') {
                break;
            }
            lojasOfflineList.removeChild(lojasOfflineList.firstChild);
        }
        
        // Mostra mensagem se não houver lojas offline após filtro
        if (lojasComProblemaFiltradas.length === 0) {
            if (noLojasOffline) {
                // Mensagem personalizada se há lojas offline mas foram filtradas
                if (lojasComProblema.length > 0) {
                    noLojasOffline.innerHTML = `
                        <i class="fas fa-filter me-2"></i>Nenhuma loja offline corresponde aos filtros
                    `;
                } else {
                    noLojasOffline.innerHTML = `
                        <i class="fas fa-check-circle me-2"></i>Todas as lojas estão online
                    `;
                }
                noLojasOffline.style.display = 'block';
            }
        } else {
            if (noLojasOffline) {
                noLojasOffline.style.display = 'none';
            }
            
            // Ordena as lojas offline pela última atualização (mais recente primeiro)
            lojasComProblemaFiltradas.sort((a, b) => {
                if (!a.ultimaAtualizacao) return 1;
                if (!b.ultimaAtualizacao) return -1;
                return b.ultimaAtualizacao - a.ultimaAtualizacao;
            });
            
            // Adiciona cada loja offline à lista
            lojasComProblemaFiltradas.forEach(loja => {
                const li = document.createElement('a');
                li.href = `loja.html?id=${loja.codigo}`;
                
                // Buscar os dados completos da loja
                const lojaCompleta = todasLojas.find(l => l.codigo === loja.codigo);
                if (!lojaCompleta) return;
                
                // Calcular o tempo offline
                let tempoOffline = 'Desconhecido';
                if (loja.ultimaAtualizacao) {
                    const agora = Date.now();
                    let ultimaAtualizacaoMs = loja.ultimaAtualizacao;
                    
                    // Verificar e ajustar o formato de timestamp (segundos vs milissegundos)
                    if (ultimaAtualizacaoMs < 10000000000) {
                        ultimaAtualizacaoMs *= 1000; // Converter de segundos para milissegundos
                    }
                    
                    const diffMs = agora - ultimaAtualizacaoMs;
                    
                    // Converter para minutos/horas
                    const diffMinutos = Math.floor(diffMs / (1000 * 60));
                    if (diffMinutos < 60) {
                        tempoOffline = `${diffMinutos} min`;
                    } else {
                        const diffHoras = Math.floor(diffMinutos / 60);
                        if (diffHoras < 24) {
                            const minutosRestantes = diffMinutos % 60;
                            tempoOffline = `${diffHoras}h ${minutosRestantes}min`;
                        } else {
                            const diffDias = Math.floor(diffHoras / 24);
                            tempoOffline = `${diffDias} ${diffDias === 1 ? 'dia' : 'dias'}`;
                        }
                    }
                }
                
                // Formata a data da última atualização
                let ultimaAtualizacao = 'Desconhecida';
                if (loja.ultimaAtualizacao) {
                    ultimaAtualizacao = formatarData(loja.ultimaAtualizacao);
                }
                
                // Contar dispositivos
                const qtdLavadoras = contarDispositivos(lojaCompleta.dados, 'lavadoras');
                const qtdSecadoras = contarDispositivos(lojaCompleta.dados, 'secadoras');
                const totalDispositivos = qtdLavadoras + qtdSecadoras;
                
                // Verificar último status conhecido do totem
                let totemStatusHTML = '';
                if (lojaCompleta.dados.status_motherboard) {
                    const totemStatus = lojaCompleta.dados.status_motherboard;
                    const isTotemOn = totemStatus === 'ON';
                    const statusColor = isTotemOn ? 'success' : 'warning';
                    const statusText = isTotemOn ? 'ON' : 'OFF';
                    const statusIcon = isTotemOn ? 'check-circle' : 'power-off';
                    
                    totemStatusHTML = `
                        <div class="mt-1 px-2 py-1 bg-light rounded-1 border border-secondary border-opacity-25">
                            <small class="text-muted">
                                <i class="fas fa-info-circle me-1"></i>
                                Último status conhecido do totem: 
                                <span class="text-${statusColor} fw-bold">
                                    <i class="fas fa-${statusIcon} me-1"></i>${statusText}
                                </span>
                                <i class="fas fa-question-circle ms-1 text-secondary" 
                                   data-bs-toggle="tooltip" 
                                   title="Este é o último status do totem antes da loja ficar offline. O status atual pode ser diferente."></i>
                            </small>
                        </div>
                    `;
                } else {
                    totemStatusHTML = `
                        <div class="mt-1 px-2 py-1 bg-light rounded-1 border border-secondary border-opacity-25">
                            <small class="text-muted">
                                <i class="fas fa-info-circle me-1"></i>
                                Status do totem: <span class="text-secondary">Desconhecido</span>
                                <i class="fas fa-question-circle ms-1 text-secondary" 
                                   data-bs-toggle="tooltip" 
                                   title="Não foi possível determinar o status do totem desta loja."></i>
                            </small>
                        </div>
                    `;
                }
                
                li.className = 'list-group-item list-group-item-action';
                
                li.innerHTML = `
                    <div class="d-flex justify-content-between align-items-start w-100">
                        <div>
                            <div class="d-flex align-items-center">
                                <span class="status-indicator status-offline me-2"></span>
                                <strong>${loja.codigo}</strong>
                                <span class="badge bg-secondary ms-2">${loja.estado}</span>
                            </div>
                            <div class="small text-muted mt-1">
                                <div><i class="far fa-clock me-1"></i> Offline há ${tempoOffline}</div>
                                <div><i class="far fa-calendar-alt me-1"></i> Última conexão: ${ultimaAtualizacao}</div>
                            </div>
                            ${totemStatusHTML}
                        </div>
                        <div class="text-end">
                            <div class="badge bg-primary mb-1">${totalDispositivos} máquinas</div>
                            <div class="small">
                                <span class="badge bg-info text-white">${qtdLavadoras} <i class="fas fa-tshirt"></i></span>
                                <span class="badge bg-info text-white">${qtdSecadoras} <i class="fas fa-wind"></i></span>
                            </div>
                        </div>
                    </div>
                `;
                
                // Adiciona ao início da lista (antes do elemento "no-lojas-offline")
                lojasOfflineList.insertBefore(li, noLojasOffline);
                
                // Inicializar tooltips nos novos elementos
                const tooltips = li.querySelectorAll('[data-bs-toggle="tooltip"]');
                tooltips.forEach(tooltip => {
                    new bootstrap.Tooltip(tooltip);
                });
            });
        }
    }
    
    // Atualiza listas de totems desligados
    if (totemsOfflineBadge && totemsOfflineList) {
        // Obter valores dos filtros
        const regiaoFiltro = totemsOfflineRegiao ? totemsOfflineRegiao.value : '';
        const estadoFiltro = totemsOfflineEstado ? totemsOfflineEstado.value : '';
        
        // Filtrar totems desligados com base na região e estado
        let totemsDesligadosFiltrados = totemsDesligados;
        
        if (regiaoFiltro) {
            totemsDesligadosFiltrados = totemsDesligadosFiltrados.filter(loja => loja.regiao === regiaoFiltro);
        }
        
        if (estadoFiltro) {
            totemsDesligadosFiltrados = totemsDesligadosFiltrados.filter(loja => loja.estado === estadoFiltro);
        }
        
        // Atualiza o badge com o número de totems desligados (total sem filtro)
        totemsOfflineBadge.textContent = totemsDesligados.length;
        
        // Limpa a lista atual
        while (totemsOfflineList.firstChild) {
            if (totemsOfflineList.firstChild.id === 'no-totems-offline') {
                break;
            }
            totemsOfflineList.removeChild(totemsOfflineList.firstChild);
        }
        
        // Mostra mensagem se não houver totems desligados após filtro
        if (totemsDesligadosFiltrados.length === 0) {
            if (noTotemsOffline) {
                // Mensagem personalizada se há totems desligados mas foram filtrados
                if (totemsDesligados.length > 0) {
                    noTotemsOffline.innerHTML = `
                        <i class="fas fa-filter me-2"></i>Nenhum totem desligado corresponde aos filtros
                    `;
                } else {
                    noTotemsOffline.innerHTML = `
                        <i class="fas fa-check-circle me-2"></i>Todos os totems estão ligados
                    `;
                }
                noTotemsOffline.style.display = 'block';
            }
        } else {
            if (noTotemsOffline) {
                noTotemsOffline.style.display = 'none';
            }
            
            // Adiciona cada totem desligado à lista
            totemsDesligadosFiltrados.forEach(loja => {
                const li = document.createElement('a');
                li.href = `loja.html?id=${loja.codigo}`;
                
                // Buscar os dados completos da loja
                const lojaCompleta = todasLojas.find(l => l.codigo === loja.codigo);
                if (!lojaCompleta) return;
                
                // Formatar a data da última atualização
                let ultimaAtualizacao = 'Desconhecida';
                if (loja.ultimaAtualizacao) {
                    ultimaAtualizacao = formatarData(loja.ultimaAtualizacao);
                }
                
                // Contar dispositivos
                const qtdLavadoras = contarDispositivos(lojaCompleta.dados, 'lavadoras');
                const qtdSecadoras = contarDispositivos(lojaCompleta.dados, 'secadoras');
                const totalDispositivos = qtdLavadoras + qtdSecadoras;
                
                li.className = 'list-group-item list-group-item-action';
                
                li.innerHTML = `
                    <div class="d-flex justify-content-between align-items-start w-100">
                        <div>
                            <div class="d-flex align-items-center">
                                <span class="status-indicator status-online me-2"></span>
                                <strong>${loja.codigo}</strong>
                                <span class="badge bg-secondary ms-2">${loja.estado}</span>
                            </div>
                            <div class="small text-muted mt-1">
                                <div><i class="fas fa-desktop me-1"></i> Totem <span class="text-warning fw-bold">OFFLINE</span></div>
                                <div><i class="far fa-calendar-alt me-1"></i> Última atualização: ${ultimaAtualizacao}</div>
                            </div>
                        </div>
                        <div class="text-end">
                            <div class="badge bg-primary mb-1">${totalDispositivos} máquinas</div>
                            <div class="small">
                                <span class="badge bg-info text-white">${qtdLavadoras} <i class="fas fa-tshirt"></i></span>
                                <span class="badge bg-info text-white">${qtdSecadoras} <i class="fas fa-wind"></i></span>
                            </div>
                        </div>
                    </div>
                `;
                
                // Adiciona ao início da lista (antes do elemento "no-totems-offline")
                totemsOfflineList.insertBefore(li, noTotemsOffline);
                
                // Inicializar tooltips nos novos elementos
                const tooltips = li.querySelectorAll('[data-bs-toggle="tooltip"]');
                tooltips.forEach(tooltip => {
                    new bootstrap.Tooltip(tooltip);
                });
            });
        }
    }
    
    // Atualizar marcadores no mapa
    atualizarMarcadoresMapa();
    
    console.log(`Estatísticas atualizadas: ${lojasOnline}/${totalLojas} lojas online (${percentLojasOnline}%), ${totemsOn}/${totalTotemsMonitorados} totems ON (${percentTotemsOn}%)`);
}

// Função para carregar as lojas do Firebase
function carregarLojas() {
    // Mostrar indicador de carregamento mais informativo
    if (lojasTableBody) {
        lojasTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                    <p class="mt-2 mb-0">Carregando lojas do Firebase...</p>
                </td>
            </tr>
        `;
    }

    // Limitar a quantidade de dados obtidos com shallow
    database.ref('/').limitToFirst(100).on('value', snapshot => {
        console.time('processamento-lojas');
        
            // Remove o elemento de loading
        if (loadingRow) {
            loadingRow.remove();
            }
            
            // Limpar o array de lojas
            todasLojas = [];
            
            // Verifica se existem lojas
            if (!snapshot.exists()) {
            if (lojasTableBody) {
                lojasTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-4">
                            <div class="alert alert-info mb-0">
                            <i class="fas fa-info-circle me-2"></i>
                            Nenhuma loja encontrada no banco de dados.
                        </div>
                        </td>
                    </tr>
                `;
            }
                return;
            }
            
            // Itera sobre as lojas
            const lojas = snapshot.val();
            let encontrouLojas = false;
        let promisesLoja = [];
            
        // Carregar dados básicos primeiro para exibição rápida
            for (const codigo in lojas) {
            // Verificação básica se é uma loja válida
                const loja = lojas[codigo];
            if (typeof loja === 'object') {
                    encontrouLojas = true;
                    
                    // Armazenar a loja para filtrar posteriormente
                    todasLojas.push({
                        codigo: codigo,
                        dados: loja
                    });
                }
            }
            
        console.log(`Carregadas ${todasLojas.length} lojas do Firebase`);
        
        // Primeiro renderizar com os dados básicos para mostrar algo rapidamente
        if (todasLojas.length > 0) {
            // Atualizar estatísticas
            atualizarEstatisticas();
            
            // Aplicar filtros iniciais
            filtrarLojas();
            
            // Configurar listeners de real-time apenas para as primeiras 10 lojas (as mais importantes)
            // Isso evita sobrecarga de listeners que podem causar lentidão
            const lojasParaListener = todasLojas.slice(0, 10);
            lojasParaListener.forEach(loja => {
                configurarStatusListener(loja.codigo);
            });
        }
            
            // Se não encontrou lojas válidas
        if (!encontrouLojas && lojasTableBody) {
            lojasTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            Foram encontrados dados no Firebase, mas nenhuma loja válida foi identificada.
                        </div>
                    </td>
                </tr>
                `;
            }
        
        console.timeEnd('processamento-lojas');
    }, error => {
            console.error("Erro ao carregar lojas:", error);
        if (loadingRow) {
            loadingRow.remove();
            }
        if (lojasTableBody) {
            lojasTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Erro ao carregar lojas: ${error.message}
                    </div>
                    </td>
                </tr>
            `;
        }
        });
}

// Função para configurar listeners para atualizações de status em tempo real
function configurarStatusListener(codigo) {
    // Listener para o timestamp do pc_status
    const statusRef = database.ref(`/${codigo}/pc_status/timestamp`);
    statusRef.on('value', (snapshot) => {
        // Quando o timestamp mudar, buscar todas as informações da loja
        database.ref(`/${codigo}`).once('value')
            .then(lojaSnapshot => {
                if (lojaSnapshot.exists()) {
                    const loja = lojaSnapshot.val();
                    // Atualiza o card da loja com as novas informações
                    atualizarStatusLoja(codigo, loja);
                    
                    // Atualiza a linha da tabela com as novas informações
                    atualizarStatusLinhaLoja(codigo, loja);
                    
                    // Atualiza os dados armazenados
                    const lojaIndex = todasLojas.findIndex(l => l.codigo === codigo);
                    if (lojaIndex !== -1) {
                        todasLojas[lojaIndex].dados = loja;
                        
                        // Atualiza as estatísticas quando um status mudar
                        atualizarEstatisticas();
                    }
                }
            })
            .catch(error => {
                console.error(`Erro ao atualizar status da loja ${codigo}:`, error);
            });
    });
    
    // Listener específico para o status do totem
    const motherboardRef = database.ref(`/${codigo}/status_motherboard`);
    motherboardRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            const status = snapshot.val();
            console.log(`Status do totem ${codigo} atualizado: ${status}`);
            
            // Busca o elemento do card no DOM
            const cardElement = document.querySelector(`.card[data-loja="${codigo}"]`);
            if (cardElement) {
                const motherboardStatusText = cardElement.querySelector('.motherboard-status');
                const motherboardIndicator = cardElement.querySelector('.motherboard-indicator');
                
                if (motherboardStatusText && motherboardIndicator) {
                    const isMotherboardOn = status === 'ON';
                    motherboardStatusText.textContent = `Totem: ${isMotherboardOn ? 'ON' : 'OFF'}`;
                    motherboardStatusText.className = `${isMotherboardOn ? 'text-success' : 'text-danger'} fw-medium motherboard-status small-text`;
                    
                    // Atualiza o indicador de status do totem
                    motherboardIndicator.classList.remove('status-online', 'status-offline');
                    if (isMotherboardOn) {
                        motherboardIndicator.classList.add('status-online');
                    } else {
                        motherboardIndicator.classList.add('status-offline');
                    }
                }
            }
            
            // Busca a linha da tabela no DOM
            const rowElement = document.querySelector(`#lojas-table-body tr[data-loja="${codigo}"]`);
            if (rowElement) {
                const motherboardStatusText = rowElement.querySelector('.motherboard-status');
                const motherboardIndicator = rowElement.querySelector('.motherboard-indicator');
                
                if (motherboardStatusText && motherboardIndicator) {
                    const isMotherboardOn = status === 'ON';
                    motherboardStatusText.textContent = isMotherboardOn ? 'ON' : 'OFF';
                    motherboardStatusText.className = `${isMotherboardOn ? 'text-success' : 'text-danger'} fw-medium motherboard-status`;
                    
                    // Atualiza o indicador de status do totem
                    motherboardIndicator.classList.remove('status-online', 'status-offline');
                    if (isMotherboardOn) {
                        motherboardIndicator.classList.add('status-online');
                        
                        // Remove classe de destaque de totem offline
                        rowElement.classList.remove('totem-offline-row');
                    } else {
                        motherboardIndicator.classList.add('status-offline');
                        
                        // Adiciona classe de destaque se não estiver offline
                        if (!rowElement.classList.contains('table-danger')) {
                            rowElement.classList.add('totem-offline-row');
                        }
                    }
                }
            }
            
            // Atualiza os dados armazenados
            const lojaIndex = todasLojas.findIndex(l => l.codigo === codigo);
            if (lojaIndex !== -1) {
                todasLojas[lojaIndex].dados.status_motherboard = status;
                
                // Atualiza as estatísticas quando um status mudar
                atualizarEstatisticas();
            }
        }
    });
}

// Função para limpar todos os filtros
function limparFiltros() {
    searchInput.value = '';
    regionFilter.value = '';
    stateFilter.value = '';
    statusFilter.value = '';
    totemFilter.value = '';
    
    // Resetar o select de estados
    stateFilter.innerHTML = '<option value="">Todos os Estados</option>';
    
    // Aplicar filtros (agora todos vazios)
    filtrarLojas();
}

// Função para inicializar o mapa
function inicializarMapa() {
    // Verificar se o elemento do mapa existe
    const mapElement = document.getElementById('brasil-map');
    if (!mapElement) return;
    
    // Inicializar o mapa centralizado no Brasil
    brasilMap = L.map('brasil-map').setView([-15.77972, -47.92972], 4);
    
    // Adicionar camada de mapa
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(brasilMap);
}

// Função para criar marcador para uma loja específica com suas coordenadas
function criarMarcadorLoja(codigo, loja, coordenadas) {
    // Verificar status da loja
    const statusInfo = determinarStatus(loja);
    const isOnline = statusInfo.status === "Online";
    
    // Determinar a classe do marcador (apenas online/offline)
    let markerClass = isOnline ? 'map-marker-online' : 'map-marker-offline';
    
    // Criar ícone personalizado
    const markerIcon = L.divIcon({
        className: markerClass,
        html: `<div style="width:100%;height:100%;"></div>`,
        iconSize: [18, 18], // Aumentado para facilitar o clique com mouse
        iconAnchor: [9, 9]
    });
    
    // Criar marcador
    const marker = L.marker([coordenadas.lat, coordenadas.lon], { icon: markerIcon });
    
    // Formatar última atualização
    const timestamp = loja.pc_status ? loja.pc_status.timestamp : null;
    const ultimaAtualizacaoFormatada = timestamp ? formatarData(timestamp) : "Desconhecida";
    
    // Contar equipamentos da loja
    const qtdLavadoras = contarDispositivos(loja, 'lavadoras');
    const qtdSecadoras = contarDispositivos(loja, 'secadoras');
    const qtdDosadoras = contarDispositivos(loja, 'dosadora_01');
    const temArCond = contarDispositivos(loja, 'ar_condicionado') > 0;
    
    // Determinar a região e o estado
    const { regiao, estado } = getLojaRegionAndState(codigo);
    
    // Obter o heartbeat se disponível
    const heartbeat = loja.heartbeat ? loja.heartbeat : "N/A";
    
    // Determinar quanto tempo passou desde a última atualização em formato legível
    let tempoDesdeAtualizacao = "";
    if (timestamp) {
        const agora = Date.now();
        const diferenca = agora - timestamp;
        
        if (diferenca < 60 * 1000) { // Menos de 1 minuto
            tempoDesdeAtualizacao = "Agora mesmo";
        } else if (diferenca < 60 * 60 * 1000) { // Menos de 1 hora
            const minutos = Math.floor(diferenca / (60 * 1000));
            tempoDesdeAtualizacao = `há ${minutos} minuto${minutos > 1 ? 's' : ''}`;
        } else if (diferenca < 24 * 60 * 60 * 1000) { // Menos de 1 dia
            const horas = Math.floor(diferenca / (60 * 60 * 1000));
            tempoDesdeAtualizacao = `há ${horas} hora${horas > 1 ? 's' : ''}`;
        } else {
            const dias = Math.floor(diferenca / (24 * 60 * 60 * 1000));
            tempoDesdeAtualizacao = `há ${dias} dia${dias > 1 ? 's' : ''}`;
        }
    }
    
    // Criar conteúdo do popup com design aprimorado
    let popupContent = `
        <div class="map-popup-content">
            <div class="text-center mb-3">
                <h5 class="mb-1">${codigo}</h5>
                <div class="text-muted">${estadosNomes[estado] || estado}, ${regiao.charAt(0).toUpperCase() + regiao.slice(1)}</div>
            </div>
            
            <a href="loja.html?id=${codigo}" class="btn btn-primary d-block w-100" style="color: white; font-weight: 500; padding: 8px 12px;">
                <i class="fas fa-store me-2"></i>Ver detalhes
            </a>
        </div>
    `;
    
    // Adicionar popup ao marcador
    marker.bindPopup(popupContent, {
        maxWidth: 280,
        minWidth: 250,
        className: 'store-popup'
    });
    
    return marker;
}

// Função para atualizar os marcadores no mapa
function atualizarMarcadoresMapa() {
    // Se o mapa não foi inicializado, não fazer nada
    if (!brasilMap) return;
    
    // Limpar marcadores existentes
    mapMarkers.forEach(marker => {
        brasilMap.removeLayer(marker);
    });
    mapMarkers = [];
    
    // Array para armazenar marcadores individuais de lojas com coordenadas
    let marcadoresLojas = [];
    
    // Objeto para agrupar lojas por estado (usado apenas como fallback)
    const lojasPorEstado = {};
    
    // Processar todas as lojas
    todasLojas.forEach(loja => {
        const { estado } = getLojaRegionAndState(loja.codigo);
        
        // Inicializar o objeto do estado se ainda não existir
        if (!lojasPorEstado[estado]) {
            lojasPorEstado[estado] = {
                online: 0,
                offline: 0,
                lojas: [],
                ultimaAtualizacao: null,
                dispositivos: {
                    lavadoras: 0,
                    secadoras: 0,
                    arCondicionado: 0,
                    dosadoras: 0
                }
            };
        }
        
        // Verificar status da loja
        const statusInfo = determinarStatus(loja.dados);
        const isOnline = statusInfo.status === "Online";
        
        // Verificar status do totem
        const totemOff = loja.dados.status_motherboard === 'OFF';
        
        // Atualizar última atualização
        const timestamp = loja.dados.pc_status ? loja.dados.pc_status.timestamp : null;
        if (timestamp && (!lojasPorEstado[estado].ultimaAtualizacao || timestamp > lojasPorEstado[estado].ultimaAtualizacao)) {
            lojasPorEstado[estado].ultimaAtualizacao = timestamp;
        }
        
        // Incrementar contadores (apenas online/offline)
        if (isOnline) {
            lojasPorEstado[estado].online++;
        } else {
            lojasPorEstado[estado].offline++;
        }
        
        // Contar dispositivos
        lojasPorEstado[estado].dispositivos.lavadoras += contarDispositivos(loja.dados, 'lavadoras');
        lojasPorEstado[estado].dispositivos.secadoras += contarDispositivos(loja.dados, 'secadoras');
        lojasPorEstado[estado].dispositivos.arCondicionado += contarDispositivos(loja.dados, 'ar_condicionado');
        lojasPorEstado[estado].dispositivos.dosadoras += contarDispositivos(loja.dados, 'dosadora_01');
        
        // Adicionar informações da loja
        lojasPorEstado[estado].lojas.push({
            codigo: loja.codigo,
            status: statusInfo.status,
            totemStatus: loja.dados.status_motherboard,
            ultimaAtualizacao: timestamp
        });
        
        // PRIORIDADE: Verificar se a loja tem coordenadas e criar marcador individual
        if (loja.dados.coordenadas && loja.dados.coordenadas.lat && loja.dados.coordenadas.lon) {
            console.log(`Usando coordenadas da loja ${loja.codigo}: Lat ${loja.dados.coordenadas.lat}, Lon ${loja.dados.coordenadas.lon}`);
            const marcadorLoja = criarMarcadorLoja(loja.codigo, loja.dados, loja.dados.coordenadas);
            marcadoresLojas.push(marcadorLoja);
        }
    });
    
    // PASSO 1: Adicionar TODOS os marcadores de lojas individuais ao mapa
    // Independentemente de quantos existam - prioridade máxima para usar coordenadas reais
    marcadoresLojas.forEach(marker => {
        marker.addTo(brasilMap);
        mapMarkers.push(marker);
    });
    
    console.log(`Adicionados ${marcadoresLojas.length} marcadores com coordenadas reais ao mapa`);
    
    // PASSO 2: Apenas se não houver NENHUM marcador individual, usamos os marcadores de estado como fallback
    if (marcadoresLojas.length === 0) {
        console.log("Usando coordenadas de estados como fallback - nenhuma loja tem coordenadas salvas");
        
        // Adicionar marcadores para cada estado com lojas
        Object.keys(lojasPorEstado).forEach(estado => {
            // Verificar se temos coordenadas para este estado
            if (!coordenadasEstados[estado]) return;
            
            const dadosEstado = lojasPorEstado[estado];
            const totalLojas = dadosEstado.online + dadosEstado.offline;
            
            // Ignorar estados sem lojas
            if (totalLojas === 0) return;
            
            // Formatar última atualização
            let ultimaAtualizacaoFormatada = "Desconhecida";
            if (dadosEstado.ultimaAtualizacao) {
                ultimaAtualizacaoFormatada = formatarData(dadosEstado.ultimaAtualizacao);
            }
            
            // Calcular a porcentagem de lojas online
            const percentOnline = totalLojas > 0 ? Math.round((dadosEstado.online / totalLojas) * 100) : 0;
            
            // Determinar a classe do marcador com base no estado predominante (apenas online/offline)
            let markerClass = 'map-marker-online';
            if (dadosEstado.offline > dadosEstado.online) {
                markerClass = 'map-marker-offline';
            }
            
            // Criar ícone personalizado
            const markerIcon = L.divIcon({
                className: markerClass,
                html: `<div style="width:100%;height:100%;"></div>`,
                iconSize: [18, 18],
                iconAnchor: [9, 9]
            });
            
            // Criar marcador
            const marker = L.marker(coordenadasEstados[estado], { icon: markerIcon });
            
            // Criar conteúdo do popup
            let popupContent = `
                <div class="map-popup-content">
                    <h6>${estado} - ${estadosNomes[estado]}</h6>
                    <div class="d-flex justify-content-center align-items-center gap-2 mb-2">
                        <span class="badge bg-primary">${totalLojas} lojas</span>
                        <div class="progress" style="height: 8px; width: 80px;">
                            <div class="progress-bar bg-success" role="progressbar" style="width: ${percentOnline}%"></div>
                        </div>
                        <small>${percentOnline}% online</small>
                    </div>
                    
                    <div class="d-flex justify-content-center gap-2 mb-3">
                        <span class="badge bg-success">${dadosEstado.online} online</span>
                        <span class="badge bg-danger">${dadosEstado.offline} offline</span>
                    </div>
                    
                    <div class="small text-muted mb-2">
                        Última atualização: ${ultimaAtualizacaoFormatada}
                    </div>
                    
                    <hr class="my-2">
                    
                    <div class="small mb-0">
                        <div class="row g-2">
                            <div class="col-6 text-start">
                                <i class="fas fa-tshirt"></i> ${dadosEstado.dispositivos.lavadoras} lavadoras
                            </div>
                            <div class="col-6 text-start">
                                <i class="fas fa-wind"></i> ${dadosEstado.dispositivos.secadoras} secadoras
                            </div>
                            <div class="col-6 text-start">
                                <i class="fas fa-snowflake"></i> ${dadosEstado.dispositivos.arCondicionado} ar-cond.
                            </div>
                            <div class="col-6 text-start">
                                <i class="fas fa-prescription-bottle"></i> ${dadosEstado.dispositivos.dosadoras} dosadoras
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Adicionar popup ao marcador
            marker.bindPopup(popupContent, {
                maxWidth: 300
            });
            
            // Adicionar ao mapa
            marker.addTo(brasilMap);
            
            // Guardar referência para limpar depois
            mapMarkers.push(marker);
        });
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando aplicação...');
    
    try {
        // Verificar se elementos principais existem antes de continuar
        if (!lojasTableBody) {
            console.warn("Elemento lojasTableBody não encontrado. Algumas funcionalidades podem não funcionar corretamente.");
        }
        
        // Configurar filtros
    if (regionFilter) {
            regionFilter.addEventListener('change', function() {
                try {
                    // Atualizar o select de estados com base na região selecionada
                    if (stateFilter) {
                        preencherSelectEstados(stateFilter, this.value);
                    }
            
            // Aplicar filtros
            filtrarLojas();
                } catch (error) {
                    console.error("Erro ao aplicar filtro de região:", error);
                }
        });
    }
    
    if (stateFilter) {
            stateFilter.addEventListener('change', function() {
                try {
                    filtrarLojas();
                } catch (error) {
                    console.error("Erro ao aplicar filtro de estado:", error);
                }
            });
        }
        
    if (statusFilter) {
            statusFilter.addEventListener('change', function() {
                try {
                    filtrarLojas();
                } catch (error) {
                    console.error("Erro ao aplicar filtro de status:", error);
                }
            });
    }
    
    if (totemFilter) {
            totemFilter.addEventListener('change', function() {
                try {
                    filtrarLojas();
                } catch (error) {
                    console.error("Erro ao aplicar filtro de totem:", error);
                }
            });
        }
        
        if (searchInput) {
            // Desativa o comportamento padrão de busca do DataTables já que usamos filtro personalizado
            searchInput.addEventListener('keyup', function(e) {
                try {
                    // Previne que o evento seja capturado pelo DataTables
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                        filtrarLojas();
                    }
                } catch (error) {
                    console.error("Erro na busca por texto:", error);
                }
            });
            
            // Conectar o botão de busca ao lado do input
            const searchButton = searchInput.parentElement?.querySelector('button');
            if (searchButton) {
                searchButton.addEventListener('click', function() {
                    try {
                        filtrarLojas();
                    } catch (error) {
                        console.error("Erro ao buscar com botão:", error);
                    }
                });
            }
        }
        
    if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', function() {
                try {
                    limparFiltros();
                } catch (error) {
                    console.error("Erro ao limpar filtros:", error);
                }
            });
    }
    
    // Configurar eventos para o modal de reset em lote
        if (resetScopeRegion) {
            resetScopeRegion.addEventListener('change', function() {
                try {
                    if (this.checked && resetRegionContainer) {
                        resetRegionContainer.style.display = 'block';
                        if (resetStateContainer) resetStateContainer.style.display = 'none';
                        // Preencher select de estados no modal com base na região selecionada
                        if (resetState && resetRegion) {
                            preencherSelectEstados(resetState, resetRegion.value);
                        }
        atualizarContadorLojasAfetadas();
                    }
                } catch (error) {
                    console.error("Erro ao mudar escopo para região:", error);
                }
            });
        }
        
        if (resetScopeState) {
            resetScopeState.addEventListener('change', function() {
                try {
                    if (this.checked) {
                        if (resetRegionContainer) resetRegionContainer.style.display = 'none';
                        if (resetStateContainer) resetStateContainer.style.display = 'block';
                        atualizarContadorLojasAfetadas();
                    }
                } catch (error) {
                    console.error("Erro ao mudar escopo para estado:", error);
                }
            });
        }
        
        if (resetScopeFiltered) {
            resetScopeFiltered.addEventListener('change', function() {
                try {
                    if (this.checked) {
                        if (resetRegionContainer) resetRegionContainer.style.display = 'none';
                        if (resetStateContainer) resetStateContainer.style.display = 'none';
                        atualizarContadorLojasAfetadas();
                    }
                } catch (error) {
                    console.error("Erro ao mudar escopo para filtrado:", error);
                }
            });
        }
        
        if (resetRegion) {
            resetRegion.addEventListener('change', function() {
                try {
                    // Preencher select de estados no modal com base na região selecionada
                    if (resetState) {
                        preencherSelectEstados(resetState, this.value);
                    }
        atualizarContadorLojasAfetadas();
                } catch (error) {
                    console.error("Erro ao mudar região no reset:", error);
                }
            });
        }
        
        if (resetState) {
            resetState.addEventListener('change', function() {
                try {
        atualizarContadorLojasAfetadas();
                } catch (error) {
                    console.error("Erro ao mudar estado no reset:", error);
                }
            });
        }
        
        if (confirmBatchResetBtn) {
            confirmBatchResetBtn.addEventListener('click', function() {
                try {
                    executarResetEmLote();
                } catch (error) {
                    console.error("Erro ao executar reset em lote:", error);
                }
            });
        }
        
        // Configurar eventos para filtros das listas de problemas
        if (lojasOfflineRegiao) {
            lojasOfflineRegiao.addEventListener('change', function() {
                try {
                    // Atualizar o select de estados com base na região selecionada
                    if (lojasOfflineEstado) {
                        preencherSelectEstados(lojasOfflineEstado, this.value);
                    }
                    // Atualizar listas com filtros
                    atualizarEstatisticas();
                } catch (error) {
                    console.error("Erro ao filtrar lojas offline por região:", error);
                }
            });
        }
        
        if (lojasOfflineEstado) {
            lojasOfflineEstado.addEventListener('change', function() {
                try {
                    atualizarEstatisticas();
                } catch (error) {
                    console.error("Erro ao filtrar lojas offline por estado:", error);
                }
            });
        }
        
        if (totemsOfflineRegiao) {
            totemsOfflineRegiao.addEventListener('change', function() {
                try {
                    // Atualizar o select de estados com base na região selecionada
                    if (totemsOfflineEstado) {
                        preencherSelectEstados(totemsOfflineEstado, this.value);
                            }
                    // Atualizar listas com filtros
                    atualizarEstatisticas();
                } catch (error) {
                    console.error("Erro ao filtrar totems offline por região:", error);
                }
            });
        }
        
        if (totemsOfflineEstado) {
            totemsOfflineEstado.addEventListener('change', function() {
                try {
                            atualizarEstatisticas();
                } catch (error) {
                    console.error("Erro ao filtrar totems offline por estado:", error);
                }
            });
        }
        
        // Preencher os selects de estados com todos os estados por padrão
        if (lojasOfflineEstado) {
            try {
                preencherSelectEstados(lojasOfflineEstado, '');
            } catch (error) {
                console.error("Erro ao preencher estados de lojas offline:", error);
            }
            }
        
        if (totemsOfflineEstado) {
            try {
                preencherSelectEstados(totemsOfflineEstado, '');
            } catch (error) {
                console.error("Erro ao preencher estados de totems offline:", error);
            }
        }
        
        // Carregar lojas do Firebase
        carregarLojas();
        
        // Inicializar o mapa
        inicializarMapa();
    } catch (error) {
        console.error("Erro na inicialização da aplicação:", error);
    }
});

