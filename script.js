// Sistema Round Robin - Taekwondo
class RoundRobinTournament {
    constructor() {
        this.competitors = [];
        this.fights = [];
        this.currentFightIndex = 0;
        this.judgeDecisions = {};
        this.standings = {};
        this.competitorCount = 5; // Por defecto 5 competidores
        this.brackets = []; // Para sistema de llaves
        this.currentPhase = 'setup'; // setup, groups, final
        this.groupWinners = []; // Ganadores de cada grupo
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Configuración inicial
        document.getElementById('start-tournament').addEventListener('click', () => this.startTournament());
        
        // Selector de número de competidores
        document.getElementById('competitor-count').addEventListener('change', (e) => this.updateCompetitorInputs(e.target.value));
        
        // Botones de jueces
        document.querySelectorAll('.judge-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleJudgeDecision(e));
        });
        
        // Controles de pelea
        document.getElementById('confirm-fight').addEventListener('click', () => this.confirmFight());
        document.getElementById('reset-fight').addEventListener('click', () => this.resetCurrentFight());
        
        // Controles de fase
        document.getElementById('next-phase').addEventListener('click', () => this.nextPhase());
        
        // Modal
        document.getElementById('close-tournament-modal').addEventListener('click', () => this.closeTournamentModal());
        document.getElementById('new-tournament').addEventListener('click', () => this.newTournament());
        document.getElementById('export-results').addEventListener('click', () => this.exportResults());
        
