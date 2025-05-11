const express = require('express');
const path = require('path');
const app = express();

// Servir arquivos estáticos da pasta web-dashboard
app.use(express.static(path.join(__dirname, 'web-dashboard')));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web-dashboard', 'index.html'));
});

// Rota para todas as outras páginas HTML
app.get('/*.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'web-dashboard', req.path));
});

// Rota para capturar todas as outras requisições
app.get('*', (req, res) => {
    // Se o arquivo existir na pasta web-dashboard, serve ele
    const filePath = path.join(__dirname, 'web-dashboard', req.path);
    if (require('fs').existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        // Caso contrário, redireciona para a página inicial
        res.redirect('/');
    }
});

// Porta padrão do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 