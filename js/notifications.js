class NotificationSystem {
    constructor() {
        this.toastContainer = document.getElementById('toastContainer');
        this.alertBadge = document.getElementById('alertBadge');
        this.alertCount = document.getElementById('alertCount');
        this.currentAlerts = 0;
        
        this.init();
    }

    init() {
        // Solicitar permisos para notificaciones del navegador
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    showToast(message, type = 'info', title = '', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const toastId = 'toast_' + Date.now();
        toast.id = toastId;
        
        toast.innerHTML = `
            <div class="toast-header">
                <span class="toast-title">${title || this.getDefaultTitle(type)}</span>
                <button class="toast-close" onclick="window.notifications.closeToast('${toastId}')">&times;</button>
            </div>
            <div class="toast-message">${message}</div>
        `;
        
        this.toastContainer.appendChild(toast);
        
        // Auto-cerrar después del tiempo especificado
        setTimeout(() => {
            this.closeToast(toastId);
        }, duration);
        
        return toastId;
    }

    closeToast(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }

    getDefaultTitle(type) {
        const titles = {
            success: '✅ Éxito',
            error: '❌ Error',
            warning: '⚠️ Advertencia',
            info: 'ℹ️ Información'
        };
        return titles[type] || 'Notificación';
    }

    // Notificación específica para coincidencia 100%
    showPerfectMatch(file1, file2) {
        const message = `Los documentos "${file1}" y "${file2}" coinciden al 100%. Todos los campos son idénticos.`;
        
        this.showToast(message, 'success', '🎉 Coincidencia Perfecta', 8000);
        
        // Notificación del navegador
        this.showBrowserNotification(
            '🎉 Coincidencia Perfecta',
            `Los documentos coinciden al 100%`,
            'success'
        );
        
        // Agregar al chat interno
        this.addSystemMessage(`🎉 COINCIDENCIA PERFECTA: Los documentos "${file1}" y "${file2}" son idénticos.`, 'success');
    }

    // Notificación específica para diferencias encontradas
    showDifferencesFound(comparisonResult) {
        const { file1, file2, summary } = comparisonResult;
        const message = `Se encontraron ${summary.differences} diferencias entre "${file1}" y "${file2}". Coincidencia: ${summary.matchPercentage}%`;
        
        this.showToast(message, 'error', '⚠️ Diferencias Encontradas', 10000);
        
        // Notificación del navegador
        this.showBrowserNotification(
            '⚠️ Diferencias Encontradas',
            `${summary.differences} campos diferentes (${summary.matchPercentage}% coincidencia)`,
            'warning'
        );
        
        // Incrementar contador de alertas
        this.incrementAlertCount();
        
        // Agregar al chat interno con detalles
        this.addSystemMessage(
            `🚨 DIFERENCIAS DETECTADAS: ${summary.differences} campos diferentes entre "${file1}" y "${file2}". Coincidencia: ${summary.matchPercentage}%`,
            'alert'
        );
        
        // Enviar alertas a usuarios registrados
        this.sendUserAlerts(comparisonResult);
    }

    // Enviar alertas a todos los usuarios registrados
    async sendUserAlerts(comparisonResult) {
        try {
            const users = window.database.getUsers();
            const { file1, file2, summary, differences } = comparisonResult;
            
            if (users.length === 0) {
                console.warn('⚠️ No hay usuarios registrados para enviar alertas');
                return;
            }

            // Crear mensaje detallado para usuarios
            const alertMessage = this.createDetailedAlertMessage(comparisonResult);
            
            // Simular envío de WhatsApp y Email a cada usuario
            for (const user of users) {
                await this.simulateWhatsAppAlert(user, alertMessage);
                await this.simulateEmailAlert(user, alertMessage);
                
                // Agregar mensaje al chat interno
                this.addSystemMessage(
                    `📱 Alerta enviada a ${user.name} (${user.whatsapp} / ${user.email})`,
                    'info'
                );
            }
            
            this.showToast(
                `Alertas enviadas a ${users.length} usuarios registrados`,
                'info',
                '📢 Alertas Enviadas',
                6000
            );
            
        } catch (error) {
            console.error('❌ Error enviando alertas:', error);
            this.showToast('Error al enviar alertas a usuarios', 'error');
        }
    }

    createDetailedAlertMessage(comparisonResult) {
        const { file1, file2, summary, differences } = comparisonResult;
        
        let message = `🚨 ALERTA TRAZABILITY AI\n\n`;
        message += `📄 Documentos comparados:\n`;
        message += `• ${file1}\n`;
        message += `• ${file2}\n\n`;
        message += `📊 Resultado:\n`;
        message += `• Coincidencia: ${summary.matchPercentage}%\n`;
        message += `• Diferencias encontradas: ${summary.differences}\n\n`;
        
        if (differences.length > 0) {
            message += `❌ Campos con diferencias:\n`;
            differences.slice(0, 5).forEach(diff => {
                message += `• ${diff.label || diff.field}\n`;
                message += `  ${file1}: "${diff.value1}"\n`;
                message += `  ${file2}: "${diff.value2}"\n\n`;
            });
            
            if (differences.length > 5) {
                message += `... y ${differences.length - 5} diferencias más.\n\n`;
            }
        }
        
        message += `🕐 Fecha: ${new Date().toLocaleString()}\n`;
        message += `🔗 Revisa el sistema para más detalles.`;
        
        return message;
    }

    async simulateWhatsAppAlert(user, message) {
        return new Promise(resolve => {
            setTimeout(() => {
                console.log(`📱 WhatsApp enviado a ${user.name} (${user.whatsapp}):`);
                console.log(message);
                resolve();
            }, 500);
        });
    }

    async simulateEmailAlert(user, message) {
        return new Promise(resolve => {
            setTimeout(() => {
                console.log(`📧 Email enviado a ${user.name} (${user.email}):`);
                console.log(`Asunto: 🚨 ALERTA TRAZABILITY AI - Diferencias Detectadas`);
                console.log(message);
                resolve();
            }, 300);
        });
    }

    showBrowserNotification(title, body, type = 'info') {
        if ('Notification' in window && Notification.permission === 'granted') {
            const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌';
            
            new Notification(`${icon} ${title}`, {
                body: body,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: 'trazability-alert',
                requireInteraction: type === 'warning' || type === 'error'
            });
        }
    }

    incrementAlertCount() {
        this.currentAlerts++;
        this.alertCount.textContent = this.currentAlerts;
        this.alertBadge.classList.remove('hidden');
    }

    clearAlerts() {
        this.currentAlerts = 0;
        this.alertBadge.classList.add('hidden');
    }

    addSystemMessage(message, type = 'system') {
        // Agregar mensaje al chat interno
        if (window.ui && window.ui.addChatMessage) {
            window.ui.addChatMessage({
                text: message,
                sender: 'Sistema',
                timestamp: new Date().toISOString(),
                type: type
            });
        }
    }
}

// Hacer disponible globalmente
window.NotificationSystem = NotificationSystem;
window.notifications = new NotificationSystem();

// Agregar estilos para animación de salida
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);