# TRAZABILITY AI - Sistema de Comparación de PDFs

Sistema completo desarrollado en **JavaScript vanilla** para comparar formularios PDF y detectar diferencias automáticamente.

## 🚀 Características

- ✅ **JavaScript Vanilla**: Sin frameworks, funciona en cualquier navegador moderno
- 📄 **Procesamiento de PDF**: Extrae y compara campos de formularios PDF
- 🤖 **IA Integrada**: Algoritmos inteligentes para identificar campos y diferencias
- 🔔 **Sistema de Alertas**: Notificaciones automáticas por WhatsApp y Email (simulado)
- 💬 **Chat Interno**: Sistema de mensajería para el equipo
- 👥 **Gestión de Usuarios**: Administración completa de usuarios autorizados
- 📊 **Reportes**: Estadísticas y actividad en tiempo real
- 🌐 **Integración Web**: Fácil integración en proyectos existentes

## 🛠️ Instalación

### Opción 1: Servidor Local Simple
```bash
# Clonar o descargar los archivos
# Abrir index.html directamente en el navegador
```

### Opción 2: Servidor HTTP
```bash
# Con Python
python -m http.server 8000

# Con Node.js (si tienes http-server instalado)
npx http-server -p 8000

# Con PHP
php -S localhost:8000
```

### Opción 3: Integración en Proyecto Existente
```html
<!-- Incluir en tu HTML existente -->
<link rel="stylesheet" href="path/to/styles.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="path/to/js/database.js"></script>
<script src="path/to/js/pdfProcessor.js"></script>
<script src="path/to/js/notifications.js"></script>
<script src="path/to/js/ui.js"></script>
<script src="path/to/js/app.js"></script>
```

## 📁 Estructura del Proyecto

```
trazability-ai/
├── index.html          # Página principal
├── styles.css          # Estilos CSS
├── js/
│   ├── app.js          # Aplicación principal
│   ├── database.js     # Sistema de base de datos local
│   ├── pdfProcessor.js # Procesador de PDFs
│   ├── notifications.js # Sistema de notificaciones
│   └── ui.js           # Controlador de interfaz
├── package.json        # Configuración del proyecto
└── README.md          # Documentación
```

## 🔧 Configuración

### Variables de Configuración
El sistema se configura automáticamente, pero puedes modificar:

```javascript
// En js/app.js
window.TRAZABILITY_CONFIG = {
    limits: {
        maxFileSize: 10 * 1024 * 1024, // 10MB máximo
        maxPages: 10,                   // 10 páginas máximo
        timeout: 30000                  // 30 segundos timeout
    }
};
```

### Personalización de Campos PDF
Modifica los patrones en `js/pdfProcessor.js`:

```javascript
const patterns = {
    nombre: /(?:nombre|name|apellido)[\s:]*([A-Za-zÀ-ÿ\s]{2,50})/i,
    documento: /(?:documento|dni|cedula)[\s:]*([0-9.-]{6,15})/i,
    // Agregar más patrones según necesidades
};
```

## 🚀 Uso

### 1. Comparación de PDFs
1. Sube dos archivos PDF en la pestaña "Comparación PDF"
2. Haz clic en "Comparar Documentos"
3. Revisa los resultados y diferencias encontradas
4. Descarga el reporte o guarda los resultados

### 2. Gestión de Usuarios
1. Ve a la pestaña "Usuarios"
2. Agrega usuarios que recibirán alertas
3. Configura WhatsApp y Email para notificaciones

### 3. Chat Interno
1. Usa la pestaña "Chat Interno" para comunicación del equipo
2. Las alertas automáticas aparecen aquí
3. Historial completo de actividad

### 4. Reportes
1. Revisa estadísticas en la pestaña "Reportes"
2. Actividad reciente y métricas del sistema

## 🔌 Integración en Proyectos Existentes

### Integración Básica
```html
<!-- Contenedor para la aplicación -->
<div id="trazability-container"></div>

<!-- Scripts necesarios -->
<script src="js/database.js"></script>
<script src="js/pdfProcessor.js"></script>
<script>
    // Inicializar solo el procesador
    const processor = new PDFProcessor();
    
    // Usar en tu código
    async function comparePDFs(file1, file2) {
        const fields1 = await processor.extractPDFFields(file1);
        const fields2 = await processor.extractPDFFields(file2);
        return processor.comparePDFFields(fields1, fields2);
    }
</script>
```

### API Programática
```javascript
// Acceder a las funciones principales
const comparison = await window.pdfProcessor.extractPDFFields(pdfFile);
const result = window.pdfProcessor.comparePDFFields(fields1, fields2);
const users = window.database.getUsers();
window.notifications.showToast('Mensaje', 'success');
```

## 🌐 Despliegue

### Netlify
1. Sube todos los archivos a Netlify
2. Configura como sitio estático
3. ¡Listo!

### Vercel
1. Conecta tu repositorio
2. Configura como sitio estático
3. Deploy automático

### Servidor Propio
1. Sube archivos a tu servidor web
2. Asegúrate de que los archivos JS se sirvan correctamente
3. Configura HTTPS para notificaciones del navegador

## 🔧 Personalización

### Cambiar Colores
Modifica las variables CSS en `styles.css`:
```css
:root {
    --primary-color: #dc2626;    /* Rojo principal */
    --background-dark: #000000;  /* Fondo oscuro */
    /* ... más variables */
}
```

### Agregar Nuevos Campos PDF
En `js/pdfProcessor.js`, agrega patrones:
```javascript
const patterns = {
    // Campos existentes...
    nuevo_campo: /(?:nuevo|field)[\s:]*([A-Za-z0-9\s]{2,50})/i,
};
```

### Personalizar Notificaciones
En `js/notifications.js`, modifica los mensajes:
```javascript
const message = `🚨 TU MENSAJE PERSONALIZADO: ${details}`;
```

## 📱 Funcionalidades Avanzadas

### Atajos de Teclado
- `Ctrl+1-4`: Cambiar entre pestañas
- `Ctrl+Shift+D`: Exportar datos
- `Ctrl+Shift+R`: Limpiar datos

### Comandos de Debug
```javascript
// En la consola del navegador
TRAZABILITY_DEBUG.getStatus();     // Estado del sistema
TRAZABILITY_DEBUG.exportData();    // Exportar datos
TRAZABILITY_DEBUG.testNotification(); // Probar notificación
```

## 🔒 Seguridad

- ✅ Procesamiento local de PDFs (no se envían a servidores)
- ✅ Datos almacenados localmente en el navegador
- ✅ Sin dependencias externas críticas
- ✅ Funciona offline después de la carga inicial

## 🐛 Solución de Problemas

### PDF no se procesa
1. Verifica que el archivo sea un PDF válido
2. Comprueba el tamaño (máximo 10MB)
3. Revisa la consola del navegador para errores

### Notificaciones no funcionan
1. Permite notificaciones en el navegador
2. Verifica que hay usuarios registrados
3. Revisa la consola para errores de permisos

### Datos no se guardan
1. Verifica que localStorage esté habilitado
2. Comprueba el espacio disponible
3. Revisa la consola para errores

## 📞 Soporte

Para soporte técnico o consultas:
- Revisa la consola del navegador para errores
- Usa `TRAZABILITY_DEBUG.getStatus()` para diagnóstico
- Verifica que todas las dependencias estén cargadas

## 📄 Licencia

MIT License - Libre para uso comercial y personal.

---

**TRAZABILITY AI v2.0** - Sistema de comparación de PDFs con JavaScript vanilla