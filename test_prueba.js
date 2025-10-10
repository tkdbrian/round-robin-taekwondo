// Prueba del sistema con los datos del torneo
const competitors = [
    { name: 'MILEI', victoryPoints: 9, judgePoints: 12 },
    { name: 'CHRISTIAN', victoryPoints: 7, judgePoints: 8 },
    { name: 'TOTO', victoryPoints: 7, judgePoints: 8 },
    { name: 'JUAN', victoryPoints: 6, judgePoints: 6 },
    { name: 'PEREZ', victoryPoints: 0, judgePoints: 0 }
];

// Ordenar competidores (misma lógica del sistema)
const sorted = [...competitors].sort((a, b) => {
    if (b.victoryPoints !== a.victoryPoints) return b.victoryPoints - a.victoryPoints;
    if (b.judgePoints !== a.judgePoints) return b.judgePoints - a.judgePoints;
    return a.name.localeCompare(b.name);
});

console.log('🏆 RESULTADO DE LA PRUEBA:');
console.log('=========================\n');

console.log('📊 ORDEN FINAL:');
sorted.forEach((c, i) => console.log(`${i+1}° ${c.name} - ${c.victoryPoints} pts, ${c.judgePoints} jueces`));

console.log('\n🔍 DETECCIÓN DE EMPATES:');
let empateEncontrado = false;

for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const tiedGroup = [current];
    
    for (let j = i + 1; j < sorted.length; j++) {
        const next = sorted[j];
        if (current.victoryPoints === next.victoryPoints && current.judgePoints === next.judgePoints) {
            tiedGroup.push(next);
        } else break;
    }
    
    if (tiedGroup.length >= 2) {
        console.log(`⚖️ EMPATE en posición ${i+1}: ${tiedGroup.map(c => c.name).join(' vs ')} (${tiedGroup[0].victoryPoints} pts, ${tiedGroup[0].judgePoints} jueces)`);
        
        if (tiedGroup.length === 2) {
            console.log(`🥊 ACCIÓN: Pelea de desempate ${tiedGroup[0].name} vs ${tiedGroup[1].name}`);
            empateEncontrado = true;
        } else {
            console.log(`🟡 Empate técnico de ${tiedGroup.length} competidores`);
        }
        i += tiedGroup.length - 1;
    }
}

console.log('\n🏆 PODIO ROUND ROBIN (Solo 1° y 2°):');
console.log(`1° ${sorted[0].name} - ${sorted[0].victoryPoints} puntos`);
console.log(`2° ${sorted[1].name} - ${sorted[1].victoryPoints} puntos`);

console.log(`\n✅ Sistema detectó empate: ${empateEncontrado ? 'SÍ - Funcionando correctamente' : 'NO - Error en detección'}`);