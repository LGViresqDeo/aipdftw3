@@ .. @@
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

-        // Mostrar resultado basado en el porcentaje de coincidencia
-        if (comparisonResult.summary.matchPercentage === 100) {
+        const { summary } = comparisonResult;
+        
+        // Determinar el resultado y mostrar notificaciones apropiadas
+        if (summary.matchPercentage === 100) {
             resultIcon.textContent = '✅';
-            resultTitle.textContent = 'Documentos Idénticos';
-            resultDescription.textContent = 'Los documentos coinciden al 100%. Todos los campos son iguales.';
+            resultTitle.textContent = '🎉 Coincidencia Perfecta - 100%';
+            resultDescription.textContent = 'Los documentos son completamente idénticos. Todos los campos coinciden exactamente.';
             resultIcon.style.color = '#10b981';
+            
+            // Mostrar notificación de coincidencia perfecta
+            window.notifications.showPerfectMatch(comparisonResult.file1, comparisonResult.file2);
         } else {
             resultIcon.textContent = '⚠️';
-            resultTitle.textContent = 'Diferencias Encontradas';
-            resultDescription.textContent = `Los documentos coinciden en un ${comparisonResult.summary.matchPercentage}%. Se encontraron ${comparisonResult.summary.differences} diferencias.`;
+            resultTitle.textContent = `⚠️ Diferencias Detectadas - ${summary.matchPercentage}%`;
+            resultDescription.textContent = `Se encontraron ${summary.differences} diferencias entre los documentos. Coincidencia: ${summary.matchPercentage}%`;
             resultIcon.style.color = '#ef4444';
+            
+            // Mostrar notificación de diferencias y enviar alertas
+            window.notifications.showDifferencesFound(comparisonResult);
         }

@@ .. @@
         fileName1.textContent = comparisonResult.file1;
         fileName2.textContent = comparisonResult.file2;

-        // Mostrar campos de ambos archivos
-        this.displayFileFields(fields1Container, this.currentData1.fields, comparisonResult.differences);
-        this.displayFileFields(fields2Container, this.currentData2.fields, comparisonResult.differences);
+        // Mostrar campos de ambos archivos con indicadores de diferencias
+        this.displayFileFields(fields1Container, this.currentData1.fields, comparisonResult);
+        this.displayFileFields(fields2Container, this.currentData2.fields, comparisonResult);

-        // Mostrar diferencias si las hay
-        if (comparisonResult.differences.length > 0) {
+        // Mostrar sección de diferencias detalladas
+        if (summary.differences > 0) {
             differencesSection.classList.remove('hidden');
             this.displayDifferences(differencesList, comparisonResult);
         } else {
             differencesSection.classList.add('hidden');
         }

         resultsSection.classList.remove('hidden');
+        
+        // Actualizar estadísticas
+        this.updateStatistics(comparisonResult);
     }

-    displayFileFields(container, fields, differences) {
+    displayFileFields(container, fields, comparisonResult) {
         container.innerHTML = '';
+        const { differences, matches } = comparisonResult;

         if (Object.keys(fields).length === 0) {
             container.innerHTML = '<p class="no-fields">No se encontraron campos en este documento</p>';
             return;
         }

         Object.entries(fields).forEach(([fieldType, fieldData]) => {
-            const isDifferent = differences.some(diff => diff.field === fieldType);
+            const isDifferent = differences.some(diff => diff.field === fieldType);
+            const isMatch = matches.some(match => match.field === fieldType);
             
             const fieldElement = document.createElement('div');
-            fieldElement.className = `field-item ${isDifferent ? 'different' : ''}`;
+            fieldElement.className = `field-item ${isDifferent ? 'different' : isMatch ? 'match' : ''}`;
             
+            // Icono según el estado del campo
+            const statusIcon = isDifferent ? '❌' : isMatch ? '✅' : '📝';
+            const confidenceText = fieldData.confidence ? ` (${Math.round(fieldData.confidence * 100)}%)` : '';
+            
             fieldElement.innerHTML = `
-                <div class="field-label">${fieldData.label || fieldType}</div>
-                <div class="field-value">${fieldData.value || 'Sin valor'}</div>
+                <div class="field-header">
+                    <span class="field-status">${statusIcon}</span>
+                    <span class="field-label">${fieldData.label || fieldType}</span>
+                    <span class="field-confidence">${confidenceText}</span>
+                </div>
+                <div class="field-value">${fieldData.value || 'Sin valor'}</div>
+                <div class="field-meta">
+                    <small>Página ${fieldData.page || 'N/A'} • ${fieldData.source || 'Desconocido'}</small>
+                </div>
             `;
             
             container.appendChild(fieldElement);
         });
     }

     displayDifferences(container, comparisonResult) {
         container.innerHTML = '';
         
+        // Mostrar resumen de diferencias
+        const summaryElement = document.createElement('div');
+        summaryElement.className = 'differences-summary';
+        summaryElement.innerHTML = `
+            <div class="summary-stats">
+                <div class="stat-item">
+                    <span class="stat-icon">📊</span>
+                    <span class="stat-text">Total: ${comparisonResult.summary.totalComparisons} campos</span>
+                </div>
+                <div class="stat-item">
+                    <span class="stat-icon">✅</span>
+                    <span class="stat-text">Coincidentes: ${comparisonResult.summary.exactMatches}</span>
+                </div>
+                <div class="stat-item">
+                    <span class="stat-icon">❌</span>
+                    <span class="stat-text">Diferentes: ${comparisonResult.summary.differences}</span>
+                </div>
+            </div>
+        `;
+        container.appendChild(summaryElement);
+        
         comparisonResult.differences.forEach(diff => {
             const diffElement = document.createElement('div');
             diffElement.className = 'difference-item';
             
+            const severityIcon = diff.severity === 'high' ? '🔴' : diff.severity === 'medium' ? '🟡' : '🟢';
+            const severityText = diff.severity === 'high' ? 'Alta' : diff.severity === 'medium' ? 'Media' : 'Baja';
+            
             diffElement.innerHTML = `
-                <div class="difference-field">${diff.label || diff.field}</div>
+                <div class="difference-header">
+                    <span class="difference-field">${diff.label || diff.field}</span>
+                    <span class="difference-severity">${severityIcon} ${severityText}</span>
+                </div>
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
+        
+        // Mostrar campos faltantes si los hay
+        if (comparisonResult.missingInFile1.length > 0 || comparisonResult.missingInFile2.length > 0) {
+            const missingSection = document.createElement('div');
+            missingSection.className = 'missing-fields-section';
+            missingSection.innerHTML = '<h5>📋 Campos Faltantes</h5>';
+            
+            [...comparisonResult.missingInFile1, ...comparisonResult.missingInFile2].forEach(missing => {
+                const missingElement = document.createElement('div');
+                missingElement.className = 'missing-field-item';
+                missingElement.innerHTML = `
+                    <div class="missing-field-info">
+                        <span class="missing-icon">📝</span>
+                        <span class="missing-text">Solo en ${missing.file}: ${missing.label} = "${missing.value}"</span>
+                    </div>
+                `;
+                missingSection.appendChild(missingElement);
+            });
+            
+            container.appendChild(missingSection);
+        }
     }

@@ .. @@
     }

     async downloadReport() {
         try {
             if (!this.currentComparisonResult) {
                window.notifications.showToast('No hay resultados de comparación para descargar', 'error');
                return;
             }

-            // Aquí implementarías la generación del reporte PDF
-            window.notifications.showToast('Generando reporte PDF...', 'info');
+            window.notifications.showToast('Generando reporte PDF...', 'info', '📄 Generando Reporte');
             
-            // Simular generación de reporte
-            setTimeout(() => {
-                window.notifications.showToast('Reporte PDF generado exitosamente', 'success');
-            }, 2000);
+            // Generar reporte PDF usando el procesador
+            const pdfDoc = await window.pdfProcessor.generateComparisonReport(this.currentComparisonResult);
+            
+            // Descargar el archivo
+            const fileName = `reporte_comparacion_${new Date().toISOString().slice(0, 10)}.pdf`;
+            pdfDoc.save(fileName);
+            
+            window.notifications.showToast(
+                `Reporte "${fileName}" descargado exitosamente`,
+                'success',
+                '📥 Descarga Completa',
+                6000
+            );
+            
+            // Registrar actividad
+            window.database.addActivity({
+                type: 'report_download',
+                description: `Reporte PDF descargado: ${fileName}`,
+                details: {
+                    file1: this.currentComparisonResult.file1,
+                    file2: this.currentComparisonResult.file2,
+                    matchPercentage: this.currentComparisonResult.summary.matchPercentage
+                }
+            });
             
         } catch (error) {
             console.error('Error generando reporte:', error);
-            window.notifications.showToast('Error al generar el reporte', 'error');
+            window.notifications.showToast(
+                `Error al generar el reporte: ${error.message}`,
+                'error',
+                '❌ Error de Generación'
+            );
         }
     }

@@ .. @@
             window.notifications.showToast('Resultado guardado exitosamente', 'success');
+            
+            // Registrar actividad
+            window.database.addActivity({
+                type: 'comparison_saved',
+                description: `Resultado de comparación guardado`,
+                details: {
+                    file1: this.currentComparisonResult.file1,
+                    file2: this.currentComparisonResult.file2,
+                    matchPercentage: this.currentComparisonResult.summary.matchPercentage,
+                    differences: this.currentComparisonResult.summary.differences
+                }
+            });
             
         } catch (error) {
             console.error('Error guardando resultado:', error);
             window.notifications.showToast('Error al guardar el resultado', 'error');
         }
     }

@@ .. @@
         this.currentData2 = null;
         this.currentComparisonResult = null;
         
         window.notifications.showToast('Listo para nueva comparación', 'info');
+        
+        // Limpiar alertas si no hay diferencias pendientes
+        window.notifications.clearAlerts();
     }

@@ .. @@
         }
     }

+    updateStatistics(comparisonResult) {
+        // Actualizar estadísticas en tiempo real
+        const stats = window.database.getStatistics();
+        
+        // Incrementar contadores
+        stats.totalComparisons++;
+        if (comparisonResult.summary.matchPercentage === 100) {
+            stats.successfulMatches++;
+        }
+        if (comparisonResult.summary.differences > 0) {
+            stats.foundDifferences += comparisonResult.summary.differences;
+        }
+        
+        // Guardar estadísticas actualizadas
+        window.database.updateStatistics(stats);
+        
+        // Actualizar UI de reportes si está visible
+        if (document.getElementById('reportsTab').classList.contains('active')) {
+            this.loadReports();
+        }
+    }
+
     // Chat functionality
     addChatMessage(message) {
         const chatMessages = document.getElementById('chatMessages');
@@ .. @@
         
         const messageElement = document.createElement('div');
-        messageElement.className = `message ${message.sender === 'Usuario' ? 'own' : ''}`;
+        messageElement.className = `message ${message.sender === 'Usuario' ? 'own' : message.type === 'system' ? 'system' : message.type === 'alert' ? 'alert system' : ''}`;
         
         messageElement.innerHTML = `
             <div class="message-content">
-                <div class="message-header">${message.sender}</div>
+                ${message.sender !== 'Sistema' ? `<div class="message-header">${message.sender}</div>` : ''}
                 <div class="message-text">${message.text}</div>
                 <div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
             </div>
         `;
         
         chatMessages.appendChild(messageElement);
         chatMessages.scrollTop = chatMessages.scrollHeight;
+        
+        // Guardar mensaje en la base de datos
+        window.database.addChatMessage(message);
     }

@@ .. @@