const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const xlsx = require('xlsx');

class FileParser {
    /**
     * Extrae el texto de un archivo según su tipo
     * @param {string} filePath - Ruta del archivo a procesar
     * @returns {Promise<string>} - Texto extraído del archivo
     */
    async extractText(filePath) {
        try {
            const ext = path.extname(filePath).toLowerCase();
            
            switch (ext) {
                case '.txt':
                    return await this.extractFromTxt(filePath);
                case '.docx':
                    return await this.extractFromDocx(filePath);
                case '.xlsx':
                    return await this.extractFromXlsx(filePath);
                case '.pptx':
                    // Implementar extracción de PPTX
                    throw new Error('Extracción de PPTX no implementada aún');
                default:
                    throw new Error(`Tipo de archivo no soportado: ${ext}`);
            }
        } catch (error) {
            console.error('Error al extraer texto:', error);
            throw error;
        }
    }

    /**
     * Extrae texto de un archivo TXT
     * @param {string} filePath - Ruta del archivo
     * @returns {Promise<string>} - Texto extraído
     */
    async extractFromTxt(filePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data);
            });
        });
    }

    /**
     * Extrae texto de un archivo DOCX
     * @param {string} filePath - Ruta del archivo
     * @returns {Promise<string>} - Texto extraído
     */
    async extractFromDocx(filePath) {
        try {
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
        } catch (error) {
            console.error('Error al extraer texto de DOCX:', error);
            throw error;
        }
    }

    /**
     * Extrae texto de un archivo XLSX
     * @param {string} filePath - Ruta del archivo
     * @returns {Promise<string>} - Texto extraído
     */
    async extractFromXlsx(filePath) {
        try {
            const workbook = xlsx.readFile(filePath);
            let extractedText = '';
            
            // Recorrer todas las hojas del libro
            workbook.SheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                const sheetText = xlsx.utils.sheet_to_txt(worksheet, { raw: false });
                extractedText += `[Hoja: ${sheetName}]\n${sheetText}\n\n`;
            });
            
            return extractedText;
        } catch (error) {
            console.error('Error al extraer texto de XLSX:', error);
            throw error;
        }
    }
}

module.exports = new FileParser();