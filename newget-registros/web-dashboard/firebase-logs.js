// Funções para registrar logs no Firestore

// Controle de operações recentes para evitar duplicações
const operacoesRecentes = new Map();

/**
 * Registra operações no Firestore
 * @param {string} tipoOperacao - Tipo de operação (liberacao_lavadora, acionamento_dosadora, reset)
 * @param {object} dados - Dados da operação
 * @returns {Promise} - Promise com o resultado da operação
 */
function registrarOperacao(tipoOperacao, dados) {
    // Verificar se o Firestore está inicializado
    if (!firebase.firestore) {
        console.error('Firestore não inicializado');
        return Promise.reject(new Error('Firestore não inicializado'));
    }
    
    // Obter usuário atual
    const usuario = firebase.auth().currentUser;
    if (!usuario) {
        console.error('Usuário não autenticado');
        return Promise.reject(new Error('Usuário não autenticado'));
    }
    
    // Dados base para todos os tipos de operação
    const dadosBase = {
        userId: usuario.uid,
        email: usuario.email,
        displayName: usuario.displayName,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        tipoOperacao: tipoOperacao
    };
    
    // Merge com os dados específicos da operação
    const dadosCompletos = { ...dadosBase, ...dados };
    
    // Registrar no Firestore
    return firebase.firestore()
        .collection('operacoes_logs')
        .add(dadosCompletos)
        .then(() => {
            console.log(`Operação ${tipoOperacao} registrada com sucesso`);
            return true;
        })
        .catch(error => {
            console.error(`Erro ao registrar operação ${tipoOperacao}:`, error);
            return Promise.reject(error);
        });
}

/**
 * Gera uma chave única para a operação
 * @param {string} tipoOperacao - Tipo de operação
 * @param {object} params - Parâmetros da operação
 * @returns {string} - Chave única
 */
function gerarChaveOperacao(tipoOperacao, params) {
    // Cria uma chave única baseada no tipo de operação e parâmetros relevantes
    let chave = `${tipoOperacao}|`;
    
    // Adiciona parâmetros específicos por tipo de operação
    if (tipoOperacao === 'liberacao_lavadora') {
        const { lojaId, lavadoraId, configuracao } = params;
        chave += `${lojaId}|${lavadoraId}|`;
        
        // Adiciona configuração específica se existir
        if (configuracao) {
            if (configuracao.amaciante !== undefined) {
                chave += `am:${configuracao.amaciante}|`;
            }
            if (configuracao.dosagem !== undefined) {
                chave += `dos:${configuracao.dosagem}|`;
            }
        }
    } else if (tipoOperacao === 'liberacao_secadora') {
        const { lojaId, secadoraId, configuracao } = params;
        chave += `${lojaId}|${secadoraId}|`;
        
        // Adiciona tempo se existir
        if (configuracao && configuracao.tempo) {
            chave += `tempo:${configuracao.tempo}|`;
        }
    } else if (tipoOperacao === 'acionamento_dosadora') {
        const { lojaId, dosadoraId, configuracao } = params;
        chave += `${lojaId}|${dosadoraId}|`;
        
        // Adiciona configuração específica se existir
        if (configuracao && configuracao.bomba !== undefined) {
            chave += `bomba:${configuracao.bomba}|`;
        }
    } else {
        // Para outros tipos, apenas usar os parâmetros como string
        chave += JSON.stringify(params);
    }
    
    return chave;
}

/**
 * Verifica se uma operação foi realizada recentemente (debounce)
 * @param {string} tipoOperacao - Tipo de operação
 * @param {object} params - Parâmetros da operação
 * @returns {boolean} - true se a operação foi realizada recentemente
 */
