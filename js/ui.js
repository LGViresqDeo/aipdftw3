class UIManager {
    constructor() {
        this.currentData1 = null;
        this.currentData2 = null;
        this.currentComparisonResult = null;
        this.initializeEventListeners();
        this.loadReports();
    }

    initializeEventListeners() {
        // Drop zone and file input handlers
        this.setupDropZone('dropZone1', 'fileInput1', 1);
        this.setupDropZone('dropZone2', 'fileInput2', 2);
        
        // Button handlers
        document.getElementById('compareBtn').addEventListener('click', () => this.compareDocuments());
        document.getElementById('downloadReportBtn').addEventListener('click', () => this.downloadReport());
        document.getElementById('saveResultBtn').addEventListener('click', () => this.saveResult());
        document.getElementById('newComparisonBtn').addEventListener('click', () => this.newComparison());
        
        // Tab handlers
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Chat handlers
        document.getElementById('sendMessageBtn').addEventListener('click', () => this.sendChatMessage());
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
        
        // Enable message input
        document.getElementById('messageInput').addEventListener('input', (e) => {
            const sendBtn = document.getElementById('sendMessageBtn');
            sendBtn.disabled = e.target.value.trim().length === 0;
        });
    }

    setupDropZone(dropZoneId, fileInputId, fileNumber) {
        const dropZone = document.getElementById(dropZoneId);
        const fileInput = document.getElementById(fileInputId);
        
        if (!dropZone || !fileInput) {
            console.error(`No se encontró elemento: ${dropZoneId} o ${fileInputId}`);
            return;
        }

        // Click en drop zone abre selector de archivos
        dropZone.addEventListener('click', () => {
            fileInput.click();
        });

        // Cambio en input de archivo
        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e, fileNumber);
        });

        // Drag and drop functionality
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type === 'application/pdf') {
                fileInput.files = files;
                this.handleFileUpload({ target: { files: files } }, fileNumber);
            } else {
                window.notifications.showToast('Por favor selecciona un archivo PDF válido', 'error');
            }
        });
    }

    async handleFileUpload(event, fileNumber) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            window.notifications.showToast('Por favor selecciona un archivo PDF válido', 'error');
            return;
        }

        const dropZone = document.getElementById(`dropZone${fileNumber}`);
        const fileInfo = document.getElementById(`fileInfo${fileNumber}`);
        const processing = document.getElementById(`processing${fileNumber}`);
        const dropContent = dropZone.querySelector('.drop-content');
        
        try {
            // Mostrar estado de procesamiento
            dropContent.style.display = 'none';
            fileInfo.classList.add('hidden');
            processing.classList.remove('hidden');
            
            window.notifications.showToast(`Procesando ${file.name}...`, 'info');
            
            const extractedData = await window.pdfProcessor.extractPDFFields(file);
            
            if (fileNumber === 1) {
                this.currentData1 = extractedData;
            } else {
                this.currentData2 = extractedData;
            }
            
            // Mostrar información del archivo
            processing.classList.add('hidden');
            fileInfo.classList.remove('hidden');
            fileInfo.querySelector('.file-name').textContent = file.name;
            fileInfo.querySelector('.file-size').textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
            
            window.notifications.showToast(
                `✓ ${file.name} procesado: ${Object.keys(extractedData.fields).length} campos detectados`, 
                'success'
            );
            
            // Enable compare button if both files are loaded
            this.updateCompareButton();
            
        } catch (error) {
            console.error('Error processing file:', error);
            
            // Restaurar estado inicial
            processing.classList.add('hidden');
            dropContent.style.display = 'block';
            
            window.notifications.showToast(`Error procesando ${file.name}: ${error.message}`, 'error');
        }
    }

    showFilePreview(container, data) {
        container.innerHTML = `
            <div class="file-preview">
                <h4>📄 ${data.fileName}</h4>
                <div class="preview-stats">
                    <span class="stat">📊 ${Object.keys(data.fields).length} campos</span>
                    <span class="stat">📑 ${data.pages} páginas</span>
                </div>
                <div class="preview-fields">
                    ${Object.entries(data.fields).slice(0, 3).map(([key, field]) => 
                        `<div class="preview-field">
                            <strong>${field.label || key}:</strong> ${field.value || 'Sin valor'}
                        </div>`
                    ).join('')}
                    ${Object.keys(data.fields).length > 3 ? '<div class="preview-more">... y más campos</div>' : ''}
                </div>
            </div>
        `;
        container.classList.remove('hidden');
    }

    updateCompareButton() {
        const compareBtn = document.getElementById('compareBtn');
        const canCompare = this.currentData1 && this.currentData2;
        
        compareBtn.disabled = !canCompare;
        
        if (canCompare) {
            compareBtn.innerHTML = '<span class="btn-icon">⚡</span><span class="btn-text">Comparar Documentos</span>';
        } else {
            compareBtn.innerHTML = '<span class="btn-icon">⚡</span><span class="btn-text">Selecciona ambos archivos</span>';
        }
    }

    async compareDocuments() {
        if (!this.currentData1 || !this.currentData2) {
            window.notifications.showToast('Selecciona ambos archivos primero', 'error');
            return;
        }

        try {
            const compareBtn = document.getElementById('compareBtn');
            compareBtn.disabled = true;
            compareBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Comparando...</span>';
            
            window.notifications.showToast('Iniciando comparación...', 'info');
            
            const comparisonResult = window.pdfProcessor.comparePDFFields(
                this.currentData1, 
                this.currentData2
            );
            
            this.currentComparisonResult = comparisonResult;
            this.displayComparisonResults(comparisonResult);
            
        } catch (error) {
            console.error('Error comparing documents:', error);
            window.notifications.showToast(`Error en la comparación: ${error.message}`, 'error');
        } finally {
            const compareBtn = document.getElementById('compareBtn');
            compareBtn.disabled = this.currentData1 && this.currentData2 ? false : true;
            compareBtn.innerHTML = '<span class="btn-icon">⚡</span><span class="btn-text">Comparar Documentos</span>';
        }
    }

    displayComparisonResults(comparisonResult) {
        const resultsSection = document.getElementById('resultsSection');
        const resultIcon = document.getElementById('resultIcon');
        const resultTitle = document.getElementById('resultTitle');
        const resultDescription = document.getElementById('resultDescription');
        const fields1Container = document.getElementById('fields1');
        const fields2Container = document.getElementById('fields2');
        const fileName1 = document.getElementById('fileName1');
        const fileName2 = document.getElementById('fileName2');
        const differencesSection = document.getElementById('differencesSection');
        const differencesList = document.getElementById('differencesList');

        const { summary } = comparisonResult;
        
        // Determinar el resultado y mostrar notificaciones apropiadas
        if (summary.matchPercentage === 100) {
            resultIcon.textContent = '✅';
            resultTitle.textContent = '🎉 COINCIDENCIA 100%';
            resultDescription.textContent = 'Los documentos coinciden perfectamente. Todos los campos son idénticos.';
            resultIcon.style.color = '#10b981';
            
            // Mostrar notificación de coincidencia perfecta
            window.notifications.showPerfectMatch(comparisonResult.file1, comparisonResult.file2);
        } else {
            resultIcon.textContent = '⚠️';
            resultTitle.textContent = `❌ NO COINCIDEN - ${summary.matchPercentage}%`;
            resultDescription.textContent = `Se encontraron ${summary.differences} diferencias. Los documentos NO son idénticos.`;
            resultIcon.style.color = '#ef4444';
            
            // Mostrar notificación de diferencias y enviar alertas
            window.notifications.showDifferencesFound(comparisonResult);
        }

        // Set file names
        fileName1.textContent = comparisonResult.file1;
        fileName2.textContent = comparisonResult.file2;

        // Mostrar campos de ambos archivos con indicadores de diferencias
        this.displayFileFields(fields1Container, this.currentData1.fields, comparisonResult);
        this.displayFileFields(fields2Container, this.currentData2.fields, comparisonResult);

        // Mostrar sección de diferencias detalladas
        if (summary.differences > 0) {
            differencesSection.classList.remove('hidden');
            this.displayDifferences(differencesList, comparisonResult);
        } else {
            differencesSection.classList.add('hidden');
        }

        resultsSection.classList.remove('hidden');
        
        // Actualizar estadísticas
        this.updateStatistics(comparisonResult);
    }

    displayFileFields(container, fields, comparisonResult) {
        container.innerHTML = '';
        const { differences, matches } = comparisonResult;

        if (Object.keys(fields).length === 0) {
            container.innerHTML = '<p class="no-fields">No se encontraron campos en este documento</p>';
            return;
        }

        Object.entries(fields).forEach(([fieldType, fieldData]) => {
            const isDifferent = differences.some(diff => diff.field === fieldType);
            const isMatch = matches.some(match => match.field === fieldType);
            
            const fieldElement = document.createElement('div');
            fieldElement.className = `field-item ${isDifferent ? 'different' : isMatch ? 'match' : ''}`;
            
            // Icono según el estado del campo
            const statusIcon = isDifferent ? '❌' : isMatch ? '✅' : '📝';
            const confidenceText = fieldData.confidence ? ` (${Math.round(fieldData.confidence * 100)}%)` : '';
            
            fieldElement.innerHTML = `
                <div class="field-header">
                    <span class="field-status">${statusIcon}</span>
                    <span class="field-label">${fieldData.label || fieldType}</span>
                    <span class="field-confidence">${confidenceText}</span>
                </div>
                <div class="field-value">${fieldData.value || 'Sin valor'}</div>
                <div class="field-meta">
                    <small>Página ${fieldData.page || 'N/A'} • ${fieldData.source || 'Desconocido'}</small>
                </div>
            `;
            
            container.appendChild(fieldElement);
        });
    }

    displayDifferences(container, comparisonResult) {
        container.innerHTML = '';
        
        // Mostrar resumen de diferencias
        const summaryElement = document.createElement('div');
        summaryElement.className = 'differences-summary';
        summaryElement.innerHTML = `
            <div class="summary-stats">
                <div class="stat-item">
                    <span class="stat-icon">📊</span>
                    <span class="stat-text">Total: ${comparisonResult.summary.totalComparisons} campos</span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">✅</span>
                    <span class="stat-text">Coincidentes: ${comparisonResult.summary.exactMatches}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">❌</span>
                    <span class="stat-text">Diferentes: ${comparisonResult.summary.differences}</span>
                </div>
            </div>
        `;
        container.appendChild(summaryElement);
        
        comparisonResult.differences.forEach(diff => {
            const diffElement = document.createElement('div');
            diffElement.className = 'difference-item';
            
            const severityIcon = diff.severity === 'high' ? '🔴' : diff.severity === 'medium' ? '🟡' : '🟢';
            const severityText = diff.severity === 'high' ? 'Alta' : diff.severity === 'medium' ? 'Media' : 'Baja';
            
            diffElement.innerHTML = `
                <div class="difference-header">
                    <span class="difference-field">${diff.label || diff.field}</span>
                    <span class="difference-severity">${severityIcon} ${severityText}</span>
                </div>
                <div class="difference-values">
                    <div class="difference-value">
                        <div class="difference-value-label">${diff.file1}</div>
                        <div class="difference-value-text">${diff.value1}</div>
                    </div>
                    <div class="difference-value">
                        <div class="difference-value-label">${diff.file2}</div>
                        <div class="difference-value-text">${diff.value2}</div>
                    </div>
                </div>
            `;
            
            container.appendChild(diffElement);
        });
        
        // Mostrar campos faltantes si los hay
        if (comparisonResult.missingInFile1.length > 0 || comparisonResult.missingInFile2.length > 0) {
            const missingSection = document.createElement('div');
            missingSection.className = 'missing-fields-section';
            missingSection.innerHTML = '<h5>📋 Campos Faltantes</h5>';
            
            [...comparisonResult.missingInFile1, ...comparisonResult.missingInFile2].forEach(missing => {
                const missingElement = document.createElement('div');
                missingElement.className = 'missing-field-item';
                missingElement.innerHTML = `
                    <div class="missing-field-info">
                        <span class="missing-icon">📝</span>
                        <span class="missing-text">Solo en ${missing.file}: ${missing.label} = "${missing.value}"</span>
                    </div>
                `;
                missingSection.appendChild(missingElement);
            });
            
            container.appendChild(missingSection);
        }
    }

    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.add('hidden');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab content
        document.getElementById(`${tabName}Tab`).classList.remove('hidden');
        
        // Add active class to selected tab button
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Load specific content based on tab
        if (tabName === 'reports') {
            this.loadReports();
        } else if (tabName === 'chat') {
            this.loadChatMessages();
        }
    }

    loadReports() {
        const activities = window.database.getActivities();
        const stats = window.database.getStatistics();
        
        // Update statistics display
        document.getElementById('totalComparisons').textContent = stats.totalComparisons;
        document.getElementById('successfulMatches').textContent = stats.successfulMatches;
        document.getElementById('foundDifferences').textContent = stats.foundDifferences;
        document.getElementById('activeUsers').textContent = stats.activeUsers;
        
        // Update activities list
        const activitiesList = document.getElementById('recentActivity');
        activitiesList.innerHTML = '';
        
        if (activities.length === 0) {
            activitiesList.innerHTML = '<p class="no-activities">No hay actividades registradas</p>';
            return;
        }
        
        activities.forEach(activity => {
            const activityElement = document.createElement('div');
            activityElement.className = 'activity-item';
            
            const icon = this.getActivityIcon(activity.type);
            const time = new Date(activity.timestamp).toLocaleString();
            
            activityElement.innerHTML = `
                <div class="activity-icon">${icon}</div>
                <div class="activity-content">
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-time">${time}</div>
                </div>
            `;
            
            activitiesList.appendChild(activityElement);
        });
    }

    getActivityIcon(type) {
        const icons = {
            'file_upload': '📁',
            'comparison': '🔍',
            'report_download': '📄',
            'comparison_saved': '💾',
            'perfect_match': '✅',
            'differences_found': '⚠️',
            'alert_sent': '🚨'
        };
        return icons[type] || '📝';
    }

    async downloadReport() {
        try {
            if (!this.currentComparisonResult) {
                window.notifications.showToast('No hay resultados de comparación para descargar', 'error');
                return;
            }

            window.notifications.showToast('Generando reporte PDF...', 'info', '📄 Generando Reporte');
            
            // Generar reporte PDF usando el procesador
            const pdfDoc = await window.pdfProcessor.generateComparisonReport(this.currentComparisonResult);
            
            // Descargar el archivo
            const fileName = `reporte_comparacion_${new Date().toISOString().slice(0, 10)}.pdf`;
            pdfDoc.save(fileName);
            
            window.notifications.showToast(
                `Reporte "${fileName}" descargado exitosamente`,
                'success',
                '📥 Descarga Completa',
                6000
            );
            
            // Registrar actividad
            window.database.addActivity({
                type: 'report_download',
                description: `Reporte PDF descargado: ${fileName}`,
                details: {
                    file1: this.currentComparisonResult.file1,
                    file2: this.currentComparisonResult.file2,
                    matchPercentage: this.currentComparisonResult.summary.matchPercentage
                }
            });
            
        } catch (error) {
            console.error('Error generando reporte:', error);
            window.notifications.showToast(
                `Error al generar el reporte: ${error.message}`,
                'error',
                '❌ Error de Generación'
            );
        }
    }

    saveResult() {
        try {
            if (!this.currentComparisonResult) {
                window.notifications.showToast('No hay resultados para guardar', 'error');
                return;
            }
            
            const savedResults = JSON.parse(localStorage.getItem('trazability_saved_results') || '[]');
            const resultToSave = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                ...this.currentComparisonResult
            };
            
            savedResults.unshift(resultToSave);
            
            // Mantener solo los últimos 50 resultados
            if (savedResults.length > 50) {
                savedResults.splice(50);
            }
            
            localStorage.setItem('trazability_saved_results', JSON.stringify(savedResults));
            window.notifications.showToast('Resultado guardado exitosamente', 'success');
            
            // Registrar actividad
            window.database.addActivity({
                type: 'comparison_saved',
                description: `Resultado de comparación guardado`,
                details: {
                    file1: this.currentComparisonResult.file1,
                    file2: this.currentComparisonResult.file2,
                    matchPercentage: this.currentComparisonResult.summary.matchPercentage,
                    differences: this.currentComparisonResult.summary.differences
                }
            });
            
        } catch (error) {
            console.error('Error guardando resultado:', error);
            window.notifications.showToast('Error al guardar el resultado', 'error');
        }
    }

    newComparison() {
        // Reset file inputs
        document.getElementById('fileInput1').value = '';
        document.getElementById('fileInput2').value = '';
        
        // Reset displays
        document.getElementById('processing1').classList.add('hidden');
        document.getElementById('processing2').classList.add('hidden');
        document.getElementById('fileInfo1').classList.add('hidden');
        document.getElementById('fileInfo2').classList.add('hidden');
        
        // Show drop content again
        document.querySelector('#dropZone1 .drop-content').style.display = 'block';
        document.querySelector('#dropZone2 .drop-content').style.display = 'block';
        
        // Hide results
        document.getElementById('resultsSection').classList.add('hidden');
        
        // Reset buttons
        document.getElementById('compareBtn').disabled = true;
        document.getElementById('compareBtn').innerHTML = '<span class="btn-icon">⚡</span><span class="btn-text">Selecciona ambos archivos</span>';
        
        // Clear data
        this.currentData1 = null;
        this.currentData2 = null;
        this.currentComparisonResult = null;
        
        window.notifications.showToast('Listo para nueva comparación', 'info');
        
        // Limpiar alertas si no hay diferencias pendientes
        window.notifications.clearAlerts();
    }

    loadChatMessages() {
        const chatMessages = document.getElementById('chatMessages');
        const messages = window.database.getChatMessages();
        
        chatMessages.innerHTML = '';
        
        if (messages.length === 0) {
            chatMessages.innerHTML = '<p class="no-messages">No hay mensajes en el chat</p>';
            return;
        }
        
        messages.forEach(message => {
            this.addChatMessage(message, false);
        });
    }

    updateStatistics(comparisonResult) {
        // Actualizar estadísticas en tiempo real
        const stats = window.database.getStatistics();
        
        // Incrementar contadores
        stats.totalComparisons++;
        if (comparisonResult.summary.matchPercentage === 100) {
            stats.successfulMatches++;
        }
        if (comparisonResult.summary.differences > 0) {
            stats.foundDifferences += comparisonResult.summary.differences;
        }
        
        // Guardar estadísticas actualizadas
        window.database.updateStatistics(stats);
        
        // Actualizar UI de reportes si está visible
        if (document.getElementById('reportsTab').classList.contains('active')) {
            this.loadReports();
        }
    }

    // Chat functionality
    addChatMessage(message, saveToDb = true) {
        const chatMessages = document.getElementById('chatMessages');
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender === 'Usuario' ? 'own' : message.type === 'system' ? 'system' : message.type === 'alert' ? 'alert system' : ''}`;
        
        messageElement.innerHTML = `
            <div class="message-content">
                ${message.sender !== 'Sistema' ? `<div class="message-header">${message.sender}</div>` : ''}
                <div class="message-text">${message.text}</div>
                <div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Guardar mensaje en la base de datos
        if (saveToDb) {
            window.database.addChatMessage(message);
        }
    }

    sendChatMessage() {
        const chatInput = document.getElementById('messageInput');
        const messageText = chatInput.value.trim();
        
        if (!messageText) return;
        
        const message = {
            sender: 'Usuario',
            text: messageText,
            timestamp: new Date().toISOString(),
            type: 'user'
        };
        
        this.addChatMessage(message);
        chatInput.value = '';
        
        // Simulate response (in a real app, this would be handled by a backend)
        setTimeout(() => {
            const response = {
                sender: 'Sistema',
                text: 'Mensaje recibido. El sistema está monitoreando las comparaciones.',
                timestamp: new Date().toISOString(),
                type: 'system'
            };
            this.addChatMessage(response);
        }, 1000);
    }
}

// Initialize UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.uiManager = new UIManager();
});