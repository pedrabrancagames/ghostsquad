/**
 * Componente de Gráficos
 * 
 * Componente responsável por renderizar gráficos e visualizações
 * de dados no painel administrativo.
 */

/**
 * Inicializa os gráficos do dashboard
 * @param {HTMLElement} activityChartElement - Elemento para o gráfico de atividade
 * @param {HTMLElement} locationChartElement - Elemento para o gráfico de localização
 * @param {Object} database - Instância do Firebase Database
 */
export function initCharts(activityChartElement, locationChartElement, database) {
    if (!activityChartElement || !locationChartElement || !database) {
        console.error('Elementos ou database não fornecidos para os gráficos');
        return;
    }
    
    // Renderizar gráficos
    renderActivityChart(activityChartElement);
    renderLocationChart(locationChartElement);
    
    // Carregar dados dos gráficos
    loadActivityData(database, activityChartElement);
    loadLocationData(database, locationChartElement);
}

/**
 * Renderiza o gráfico de atividade
 * @param {HTMLElement} element - Elemento onde o gráfico será renderizado
 */
function renderActivityChart(element) {
    element.innerHTML = `
        <div class="chart-container">
            <canvas id="activity-chart-canvas"></canvas>
        </div>
    `;
}

/**
 * Renderiza o gráfico de localização
 * @param {HTMLElement} element - Elemento onde o gráfico será renderizado
 */
function renderLocationChart(element) {
    element.innerHTML = `
        <div class="chart-container">
            <canvas id="location-chart-canvas"></canvas>
        </div>
    `;
}

/**
 * Carrega os dados de atividade
 * @param {Object} database - Instância do Firebase Database
 * @param {HTMLElement} element - Elemento do gráfico
 */
async function loadActivityData(database, element) {
    try {
        // Simular dados de atividade dos últimos 30 dias
        const activityData = generateActivityData(30);
        
        // Renderizar gráfico de barras
        renderBarChart(
            element.querySelector('#activity-chart-canvas'),
            activityData.labels,
            activityData.values,
            'Atividade dos Últimos 30 Dias',
            'Usuários Ativos por Dia'
        );
    } catch (error) {
        console.error('Erro ao carregar dados de atividade:', error);
        renderChartPlaceholder(element, 'Erro ao carregar dados de atividade');
    }
}

/**
 * Carrega os dados de localização
 * @param {Object} database - Instância do Firebase Database
 * @param {HTMLElement} element - Elemento do gráfico
 */
async function loadLocationData(database, element) {
    try {
        // Simular dados de localização
        const locationData = generateLocationData();
        
        // Renderizar gráfico de pizza
        renderPieChart(
            element.querySelector('#location-chart-canvas'),
            locationData.labels,
            locationData.values,
            'Distribuição de Capturas por Localização'
        );
    } catch (error) {
        console.error('Erro ao carregar dados de localização:', error);
        renderChartPlaceholder(element, 'Erro ao carregar dados de localização');
    }
}

/**
 * Gera dados de atividade simulados
 * @param {number} days - Número de dias
 * @returns {Object} - Dados de atividade
 */
function generateActivityData(days) {
    const labels = [];
    const values = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }));
        values.push(Math.floor(Math.random() * 100) + 20);
    }
    
    return { labels, values };
}

/**
 * Gera dados de localização simulados
 * @returns {Object} - Dados de localização
 */
function generateLocationData() {
    const locations = [
        'Parque dos Dinossauros',
        'Museu de História Natural',
        'Biblioteca Central',
        'Estação de Trem',
        'Praça da Matriz',
        'Shopping Center'
    ];
    
    const labels = locations;
    const values = locations.map(() => Math.floor(Math.random() * 150) + 10);
    
    return { labels, values };
}

/**
 * Renderiza um gráfico de barras
 * @param {HTMLCanvasElement} canvas - Elemento canvas
 * @param {Array} labels - Rótulos
 * @param {Array} data - Dados
 * @param {string} title - Título do gráfico
 * @param {string} label - Rótulo dos dados
 */
function renderBarChart(canvas, labels, data, title, label) {
    if (!canvas) return;
    
    // Limpar canvas
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Configurar dimensões
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 300;
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    // Encontrar valor máximo para escala
    const maxValue = Math.max(...data);
    const step = maxValue / 5;
    
    // Desenhar eixos
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Desenhar grades
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
        const y = height - padding - (i * chartHeight / 5);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
        
        // Desenhar valores no eixo Y
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(i * step), padding - 10, y + 4);
    }
    
    // Desenhar título
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 20);
    
    // Desenhar barras
    const barWidth = chartWidth / labels.length * 0.8;
    const barSpacing = chartWidth / labels.length * 0.2;
    
    for (let i = 0; i < labels.length; i++) {
        const x = padding + i * (barWidth + barSpacing) + barSpacing / 2;
        const barHeight = (data[i] / maxValue) * chartHeight;
        const y = height - padding - barHeight;
        
        // Desenhar barra
        ctx.fillStyle = '#3498db';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Desenhar rótulo no eixo X
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], x + barWidth / 2, height - padding + 20);
        
        // Desenhar valor na barra
        if (barHeight > 20) {
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.fillText(data[i], x + barWidth / 2, y + 15);
        }
    }
    
    // Desenhar legenda
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label, padding, height - 5);
}

/**
 * Renderiza um gráfico de pizza
 * @param {HTMLCanvasElement} canvas - Elemento canvas
 * @param {Array} labels - Rótulos
 * @param {Array} data - Dados
 * @param {string} title - Título do gráfico
 */
function renderPieChart(canvas, labels, data, title) {
    if (!canvas) return;
    
    // Limpar canvas
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Configurar dimensões
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 300;
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    
    // Calcular total
    const total = data.reduce((sum, value) => sum + value, 0);
    
    // Cores para as fatias
    const colors = [
        '#3498db', '#e74c3c', '#2ecc71', '#f39c12', 
        '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
    ];
    
    // Desenhar título
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 20);
    
    // Desenhar gráfico de pizza
    let startAngle = 0;
    
    for (let i = 0; i < data.length; i++) {
        const sliceAngle = (data[i] / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;
        
        // Desenhar fatia
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        
        // Desenhar borda
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Calcular posição para o rótulo
        const midAngle = startAngle + sliceAngle / 2;
        const labelX = centerX + (radius + 30) * Math.cos(midAngle);
        const labelY = centerY + (radius + 30) * Math.sin(midAngle);
        
        // Desenhar porcentagem
        const percentage = ((data[i] / total) * 100).toFixed(1);
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${percentage}%`, labelX, labelY);
        
        startAngle = endAngle;
    }
    
    // Desenhar legenda
    const legendX = width - 150;
    const legendY = 60;
    
    for (let i = 0; i < labels.length; i++) {
        // Desenhar cor
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(legendX, legendY + i * 20, 15, 15);
        
        // Desenhar rótulo
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(labels[i], legendX + 20, legendY + i * 20 + 12);
    }
}

/**
 * Renderiza um placeholder para gráficos
 * @param {HTMLElement} element - Elemento onde o placeholder será renderizado
 * @param {string} message - Mensagem para exibir
 */
function renderChartPlaceholder(element, message) {
    element.innerHTML = `
        <div class="chart-placeholder">
            <p>${message}</p>
        </div>
    `;
}