function operacaoRecente(tipoOperacao, params) {
    const chave = gerarChaveOperacao(tipoOperacao, params);
    
    // Verifica se a operação foi realizada nos últimos segundos
    if (operacoesRecentes.has(chave)) {
        const ultimaExecucao = operacoesRecentes.get(chave);
        const agora = Date.now();
        const tempoDecorrido = agora - ultimaExecucao;
        
        // Se a última execução foi há menos de 10 segundos, considera recente
        if (tempoDecorrido < 10000) {
            console.log(`Operação ${tipoOperacao} ignorada (debounce): última execução há ${tempoDecorrido}ms`);
            return true;
        }
    }
    
    // Registra esta operação no mapa de operações recentes
    operacoesRecentes.set(chave, Date.now());
    
    // Limpar entradas antigas periodicamente para evitar vazamento de memória
    if (operacoesRecentes.size > 100) {
        const agora = Date.now();
        for (const [k, timestamp] of operacoesRecentes.entries()) {
            if (agora - timestamp > 60000) { // Remove entradas com mais de 1 minuto
                operacoesRecentes.delete(k);
            }
        }
    }
    
    return false;
}

/**
 * Registra liberação de lavadora
 * @param {string} lojaId - ID da loja
 * @param {string} lavadoraId - ID da lavadora
 * @param {object} configuracao - Configuração da liberação (amaciante, dosagem)
 * @returns {Promise}
 */
function registrarLiberacaoLavadora(lojaId, lavadoraId, configuracao) {
    const params = { lojaId, lavadoraId, configuracao };
    
    // Verificar se esta operação foi realizada recentemente
    if (operacaoRecente('liberacao_lavadora', params)) {
        // Retorna uma Promise resolvida para manter a interface consistente
        console.log(`Evitando registro duplicado para lavadora ${lavadoraId}`);
        return Promise.resolve(true);
    }
    
    // Se não foi recente, registra normalmente
    return registrarOperacao('liberacao_lavadora', params);
}

/**
 * Registra liberação de secadora
 * @param {string} lojaId - ID da loja
 * @param {string} secadoraId - ID da secadora
 * @param {object} configuracao - Configuração da liberação (tempo, status)
 * @returns {Promise}
 */
function registrarLiberacaoSecadora(lojaId, secadoraId, configuracao) {
    // Add defaults for better data consistency
    const configCompleta = {
        tempo: configuracao.tempo || "0",
        status: configuracao.status || "desconhecido",
        timestamp_client: Date.now(),
        dispositivo: `secadora_${secadoraId}`,
        ...configuracao
    };
    
    const params = { lojaId, secadoraId, configuracao: configCompleta };
    
    // Para status='iniciado', não aplicamos debounce para capturar todas as tentativas
    if (configCompleta.status !== 'iniciado' && operacaoRecente('liberacao_secadora', params)) {
        // Retorna uma Promise resolvida para manter a interface consistente
        console.log(`Evitando registro duplicado para secadora ${secadoraId}`);
        return Promise.resolve(true);
    }
    
    // Adicionar log console para depuração
    console.log(`Registrando operação de secadora ${secadoraId}: ${configCompleta.status}`);
    
    // Se não foi recente, registra normalmente
    return registrarOperacao('liberacao_secadora', params);
}

/**
 * Registra acionamento de dosadora
 * @param {string} lojaId - ID da loja
 * @param {string} dosadoraId - ID da dosadora
 * @param {object} configuracao - Configuração do acionamento (produto, tempo)
 * @returns {Promise}
 */
function registrarAcionamentoDosadora(lojaId, dosadoraId, configuracao) {
    const params = { lojaId, dosadoraId, configuracao };
    
    // Verificar se esta operação foi realizada recentemente
    if (operacaoRecente('acionamento_dosadora', params)) {
        // Retorna uma Promise resolvida para manter a interface consistente
        console.log(`Evitando registro duplicado para dosadora ${dosadoraId}`);
        return Promise.resolve(true);
    }
    
    // Se não foi recente, registra normalmente
    return registrarOperacao('acionamento_dosadora', params);
}

/**
 * Registra reset
 * @param {string} lojaId - ID da loja
 * @param {string} tipo - Tipo de reset (Reset ON, Reset OFF)
 * @returns {Promise}
 */
function registrarReset(lojaId, tipo) {
    const params = { lojaId, operacao: tipo };
    
    // Verificar se esta operação foi realizada recentemente
    if (operacaoRecente('reset', params)) {
        // Retorna uma Promise resolvida para manter a interface consistente
        console.log(`Evitando registro duplicado para reset de ${lojaId}`);
        return Promise.resolve(true);
    }
    
    // Se não foi recente, registra normalmente
    return registrarOperacao('reset', params);
}

