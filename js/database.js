class DatabaseManager {
    constructor() {
        this.initializeDatabase();
    }

    initializeDatabase() {
        // Initialize with default data if needed
        if (!localStorage.getItem('trazability_activities')) {
            localStorage.setItem('trazability_activities', JSON.stringify([]));
        }
        
        if (!localStorage.getItem('trazability_statistics')) {
            const defaultStats = {
                totalComparisons: 0,
                successfulMatches: 0,
                foundDifferences: 0,
                activeUsers: 1
            };
            localStorage.setItem('trazability_statistics', JSON.stringify(defaultStats));
        }
    }

    addActivity(activity) {
        const activities = this.getActivities();
        const newActivity = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...activity
        };
        activities.unshift(newActivity);
        
        // Mantener solo las últimas 100 actividades
        if (activities.length > 100) {
            activities.splice(100);
        }
        
        localStorage.setItem('trazability_activities', JSON.stringify(activities));
        return newActivity;
    }

    getActivities() {
        try {
            return JSON.parse(localStorage.getItem('trazability_activities') || '[]');
        } catch {
            return [];
        }
    }

    addChatMessage(message) {
        const messages = this.getChatMessages();
        const newMessage = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...message
        };
        messages.push(newMessage);
        
        // Mantener solo los últimos 500 mensajes
        if (messages.length > 500) {
            messages.splice(0, messages.length - 500);
        }
        
        localStorage.setItem('trazability_chat', JSON.stringify(messages));
        return newMessage;
    }

    getChatMessages() {
        try {
            return JSON.parse(localStorage.getItem('trazability_chat') || '[]');
        } catch {
            return [];
        }
    }

    updateStatistics(stats) {
        localStorage.setItem('trazability_statistics', JSON.stringify(stats));
    }

    getStatistics() {
        try {
            const defaultStats = {
                totalComparisons: 0,
                successfulMatches: 0,
                foundDifferences: 0,
                activeUsers: 0
            };
            
            const stored = localStorage.getItem('trazability_statistics');
            return stored ? { ...defaultStats, ...JSON.parse(stored) } : defaultStats;
        } catch {
            return {
                totalComparisons: 0,
                successfulMatches: 0,
                foundDifferences: 0,
                activeUsers: 0
            };
        }
    }

    clearAllData() {
        localStorage.removeItem('trazability_activities');
        localStorage.removeItem('trazability_statistics');
        localStorage.removeItem('trazability_saved_results');
        localStorage.removeItem('trazability_chat');
        this.initializeDatabase();
    }
}

// Initialize database when script loads
window.database = new DatabaseManager();