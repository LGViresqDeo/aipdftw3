class PDFProcessor {
    constructor() {
        this.pdfjsLib = window['pdfjs-dist/build/pdf'];
        this.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        // Patrones mejorados para detectar campos de formularios
        this.fieldPatterns = {
            // Campos de identificación personal
            nombre: {
                labels: /(?:nombre|name|apellido|apellidos|full\s*name|primer\s*nombre|segundo\s*nombre)[\s:]*$/i,
                value: /^[\s]*([A-Za-zÀ-ÿ\u00f1\u00d1\s]{2,50})[\s]*$/,
                type: 'text'
            },
            documento: {
                labels: /(?:documento|dni|cedula|cédula|id|identification|passport|pasaporte|ci)[\s:]*$/i,
                value: /^[\s]*([0-9.-]{6,15})[\s]*$/,
                type: 'number'
            },
            email: {
                labels: /(?:email|e-mail|correo|mail)[\s:]*$/i,
                value: /^[\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})[\s]*$/,
                type: 'email'
            },
            telefono: {
                labels: /(?:teléfono|telefono|phone|celular|móvil|movil|tel)[\s:]*$/i,
                value: /^[\s]*([+]?[0-9\s()-]{7,20})[\s]*$/,
                type: 'phone'
            },
            fecha: {
                labels: /(?:fecha|date|nacimiento|birth|vencimiento|expiry|exp)[\s:]*$/i,
                value: /^[\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})[\s]*$/,
                type: 'date'
            },
            direccion: {
                labels: /(?:dirección|direccion|address|domicilio|residencia)[\s:]*$/i,
                value: /^[\s]*([A-Za-zÀ-ÿ\u00f1\u00d1\s0-9#,.-]{5,100})[\s]*$/,
                type: 'address'
            },
            codigo_postal: {
                labels: /(?:código\s*postal|codigo\s*postal|zip|postal\s*code|cp)[\s:]*$/i,
                value: /^[\s]*([0-9A-Z]{3,10})[\s]*$/,
                type: 'postal'
            },
            ciudad: {
                labels: /(?:ciudad|city|localidad|municipio)[\s:]*$/i,
                value: /^[\s]*([A-Za-zÀ-ÿ\u00f1\u00d1\s]{2,50})[\s]*$/,
                type: 'city'
            },
            pais: {
                labels: /(?:país|pais|country|nacionalidad)[\s:]*$/i,
                value: /^[\s]*([A-Za-zÀ-ÿ\u00f1\u00d1\s]{2,50})[\s]*$/,
                type: 'country'
            },
            profesion: {
                labels: /(?:profesión|profesion|occupation|trabajo|job|cargo|puesto)[\s:]*$/i,
                value: /^[\s]*([A-Za-zÀ-ÿ\u00f1\u00d1\s]{2,50})[\s]*$/,
                type: 'profession'
            },
            empresa: {
                labels: /(?:empresa|company|empleador|organización|organizacion)[\s:]*$/i,
                value: /^[\s]*([A-Za-zÀ-ÿ\u00f1\u00d1\s0-9&.,]{2,100})[\s]*$/,
                type: 'company'
            },
            salario: {
                labels: /(?:salario|salary|sueldo|ingreso|income|wage)[\s:]*$/i,
                value: /^[\s]*([0-9.,\$€£¥]{1,20})[\s]*$/,
                type: 'money'
            },
            genero: {
                labels: /(?:género|genero|gender|sexo|sex)[\s:]*$/i,
                value: /^[\s]*(masculino|femenino|male|female|m|f|hombre|mujer|otro|other)[\s]*$/i,
                type: 'gender'
            },
            estado_civil: {
                labels: /(?:estado\s*civil|marital\s*status|civil\s*status)[\s:]*$/i,
                value: /^[\s]*(soltero|casado|divorciado|viudo|single|married|divorced|widowed)[\s]*$/i,
                type: 'marital'
            }
        };
    }

    async extractPDFFields(file) {
        try {
            console.log('🔍 Iniciando extracción avanzada de campos PDF...');
            
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await this.pdfjsLib.getDocument(arrayBuffer).promise;
            
            const extractedData = {
                fileName: file.name,
                totalPages: pdf.numPages,
                fields: {},
                formFields: [],
                textContent: [],
                metadata: {
                    extractedAt: new Date().toISOString(),
                    processingTime: 0
                }
            };

            const startTime = Date.now();

            // Extraer campos de formulario si existen
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                
                // Extraer anotaciones (campos de formulario)
                const annotations = await page.getAnnotations();
                
                // Extraer contenido de texto
                const textContent = await page.getTextContent();
                
                // Procesar campos de formulario
                this.processFormFields(annotations, extractedData, pageNum);
                
                // Procesar contenido de texto para encontrar campos
                this.processTextContent(textContent, extractedData, pageNum);
            }

            // Analizar y estructurar los datos extraídos
            this.analyzeExtractedData(extractedData);
            
            extractedData.metadata.processingTime = Date.now() - startTime;
            
            console.log('✅ Extracción completada:', extractedData);
            return extractedData;
            
        } catch (error) {
            console.error('❌ Error en extracción PDF:', error);
            throw new Error(`Error al procesar PDF: ${error.message}`);
        }
    }

    processFormFields(annotations, extractedData, pageNum) {
        annotations.forEach((annotation, index) => {
            if (annotation.subtype === 'Widget' && annotation.fieldName) {
                const field = {
                    id: `form_${pageNum}_${index}`,
                    name: annotation.fieldName,
                    value: annotation.fieldValue || '',
                    type: annotation.fieldType || 'text',
                    page: pageNum,
                    rect: annotation.rect,
                    source: 'form_field'
                };
                
                extractedData.formFields.push(field);
                
                // Categorizar el campo
                const category = this.categorizeField(field.name, field.value);
                if (category) {
                    extractedData.fields[category] = {
                        label: field.name,
                        value: field.value,
                        type: category,
                        confidence: 0.9,
                        source: 'form_field',
                        page: pageNum
                    };
                }
            }
        });
    }

    processTextContent(textContent, extractedData, pageNum) {
        const textItems = textContent.items;
        const pageText = [];
        
        // Construir texto de la página con posiciones
        textItems.forEach(item => {
            pageText.push({
                text: item.str,
                x: item.transform[4],
                y: item.transform[5],
                width: item.width,
                height: item.height
            });
        });
        
        extractedData.textContent.push({
            page: pageNum,
            items: pageText
        });
        
        // Buscar patrones de campos en el texto
        this.findFieldPatterns(pageText, extractedData, pageNum);
    }

    findFieldPatterns(textItems, extractedData, pageNum) {
        // Ordenar elementos por posición (de arriba a abajo, izquierda a derecha)
        const sortedItems = textItems.sort((a, b) => {
            if (Math.abs(a.y - b.y) < 10) {
                return a.x - b.x;
            }
            return b.y - a.y;
        });

        for (let i = 0; i < sortedItems.length; i++) {
            const currentItem = sortedItems[i];
            const currentText = currentItem.text.trim();
            
            if (!currentText) continue;

            // Buscar etiquetas de campos
            for (const [fieldType, pattern] of Object.entries(this.fieldPatterns)) {
                if (pattern.labels.test(currentText)) {
                    // Buscar el valor correspondiente en elementos cercanos
                    const value = this.findNearbyValue(sortedItems, i, pattern.value);
                    
                    if (value && !extractedData.fields[fieldType]) {
                        extractedData.fields[fieldType] = {
                            label: currentText,
                            value: value.trim(),
                            type: fieldType,
                            confidence: 0.8,
                            source: 'text_pattern',
                            page: pageNum,
                            position: {
                                label: { x: currentItem.x, y: currentItem.y },
                                value: value.position
                            }
                        };
                    }
                }
            }
        }
    }

    findNearbyValue(textItems, labelIndex, valuePattern) {
        const labelItem = textItems[labelIndex];
        const searchRadius = 100; // píxeles
        
        // Buscar en elementos cercanos
        for (let i = labelIndex + 1; i < Math.min(labelIndex + 10, textItems.length); i++) {
            const item = textItems[i];
            const distance = Math.sqrt(
                Math.pow(item.x - labelItem.x, 2) + 
                Math.pow(item.y - labelItem.y, 2)
            );
            
            if (distance <= searchRadius && valuePattern.test(item.text)) {
                const match = item.text.match(valuePattern);
                if (match && match[1]) {
                    return {
                        value: match[1],
                        position: { x: item.x, y: item.y }
                    };
                }
            }
        }
        
        return null;
    }

    categorizeField(fieldName, fieldValue) {
        const name = fieldName.toLowerCase();
        
        for (const [category, pattern] of Object.entries(this.fieldPatterns)) {
            if (pattern.labels.test(name) || pattern.value.test(fieldValue)) {
                return category;
            }
        }
        
        return null;
    }

    analyzeExtractedData(extractedData) {
        // Limpiar y normalizar valores
        Object.keys(extractedData.fields).forEach(key => {
            const field = extractedData.fields[key];
            field.value = this.normalizeValue(field.value, field.type);
        });
        
        // Calcular estadísticas
        extractedData.metadata.totalFields = Object.keys(extractedData.fields).length;
        extractedData.metadata.formFieldsCount = extractedData.formFields.length;
        extractedData.metadata.textFieldsCount = Object.values(extractedData.fields)
            .filter(f => f.source === 'text_pattern').length;
    }

    normalizeValue(value, type) {
        if (!value) return '';
        
        let normalized = value.toString().trim();
        
        switch (type) {
            case 'email':
                return normalized.toLowerCase();
            case 'phone':
                return normalized.replace(/[\s()-]/g, '');
            case 'documento':
                return normalized.replace(/[.-]/g, '');
            case 'nombre':
            case 'ciudad':
            case 'pais':
                return normalized.toLowerCase()
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            default:
                return normalized;
        }
    }

    comparePDFFields(data1, data2) {
        console.log('🔄 Iniciando comparación detallada de campos...');
        
        const comparison = {
            timestamp: new Date().toISOString(),
            file1: data1.fileName,
            file2: data2.fileName,
            totalFields1: Object.keys(data1.fields).length,
            totalFields2: Object.keys(data2.fields).length,
            matches: [],
            differences: [],
            missingInFile1: [],
            missingInFile2: [],
            summary: {
                totalComparisons: 0,
                exactMatches: 0,
                differences: 0,
                matchPercentage: 0
            }
        };

        // Obtener todos los campos únicos
        const allFields = new Set([
            ...Object.keys(data1.fields),
            ...Object.keys(data2.fields)
        ]);

        allFields.forEach(fieldType => {
            const field1 = data1.fields[fieldType];
            const field2 = data2.fields[fieldType];
            
            comparison.summary.totalComparisons++;

            if (field1 && field2) {
                // Ambos archivos tienen el campo
                const isMatch = this.compareFieldValues(field1.value, field2.value, fieldType);
                
                if (isMatch) {
                    comparison.matches.push({
                        field: fieldType,
                        label: field1.label || field2.label,
                        value: field1.value,
                        confidence: Math.min(field1.confidence, field2.confidence)
                    });
                    comparison.summary.exactMatches++;
                } else {
                    comparison.differences.push({
                        field: fieldType,
                        label: field1.label || field2.label,
                        value1: field1.value,
                        value2: field2.value,
                        file1: data1.fileName,
                        file2: data2.fileName,
                        type: fieldType,
                        severity: this.calculateDifferenceSeverity(field1.value, field2.value)
                    });
                    comparison.summary.differences++;
                }
            } else if (field1 && !field2) {
                // Solo en archivo 1
                comparison.missingInFile2.push({
                    field: fieldType,
                    label: field1.label,
                    value: field1.value,
                    file: data1.fileName
                });
            } else if (!field1 && field2) {
                // Solo en archivo 2
                comparison.missingInFile1.push({
                    field: fieldType,
                    label: field2.label,
                    value: field2.value,
                    file: data2.fileName
                });
            }
        });

        // Calcular porcentaje de coincidencia
        if (comparison.summary.totalComparisons > 0) {
            comparison.summary.matchPercentage = Math.round(
                (comparison.summary.exactMatches / comparison.summary.totalComparisons) * 100
            );
        }

        console.log('✅ Comparación completada:', comparison);
        return comparison;
    }

    compareFieldValues(value1, value2, fieldType) {
        if (!value1 || !value2) return false;
        
        const normalized1 = this.normalizeValue(value1, fieldType);
        const normalized2 = this.normalizeValue(value2, fieldType);
        
        // Comparación exacta para la mayoría de campos
        if (normalized1 === normalized2) return true;
        
        // Comparaciones especiales según el tipo de campo
        switch (fieldType) {
            case 'fecha':
                return this.compareDates(normalized1, normalized2);
            case 'telefono':
                return this.comparePhones(normalized1, normalized2);
            case 'nombre':
                return this.compareNames(normalized1, normalized2);
            default:
                return false;
        }
    }

    compareDates(date1, date2) {
        try {
            const d1 = new Date(date1.replace(/[\/\-\.]/g, '/'));
            const d2 = new Date(date2.replace(/[\/\-\.]/g, '/'));
            return d1.getTime() === d2.getTime();
        } catch {
            return false;
        }
    }

    comparePhones(phone1, phone2) {
        const clean1 = phone1.replace(/[\s+()-]/g, '');
        const clean2 = phone2.replace(/[\s+()-]/g, '');
        return clean1 === clean2 || clean1.endsWith(clean2) || clean2.endsWith(clean1);
    }

    compareNames(name1, name2) {
        const words1 = name1.toLowerCase().split(/\s+/);
        const words2 = name2.toLowerCase().split(/\s+/);
        
        // Si tienen las mismas palabras en cualquier orden
        return words1.length === words2.length && 
               words1.every(word => words2.includes(word));
    }

    calculateDifferenceSeverity(value1, value2) {
        if (!value1 || !value2) return 'high';
        
        const similarity = this.calculateSimilarity(value1, value2);
        
        if (similarity > 0.8) return 'low';
        if (similarity > 0.5) return 'medium';
        return 'high';
    }

    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    async generateComparisonReport(comparisonResult) {
        try {
            console.log('📄 Generando reporte PDF...');
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Configuración del documento
            let yPosition = 20;
            const pageWidth = doc.internal.pageSize.width;
            const margin = 20;
            const lineHeight = 7;
            
            // Función para agregar texto con salto de página automático
            const addText = (text, x, y, options = {}) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(text, x, y, options);
                return y + lineHeight;
            };
            
            // Título del reporte
            doc.setFontSize(20);
            doc.setTextColor(220, 38, 38);
            yPosition = addText('REPORTE DE COMPARACIÓN PDF', margin, yPosition);
            yPosition += 5;
            
            // Información general
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            yPosition = addText(`Fecha: ${new Date(comparisonResult.timestamp).toLocaleString()}`, margin, yPosition);
            yPosition = addText(`Archivo 1: ${comparisonResult.file1}`, margin, yPosition);
            yPosition = addText(`Archivo 2: ${comparisonResult.file2}`, margin, yPosition);
            yPosition += 5;
            
            // Resumen ejecutivo
            doc.setFontSize(16);
            doc.setTextColor(220, 38, 38);
            yPosition = addText('RESUMEN EJECUTIVO', margin, yPosition);
            yPosition += 2;
            
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            
            const summary = comparisonResult.summary;
            const matchIcon = summary.matchPercentage === 100 ? '✅' : '⚠️';
            
            yPosition = addText(`${matchIcon} Porcentaje de Coincidencia: ${summary.matchPercentage}%`, margin, yPosition);
            yPosition = addText(`📊 Total de Campos Comparados: ${summary.totalComparisons}`, margin, yPosition);
            yPosition = addText(`✅ Campos Coincidentes: ${summary.exactMatches}`, margin, yPosition);
            yPosition = addText(`❌ Campos Diferentes: ${summary.differences}`, margin, yPosition);
            yPosition = addText(`📋 Campos Solo en Archivo 1: ${comparisonResult.missingInFile2.length}`, margin, yPosition);
            yPosition = addText(`📋 Campos Solo en Archivo 2: ${comparisonResult.missingInFile1.length}`, margin, yPosition);
            yPosition += 10;
            
            // Resultado principal
            if (summary.matchPercentage === 100) {
                doc.setFillColor(16, 185, 129, 0.1);
                doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 15, 'F');
                doc.setTextColor(16, 185, 129);
                doc.setFontSize(14);
                yPosition = addText('🎉 COINCIDENCIA TOTAL - Los documentos son idénticos', margin + 5, yPosition);
            } else {
                doc.setFillColor(239, 68, 68, 0.1);
                doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 15, 'F');
                doc.setTextColor(239, 68, 68);
                doc.setFontSize(14);
                yPosition = addText('⚠️ DIFERENCIAS ENCONTRADAS - Revisar campos marcados', margin + 5, yPosition);
            }
            yPosition += 10;
            
            // Campos coincidentes
            if (comparisonResult.matches.length > 0) {
                doc.setFontSize(14);
                doc.setTextColor(16, 185, 129);
                yPosition = addText('✅ CAMPOS COINCIDENTES', margin, yPosition);
                yPosition += 2;
                
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                
                comparisonResult.matches.forEach(match => {
                    yPosition = addText(`• ${match.label || match.field}: ${match.value}`, margin + 5, yPosition);
                });
                yPosition += 5;
            }
            
            // Diferencias encontradas
            if (comparisonResult.differences.length > 0) {
                doc.setFontSize(14);
                doc.setTextColor(239, 68, 68);
                yPosition = addText('❌ DIFERENCIAS ENCONTRADAS', margin, yPosition);
                yPosition += 2;
                
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                
                comparisonResult.differences.forEach(diff => {
                    const severityIcon = diff.severity === 'high' ? '🔴' : diff.severity === 'medium' ? '🟡' : '🟢';
                    yPosition = addText(`${severityIcon} Campo: ${diff.label || diff.field}`, margin + 5, yPosition);
                    yPosition = addText(`   ${comparisonResult.file1}: "${diff.value1}"`, margin + 10, yPosition);
                    yPosition = addText(`   ${comparisonResult.file2}: "${diff.value2}"`, margin + 10, yPosition);
                    yPosition += 2;
                });
                yPosition += 5;
            }
            
            // Campos faltantes
            if (comparisonResult.missingInFile1.length > 0 || comparisonResult.missingInFile2.length > 0) {
                doc.setFontSize(14);
                doc.setTextColor(245, 158, 11);
                yPosition = addText('📋 CAMPOS FALTANTES', margin, yPosition);
                yPosition += 2;
                
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                
                comparisonResult.missingInFile2.forEach(missing => {
                    yPosition = addText(`• Solo en ${missing.file}: ${missing.label} = "${missing.value}"`, margin + 5, yPosition);
                });
                
                comparisonResult.missingInFile1.forEach(missing => {
                    yPosition = addText(`• Solo en ${missing.file}: ${missing.label} = "${missing.value}"`, margin + 5, yPosition);
                });
            }
            
            // Pie de página
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(128, 128, 128);
                doc.text(`TRAZABILITY AI - Página ${i} de ${pageCount}`, pageWidth - margin, 285, { align: 'right' });
                doc.text(`Generado el ${new Date().toLocaleString()}`, margin, 285);
            }
            
            return doc;
            
        } catch (error) {
            console.error('❌ Error generando reporte:', error);
            throw new Error(`Error al generar reporte: ${error.message}`);
        }
    }
}

// Hacer disponible globalmente
window.PDFProcessor = PDFProcessor;
window.pdfProcessor = new PDFProcessor();