/**
 * Registra reset em lote
 * @param {object} configuracao - Configuração do reset em lote (escopo, tipo, lojasAfetadas)
 * @returns {Promise}
 */
function registrarResetEmLote(configuracao) {
    // Para reset em lote não aplicamos debounce, pois é uma operação raramente repetida
    return registrarOperacao('reset_em_lote', configuracao);
}

/**
 * Registra operação do ar-condicionado
 * @param {string} lojaId - ID da loja
 * @param {string} temperatura - Temperatura configurada (18, 22, OFF)
 * @param {string} status - Status da operação (iniciado, sucesso, falha)
 * @returns {Promise}
 */
function registrarArCondicionado(lojaId, temperatura, status = 'sucesso') {
    console.log(`[DEBUG] Iniciando registro de ar-condicionado para loja=${lojaId}, temperatura=${temperatura}, status=${status}`);
    
    // Validar parâmetros de entrada
    if (!lojaId) {
        console.error('ID da loja é obrigatório para registrar operação de ar-condicionado');
        return Promise.reject(new Error('ID da loja é obrigatório'));
    }
    
    if (!temperatura) {
        console.error('Temperatura é obrigatória para registrar operação de ar-condicionado');
        return Promise.reject(new Error('Temperatura é obrigatória'));
    }
    
    // Normalizar temperatura para formato padrão
    const tempNormalizada = temperatura.toString().trim();
    
    const configuracao = {
        temperatura: tempNormalizada,
        status: status,
        timestamp_client: Date.now(),
        dispositivo: `ar_condicionado`
    };
    
    // Criar objeto de parâmetros com todos os campos necessários
    const params = { 
        lojaId, 
        temperatura: tempNormalizada,  // Adicionar campo direto para garantir que apareça no log
        configuracao,
        dispositivo: 'AC',  // Identificador padrão para o dispositivo
        maquinaId: 'AC',    // Para garantir que aparece corretamente na tabela de logs
        operacao: 'Ar-Condicionado'  // Campo operação para facilitar filtragem
    };
    
    // Verificar se esta operação foi realizada recentemente
    if (operacaoRecente('operacao_ar_condicionado', params)) {
        // Retorna uma Promise resolvida para manter a interface consistente
        console.log(`Evitando registro duplicado para ar-condicionado em ${lojaId}`);
        return Promise.resolve(true);
    }
    
    // Adicionar log console para depuração
    console.log(`Registrando operação de ar-condicionado: ${tempNormalizada}, status: ${status}`);
    
    // Se não foi recente, registra normalmente
    return registrarOperacao('operacao_ar_condicionado', params);
}

// Adiciona classe única ao card
const cardDiv = card.querySelector('.card');
if (cardDiv) {
    cardDiv.classList.add(`card-lavadora-${id}`);
}

// Listener em tempo real para o status da lavadora
const statusRef = database.ref(`/${lojaId}/status/lavadoras/${id}`);
statusRef.on('value', (snapshot) => {
    const status = snapshot.val();
    // Atualiza SEMPRE o cardDiv local (garante atualização mesmo antes de estar no DOM)
    const statusIndicator = cardDiv.querySelector('.status-indicator');
    const statusBadge = cardDiv.querySelector('.device-status');
    if (status === 'online') {
        if (statusIndicator) statusIndicator.className = 'status-indicator status-online';
        if (statusBadge) {
            statusBadge.textContent = 'Online';
            statusBadge.className = 'badge bg-success device-status';
        }
    } else if (status === 'offline') {
        if (statusIndicator) statusIndicator.className = 'status-indicator status-offline';
        if (statusBadge) {
            statusBadge.textContent = 'Offline';
            statusBadge.className = 'badge bg-danger device-status';
        }
    } else if (status === 'liberando') {
        if (statusIndicator) statusIndicator.className = 'status-indicator status-warning';
        if (statusBadge) {
            statusBadge.textContent = 'Liberando...';
            statusBadge.className = 'badge bg-info device-status';
        }
    } else {
        if (statusIndicator) statusIndicator.className = 'status-indicator status-offline';
        if (statusBadge) {
            statusBadge.textContent = 'Desconhecido';
            statusBadge.className = 'badge bg-secondary device-status';
        }
    }
}); 