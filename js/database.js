@@ .. @@
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

+    addChatMessage(message) {
+        const messages = this.getChatMessages();
+        const newMessage = {
+            id: Date.now(),
+            timestamp: new Date().toISOString(),
+            ...message
+        };
+        messages.push(newMessage);
+        
+        // Mantener solo los últimos 500 mensajes
+        if (messages.length > 500) {
+            messages.splice(0, messages.length - 500);
+        }
+        
+        localStorage.setItem('trazability_chat', JSON.stringify(messages));
+        return newMessage;
+    }
+
+    getChatMessages() {
+        try {
+            return JSON.parse(localStorage.getItem('trazability_chat') || '[]');
+        } catch {
+            return [];
+        }
+    }
+
+    updateStatistics(stats) {
+        localStorage.setItem('trazability_statistics', JSON.stringify(stats));
+    }
+
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

@@ .. @@