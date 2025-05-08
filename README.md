# Sistema de Lavanderia - Dashboard Web

Este é um dashboard web para monitoramento e gestão de operações de equipamentos de lavanderia conectados via ESP32/ESP8266 ao Firebase.

## Funcionalidades Principais

- **Monitoramento em Tempo Real**: Visualização do status de lojas e equipamentos com atualizações automáticas
- **Mapa Interativo**: Visualização georreferenciada das lojas com indicadores de status (online/offline)
- **Registro de Ações**: Visualização de logs de operações de equipamentos (lavadoras, secadoras, dosadoras)
- **Autenticação de Usuários**: Sistema seguro de login com Firebase Authentication
- **Interface Responsiva**: Design adaptável para diferentes dispositivos
- **Reset em Lote**: Funcionalidade para reiniciar múltiplos equipamentos simultaneamente

## Estrutura do Projeto

- `web-dashboard/`: Contém os arquivos do dashboard web
  - `index.html`: Página principal com visão geral e mapa das lojas
  - `logs.html`: Página de registros de operações
  - `lojas.html`: Página de gerenciamento de lojas
  - `loja.html`: Página de detalhes de uma loja específica
  - `login.html`: Página de autenticação
  - `app.js`: Scripts para gerenciamento geral da aplicação
  - `firebase-config.js`: Configurações de conexão com o Firebase
  - `firebase-logs.js`: Scripts para gerenciamento de logs e registros
  - `auth-check.js`: Scripts para controle de autenticação
  - `heartbeat-integration.js`: Integração de verificação de status dos dispositivos

## Caso Especial: Loja SP01

A loja SP01 utiliza um dispositivo ESP ao invés da aplicação Python como nas outras lojas. Para esta loja:

- Foi implementado um tratamento especial no `heartbeat-integration.js` para considerar a loja online se o heartbeat for da mesma data atual, ignorando diferenças de hora.
- ESP8266/ESP32 pode ter imprecisões de relógio, o que é tratado verificando apenas se a data (ignorando a hora) está correta.

## Integrações

- **Firebase Realtime Database**: Armazenamento e sincronização de dados em tempo real
- **API ViaCEP**: Integração para obtenção de endereços completos a partir do CEP
- **Leaflet Maps**: Biblioteca para renderização de mapas interativos
- **Firebase Authentication**: Sistema de autenticação e gerenciamento de usuários
- **Vercel**: Plataforma de deploy e hospedagem da aplicação

## Otimizações Implementadas

1. **Status Direto do Firebase**:
   - O status de dispositivos é definido diretamente no Firebase ao invés de ser calculado no frontend
   - Eliminação de verificações baseadas em timestamp do frontend
   - Tratamento especial para a loja SP01 que usa ESP

2. **Melhoria de Desempenho**:
   - Implementação de debounce para limitar a frequência de chamadas de funções
   - Redução de logs de console desnecessários
   - Uso de `once` em vez de `on` para consultas não recorrentes ao Firebase

## Requisitos Técnicos

- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Backend**: Firebase (Authentication, Firestore, Realtime Database)
- **Bibliotecas**: jQuery, DataTables, Font Awesome, SweetAlert2, Leaflet
- **Deploy**: Vercel (produção), Node.js (desenvolvimento local)

## Instalação e Uso

1. Clone o repositório:
   ```bash
   git clone https://github.com/AyltonJunior/newget-registros.git
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure o projeto Firebase:
   - Crie um projeto no console do Google Firebase
   - Copie as credenciais para o arquivo `firebase-config.js`

4. Execute localmente:
   ```bash
   npm start
   ```

5. Para deploy em produção:
   - Configure o projeto no Vercel
   - Conecte com o repositório GitHub
   - O deploy será automático a cada push na branch master

## Desenvolvimento

Para contribuir com o projeto:

1. Clone o repositório
2. Crie uma branch para sua feature: `git checkout -b feature/nova-funcionalidade`
3. Faça suas modificações
4. Teste localmente
5. Commit suas mudanças: `git commit -m "Add: nova funcionalidade"`
6. Push para a branch: `git push origin feature/nova-funcionalidade`
7. Abra um Pull Request

## Licença

Este projeto está licenciado sob os termos da licença MIT. 