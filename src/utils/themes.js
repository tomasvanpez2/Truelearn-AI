const fs = require('fs');
const path = require('path');

const THEMES_PATH = path.join(__dirname, '../themes.config.js');

// Cargar temas desde el archivo
function loadThemes() {
    try {
        delete require.cache[require.resolve(THEMES_PATH)];
        const data = require(THEMES_PATH);
        return data || {};
    } catch (e) {
        return {};
    }
}

// Guardar temas en el archivo
function saveThemes(themes) {
    fs.writeFileSync(
        THEMES_PATH,
        'module.exports = ' + JSON.stringify(themes, null, 2) + ';\n',
        'utf8'
    );
}

module.exports = {
    loadThemes,
    saveThemes
};
