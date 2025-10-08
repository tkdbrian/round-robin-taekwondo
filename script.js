// Sistema Round Robin - Taekwon-Do
let tournament; // Variable global para acceso desde HTML

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
        
        // Información de categoría
        this.categoryInfo = {
            gender: '',
            ageFrom: '',
            ageTo: '',
            beltCategory: ''
        };
        
        this.initializeEventListeners();
        this.loadFromLocalStorage(); // Cargar datos guardados
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
        
        // Manejo de categoría personalizada
        document.getElementById('belt-category').addEventListener('change', (e) => {
            const customBelt = document.getElementById('custom-belt');
            if (e.target.value === 'Personalizada') {
                customBelt.style.display = 'block';
            } else {
                customBelt.style.display = 'none';
            }
        });
        
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
        // Capturar información de categoría
        this.categoryInfo = {
            gender: document.getElementById('gender').value,
            ageFrom: document.getElementById('age-from').value,
            ageTo: document.getElementById('age-to').value,
            beltCategory: document.getElementById('belt-category').value === 'Personalizada' 
                ? document.getElementById('custom-belt-text').value 
                : document.getElementById('belt-category').value
        };

        // Validar información de categoría
        if (!this.categoryInfo.ageFrom || !this.categoryInfo.ageTo) {
            alert('Por favor, completa el rango de edades.');
            return;
        }

        if (parseInt(this.categoryInfo.ageFrom) > parseInt(this.categoryInfo.ageTo)) {
            alert('La edad "desde" no puede ser mayor que la edad "hasta".');
            return;
        }

        if (this.categoryInfo.beltCategory === 'Personalizada' && !document.getElementById('custom-belt-text').value.trim()) {
            alert('Por favor, especifica la categoría personalizada de cinturones.');
            return;
        }

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
        this.saveToLocalStorage(); // Guardar estado inicial
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

    showTournamentInfo() {
        const tournamentInfo = document.getElementById('tournament-info');
        const categoryDisplay = document.getElementById('category-display');
        
        categoryDisplay.innerHTML = `
            <div class="category-item">
                <h4>Género</h4>
                <span>${this.categoryInfo.gender}</span>
            </div>
            <div class="category-item">
                <h4>Edad</h4>
                <span>${this.categoryInfo.ageFrom} - ${this.categoryInfo.ageTo} años</span>
            </div>
            <div class="category-item">
                <h4>Cinturones</h4>
                <span>${this.categoryInfo.beltCategory}</span>
            </div>
            <div class="category-item">
                <h4>Competidores</h4>
                <span>${this.competitors.length}</span>
            </div>
        `;
        
        tournamentInfo.style.display = 'block';
    }

    checkForTieAndCreateTiebreaker() {
        // Ordenar competidores según las reglas actuales
        const sortedCompetitors = [...this.competitors].sort((a, b) => {
            if (b.victoryPoints !== a.victoryPoints) {
                return b.victoryPoints - a.victoryPoints;
            }
            return b.judgePoints - a.judgePoints;
        });

        // Verificar si los dos primeros están empatados
        const first = sortedCompetitors[0];
        const second = sortedCompetitors[1];

        if (first.victoryPoints === second.victoryPoints && 
            first.judgePoints === second.judgePoints) {
            
            // HAY EMPATE - Crear combate de desempate
            this.createTiebreakerFight(first, second);
            return true;
        }

        return false; // No hay empate
    }

    createTiebreakerFight(fighter1, fighter2) {
        // Buscar índices de los competidores
        const fighter1Index = this.competitors.findIndex(c => c.id === fighter1.id);
        const fighter2Index = this.competitors.findIndex(c => c.id === fighter2.id);

        // Crear combate de desempate
        const tiebreakerFight = {
            fighter1Index: fighter1Index,
            fighter2Index: fighter2Index,
            completed: false,
            result: null,
            judgeVotes: {
                judge1: null,
                judge2: null,
                judge3: null,
                judge4: null
            },
            isTiebreaker: true // Marcar como combate de desempate
        };

        // Agregar el combate de desempate
        this.fights.push(tiebreakerFight);
        
        // No incrementar currentFightIndex, seguirá en el nuevo combate
        // Actualizar displays
        this.updateScheduleDisplay();
        this.saveToLocalStorage();
        
        // Mostrar mensaje de desempate
        alert(`🥊 COMBATE DE DESEMPATE\n\n${fighter1.name} vs ${fighter2.name}\n\nAmbos competidores están empatados en:\n• Victorias: ${fighter1.victoryPoints}\n• Jueces: ${fighter1.judgePoints}\n\n¡Se realizará un combate final para determinar el ganador!`);
        
        // Cargar el combate de desempate
        this.loadCurrentFight();
    }

    handleTiebreakerResult(currentFight, fighter1, fighter2, votes, decisions) {
        // En combate de desempate, NO se actualizan peleas/victorias/empates normales
        // Solo se determina el ganador por jueces
        
        if (votes.fighter1 > votes.fighter2) {
            // Fighter 1 gana el desempate
            currentFight.result = `${fighter1.name} ganó DESEMPATE`;
            fighter1.tiebreakerWins = (fighter1.tiebreakerWins || 0) + 1;
        } else if (votes.fighter2 > votes.fighter1) {
            // Fighter 2 gana el desempate  
            currentFight.result = `${fighter2.name} ganó DESEMPATE`;
            fighter2.tiebreakerWins = (fighter2.tiebreakerWins || 0) + 1;
        } else {
            // EMPATE EN DESEMPATE - ¡Otro combate de desempate!
            currentFight.result = 'EMPATE - Se requiere nuevo desempate';
            
            // Marcar como completada pero crear otro desempate
            currentFight.completed = true;
            currentFight.completedAt = new Date();
            currentFight.judgeVotes = { ...decisions };
            
            // Avanzar índice y crear nuevo desempate
            this.currentFightIndex++;
            this.updateStandings();
            this.updateFightHistory();
            this.updateScheduleDisplay();
            this.saveToLocalStorage();
            
            alert(`⚡ NUEVO EMPATE\n\n${fighter1.name} y ${fighter2.name} volvieron a empatar en el desempate.\n\n¡Se realizará un nuevo combate de desempate!`);
            
            // Crear otro combate de desempate
            this.createTiebreakerFight(fighter1, fighter2);
            return;
        }
        
        // Marcar pelea como completada
        currentFight.completed = true;
        currentFight.completedAt = new Date();
        currentFight.judgeVotes = { ...decisions };

        // Avanzar a siguiente pelea (que debería terminar la categoría)
        this.currentFightIndex++;
        this.updateStandings();
        this.updateFightHistory();
        this.updateScheduleDisplay();
        this.saveToLocalStorage();
        
        // Mostrar mensaje de ganador del desempate
        const winner = votes.fighter1 > votes.fighter2 ? fighter1.name : fighter2.name;
        alert(`🏆 ¡DESEMPATE RESUELTO!\n\nGanador: ${winner}\n\nLa categoría ha terminado.`);
        
        this.loadCurrentFight();
    }

    loadCurrentFight() {
        console.log('loadCurrentFight - currentFightIndex:', this.currentFightIndex, 'fights.length:', this.fights.length);
        console.log('Peleas disponibles:', this.fights.map(f => ({completed: f.completed, isFinal: f.isFinal})));
        
        if (this.currentFightIndex >= this.fights.length) {
            // Solo verificar empates para Round Robin, no para sistema de brackets
            if (this.competitorCount <= 5) {
                // Verificar si hay empate y necesita desempate
                if (this.checkForTieAndCreateTiebreaker()) {
                    return; // Se creó un combate de desempate, continuar
                }
            }
            
            // Categoría completada sin empates
            this.showTournamentResults();
            return;
        }

        const currentFight = this.fights[this.currentFightIndex];
        console.log('Pelea actual:', currentFight);
        
        if (currentFight.completed) {
            console.log('La pelea actual ya está completada, avanzando...');
            this.currentFightIndex++;
            this.loadCurrentFight();
            return;
        }
        
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

        // Determinar resultado - MAYORÍA DE VOTOS gana
        if (votes.tie > votes.fighter1 && votes.tie > votes.fighter2) {
            // EMPATE tiene mayoría de votos
            winner = 'Empate';
            victoryPoints = `${fighter1.name}: 1 pt, ${fighter2.name}: 1 pt`;
            judgePoints = `${fighter1.name}: +${votes.fighter1} pts, ${fighter2.name}: +${votes.fighter2} pts`;
        } else if (votes.fighter1 > votes.fighter2 && votes.fighter1 > votes.tie) {
            // Fighter 1 tiene mayoría absoluta
            winner = `${fighter1.name} (Ganador)`;
            victoryPoints = `${fighter1.name}: 3 pts, ${fighter2.name}: 0 pts`;
            judgePoints = `${fighter1.name}: +${votes.fighter1} pts, ${fighter2.name}: +${votes.fighter2} pts`;
        } else if (votes.fighter2 > votes.fighter1 && votes.fighter2 > votes.tie) {
            // Fighter 2 tiene mayoría absoluta
            winner = `${fighter2.name} (Ganador)`;
            victoryPoints = `${fighter2.name}: 3 pts, ${fighter1.name}: 0 pts`;
            judgePoints = `${fighter2.name}: +${votes.fighter2} pts, ${fighter1.name}: +${votes.fighter1} pts`;
        } else if (votes.fighter1 > votes.fighter2) {
            // Fighter 1 tiene más votos que fighter 2 (pero empate también puede tener votos)
            winner = `${fighter1.name} (Ganador)`;
            victoryPoints = `${fighter1.name}: 3 pts, ${fighter2.name}: 0 pts`;
            judgePoints = `${fighter1.name}: +${votes.fighter1} pts, ${fighter2.name}: +${votes.fighter2} pts`;
        } else if (votes.fighter2 > votes.fighter1) {
            // Fighter 2 tiene más votos que fighter 1 (pero empate también puede tener votos)
            winner = `${fighter2.name} (Ganador)`;
            victoryPoints = `${fighter2.name}: 3 pts, ${fighter1.name}: 0 pts`;
            judgePoints = `${fighter2.name}: +${votes.fighter2} pts, ${fighter1.name}: +${votes.fighter1} pts`;
        } else {
            // Empate real (fighter1 y fighter2 tienen mismo número de votos)
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
        const fighter1 = this.competitors[currentFight.fighter1Index];
        const fighter2 = this.competitors[currentFight.fighter2Index];

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

        // LÓGICA ESPECIAL PARA COMBATES DE DESEMPATE
        if (currentFight.isTiebreaker) {
            this.handleTiebreakerResult(currentFight, fighter1, fighter2, votes, decisions);
            return;
        }

        // Actualizar estadísticas de competidores (COMBATE NORMAL)
        fighter1.fights++;
        fighter2.fights++;

        // Asignar puntos de victoria/empate - MAYORÍA DE VOTOS gana
        if (votes.tie > votes.fighter1 && votes.tie > votes.fighter2) {
            // EMPATE tiene mayoría de votos
            fighter1.ties++;
            fighter2.ties++;
            fighter1.victoryPoints += 1;
            fighter2.victoryPoints += 1;
            currentFight.result = 'Empate';
        } else if (votes.fighter1 > votes.fighter2 && votes.fighter1 > votes.tie) {
            // Fighter 1 tiene mayoría absoluta
            fighter1.wins++;
            fighter1.victoryPoints += 3;
            fighter2.losses++;
            currentFight.result = `${fighter1.name} ganó`;
        } else if (votes.fighter2 > votes.fighter1 && votes.fighter2 > votes.tie) {
            // Fighter 2 tiene mayoría absoluta
            fighter2.wins++;
            fighter2.victoryPoints += 3;
            fighter1.losses++;
            currentFight.result = `${fighter2.name} ganó`;
        } else if (votes.fighter1 > votes.fighter2) {
            // Fighter 1 tiene más votos que fighter 2 (pero empate también puede tener votos)
            fighter1.wins++;
            fighter1.victoryPoints += 3;
            fighter2.losses++;
            currentFight.result = `${fighter1.name} ganó`;
        } else if (votes.fighter2 > votes.fighter1) {
            // Fighter 2 tiene más votos que fighter 1 (pero empate también puede tener votos)
            fighter2.wins++;
            fighter2.victoryPoints += 3;
            fighter1.losses++;
            currentFight.result = `${fighter2.name} ganó`;
        } else {
            // Empate real (fighter1 y fighter2 tienen mismo número de votos)
            fighter1.ties++;
            fighter2.ties++;
            fighter1.victoryPoints += 1;
            fighter2.victoryPoints += 1;
            currentFight.result = 'Empate';
        }

        // Asignar puntos de jueces (SEPARADOS de los puntos de victoria)
        fighter1.judgePoints += votes.fighter1;
        fighter2.judgePoints += votes.fighter2;

        // Los puntos totales ya NO se usan - solo victorias y jueces por separado

        // Marcar pelea como completada con fecha y hora
        currentFight.completed = true;
        currentFight.completedAt = new Date(); // Agregar timestamp
        currentFight.judgeVotes = { ...decisions };

        // Avanzar a siguiente pelea
        this.currentFightIndex++;
        
        // Actualizar displays
        this.updateStandings();
        this.updateFightHistory();
        this.updateScheduleDisplay();
        this.saveToLocalStorage(); // Auto-guardar progreso
        
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

        // Si es sistema de brackets y estamos en fase de grupos, no mostrar tabla general
        if (this.competitorCount > 5 && this.currentPhase === 'groups') {
            // En fase de grupos de brackets, no mostrar tabla de posiciones general
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 20px; color: #666;">
                        <strong>Fase de Grupos en Progreso</strong><br>
                        Las posiciones se mostrarán al completar todas las peleas de los brackets
                    </td>
                </tr>
            `;
            return;
        }

        // Para Round Robin o después de completar fase de grupos
        // Ordenar competidores: PRIMERO por victorias, en empate por jueces, luego desempates ganados
        const sortedCompetitors = [...this.competitors].sort((a, b) => {
            // Primero: El que tiene más victorias (combates ganados)
            if (b.victoryPoints !== a.victoryPoints) {
                return b.victoryPoints - a.victoryPoints;
            }
            // En caso de empate en victorias: Gana el que tuvo más jueces
            if (b.judgePoints !== a.judgePoints) {
                return b.judgePoints - a.judgePoints;
            }
            // En caso de empate total: Gana el que tiene desempates ganados
            const aTiebreakers = a.tiebreakerWins || 0;
            const bTiebreakers = b.tiebreakerWins || 0;
            if (bTiebreakers !== aTiebreakers) {
                return bTiebreakers - aTiebreakers;
            }
            // Si persiste empate total, mantener orden alfabético
            return a.name.localeCompare(b.name);
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
                <td><strong style="color: #2ecc71; font-size: 1.2em;">${competitor.victoryPoints}</strong></td>
                <td><strong style="color: #e74c3c; font-size: 1.2em;">${competitor.judgePoints}</strong></td>
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
                
                // Formatear fecha y hora
                const completedDate = fight.completedAt || new Date();
                const dateStr = completedDate.toLocaleDateString('es-ES');
                const timeStr = completedDate.toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
                const fightItem = document.createElement('div');
                fightItem.className = `fight-item completed ${fight.isTiebreaker ? 'tiebreaker' : ''}`;
                
                const fightLabel = fight.isTiebreaker ? '⚡ DESEMPATE' : `Pelea ${index + 1}`;
                
                fightItem.innerHTML = `
                    <div class="fight-details">
                        <div class="fight-competitors">${fighter1.name} vs ${fighter2.name}</div>
                        <div class="fight-result">Resultado: ${fight.result}</div>
                        <div class="fight-datetime">📅 ${dateStr} - 🕐 ${timeStr}</div>
                    </div>
                    <div class="fight-number ${fight.isTiebreaker ? 'tiebreaker-label' : ''}">${fightLabel}</div>
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
                                        <th style="padding: 8px;">Victorias</th>
                                        <th style="padding: 8px;">Pts Jueces</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${bracket.competitors
                                        .sort((a, b) => {
                                            if (b.victoryPoints !== a.victoryPoints) return b.victoryPoints - a.victoryPoints;
                                            return b.judgePoints - a.judgePoints;
                                        })
                                        .map((competitor, index) => `
                                            <tr style="border-bottom: 1px solid #ddd; ${index === 0 ? 'background: #27ae60; color: white; font-weight: bold;' : ''}">
                                                <td style="padding: 8px; text-align: center;">${index + 1}°</td>
                                                <td style="padding: 8px;">${competitor.name}</td>
                                                <td style="padding: 8px; text-align: center;"><strong>${competitor.victoryPoints}</strong></td>
                                                <td style="padding: 8px; text-align: center;">${competitor.judgePoints}</td>
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
                // Primero: Por victorias (combates ganados)
                if (b.victoryPoints !== a.victoryPoints) {
                    return b.victoryPoints - a.victoryPoints;
                }
                // En empate: Por jueces
                return b.judgePoints - a.judgePoints;
            });

            finalStandings.innerHTML = `
                <div class="final-standings-table">
                    <h3>🏆 Clasificación Final</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <thead>
                            <tr style="background: #3498db; color: white;">
                                <th style="padding: 10px;">Pos</th>
                                <th style="padding: 10px;">Competidor</th>
                                <th style="padding: 10px;">Victorias</th>
                                <th style="padding: 10px;">Pts Jueces</th>
                                <th style="padding: 10px;">G-E-P</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedCompetitors.map((competitor, index) => `
                                <tr style="border-bottom: 1px solid #ddd; ${index === 0 ? 'background: #f1c40f; font-weight: bold;' : ''}">
                                    <td style="padding: 10px; text-align: center;">${index + 1}°</td>
                                    <td style="padding: 10px;">${competitor.name}</td>
                                    <td style="padding: 10px; text-align: center;"><strong>${competitor.victoryPoints}</strong></td>
                                    <td style="padding: 10px; text-align: center;">${competitor.judgePoints}</td>
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
        
        // Mostrar sección de resultados finales permanente
        this.showFinalResultsSection();
    }

    showFinalResultsSection() {
        // Crear o mostrar sección de resultados finales
        let finalSection = document.getElementById('final-results-section');
        
        if (!finalSection) {
            finalSection = document.createElement('section');
            finalSection.id = 'final-results-section';
            finalSection.className = 'final-results-section';
            
            // Insertar antes del footer
            const footer = document.querySelector('.footer');
            footer.parentNode.insertBefore(finalSection, footer);
        }
        
        // Obtener competidores ordenados (mismo criterio que updateStandings)
        const sortedCompetitors = [...this.competitors].sort((a, b) => {
            if (b.victoryPoints !== a.victoryPoints) {
                return b.victoryPoints - a.victoryPoints;
            }
            if (b.judgePoints !== a.judgePoints) {
                return b.judgePoints - a.judgePoints;
            }
            const aTiebreakers = a.tiebreakerWins || 0;
            const bTiebreakers = b.tiebreakerWins || 0;
            if (bTiebreakers !== aTiebreakers) {
                return bTiebreakers - aTiebreakers;
            }
            return a.name.localeCompare(b.name);
        });
        
        finalSection.innerHTML = `
            <div class="final-results-container">
                <h2><i class="fas fa-trophy"></i> Categoría Finalizada - Resultados</h2>
                
                <div class="tournament-summary">
                    <div class="summary-item">
                        <h4>Categoría</h4>
                        <span>${this.categoryInfo.gender} ${this.categoryInfo.ageFrom}-${this.categoryInfo.ageTo} años</span>
                    </div>
                    <div class="summary-item">
                        <h4>Cinturones</h4>
                        <span>${this.categoryInfo.beltCategory}</span>
                    </div>
                    <div class="summary-item">
                        <h4>Competidores</h4>
                        <span>${this.competitors.length}</span>
                    </div>
                    <div class="summary-item">
                        <h4>Combates</h4>
                        <span>${this.fights.filter(f => f.completed).length}</span>
                    </div>
                </div>
                
                <div class="podium">
                    ${this.competitorCount > 5 ? this.generateBracketPodium() : this.generateRoundRobinPodium(sortedCompetitors)}
                </div>
                
                <div class="final-actions">
                    <button class="action-btn results-btn" onclick="tournament.showTournamentResults()">
                        <i class="fas fa-table"></i>
                        Ver Tabla Completa
                    </button>
                    <button class="action-btn export-btn" onclick="tournament.exportResults()">
                        <i class="fas fa-download"></i>
                        Exportar Resultados
                    </button>
                    <button class="action-btn new-btn" onclick="tournament.newTournament()">
                        <i class="fas fa-plus"></i>
                        Nueva Categoría
                    </button>
                </div>
            </div>
        `;
        
        finalSection.style.display = 'block';
        
        // Scroll suave hacia los resultados
        finalSection.scrollIntoView({ behavior: 'smooth' });
    }

    newTournament() {
        // Confirmar antes de limpiar todo
        if (this.competitors.length > 0) {
            const confirmMsg = `⚠️ LIMPIAR TODO\n\n` +
                `Esto borrará completamente:\n` +
                `• Todos los competidores\n` +
                `• Todos los combates realizados\n` +
                `• El historial completo\n` +
                `• Los datos guardados\n\n` +
                `¿Estás seguro de que quieres empezar un torneo completamente nuevo?`;
            
            if (!confirm(confirmMsg)) {
                return; // No hacer nada si cancela
            }
        }
        
        // Reset completo
        this.competitors = [];
        this.fights = [];
        this.currentFightIndex = 0;
        this.judgeDecisions = {};
        this.competitorCount = 5;
        this.brackets = [];
        this.currentPhase = 'setup';
        this.groupWinners = [];
        this.categoryInfo = {
            gender: '',
            ageFrom: '',
            ageTo: '',
            beltCategory: ''
        };
        
        // Limpiar localStorage
        localStorage.removeItem('taekwondo_tournament');
        
        // Limpiar inputs
        document.querySelectorAll('input[type="text"]').forEach(input => input.value = '');
        
        // Resetear selectores
        document.getElementById('competitor-count').value = '5';
        document.getElementById('gender').value = 'Masculino';
        document.getElementById('belt-category').value = 'Blanco a Punta Amarilla';
        document.getElementById('custom-belt').style.display = 'none';
        this.updateCompetitorInputs(5);
        
        // Mostrar setup inicial
        document.getElementById('setup-section').style.display = 'block';
        document.getElementById('fight-section').style.display = 'none';
        document.getElementById('tournament-result-modal').style.display = 'none';
        
        // Ocultar sección de resultados finales si existe
        const finalSection = document.getElementById('final-results-section');
        if (finalSection) {
            finalSection.style.display = 'none';
        }
        
        // Limpiar displays
        document.getElementById('standings-body').innerHTML = '';
        document.getElementById('fights-list').innerHTML = '';
        document.getElementById('schedule-list').innerHTML = '';
        
        // Confirmar reset
        alert('✅ Nuevo torneo iniciado!\n\nTodos los datos han sido limpiados. Puedes comenzar una nueva categoría.');
    }

    generateBracketPodium() {
        // Para sistema de brackets, mostrar ganadores de cada llave
        const finalFight = this.fights.find(f => f.isFinal && f.completed);
        
        if (finalFight) {
            // Si la final ya se jugó, mostrar 1º y 2º
            const votes = { fighter1: 0, fighter2: 0, tie: 0 };
            Object.values(finalFight.judgeVotes).forEach(decision => {
                if (decision === '1') votes.fighter1++;
                else if (decision === '2') votes.fighter2++;
                else if (decision === 'tie') votes.tie++;
            });

            let champion, runnerUp;
            if (votes.fighter1 > votes.fighter2) {
                champion = this.competitors[finalFight.fighter1Index];
                runnerUp = this.competitors[finalFight.fighter2Index];
            } else if (votes.fighter2 > votes.fighter1) {
                champion = this.competitors[finalFight.fighter2Index];
                runnerUp = this.competitors[finalFight.fighter1Index];
            } else {
                // En caso de empate, usar puntos de jueces de la final
                champion = votes.fighter1 >= votes.fighter2 ? 
                    this.competitors[finalFight.fighter1Index] : 
                    this.competitors[finalFight.fighter2Index];
                runnerUp = champion === this.competitors[finalFight.fighter1Index] ? 
                    this.competitors[finalFight.fighter2Index] : 
                    this.competitors[finalFight.fighter1Index];
            }

            return `
                <div class="podium-place place-1">
                    <div class="place-number">1°</div>
                    <div class="competitor-name">${champion.name}</div>
                    <div class="competitor-stats">
                        <span class="victories">🏆 CAMPEÓN</span>
                        <span class="judges">Ganador de la Final</span>
                    </div>
                </div>
                <div class="podium-place place-2">
                    <div class="place-number">2°</div>
                    <div class="competitor-name">${runnerUp.name}</div>
                    <div class="competitor-stats">
                        <span class="victories">🥈 SUBCAMPEÓN</span>
                        <span class="judges">Finalista</span>
                    </div>
                </div>
            `;
        } else {
            // Si la final no se ha jugado, mostrar ganadores de cada llave
            const winner1 = this.competitors.find(c => c.id === this.groupWinners[0]);
            const winner2 = this.competitors.find(c => c.id === this.groupWinners[1]);
            
            return `
                <div class="podium-place place-1">
                    <div class="place-number">1°</div>
                    <div class="competitor-name">${winner1.name}</div>
                    <div class="competitor-stats">
                        <span class="victories">👑 Ganador ${this.brackets[0].name}</span>
                        <span class="judges">${winner1.judgePoints} jueces</span>
                    </div>
                </div>
                <div class="podium-place place-1">
                    <div class="place-number">1°</div>
                    <div class="competitor-name">${winner2.name}</div>
                    <div class="competitor-stats">
                        <span class="victories">👑 Ganador ${this.brackets[1].name}</span>
                        <span class="judges">${winner2.judgePoints} jueces</span>
                    </div>
                </div>
            `;
        }
    }

    generateRoundRobinPodium(sortedCompetitors) {
        // Para Round Robin, mostrar solo 1º y 2º lugar (sin 3º puesto)
        return sortedCompetitors.slice(0, 2).map((competitor, index) => `
            <div class="podium-place place-${index + 1}">
                <div class="place-number">${index + 1}°</div>
                <div class="competitor-name">${competitor.name}</div>
                <div class="competitor-stats">
                    <span class="victories">${competitor.victoryPoints} victorias</span>
                    <span class="judges">${competitor.judgePoints} jueces</span>
                </div>
            </div>
        `).join('');
    }

    exportResults() {
        // Mostrar opciones de exportación
        const exportChoice = confirm(
            "📊 EXPORTAR RESULTADOS\n\n" +
            "✅ OK = Reporte Completo (PDF profesional)\n" +
            "❌ Cancelar = Datos CSV (solo números)\n\n" +
            "¿Qué tipo de exportación prefieres?"
        );

        if (exportChoice) {
            this.exportProfessionalReport();
        } else {
            this.exportCSVData();
        }
    }

    exportProfessionalReport() {
        // Crear reporte HTML completo para convertir a PDF
        const sortedCompetitors = [...this.competitors].sort((a, b) => {
            if (b.victoryPoints !== a.victoryPoints) {
                return b.victoryPoints - a.victoryPoints;
            }
            if (b.judgePoints !== a.judgePoints) {
                return b.judgePoints - a.judgePoints;
            }
            const aTiebreakers = a.tiebreakerWins || 0;
            const bTiebreakers = b.tiebreakerWins || 0;
            if (bTiebreakers !== aTiebreakers) {
                return bTiebreakers - aTiebreakers;
            }
            return a.name.localeCompare(b.name);
        });

        const reportContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reporte de Categoría - Taekwon-Do</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
        .header { text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; }
        .category-info { background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
        .info-item { text-align: center; padding: 10px; background: #f8f9fa; border-radius: 8px; }
        .info-label { font-weight: bold; color: #666; font-size: 0.9rem; }
        .info-value { font-size: 1.1rem; color: #2c3e50; margin-top: 5px; }
        .podium { display: flex; justify-content: center; margin: 30px 0; gap: 20px; }
        .podium-place { text-align: center; padding: 20px; border-radius: 10px; min-width: 150px; }
        .place-1 { background: linear-gradient(145deg, #f1c40f, #f39c12); color: white; transform: scale(1.1); }
        .place-2 { background: linear-gradient(145deg, #95a5a6, #7f8c8d); color: white; }
        .place-3 { background: linear-gradient(145deg, #cd7f32, #b8860b); color: white; }
        .place-number { font-size: 2rem; font-weight: bold; }
        .competitor-name { font-size: 1.2rem; margin: 10px 0; }
        .table-container { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: center; border-bottom: 1px solid #ddd; }
        th { background: #3498db; color: white; font-weight: bold; }
        tr:nth-child(even) { background: #f8f9fa; }
        tr:hover { background: #e3f2fd; }
        .winner { background: #d4edda !important; font-weight: bold; }
        .fights-section { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 20px 0; }
        .fight-item { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
        .fight-item.tiebreaker { background: #fff5f5; border-left: 4px solid #e74c3c; }
        .tiebreaker-tag { background: #e74c3c; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏆 REPORTE OFICIAL DE CATEGORÍA</h1>
        <h2>TAEKWON-DO</h2>
    </div>

    <div class="category-info">
        <h3>📋 Información de la Categoría</h3>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Género</div>
                <div class="info-value">${this.categoryInfo.gender}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Edad</div>
                <div class="info-value">${this.categoryInfo.ageFrom} - ${this.categoryInfo.ageTo} años</div>
            </div>
            <div class="info-item">
                <div class="info-label">Cinturones</div>
                <div class="info-value">${this.categoryInfo.beltCategory}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Fecha</div>
                <div class="info-value">${new Date().toLocaleDateString('es-ES')}</div>
            </div>
        </div>
    </div>

    <div class="podium">
        ${sortedCompetitors.slice(0, 3).map((competitor, index) => `
            <div class="podium-place place-${index + 1}">
                <div class="place-number">${index + 1}°</div>
                <div class="competitor-name">${competitor.name}</div>
                <div>${competitor.victoryPoints} victorias</div>
                <div>${competitor.judgePoints} pts jueces</div>
            </div>
        `).join('')}
    </div>

    <div class="table-container">
        <h3>📊 Clasificación Final</h3>
        <table>
            <thead>
                <tr>
                    <th>Pos</th>
                    <th>Competidor</th>
                    <th>Peleas</th>
                    <th>Ganadas</th>
                    <th>Empates</th>
                    <th>Perdidas</th>
                    <th>Pts Victoria</th>
                    <th>Pts Jueces</th>
                    ${this.competitors.some(c => c.tiebreakerWins) ? '<th>Desempates</th>' : ''}
                </tr>
            </thead>
            <tbody>
                ${sortedCompetitors.map((competitor, index) => `
                    <tr class="${index === 0 ? 'winner' : ''}">
                        <td>${index + 1}°</td>
                        <td><strong>${competitor.name}</strong></td>
                        <td>${competitor.fights}</td>
                        <td>${competitor.wins}</td>
                        <td>${competitor.ties}</td>
                        <td>${competitor.losses}</td>
                        <td><strong>${competitor.victoryPoints}</strong></td>
                        <td><strong>${competitor.judgePoints}</strong></td>
                        ${this.competitors.some(c => c.tiebreakerWins) ? `<td>${competitor.tiebreakerWins || 0}</td>` : ''}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="fights-section">
        <h3>🥊 Historial de Combates</h3>
        ${this.fights.filter(f => f.completed).map((fight, index) => {
            const fighter1 = this.competitors[fight.fighter1Index];
            const fighter2 = this.competitors[fight.fighter2Index];
            const date = fight.completedAt ? new Date(fight.completedAt) : new Date();
            return `
                <div class="fight-item ${fight.isTiebreaker ? 'tiebreaker' : ''}">
                    <div>
                        <strong>${fighter1.name} vs ${fighter2.name}</strong>
                        ${fight.isTiebreaker ? '<span class="tiebreaker-tag">DESEMPATE</span>' : ''}
                        <br>
                        <small>${date.toLocaleDateString('es-ES')} - ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                    <div>
                        <strong>${fight.result}</strong>
                    </div>
                </div>
            `;
        }).join('')}
    </div>

    <div class="footer">
        <p>📅 Reporte generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}</p>
        <p>🥋 Sistema de Puntuación Taekwon-Do - Brian E. Lipnjak</p>
    </div>
</body>
</html>`;

        // Crear y descargar el archivo HTML
        const blob = new Blob([reportContent], { type: 'text/html;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        
        const categoryName = `${this.categoryInfo.gender}_${this.categoryInfo.ageFrom}-${this.categoryInfo.ageTo}_${this.categoryInfo.beltCategory}`.replace(/\s+/g, '_');
        link.download = `Reporte_Taekwondo_${categoryName}_${new Date().toISOString().split('T')[0]}.html`;
        
        link.click();
        
        alert('📄 ¡Reporte generado!\n\nSe descargó un archivo HTML que puedes:\n• Abrir en cualquier navegador\n• Imprimir como PDF\n• Compartir fácilmente');
    }

    exportCSVData() {
        const sortedCompetitors = [...this.competitors].sort((a, b) => {
            if (b.victoryPoints !== a.victoryPoints) {
                return b.victoryPoints - a.victoryPoints;
            }
            if (b.judgePoints !== a.judgePoints) {
                return b.judgePoints - a.judgePoints;
            }
            const aTiebreakers = a.tiebreakerWins || 0;
            const bTiebreakers = b.tiebreakerWins || 0;
            if (bTiebreakers !== aTiebreakers) {
                return bTiebreakers - aTiebreakers;
            }
            return a.name.localeCompare(b.name);
        });

        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Información de categoría
        csvContent += "CATEGORIA DE TAEKWON-DO\\n";
        csvContent += `Genero,${this.categoryInfo.gender}\\n`;
        csvContent += `Edad,${this.categoryInfo.ageFrom}-${this.categoryInfo.ageTo} años\\n`;
        csvContent += `Cinturones,${this.categoryInfo.beltCategory}\\n`;
        csvContent += `Fecha,${new Date().toLocaleDateString('es-ES')}\\n\\n`;
        
        // Encabezados de tabla
        csvContent += "Posicion,Nombre,Peleas,Ganadas,Empates,Perdidas,Pts_Victoria,Pts_Jueces";
        if (this.competitors.some(c => c.tiebreakerWins)) {
            csvContent += ",Desempates_Ganados";
        }
        csvContent += "\\n";
        
        // Datos de competidores
        sortedCompetitors.forEach((competitor, index) => {
            csvContent += `${index + 1},${competitor.name},${competitor.fights},${competitor.wins},${competitor.ties},${competitor.losses},${competitor.victoryPoints},${competitor.judgePoints}`;
            if (this.competitors.some(c => c.tiebreakerWins)) {
                csvContent += `,${competitor.tiebreakerWins || 0}`;
            }
            csvContent += "\\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        
        const categoryName = `${this.categoryInfo.gender}_${this.categoryInfo.ageFrom}-${this.categoryInfo.ageTo}`.replace(/\s+/g, '_');
        link.setAttribute("download", `Datos_Taekwondo_${categoryName}_${new Date().toISOString().split('T')[0]}.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('📊 ¡Datos CSV exportados!\n\nArchivo con datos básicos para análisis en Excel.');
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
        this.showTournamentInfo(); // Mostrar información de categoría
        this.updateBracketsDisplay();
    }

    showFightSection() {
        document.getElementById('setup-section').style.display = 'none';
        document.getElementById('fight-section').style.display = 'block';
        this.showTournamentInfo(); // Mostrar información de categoría
    }

    updateBracketStatistics() {
        // Solo actualizar estadísticas para competidores en brackets
        const bracketCompetitorIds = this.brackets.flatMap(bracket => 
            bracket.competitors.map(c => c.id)
        );
        
        // Reiniciar estadísticas solo de competidores en brackets
        this.competitors.forEach(competitor => {
            if (bracketCompetitorIds.includes(competitor.id)) {
                competitor.fights = 0;
                competitor.wins = 0;
                competitor.ties = 0;
                competitor.losses = 0;
                competitor.victoryPoints = 0;
                competitor.judgePoints = 0;
            }
        });

        // Recalcular estadísticas basándose en peleas completadas de brackets
        this.fights.forEach(fight => {
            if (fight.completed && fight.bracket) { // Solo peleas de brackets
                const fighter1 = this.competitors[fight.fighter1Index];
                const fighter2 = this.competitors[fight.fighter2Index];
                
                fighter1.fights++;
                fighter2.fights++;

                // Contar votos para determinar resultado
                const votes = { fighter1: 0, fighter2: 0, tie: 0 };
                Object.values(fight.judgeVotes).forEach(decision => {
                    if (decision === '1') votes.fighter1++;
                    else if (decision === '2') votes.fighter2++;
                    else if (decision === 'tie') votes.tie++;
                });

                // Determinar ganador y actualizar estadísticas
                if (votes.fighter1 > votes.fighter2 && votes.fighter1 > votes.tie) {
                    // Fighter1 gana
                    fighter1.wins++;
                    fighter1.victoryPoints += 3;
                    fighter2.losses++;
                } else if (votes.fighter2 > votes.fighter1 && votes.fighter2 > votes.tie) {
                    // Fighter2 gana
                    fighter2.wins++;
                    fighter2.victoryPoints += 3;
                    fighter1.losses++;
                } else {
                    // Empate (mayoría de votos empate o empate en votos ganadores)
                    fighter1.ties++;
                    fighter2.ties++;
                    fighter1.victoryPoints += 1;
                    fighter2.victoryPoints += 1;
                }

                // Asignar puntos de jueces
                fighter1.judgePoints += votes.fighter1;
                fighter2.judgePoints += votes.fighter2;
            }
        });
    }

    updateBracketsDisplay() {
        // Primero actualizar las estadísticas de todos los competidores
        this.updateBracketStatistics();
        
        const container = document.getElementById('brackets-container');
        container.innerHTML = '';
        
        this.brackets.forEach(bracket => {
            const bracketDiv = document.createElement('div');
            bracketDiv.className = 'bracket';
            
            // Ordenar competidores dentro del bracket por estadísticas
            const sortedCompetitors = [...bracket.competitors].sort((a, b) => {
                // Primero por puntos de victoria
                if (b.victoryPoints !== a.victoryPoints) {
                    return b.victoryPoints - a.victoryPoints;
                }
                // Luego por puntos de jueces
                if (b.judgePoints !== a.judgePoints) {
                    return b.judgePoints - a.judgePoints;
                }
                // Finalmente alfabético
                return a.name.localeCompare(b.name);
            });
            
            bracketDiv.innerHTML = `
                <h3>${bracket.name}</h3>
                <div class="bracket-competitors">
                    ${sortedCompetitors.map((competitor, index) => `
                        <div class="bracket-competitor ${this.groupWinners.includes(competitor.id) ? 'qualified' : ''}">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: ${index === 0 ? 'bold' : 'normal'};">
                                    ${index + 1}º ${competitor.name}
                                </span>
                                ${index === 0 && this.currentPhase === 'groups' ? '<span style="color: #27ae60;">👑</span>' : ''}
                            </div>
                            <small style="display: block; font-size: 0.8em; margin-top: 5px;">
                                ${competitor.judgePoints} pts (${competitor.wins}G-${competitor.ties}E-${competitor.losses}P)
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
            
            // Buscar si ya se completó la final
            const finalFight = this.fights.find(f => f.isFinal);
            let finalResult = '';
            let champion = null;
            
            if (finalFight && finalFight.completed) {
                // La final ya se jugó
                if (finalFight.result.includes(winner1.name)) {
                    champion = winner1;
                    finalResult = `<div class="champion-announcement">🏆 CAMPEÓN: <strong>${winner1.name}</strong></div>`;
                } else if (finalFight.result.includes(winner2.name)) {
                    champion = winner2;
                    finalResult = `<div class="champion-announcement">🏆 CAMPEÓN: <strong>${winner2.name}</strong></div>`;
                } else if (finalFight.result === 'Empate') {
                    finalResult = `<div class="champion-announcement">⚡ EMPATE EN FINAL - Se requiere desempate</div>`;
                }
            }
            
            finalDiv.innerHTML = `
                <h3>🏆 FINAL DE LA CATEGORÍA</h3>
                ${finalResult}
                <div class="bracket-competitors">
                    <div class="bracket-competitor qualified ${champion === winner1 ? 'champion' : ''}">
                        ${winner1.name}
                        <small style="display: block; font-size: 0.8em; margin-top: 5px;">
                            Ganador ${this.brackets[0].name}
                        </small>
                    </div>
                    <div class="vs-indicator">VS</div>
                    <div class="bracket-competitor qualified ${champion === winner2 ? 'champion' : ''}">
                        ${winner2.name}
                        <small style="display: block; font-size: 0.8em; margin-top: 5px;">
                            Ganador ${this.brackets[1].name}
                        </small>
                    </div>
                </div>
                ${finalFight && finalFight.completed ? 
                    `<div class="final-result">
                        <strong>Resultado Final:</strong> ${finalFight.result}<br>
                        <small>Fecha: ${finalFight.completedAt ? finalFight.completedAt.toLocaleDateString('es-ES') : ''} - 
                        Hora: ${finalFight.completedAt ? finalFight.completedAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}</small>
                    </div>` : 
                    '<div class="final-pending">⏳ Final pendiente</div>'
                }
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
            // Ordenar competidores de la llave por puntos CORRECTOS
            const sortedCompetitors = bracket.competitors.sort((a, b) => {
                // Primero: victorias
                if (b.victoryPoints !== a.victoryPoints) {
                    return b.victoryPoints - a.victoryPoints;
                }
                // Segundo: jueces
                if (b.judgePoints !== a.judgePoints) {
                    return b.judgePoints - a.judgePoints;
                }
                // Tercero: desempates ganados
                const aTiebreakers = a.tiebreakerWins || 0;
                const bTiebreakers = b.tiebreakerWins || 0;
                if (bTiebreakers !== aTiebreakers) {
                    return bTiebreakers - aTiebreakers;
                }
                // Cuarto: alfabético
                return a.name.localeCompare(b.name);
            });
            
            // El primer lugar de cada llave avanza a la FINAL
            this.groupWinners.push(sortedCompetitors[0].id);
            bracket.completed = true;
            bracket.winner = sortedCompetitors[0]; // Guardar ganador para mostrar
        });
        
        console.log('Ganadores de llaves:', this.groupWinners);
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
        
        // Actualizar currentFightIndex para apuntar a la pelea final
        this.currentFightIndex = this.fights.length - 1;
    }

    nextPhase() {
        if (this.currentPhase === 'groups') {
            if (this.checkGroupStageComplete()) {
                this.determineGroupWinners();
                this.generateFinalFight();
                this.currentPhase = 'final';
                document.getElementById('current-phase').textContent = 'FINAL';
                document.getElementById('next-phase').style.display = 'none';
                // Asegurar que la sección de peleas esté visible para la final
                document.getElementById('fight-section').style.display = 'block';
                this.updateBracketsDisplay();
                this.loadCurrentFight();
            } else {
                alert('Debe completar todas las peleas de la fase de grupos primero.');
            }
        }
    }

    // Función de auto-guardado local solamente
    saveToLocalStorage() {
        const tournamentData = {
            competitors: this.competitors,
            fights: this.fights,
            currentFightIndex: this.currentFightIndex,
            categoryInfo: this.categoryInfo,
            competitorCount: this.competitorCount,
            brackets: this.brackets,
            currentPhase: this.currentPhase,
            groupWinners: this.groupWinners,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('taekwondo_tournament', JSON.stringify(tournamentData));
        console.log('✅ Torneo guardado automáticamente');
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('taekwondo_tournament');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                
                // Mostrar opción de continuar torneo guardado
                if (data.competitors && data.competitors.length > 0) {
                    const continueMsg = `🔄 RECUPERAR TORNEO GUARDADO\n\n` +
                        `Se encontró un torneo guardado automáticamente:\n\n` +
                        `📋 Categoría: ${data.categoryInfo.gender} ${data.categoryInfo.ageFrom}-${data.categoryInfo.ageTo} años\n` +
                        `🥋 Cinturones: ${data.categoryInfo.beltCategory}\n` +
                        `👥 Competidores: ${data.competitors.length}\n` +
                        `📅 Guardado: ${new Date(data.timestamp).toLocaleDateString('es-ES')} ${new Date(data.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}\n\n` +
                        `¿Deseas continuar este torneo?`;
                    
                    if (confirm(continueMsg)) {
                        this.restoreFromData(data);
                        alert('✅ Torneo recuperado exitosamente!');
                        return true;
                    } else {
                        // Si no quiere continuar, limpiar datos guardados
                        localStorage.removeItem('taekwondo_tournament');
                    }
                }
            } catch (e) {
                console.log('Error cargando datos guardados:', e);
                localStorage.removeItem('taekwondo_tournament');
            }
        }
        return false;
    }

    restoreFromData(data) {
        this.competitors = data.competitors || [];
        this.fights = data.fights || [];
        this.currentFightIndex = data.currentFightIndex || 0;
        this.categoryInfo = data.categoryInfo || {};
        this.competitorCount = data.competitorCount || 5;
        this.brackets = data.brackets || [];
        this.currentPhase = data.currentPhase || 'setup';
        this.groupWinners = data.groupWinners || [];

        // Restaurar fechas de las peleas
        this.fights.forEach(fight => {
            if (fight.completedAt) {
                fight.completedAt = new Date(fight.completedAt);
            }
        });

        // Mostrar la vista correcta según el estado
        if (this.competitors.length > 0) {
            if (this.competitorCount >= 6) {
                this.showBracketsSection();
            } else {
                this.showFightSection();
            }
            this.updateStandings();
            this.updateScheduleDisplay();
            this.updateFightHistory();
            if (this.currentFightIndex < this.fights.length) {
                this.loadCurrentFight();
            }
        }
    }
}

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    tournament = new RoundRobinTournament();
});

// Funcionalidad adicional para cerrar modal al hacer clic fuera
window.addEventListener('click', function(event) {
    const modal = document.getElementById('tournament-result-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Variable tournament ya declarada al inicio del archivo