        // Inicializar con 5 competidores por defecto
        this.updateCompetitorInputs(5);
    }

    updateCompetitorInputs(count) {
        this.competitorCount = parseInt(count);
        
        // Mostrar/ocultar campos según el número seleccionado
        for (let i = 4; i <= 8; i++) {
            const container = document.getElementById(`competitor${i}-container`);
            const input = document.getElementById(`competitor${i}`);
            
            if (count >= i) {
                container.style.display = 'flex';
                input.required = true;
            } else {
                container.style.display = 'none';
                input.required = false;
                input.value = '';
            }
        }
        
        // Actualizar el texto del botón según el sistema
        let buttonText = '';
        if (count <= 5) {
            const totalFights = (count * (count - 1)) / 2;
            buttonText = `Iniciar Torneo (${totalFights} peleas)`;
        } else if (count == 6) {
            buttonText = 'Iniciar Torneo (2 llaves de 3 + Final)';
        } else if (count == 7) {
            buttonText = 'Iniciar Torneo (1 llave de 4 + 1 llave de 3 + Final)';
        } else if (count == 8) {
            buttonText = 'Iniciar Torneo (2 llaves de 4 + Final)';
        }
        
        document.querySelector('.start-btn').innerHTML = `
            <i class="fas fa-play"></i>
            ${buttonText}
        `;
    }

    startTournament() {
        // Obtener nombres de los competidores según la cantidad seleccionada
        const competitorInputs = [];
        for (let i = 1; i <= this.competitorCount; i++) {
            const input = document.getElementById(`competitor${i}`);
            if (input && input.style.display !== 'none') {
                const value = input.value.trim();
                if (value === '') {
                    alert(`Por favor, ingresa el nombre del competidor ${i}.`);
                    return;
                }
                competitorInputs.push(value);
            }
        }

        // Validar nombres únicos
        const uniqueNames = new Set(competitorInputs);
        if (uniqueNames.size !== competitorInputs.length) {
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
            totalPoints: 0,
            bracket: null // Para identificar a qué llave pertenece
        }));

        // Decidir el sistema según el número de competidores
        if (this.competitorCount <= 5) {
            // Sistema Round Robin tradicional
            this.currentPhase = 'roundrobin';
            this.generateFightSchedule();
            this.showFightSection();
        } else {
            // Sistema de llaves
            this.currentPhase = 'groups';
            this.createBrackets();
            this.generateGroupStage();
            this.showBracketsSection();
        }
        
        this.initializeStandings();
        this.loadCurrentFight();
        this.updateStandings();
        this.updateScheduleDisplay();
    }

    generateFightSchedule() {
        this.fights = [];
        
        // Generar todas las combinaciones posibles (Round Robin) según el número de competidores
        for (let i = 0; i < this.competitors.length; i++) {
            for (let j = i + 1; j < this.competitors.length; j++) {
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
        let fightInfo = `Pelea ${this.currentFightIndex + 1} de ${this.fights.length}`;
        if (currentFight.isFinal) {
            fightInfo = `🏆 FINAL - ${fightInfo}`;
        } else if (currentFight.bracket) {
            const bracketName = this.brackets.find(b => b.id === currentFight.bracket)?.name || '';
            fightInfo = `${bracketName} - ${fightInfo}`;
        }
        
        document.getElementById('current-fight-info').textContent = fightInfo;
        document.getElementById('fighter1-name').textContent = fighter1.name;
        document.getElementById('fighter2-name').textContent = fighter2.name;

        // Actualizar nombres en botones de jueces
        document.querySelectorAll('#fighter1-name-j1, #fighter1-name-j2, #fighter1-name-j3, #fighter1-name-j4')
            .forEach(el => el.textContent = fighter1.name);
        document.querySelectorAll('#fighter2-name-j1, #fighter2-name-j2, #fighter2-name-j3, #fighter2-name-j4')
            .forEach(el => el.textContent = fighter2.name);

        // Actualizar header
        document.getElementById('fight-display').textContent = fightInfo;
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
            // Fighter 1 gana (tiene más votos que el fighter 2 Y más que empates)
            winner = `${fighter1.name} (Ganador)`;
            victoryPoints = `${fighter1.name}: 3 pts, ${fighter2.name}: 0 pts`;
            judgePoints = `${fighter1.name}: +${votes.fighter1} pts, ${fighter2.name}: +${votes.fighter2} pts`;
        } else if (votes.fighter2 > votes.fighter1 && votes.fighter2 > votes.tie) {
            // Fighter 2 gana (tiene más votos que el fighter 1 Y más que empates)
            winner = `${fighter2.name} (Ganador)`;
            victoryPoints = `${fighter2.name}: 3 pts, ${fighter1.name}: 0 pts`;
            judgePoints = `${fighter2.name}: +${votes.fighter2} pts, ${fighter1.name}: +${votes.fighter1} pts`;
        } else if (votes.fighter1 > votes.fighter2) {
            // Fighter 1 tiene más votos que fighter 2, aunque haya empates
            winner = `${fighter1.name} (Ganador)`;
            victoryPoints = `${fighter1.name}: 3 pts, ${fighter2.name}: 0 pts`;
            judgePoints = `${fighter1.name}: +${votes.fighter1} pts, ${fighter2.name}: +${votes.fighter2} pts`;
        } else if (votes.fighter2 > votes.fighter1) {
            // Fighter 2 tiene más votos que fighter 1, aunque haya empates
            winner = `${fighter2.name} (Ganador)`;
            victoryPoints = `${fighter2.name}: 3 pts, ${fighter1.name}: 0 pts`;
            judgePoints = `${fighter2.name}: +${votes.fighter2} pts, ${fighter1.name}: +${votes.fighter1} pts`;
        } else {
            // Empate real (mismo número de votos para ambos fighters)
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
            // Fighter 1 gana claramente (más votos que fighter 2 Y más que empates)
            fighter1.wins++;
            fighter1.victoryPoints += 3;
            fighter2.losses++;
            currentFight.result = `${fighter1.name} ganó`;
        } else if (votes.fighter2 > votes.fighter1 && votes.fighter2 > votes.tie) {
            // Fighter 2 gana claramente (más votos que fighter 1 Y más que empates)
            fighter2.wins++;
            fighter2.victoryPoints += 3;
            fighter1.losses++;
            currentFight.result = `${fighter2.name} ganó`;
        } else if (votes.fighter1 > votes.fighter2) {
            // Fighter 1 tiene más votos que fighter 2, aunque haya empates
            fighter1.wins++;
            fighter1.victoryPoints += 3;
            fighter2.losses++;
            currentFight.result = `${fighter1.name} ganó`;
        } else if (votes.fighter2 > votes.fighter1) {
            // Fighter 2 tiene más votos que fighter 1, aunque haya empates
            fighter2.wins++;
            fighter2.victoryPoints += 3;
            fighter1.losses++;
            currentFight.result = `${fighter2.name} ganó`;
        } else {
            // Empate real (mismo número de votos para ambos fighters)
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
        
        // Si es sistema de llaves, actualizar brackets
        if (this.competitorCount > 5) {
            this.updateBracketsDisplay();
            
            // Verificar si se completó la fase de grupos
            if (this.currentPhase === 'groups' && this.checkGroupStageComplete()) {
                document.getElementById('current-phase').textContent = 'Fase de Grupos Completada';
                document.getElementById('next-phase').style.display = 'block';
            }
        }
        
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
        
        if (this.competitorCount > 5) {
            // Sistema de llaves - buscar ganador de la final
            const finalFight = this.fights.find(f => f.isFinal && f.completed);
            let championMessage = '';
            
            if (finalFight) {
                // Determinar ganador de la final
                const votes = {
                    fighter1: 0,
                    fighter2: 0,
                    tie: 0
                };
                
                Object.values(finalFight.judgeVotes).forEach(decision => {
                    if (decision === '1') votes.fighter1++;
                    else if (decision === '2') votes.fighter2++;
                    else if (decision === 'tie') votes.tie++;
                });
                
                let champion;
                if (votes.fighter1 > votes.fighter2) {
                    champion = this.competitors[finalFight.fighter1Index];
                } else if (votes.fighter2 > votes.fighter1) {
                    champion = this.competitors[finalFight.fighter2Index];
                } else {
                    // En caso de empate en la final, gana quien tenga más puntos de jueces en la final
                    const fighter1 = this.competitors[finalFight.fighter1Index];
                    const fighter2 = this.competitors[finalFight.fighter2Index];
                    champion = votes.fighter1 >= votes.fighter2 ? fighter1 : fighter2;
                }
                
                championMessage = `
                    <div style="text-align: center; margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #f1c40f, #f39c12); border-radius: 15px; color: white;">
                        <h2 style="margin: 0; font-size: 2rem;">🏆 CAMPEÓN DE LA CATEGORÍA</h2>
                        <h3 style="margin: 10px 0; font-size: 1.5rem;">${champion.name}</h3>
                        <p style="margin: 5px 0;">Ganador de la Final</p>
                    </div>
                `;
            }
            
            finalStandings.innerHTML = `
                ${championMessage}
                <div class="final-standings-table">
                    <h3>📊 Resultados por Llaves</h3>
                    ${this.brackets.map(bracket => `
                        <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 10px; border-left: 5px solid #3498db;">
                            <h4 style="color: #2c3e50; margin-bottom: 10px;">${bracket.name}</h4>
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background: #3498db; color: white;">
                                        <th style="padding: 8px;">Pos</th>
                                        <th style="padding: 8px;">Competidor</th>
                                        <th style="padding: 8px;">Pts Jueces</th>
                                        <th style="padding: 8px;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${bracket.competitors
                                        .sort((a, b) => {
                                            if (b.judgePoints !== a.judgePoints) return b.judgePoints - a.judgePoints;
                                            return b.totalPoints - a.totalPoints;
                                        })
                                        .map((competitor, index) => `
                                            <tr style="border-bottom: 1px solid #ddd; ${index === 0 ? 'background: #27ae60; color: white; font-weight: bold;' : ''}">
                                                <td style="padding: 8px; text-align: center;">${index + 1}°</td>
                                                <td style="padding: 8px;">${competitor.name}</td>
                                                <td style="padding: 8px; text-align: center;">${competitor.judgePoints}</td>
                                                <td style="padding: 8px; text-align: center;">${competitor.totalPoints}</td>
                                            </tr>
                                        `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            // Sistema Round Robin tradicional
            const sortedCompetitors = [...this.competitors].sort((a, b) => {
                if (b.judgePoints !== a.judgePoints) {
                    return b.judgePoints - a.judgePoints;
                }
                if (b.totalPoints !== a.totalPoints) {
                    return b.totalPoints - a.totalPoints;
                }
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
                                <th style="padding: 10px;">Pts Jueces</th>
                                <th style="padding: 10px;">Pts Total</th>
                                <th style="padding: 10px;">G-E-P</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedCompetitors.map((competitor, index) => `
                                <tr style="border-bottom: 1px solid #ddd; ${index === 0 ? 'background: #f1c40f; font-weight: bold;' : ''}">
                                    <td style="padding: 10px; text-align: center;">${index + 1}°</td>
                                    <td style="padding: 10px;">${competitor.name}</td>
                                    <td style="padding: 10px; text-align: center;"><strong>${competitor.judgePoints}</strong></td>
                                    <td style="padding: 10px; text-align: center;">${competitor.totalPoints}</td>
                                    <td style="padding: 10px; text-align: center;">${competitor.wins}-${competitor.ties}-${competitor.losses}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

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
        this.competitorCount = 5;
        
        // Limpiar inputs
        document.querySelectorAll('input[type="text"]').forEach(input => input.value = '');
        
        // Resetear selector
        document.getElementById('competitor-count').value = '5';
        this.updateCompetitorInputs(5);
        
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

    // Métodos para sistema de llaves
    createBrackets() {
        this.brackets = [];
        
        if (this.competitorCount === 6) {
            // 2 llaves de 3
            this.brackets = [
                { id: 1, name: 'Llave A', competitors: this.competitors.slice(0, 3), completed: false },
                { id: 2, name: 'Llave B', competitors: this.competitors.slice(3, 6), completed: false }
            ];
        } else if (this.competitorCount === 7) {
            // 1 llave de 4 + 1 llave de 3
            this.brackets = [
                { id: 1, name: 'Llave A', competitors: this.competitors.slice(0, 4), completed: false },
                { id: 2, name: 'Llave B', competitors: this.competitors.slice(4, 7), completed: false }
            ];
        } else if (this.competitorCount === 8) {
            // 2 llaves de 4
            this.brackets = [
                { id: 1, name: 'Llave A', competitors: this.competitors.slice(0, 4), completed: false },
                { id: 2, name: 'Llave B', competitors: this.competitors.slice(4, 8), completed: false }
            ];
        }
        
        // Asignar llave a cada competidor
        this.brackets.forEach(bracket => {
            bracket.competitors.forEach(competitor => {
                competitor.bracket = bracket.id;
            });
        });
    }

    generateGroupStage() {
        this.fights = [];
        
        // Generar peleas para cada llave
        this.brackets.forEach(bracket => {
            for (let i = 0; i < bracket.competitors.length; i++) {
                for (let j = i + 1; j < bracket.competitors.length; j++) {
                    const fighter1Index = this.competitors.findIndex(c => c.id === bracket.competitors[i].id);
                    const fighter2Index = this.competitors.findIndex(c => c.id === bracket.competitors[j].id);
                    
                    this.fights.push({
                        fighter1Index: fighter1Index,
                        fighter2Index: fighter2Index,
                        bracket: bracket.id,
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
        });
    }

    showBracketsSection() {
        document.getElementById('setup-section').style.display = 'none';
        document.getElementById('brackets-section').style.display = 'block';
        document.getElementById('fight-section').style.display = 'block';
        this.updateBracketsDisplay();
    }

    showFightSection() {
        document.getElementById('setup-section').style.display = 'none';
        document.getElementById('fight-section').style.display = 'block';
    }

    updateBracketsDisplay() {
        const container = document.getElementById('brackets-container');
        container.innerHTML = '';
        
        this.brackets.forEach(bracket => {
            const bracketDiv = document.createElement('div');
            bracketDiv.className = 'bracket';
            bracketDiv.innerHTML = `
                <h3>${bracket.name}</h3>
                <div class="bracket-competitors">
                    ${bracket.competitors.map(competitor => `
                        <div class="bracket-competitor ${this.groupWinners.includes(competitor.id) ? 'qualified' : ''}">
                            ${competitor.name}
                            <small style="display: block; font-size: 0.8em; margin-top: 5px;">
                                ${competitor.totalPoints} pts (${competitor.wins}G-${competitor.ties}E-${competitor.losses}P)
                            </small>
                        </div>
                    `).join('')}
                </div>
            `;
            container.appendChild(bracketDiv);
        });
        
        // Si estamos en fase final, mostrar la final
        if (this.currentPhase === 'final' && this.groupWinners.length === 2) {
            const finalDiv = document.createElement('div');
            finalDiv.className = 'bracket final-bracket';
            const winner1 = this.competitors.find(c => c.id === this.groupWinners[0]);
            const winner2 = this.competitors.find(c => c.id === this.groupWinners[1]);
            
            finalDiv.innerHTML = `
                <h3>🏆 FINAL</h3>
                <div class="bracket-competitors">
                    <div class="bracket-competitor qualified">
                        ${winner1.name}
                        <small style="display: block; font-size: 0.8em; margin-top: 5px;">
                            Ganador ${this.brackets[0].name}
                        </small>
                    </div>
                    <div class="bracket-competitor qualified">
                        ${winner2.name}
                        <small style="display: block; font-size: 0.8em; margin-top: 5px;">
                            Ganador ${this.brackets[1].name}
                        </small>
                    </div>
                </div>
            `;
            container.appendChild(finalDiv);
        }
    }

    checkGroupStageComplete() {
        // Verificar si todas las peleas de grupos están completadas
        const groupFights = this.fights.filter(f => f.bracket && !f.completed);
        return groupFights.length === 0;
    }

    determineGroupWinners() {
        this.groupWinners = [];
        
        this.brackets.forEach(bracket => {
            // Ordenar competidores de la llave por puntos
            const sortedCompetitors = bracket.competitors.sort((a, b) => {
                if (b.judgePoints !== a.judgePoints) {
                    return b.judgePoints - a.judgePoints;
                }
                if (b.totalPoints !== a.totalPoints) {
                    return b.totalPoints - a.totalPoints;
                }
                return b.victoryPoints - a.victoryPoints;
            });
            
            // El primer lugar de cada llave avanza
            this.groupWinners.push(sortedCompetitors[0].id);
            bracket.completed = true;
        });
    }

    generateFinalFight() {
        if (this.groupWinners.length !== 2) return;
        
        const fighter1Index = this.competitors.findIndex(c => c.id === this.groupWinners[0]);
        const fighter2Index = this.competitors.findIndex(c => c.id === this.groupWinners[1]);
        
        this.fights.push({
            fighter1Index: fighter1Index,
            fighter2Index: fighter2Index,
            bracket: null, // No pertenece a ninguna llave
            isFinal: true,
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

    nextPhase() {
        if (this.currentPhase === 'groups') {
            if (this.checkGroupStageComplete()) {
                this.determineGroupWinners();
                this.generateFinalFight();
                this.currentPhase = 'final';
                document.getElementById('current-phase').textContent = 'FINAL';
                document.getElementById('next-phase').style.display = 'none';
                this.updateBracketsDisplay();
                this.loadCurrentFight();
            } else {
                alert('Debe completar todas las peleas de la fase de grupos primero.');
            }
        }
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