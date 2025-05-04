// Script de diagnóstico para debug da página dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Iniciando verificação de elementos DOM...');
    
    // Verifica templates
    const templates = [
        { id: 'lavadora-card-template', name: 'Lavadora' },
        { id: 'secadora-card-template', name: 'Secadora' },
        { id: 'dosadora-card-template', name: 'Dosadora' },
        { id: 'ar-card-template', name: 'Ar Condicionado' }
    ];
    
    console.log('Verificando templates:');
    templates.forEach(template => {
        const element = document.getElementById(template.id);
        if (element) {
            console.log(`✅ Template ${template.name} (${template.id}) encontrado`);
            console.log(`   Conteúdo: ${element.innerHTML.substring(0, 50)}...`);
        } else {
            console.error(`❌ Template ${template.name} (${template.id}) NÃO encontrado`);
        }
    });
    
    // Verifica containers
    const containers = [
        { id: 'lavadoras-container', name: 'Lavadoras' },
        { id: 'secadoras-container', name: 'Secadoras' },
        { id: 'dosadoras-container', name: 'Dosadoras' },
        { id: 'ar-container', name: 'Ar Condicionado' }
    ];
    
    console.log('\nVerificando containers:');
    containers.forEach(container => {
        const element = document.getElementById(container.id);
        if (element) {
            console.log(`✅ Container ${container.name} (${container.id}) encontrado`);
        } else {
            console.error(`❌ Container ${container.name} (${container.id}) NÃO encontrado`);
        }
    });
    
    // Verifica variáveis globais importantes
    console.log('\nVerificando variáveis globais:');
    ['database', 'firebase', 'bootstrap'].forEach(varName => {
        if (typeof window[varName] !== 'undefined') {
            console.log(`✅ Variável global ${varName} está definida`);
        } else {
            console.error(`❌ Variável global ${varName} NÃO está definida`);
        }
    });
    
    // Verifica se o arquivo firebase-config.js está carregado
    console.log('\nVerificando configuração do Firebase:');
    if (typeof firebaseConfig !== 'undefined') {
        console.log('✅ Configuração do Firebase encontrada');
    } else {
        console.error('❌ Configuração do Firebase NÃO encontrada. Verifique o arquivo firebase-config.js');
    }
    
    console.log('\nVerificação de elementos DOM concluída.');
}); 