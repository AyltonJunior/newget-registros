function createDosadoraCard(id, deviceId) {
    const cardTemplate = document.getElementById('dosadora-card-template');
    const cardClone = document.importNode(cardTemplate.content, true);
    
    // Definir IDs e valores
    cardClone.querySelector('.device-id').textContent = deviceId;
    
    const card = cardClone.querySelector('.device-card');
    card.id = `dosadora-${id}`;
    
    // Adicionar event listeners
    addDosadoraEventListeners(card, deviceId);
    
    return cardClone;
}

function addDosadoraEventListeners(card, deviceId) {
    const bombaSelect = card.querySelector('.bomba-select');
    const btnAcionar = card.querySelector('.btn-acionar');
    const btnConfigurar = card.querySelector('.btn-configurar');
    const btnConsultar = card.querySelector('.btn-consultar');
    
    btnAcionar.addEventListener('click', function() {
        const bombaId = bombaSelect.value;
        acionarBomba(deviceId, bombaId);
    });
    
    btnConfigurar.addEventListener('click', function() {
        const bombaId = bombaSelect.value;
        const promptMessage = bombaId === '1' ? 'Sabão' : 
                             bombaId === '2' ? 'Amaciante Floral' : 'Amaciante Sport';
        const tempo = prompt(`Digite o tempo em segundos para ${promptMessage}:`);
        
        if (tempo !== null && !isNaN(parseInt(tempo))) {
            configurarTempoBomba(deviceId, bombaId, parseInt(tempo));
        }
    });
    
    btnConsultar.addEventListener('click', function() {
        consultarTemposBomba(deviceId, card);
    });

    // Consultar tempos iniciais ao carregar o card
    setTimeout(() => {
        consultarTemposBomba(deviceId, card);
    }, 1000);
}

function acionarBomba(deviceId, bombaId) {
    console.log(`Acionando bomba ${bombaId} da dosadora ${deviceId}`);
    
    // Mapear bombaId para o endpoint correto
    const endpoint = bombaId === '1' ? 'rele1on' : 
                    bombaId === '2' ? 'rele2on' : 'rele3on';
    
    // Fazer requisição para o ESP8266
    const deviceIp = getDeviceIpById(deviceId);
    
    if (!deviceIp) {
        showToast('Erro', 'IP da dosadora não encontrado', 'error');
        return;
    }
    
    const url = `http://${deviceIp}/${endpoint}`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            console.log('Resposta:', data);
            const bombaName = bombaId === '1' ? 'Sabão' : 
                             bombaId === '2' ? 'Amaciante Floral' : 'Amaciante Sport';
            showToast('Sucesso', `Bomba ${bombaName} acionada!`, 'success');
        })
        .catch(error => {
            console.error('Erro ao acionar bomba:', error);
            showToast('Erro', `Falha ao acionar bomba: ${error.message}`, 'error');
        });
}

function configurarTempoBomba(deviceId, bombaId, tempo) {
    console.log(`Configurando bomba ${bombaId} da dosadora ${deviceId} para ${tempo} segundos`);
    
    // Mapear bombaId para o endpoint correto
    const endpoint = bombaId === '1' ? 'ajustesab' : 
                    bombaId === '2' ? 'ajusteam01' : 'ajusteam02';
    
    // Fazer requisição para o ESP8266
    const deviceIp = getDeviceIpById(deviceId);
    
    if (!deviceIp) {
        showToast('Erro', 'IP da dosadora não encontrado', 'error');
        return;
    }
    
    const url = `http://${deviceIp}/${endpoint}?valor=${tempo}`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            console.log('Resposta:', data);
            const bombaName = bombaId === '1' ? 'Sabão' : 
                             bombaId === '2' ? 'Amaciante Floral' : 'Amaciante Sport';
            showToast('Sucesso', `Tempo da bomba ${bombaName} configurado para ${tempo} segundos!`, 'success');
            
            // Atualizar a exibição dos tempos
            consultarTemposBomba(deviceId, document.getElementById(`dosadora-${deviceId}`));
        })
        .catch(error => {
            console.error('Erro ao configurar tempo:', error);
            showToast('Erro', `Falha ao configurar tempo: ${error.message}`, 'error');
        });
}

function consultarTemposBomba(deviceId, card) {
    console.log(`Consultando tempos da dosadora ${deviceId}`);
    
    const deviceIp = getDeviceIpById(deviceId);
    
    if (!deviceIp) {
        showToast('Erro', 'IP da dosadora não encontrado', 'error');
        return;
    }
    
    // Consultar tempo para cada bomba
    const endpoints = [
        { id: '1', endpoint: 'consultasab', selector: '.tempo-sabao', name: 'Sabão' },
        { id: '2', endpoint: 'consultaam01', selector: '.tempo-floral', name: 'Amaciante Floral' },
        { id: '3', endpoint: 'consultaam02', selector: '.tempo-sport', name: 'Amaciante Sport' }
    ];
    
    endpoints.forEach(item => {
        const url = `http://${deviceIp}/${item.endpoint}`;
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro HTTP: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                console.log(`Resposta ${item.name}:`, data);
                
                // Extrair o tempo da resposta - assumindo que está em ms e queremos exibir em segundos
                let tempo = 'N/A';
                const match = data.match(/(\d+)\s*ms/);
                if (match && match[1]) {
                    tempo = `${Math.round(parseInt(match[1]) / 1000)}s`;
                }
                
                // Atualizar a exibição
                const displayElement = card.querySelector(item.selector);
                if (displayElement) {
                    displayElement.textContent = tempo;
                }
            })
            .catch(error => {
                console.error(`Erro ao consultar tempo ${item.name}:`, error);
                const displayElement = card.querySelector(item.selector);
                if (displayElement) {
                    displayElement.textContent = 'Erro';
                }
            });
    });
    
    showToast('Info', 'Consultando tempos das bombas...', 'info');
}

function getDeviceIpById(deviceId) {
    // Buscar IP do dispositivo por ID
    for (const device of config.devices) {
        if (device.id === deviceId && device.ip) {
            return device.ip;
        }
    }
    return null;
} 