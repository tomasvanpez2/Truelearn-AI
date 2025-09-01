const dataService = require('./src/services/dataService');

console.log('=== DEMOSTRACIÓN COMPLETA DE FUNCIONALIDAD ===\n');

// Función para mostrar información completa
function mostrarEstadoCompleto(adminId, adminName) {
    console.log(`🏢 ${adminName}`);
    console.log('─'.repeat(50));
    
    const admin = dataService.findUserById(adminId);
    const teachers = dataService.findTeachersByAdmin(adminId);
    const adminTokens = dataService.getAdminTokensWithAccumulatedUsage(adminId);
    
    console.log(`📊 Resumen de tokens:`);
    console.log(`   Límite del admin: ${adminTokens.limit.toLocaleString()} tokens`);
    console.log(`   Uso directo del admin: ${adminTokens.adminDirectUsage.toLocaleString()} tokens`);
    console.log(`   Uso de profesores: ${adminTokens.teachersUsage.toLocaleString()} tokens`);
    console.log(`   ─────────────────────────────────────`);
    console.log(`   TOTAL USADO: ${adminTokens.used.toLocaleString()} tokens`);
    console.log(`   RESTANTES: ${adminTokens.remaining.toLocaleString()} tokens`);
    
    if (adminTokens.remaining < 0) {
        console.log(`   🚨 LÍMITE EXCEDIDO por ${Math.abs(adminTokens.remaining).toLocaleString()} tokens`);
    } else {
        console.log(`   ✅ Dentro del límite`);
    }
    
    console.log(`\n👥 Profesores (${teachers.length}):`);
    teachers.forEach(teacher => {
        const tokensUsed = teacher.platformData?.tokens?.used || 0;
        const tokensLimit = teacher.platformData?.tokens?.limit || 0;
        console.log(`   • ${teacher.name} (${teacher.subject}): ${tokensUsed.toLocaleString()}/${tokensLimit.toLocaleString()} tokens`);
    });
    
    console.log('\n');
}

// Estado inicial
console.log('📋 ESTADO INICIAL:');
mostrarEstadoCompleto('1', 'Admin Test');
mostrarEstadoCompleto('1756586521800', 'Admin Tomás');

// Prueba de verificación antes de usar tokens
console.log('🔍 VERIFICACIÓN DE USO DE TOKENS:');
console.log('¿Puede el Admin Test permitir que un profesor use 5000 tokens adicionales?');
const verification1 = dataService.canAdminAllowTokenUsage('1', 5000);
console.log(`   Resultado: ${verification1.allowed ? '✅ PERMITIDO' : '❌ DENEGADO'}`);
console.log(`   Razón: ${verification1.reason}`);
console.log(`   Uso actual: ${verification1.currentUsed.toLocaleString()} tokens`);
console.log(`   Nuevo total sería: ${verification1.newTotal.toLocaleString()} tokens`);

console.log('\n¿Puede el Admin Tomás permitir que un profesor use 15000 tokens adicionales?');
const verification2 = dataService.canAdminAllowTokenUsage('1756586521800', 15000);
console.log(`   Resultado: ${verification2.allowed ? '✅ PERMITIDO' : '❌ DENEGADO'}`);
console.log(`   Razón: ${verification2.reason}`);
console.log(`   Exceso sería: ${verification2.excess.toLocaleString()} tokens`);

console.log('\n');

// Simulación de uso real
console.log('⚡ SIMULACIÓN DE USO REAL:');
console.log('1. El Profesor Juan usa 2000 tokens adicionales...');
const currentJuanTokens = dataService.findUserById('teacher1').platformData.tokens.used;
dataService.updateTeacherTokens('teacher1', { used: currentJuanTokens + 2000 });

console.log('2. El Admin Test usa 1000 tokens directamente...');
const currentAdminTokens = dataService.findUserById('1').platformData.tokens.used;
dataService.updateTokens('1', { used: currentAdminTokens + 1000 });

console.log('\n📊 ESTADO DESPUÉS DE LOS CAMBIOS:');
mostrarEstadoCompleto('1', 'Admin Test');

console.log('💡 EXPLICACIÓN DEL SISTEMA:');
console.log('─'.repeat(60));
console.log('• Cada admin tiene un límite fijo de tokens');
console.log('• Los tokens usados por profesores se SUMAN al uso del admin');
console.log('• El sistema permite verificar ANTES de usar tokens');
console.log('• Se puede controlar el exceso de límites');
console.log('• Uso total = uso directo admin + suma uso profesores');