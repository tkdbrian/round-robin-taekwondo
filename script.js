// Sistema Round Robin - Taekwondo
class RoundRobinTournament {
    constructor() {
        this.competitors = [];
        this.fights = [];
        this.currentFightIndex = 0;
        this.judgeDecisions = {};
        this.standings = {};
        
        this.initializeEventListeners();
        this.generateFightSchedule();
    }

    initializeEventListeners() {
        // Configuración inicial
        document.getElementById('start-tournament').addEventListener('click', () => this.startTournament());
        
        // Botones de jueces
        document.querySelectorAll('.judge-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleJudgeDecision(e));
        });
        
        // Controles de pelea
        document.getElementById('confirm-fight').addEventListener('click', () => this.confirmFight());
        document.getElementById('reset-fight').addEventListener('click', () => this.resetCurrentFight());
        
        // Modal
        document.getElementById('close-tournament-modal').addEventListener('click', () => this.closeTournamentModal());
        document.getElementById('new-tournament').addEventListener('click', () => this.newTournament());
        document.getElementById('export-results').addEventListener('click', () => this.exportResults());
    }

    startTournament() {
        // Obtener nombres de los competidores
        const competitorInputs = [
            document.getElementById('competitor1').value.trim(),
            document.getElementById('competitor2').value.trim(),
            document.getElementById('competitor3').value.trim(),
            document.getElementById('competitor4').value.trim(),
            document.getElementById('competitor5').value.trim()
        ];

        // Validar que todos los campos estén llenos
        if (competitorInputs.some(name => name === '')) {
            alert('Por favor, ingresa el nombre de todos los competidores.');
            return;
        }

        // Validar nombres únicos
        const uniqueNames = new Set(competitorInputs);
        if (uniqueNames.size !== 5) {
            alert('Todos los competidores deben tener nombres únicos.');
            return;
        }

        // Inicializar competidores
        this.competitors = competitorInputs.map((name, index) => ({
            id: index + 1,
            name: name,
            fights: 0,
            wins: 0,
            ties: 0,
            losses: 0,
            victoryPoints: 0,
            judgePoints: 0,
            totalPoints: 0
        }));

        // Generar calendario de peleas
        this.generateFightSchedule();
        this.initializeStandings();
        
        // Mostrar sección de peleas
        document.getElementById('setup-section').style.display = 'none';
        document.getElementById('fight-section').style.display = 'block';
        
        // Cargar primera pelea
        this.loadCurrentFight();
        this.updateStandings();
        this.updateScheduleDisplay();
    }

    generateFightSchedule() {
        this.fights = [];
        
        // Generar todas las combinaciones posibles (Round Robin)
        for (let i = 0; i < 5; i++) {
            for (let j = i + 1; j < 5; j++) {
                this.fights.push({
                    fighter1Index: i,
                    fighter2Index: j,
                    completed: false,
                    result: null,
                    judgeVotes: {
                        judge1: null,
                        judge2: null,
                        judge3: null,
                        judge4: null
                    }
                });
            }
        }
    }

    loadCurrentFight() {
        if (this.currentFightIndex >= this.fights.length) {
            // Torneo completado
            this.showTournamentResults();
            return;
        }

        const currentFight = this.fights[this.currentFightIndex];
        const fighter1 = this.competitors[currentFight.fighter1Index];
        const fighter2 = this.competitors[currentFight.fighter2Index];

        // Actualizar información de la pelea
        document.getElementById('current-fight-info').textContent = 
            `Pelea ${this.currentFightIndex + 1} de ${this.fights.length}`;
        document.getElementById('fighter1-name').textContent = fighter1.name;
        document.getElementById('fighter2-name').textContent = fighter2.name;

        // Actualizar nombres en botones de jueces
        document.querySelectorAll('#fighter1-name-j1, #fighter1-name-j2, #fighter1-name-j3, #fighter1-name-j4')
            .forEach(el => el.textContent = fighter1.name);
        document.querySelectorAll('#fighter2-name-j1, #fighter2-name-j2, #fighter2-name-j3, #fighter2-name-j4')
            .forEach(el => el.textContent = fighter2.name);

        // Actualizar header
        document.getElementById('fight-display').textContent = `Pelea ${this.currentFightIndex + 1} de ${this.fights.length}`;
        document.getElementById('competitors-display').textContent = `${fighter1.name} vs ${fighter2.name}`;

        // Reset de decisiones de jueces
        this.resetJudgeDecisions();
        this.updateFightResult();
    }

    handleJudgeDecision(event) {
        const button = event.target.closest('.judge-btn');
        const judgeNumber = button.dataset.judge;
        const fighterChoice = button.dataset.fighter;

        // Remover selección anterior del mismo juez
        const judgeButtons = document.querySelectorAll(`[data-judge="${judgeNumber}"]`);
        judgeButtons.forEach(btn => btn.classList.remove('selected'));

        // Agregar selección actual
        button.classList.add('selected');

        // Guardar decisión
        this.judgeDecisions[`judge${judgeNumber}`] = fighterChoice;

        // Actualizar display de selección
        const selectionElement = document.getElementById(`judge${judgeNumber}-selection`);
        if (fighterChoice === 'tie') {
            selectionElement.textContent = 'Empate';
        } else {
            const currentFight = this.fights[this.currentFightIndex];
            const fighterIndex = fighterChoice === '1' ? currentFight.fighter1Index : currentFight.fighter2Index;
            selectionElement.textContent = this.competitors[fighterIndex].name;
        }

        this.updateFightResult();
    }

    updateFightResult() {
        const decisions = Object.values(this.judgeDecisions);
        
        // Verificar si todos los jueces han decidido
        if (decisions.length < 4 || decisions.some(decision => decision === null)) {
            document.getElementById('fight-winner').textContent = '-';
            document.getElementById('victory-points').textContent = '-';
            document.getElementById('judge-points').textContent = '-';
            document.getElementById('confirm-fight').disabled = true;
            return;
        }

        // Contar votos
        const votes = {
            fighter1: 0,
            fighter2: 0,
            tie: 0
        };

        Object.values(this.judgeDecisions).forEach(decision => {
            if (decision === '1') votes.fighter1++;
            else if (decision === '2') votes.fighter2++;
            else if (decision === 'tie') votes.tie++;
        });

        const currentFight = this.fights[this.currentFightIndex];
        const fighter1 = this.competitors[currentFight.fighter1Index];
        const fighter2 = this.competitors[currentFight.fighter2Index];

        let winner, victoryPoints, judgePoints;

        // Determinar resultado
        if (votes.fighter1 > votes.fighter2 && votes.fighter1 > votes.tie) {
            // Fighter 1 gana
            winner = `${fighter1.name} (Ganador)`;
            victoryPoints = `${fighter1.name}: 3 pts, ${fighter2.name}: 0 pts`;
            judgePoints = `${fighter1.name}: +${votes.fighter1} pts, ${fighter2.name}: +${votes.fighter2} pts`;
        } else if (votes.fighter2 > votes.fighter1 && votes.fighter2 > votes.tie) {
            // Fighter 2 gana
            winner = `${fighter2.name} (Ganador)`;
            victoryPoints = `${fighter2.name}: 3 pts, ${fighter1.name}: 0 pts`;
            judgePoints = `${fighter2.name}: +${votes.fighter2} pts, ${fighter1.name}: +${votes.fighter1} pts`;
        } else {
            // Empate (puede ser por empate de votos o mayoría de empates)
            winner = 'Empate';
            victoryPoints = `${fighter1.name}: 1 pt, ${fighter2.name}: 1 pt`;
            judgePoints = `${fighter1.name}: +${votes.fighter1} pts, ${fighter2.name}: +${votes.fighter2} pts`;
        }

        document.getElementById('fight-winner').textContent = winner;
        document.getElementById('victory-points').textContent = victoryPoints;
        document.getElementById('judge-points').textContent = judgePoints;
        document.getElementById('confirm-fight').disabled = false;
    }

    confirmFight() {
        const currentFight = this.fights[this.currentFightIndex];
        const decisions = { ...this.judgeDecisions };

        // Contar votos
        const votes = {
            fighter1: 0,
            fighter2: 0,
            tie: 0
        };

        Object.values(decisions).forEach(decision => {
            if (decision === '1') votes.fighter1++;
            else if (decision === '2') votes.fighter2++;
            else if (decision === 'tie') votes.tie++;
        });

        // Actualizar estadísticas de competidores
        const fighter1 = this.competitors[currentFight.fighter1Index];
        const fighter2 = this.competitors[currentFight.fighter2Index];

        fighter1.fights++;
        fighter2.fights++;

        // Asignar puntos de victoria/empate
        if (votes.fighter1 > votes.fighter2 && votes.fighter1 > votes.tie) {
            // Fighter 1 gana
            fighter1.wins++;
            fighter1.victoryPoints += 3;
            fighter2.losses++;
            currentFight.result = `${fighter1.name} ganó`;
        } else if (votes.fighter2 > votes.fighter1 && votes.fighter2 > votes.tie) {
            // Fighter 2 gana
            fighter2.wins++;
            fighter2.victoryPoints += 3;
            fighter1.losses++;
            currentFight.result = `${fighter2.name} ganó`;
        } else {
            // Empate
            fighter1.ties++;
            fighter2.ties++;
            fighter1.victoryPoints += 1;
            fighter2.victoryPoints += 1;
            currentFight.result = 'Empate';
        }

        // Asignar puntos de jueces (SEPARADOS de los puntos de victoria)
        fighter1.judgePoints += votes.fighter1;
        fighter2.judgePoints += votes.fighter2;

        // Calcular puntos totales (solo para desempates)
        fighter1.totalPoints = fighter1.victoryPoints + fighter1.judgePoints;
        fighter2.totalPoints = fighter2.victoryPoints + fighter2.judgePoints;

        // Marcar pelea como completada
        currentFight.completed = true;
        currentFight.judgeVotes = { ...decisions };

        // Avanzar a siguiente pelea
        this.currentFightIndex++;
        
        // Actualizar displays
        this.updateStandings();
        this.updateFightHistory();
        this.updateScheduleDisplay();
        
        // Cargar siguiente pelea
        this.loadCurrentFight();
    }

    resetCurrentFight() {
        this.resetJudgeDecisions();
        this.updateFightResult();
    }

    resetJudgeDecisions() {
        this.judgeDecisions = {};
        
        // Remover todas las selecciones
        document.querySelectorAll('.judge-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Reset de displays de selección
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`judge${i}-selection`).textContent = 'Sin decisión';
        }
    }

    initializeStandings() {
        this.updateStandings();
    }

    updateStandings() {
        const tbody = document.getElementById('standings-body');
        tbody.innerHTML = '';

        // Ordenar competidores: PRIMERO por puntos de jueces, luego por puntos totales
        const sortedCompetitors = [...this.competitors].sort((a, b) => {
            // Primero: El que tiene más puntos de jueces
            if (b.judgePoints !== a.judgePoints) {
                return b.judgePoints - a.judgePoints;
            }
            // En caso de empate: Se suma puntos de victoria + puntos de jueces
            if (b.totalPoints !== a.totalPoints) {
                return b.totalPoints - a.totalPoints;
            }
            // Si persiste empate, por puntos de victoria
            return b.victoryPoints - a.victoryPoints;
        });

        sortedCompetitors.forEach((competitor, index) => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${competitor.name}</td>
                <td>${competitor.fights}</td>
                <td>${competitor.wins}</td>
                <td>${competitor.ties}</td>
                <td>${competitor.losses}</td>
                <td>${competitor.victoryPoints}</td>
                <td><strong style="color: #e74c3c; font-size: 1.2em;">${competitor.judgePoints}</strong></td>
                <td>${competitor.totalPoints}</td>
            `;
        });
    }

    updateFightHistory() {
        const historyList = document.getElementById('fights-list');
        historyList.innerHTML = '';

        this.fights.forEach((fight, index) => {
            if (fight.completed) {
                const fighter1 = this.competitors[fight.fighter1Index];
                const fighter2 = this.competitors[fight.fighter2Index];
                
                const fightItem = document.createElement('div');
                fightItem.className = 'fight-item completed';
                fightItem.innerHTML = `
                    <div class="fight-details">
                        <div class="fight-competitors">${fighter1.name} vs ${fighter2.name}</div>
                        <div class="fight-result">Resultado: ${fight.result}</div>
                    </div>
                    <div class="fight-number">Pelea ${index + 1}</div>
                `;
                historyList.appendChild(fightItem);
            }
        });
    }

    updateScheduleDisplay() {
        const scheduleList = document.getElementById('schedule-list');
        scheduleList.innerHTML = '';

        this.fights.forEach((fight, index) => {
            const fighter1 = this.competitors[fight.fighter1Index];
            const fighter2 = this.competitors[fight.fighter2Index];
            
            const scheduleItem = document.createElement('div');
            scheduleItem.className = `schedule-item ${fight.completed ? 'completed' : 'pending'}`;
            
            let statusText = fight.completed ? `✓ ${fight.result}` : 
                            index === this.currentFightIndex ? '🔴 En progreso' : '⏳ Pendiente';
            
            scheduleItem.innerHTML = `
                <div class="fight-details">
                    <div class="fight-competitors">${fighter1.name} vs ${fighter2.name}</div>
                    <div class="fight-result">${statusText}</div>
                </div>
                <div class="fight-number">Pelea ${index + 1}</div>
            `;
            scheduleList.appendChild(scheduleItem);
        });
    }

    showTournamentResults() {
        document.getElementById('fight-section').style.display = 'none';
        
        // Actualizar standings finales en el modal
        const finalStandings = document.getElementById('final-standings');
        const sortedCompetitors = [...this.competitors].sort((a, b) => {
            // Primero: El que tiene más puntos de jueces
            if (b.judgePoints !== a.judgePoints) {
                return b.judgePoints - a.judgePoints;
            }
            // En caso de empate: Se suma puntos de victoria + puntos de jueces
            if (b.totalPoints !== a.totalPoints) {
                return b.totalPoints - a.totalPoints;
            }
            // Si persiste empate, por puntos de victoria
            return b.victoryPoints - a.victoryPoints;
        });

        finalStandings.innerHTML = `
            <div class="final-standings-table">
                <h3>🏆 Clasificación Final</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background: #3498db; color: white;">
                            <th style="padding: 10px;">Pos</th>
                            <th style="padding: 10px;">Competidor</th>
                            <th style="padding: 10px;">Pts Total</th>
                            <th style="padding: 10px;">G-E-P</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedCompetitors.map((competitor, index) => `
                            <tr style="border-bottom: 1px solid #ddd; ${index === 0 ? 'background: #f1c40f; font-weight: bold;' : ''}">
                                <td style="padding: 10px; text-align: center;">${index + 1}°</td>
                                <td style="padding: 10px;">${competitor.name}</td>
                                <td style="padding: 10px; text-align: center;"><strong>${competitor.totalPoints}</strong></td>
                                <td style="padding: 10px; text-align: center;">${competitor.wins}-${competitor.ties}-${competitor.losses}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById('tournament-result-modal').style.display = 'block';
    }

    closeTournamentModal() {
        document.getElementById('tournament-result-modal').style.display = 'none';
    }

    newTournament() {
        // Reset completo
        this.competitors = [];
        this.fights = [];
        this.currentFightIndex = 0;
        this.judgeDecisions = {};
        
        // Limpiar inputs
        document.querySelectorAll('input[type="text"]').forEach(input => input.value = '');
        
        // Mostrar setup inicial
        document.getElementById('setup-section').style.display = 'block';
        document.getElementById('fight-section').style.display = 'none';
        document.getElementById('tournament-result-modal').style.display = 'none';
        
        // Limpiar displays
        document.getElementById('standings-body').innerHTML = '';
        document.getElementById('fights-list').innerHTML = '';
        document.getElementById('schedule-list').innerHTML = '';
    }

    exportResults() {
        const sortedCompetitors = [...this.competitors].sort((a, b) => {
            // Primero: El que tiene más puntos de jueces
            if (b.judgePoints !== a.judgePoints) {
                return b.judgePoints - a.judgePoints;
            }
            // En caso de empate: Se suma puntos de victoria + puntos de jueces
            if (b.totalPoints !== a.totalPoints) {
                return b.totalPoints - a.totalPoints;
            }
            // Si persiste empate, por puntos de victoria
            return b.victoryPoints - a.victoryPoints;
        });

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Posicion,Nombre,Peleas,Ganadas,Empates,Perdidas,Puntos_Victoria,Puntos_Jueces,Total_Puntos\n";
        
        sortedCompetitors.forEach((competitor, index) => {
            csvContent += `${index + 1},${competitor.name},${competitor.fights},${competitor.wins},${competitor.ties},${competitor.losses},${competitor.victoryPoints},${competitor.judgePoints},${competitor.totalPoints}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "resultados_round_robin_taekwondo.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    new RoundRobinTournament();
});

// Funcionalidad adicional para cerrar modal al hacer clic fuera
window.addEventListener('click', function(event) {
    const modal = document.getElementById('tournament-result-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});