(function () {
    const TIME_LIMIT_SEC = 180;
    const POINTS_CORRECT_L1 = 20, PENALTY_L1 = 5;
    const POINTS_CORRECT_L2 = 30, PENALTY_L2 = 10;
    const POINTS_CORRECT_L3 = 40, PENALTY_L3 = 15;

    const ROUNDS_PER_LEVEL = 3;

    let state = {
        playerName: '',
        level: 1,
        score: 0,
        timeLeft: TIME_LIMIT_SEC,
        timerId: null,
        round: 0,
        level1Question: null,
        level1Selected: [],
        level1UsedQuestionIndices: [],
        level2Slots: [],
        level2Filled: {},
        level3Data: null,
        level3UsedQuestionIndices: [],
        level3StartTime: null,
        level3MovementIntervals: [],
        testMode: false
    };

    function getParams() {
        const params = new URLSearchParams(location.search);
        return {
            name: params.get('name') || localStorage.getItem('Game_ElectricCircuits_name') || 'Игрок',
            startLevel: parseInt(params.get('level') || '1', 10),
            testMode: params.get('test') === '1'
        };
    }

    function startTimer() {
        if (state.timerId) clearInterval(state.timerId);
        state.timerId = setInterval(() => {
            state.timeLeft--;
            updateHeader();
            if (state.timeLeft <= 0) {
                clearInterval(state.timerId);
                endGame('time');
            }
        }, 1000);
    }

    function updateHeader() {
        const el = document.getElementById('gameHeader');
        if (!el) return;
        el.querySelector('.player-name').textContent = state.playerName;
        el.querySelector('.score-box').textContent = 'Очки: ' + state.score;
        el.querySelector('.timer-box').textContent = 'Время: ' + Math.max(0, state.timeLeft) + ' с';
        el.querySelector('.level-badge').textContent = 'Уровень ' + state.level;
    }

    function addScore(points) {
        state.score = Math.max(0, state.score + points);
        updateHeader();
    }

    function endLevel(success) {
        if (state.timerId) clearInterval(state.timerId);
        const timeSpent = TIME_LIMIT_SEC - state.timeLeft;
        if (success && state.level < 3) {
            state.level++;
            state.round = 0;
            state.level1UsedQuestionIndices = [];
            state.level3UsedQuestionIndices = [];
            state.timeLeft = Math.max(30, state.timeLeft);
            state.timerId = setInterval(() => {
                state.timeLeft--;
                updateHeader();
                if (state.timeLeft <= 0) {
                    clearInterval(state.timerId);
                    endGame('time');
                }
            }, 1000);
            renderLevel();
            return;
        }
        if (success && state.level === 3) {
            endGame('win', timeSpent);
            return;
        }
        endGame(success ? 'win' : 'fail', timeSpent);
    }

    function endGame(reason, timeSpent) {
        if (state.timerId) clearInterval(state.timerId);
        timeSpent = timeSpent != null ? timeSpent : (TIME_LIMIT_SEC - state.timeLeft);
        saveResultLocal(state.playerName, state.score, state.level, timeSpent);
        const params = new URLSearchParams({
            name: state.playerName,
            score: state.score,
            level: state.level,
            time: timeSpent,
            reason: reason || 'end'
        });
        location.href = 'rating.html?' + params.toString();
    }

    function renderLevel() {
        const container = document.getElementById('levelContainer');
        if (!container) return;
        updateHeader();

        if (state.level === 1) renderLevel1(container);
        else if (state.level === 2) renderLevel2(container);
        else renderLevel3(container);
    }

    function renderLevel1(container) {
        if (!container) container = document.getElementById('levelContainer');
        state.level1Question = getRandomQuestionLevel1(state.level1UsedQuestionIndices);
        state.level1Selected = [];
        var q = state.level1Question;
        container.innerHTML = `
          <h2>Уровень 1 — Узнай элемент (вопрос ${state.round + 1} из ${ROUNDS_PER_LEVEL})</h2>
          <p class="question-text">${q.text}</p>
          <p style="margin-bottom:10px;font-size:0.9rem;color:#aaa;">Наведи курсор на карточку для подсказки, двойной клик — выбрать.</p>
          <div id="level1Feedback" class="level1-feedback" role="status" aria-live="polite"></div>
          <div class="cards-grid" id="cardsGrid"></div>
          <div class="game-actions">
            <button class="btn btn-primary" id="checkL1">Проверить</button>
            <button class="btn btn-success" id="finishLevel">Завершить уровень</button>
          </div>
        `;
        const grid = document.getElementById('cardsGrid');
        q.components.forEach(comp => {
            const card = document.createElement('div');
            card.className = 'component-card';
            card.dataset.id = comp.id;
            card.innerHTML = `<span class="icon">${comp.icon}</span><span class="label">${comp.name}</span>`;
            card.addEventListener('mouseenter', function () {
                this.title = comp.name + ' (двойной клик — выбрать)';
            });
            card.addEventListener('dblclick', function () {
                if (state.level1Selected.includes(comp.id)) {
                    state.level1Selected = state.level1Selected.filter(x => x !== comp.id);
                } else {
                    state.level1Selected.push(comp.id);
                }
                card.classList.toggle('selected', state.level1Selected.includes(comp.id));
            });
            grid.appendChild(card);
        });
        document.getElementById('checkL1').addEventListener('click', () => checkLevel1());
        document.getElementById('finishLevel').addEventListener('click', () => endLevel(true));
    }

    function checkLevel1() {
        var correct = state.level1Question.correct.slice().sort().join(',');
        var selected = state.level1Selected.slice().sort().join(',');
        const cards = document.querySelectorAll('.component-card');
        const correctIds = state.level1Question.correct;
        
        if (correct === selected) {
            // Правильный ответ - показать зеленым все выбранные
            cards.forEach(card => {
                if (state.level1Selected.includes(card.dataset.id)) {
                    card.classList.add('correct-answer');
                }
            });
            addScore(POINTS_CORRECT_L1);
            if (state.level1Question.questionIndex !== undefined) {
                state.level1UsedQuestionIndices.push(state.level1Question.questionIndex);
            }
            state.round++;
            setTimeout(() => {
                if (state.round >= ROUNDS_PER_LEVEL) {
                    endLevel(true);
                } else {
                    renderLevel1(document.getElementById('levelContainer'));
                }
            }, 1500);
        } else {
            // Неправильный ответ - показать правильные зеленым, неправильные красным
            cards.forEach(card => {
                const cardId = card.dataset.id;
                const isCorrect = correctIds.includes(cardId);
                const isSelected = state.level1Selected.includes(cardId);
                
                if (isCorrect && isSelected) {
                    card.classList.add('correct-answer');
                } else if (isCorrect && !isSelected) {
                    card.classList.add('should-be-selected');
                } else if (!isCorrect && isSelected) {
                    card.classList.add('wrong-answer');
                }
            });
            addScore(-PENALTY_L1);
            
            // Показать сообщение об ошибке
            const feedbackEl = document.getElementById('level1Feedback');
            if (feedbackEl) {
                feedbackEl.className = 'level1-feedback level1-feedback--error';
                feedbackEl.textContent = 'Неправильно! (-' + PENALTY_L1 + ' очков) Зеленым показаны правильные ответы, красным - неправильно выбранные.';
            }
            
            // Сбросить визуальные эффекты через 3 секунды
            setTimeout(() => {
                cards.forEach(card => {
                    card.classList.remove('correct-answer', 'wrong-answer', 'should-be-selected');
                });
                if (feedbackEl) {
                    feedbackEl.textContent = '';
                    feedbackEl.className = 'level1-feedback';
                }
            }, 3000);
        }
    }

    function renderLevel2(container) {
        if (!container) container = document.getElementById('levelContainer');
        state.level2Slots = getLevel2Slots(state.round);
        state.level2Filled = {};
        var draggables = getLevel2Draggables(state.round);
        var phrase = getLevel2Phrase(state.round);
        var slotsHtml = state.level2Slots.map(function(s, i) {
            return '<div class="drop-slot" data-slot-id="' + s.id + '" data-index="' + i + '"><span class="slot-placeholder">?</span></div>';
        }).join('');
        container.innerHTML = `
          <h2>Уровень 2 — ${phrase.title} (цепь ${state.round + 1} из ${ROUNDS_PER_LEVEL})</h2>
          <p class="question-text">Перетащите элементы слева в три ячейки справа в таком порядке:</p>
          <p class="level2-order-hint">${phrase.orderHint}</p>
          <p style="margin-top:8px;margin-bottom:10px;font-size:0.85rem;color:#aaa;">💡 Подсказка: двойной клик по заполненной ячейке удалит элемент</p>
          <div id="level2Feedback" class="level2-feedback" role="status" aria-live="polite"></div>
          <div class="circuit-area" id="circuitArea">
            <div id="draggablesRow"></div>
            ${slotsHtml}
          </div>
          <div class="game-actions">
            <button class="btn btn-primary" id="checkL2">Проверить</button>
            <button class="btn btn-success" id="finishLevel2">Завершить уровень</button>
          </div>
        `;
        const area = document.getElementById('circuitArea');
        const drRow = document.getElementById('draggablesRow');
        drRow.style.cssText = 'display:flex; gap:15px; flex-wrap:wrap;';
        draggables.forEach(comp => {
            const el = document.createElement('div');
            el.className = 'draggable-component';
            el.draggable = true;
            el.dataset.id = comp.id;
            el.innerHTML = `<span class="icon">${comp.icon}</span><span class="label">${comp.name}</span>`;
            el.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', comp.id);
                el.classList.add('dragging');
            });
            el.addEventListener('dragend', () => el.classList.remove('dragging'));
            drRow.appendChild(el);
        });
        const slots = area.querySelectorAll('.drop-slot');
        slots.forEach(slot => {
            slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('drag-over'); });
            slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
            slot.addEventListener('drop', e => {
                e.preventDefault();
                slot.classList.remove('drag-over');
                const id = e.dataTransfer.getData('text/plain');
                if (!id) return;
                
                const slotIndex = slot.dataset.index;
                const oldId = state.level2Filled[slotIndex];
                
                // Если перетаскиваем тот же элемент в тот же слот, ничего не делаем
                if (oldId === id) return;
                
                // Убираем визуальные индикаторы при изменении
                slot.classList.remove('slot-correct', 'slot-wrong');
                
                // Если элемент уже находится в другом слоте, удаляем его оттуда
                Object.keys(state.level2Filled).forEach(function(key) {
                    if (state.level2Filled[key] === id && parseInt(key, 10) !== parseInt(slotIndex, 10)) {
                        const otherSlot = area.querySelector(`[data-index="${key}"]`);
                        if (otherSlot) {
                            otherSlot.classList.remove('slot-correct', 'slot-wrong', 'filled');
                            otherSlot.innerHTML = '<span class="slot-placeholder">?</span>';
                        }
                        delete state.level2Filled[key];
                    }
                });
                
                // Если текущий слот уже заполнен другим элементом, возвращаем старый элемент в список доступных
                if (oldId !== undefined) {
                    returnElementToDraggables(oldId, drRow);
                }
                
                // Удаляем элемент из списка доступных (если он там есть)
                removeElementFromDraggables(id, drRow);
                
                // Заполняем слот новым элементом
                state.level2Filled[slotIndex] = id;
                const comp = COMPONENTS.find(c => c.id === id);
                slot.innerHTML = `<span class="icon">${comp.icon}</span><span class="label">${comp.name}</span><span class="slot-remove-hint" title="Двойной клик для удаления">×</span>`;
                slot.classList.add('filled');
                
                // Убираем сообщение об ошибке, если пользователь начал исправлять
                const feedbackEl = document.getElementById('level2Feedback');
                if (feedbackEl && feedbackEl.classList.contains('level2-feedback--error')) {
                    feedbackEl.textContent = 'Исправьте порядок элементов и нажмите «Проверить» снова.';
                }
            });
            
            // Двойной клик для удаления элемента из слота
            slot.addEventListener('dblclick', function(e) {
                e.stopPropagation();
                const slotIndex = this.dataset.index;
                const filledId = state.level2Filled[slotIndex];
                if (filledId !== undefined) {
                    // Убираем визуальные индикаторы
                    this.classList.remove('slot-correct', 'slot-wrong', 'filled');
                    // Возвращаем элемент в список доступных
                    returnElementToDraggables(filledId, drRow);
                    // Очищаем слот
                    delete state.level2Filled[slotIndex];
                    this.innerHTML = '<span class="slot-placeholder">?</span>';
                    
                    // Убираем сообщение об ошибке, если пользователь начал исправлять
                    const feedbackEl = document.getElementById('level2Feedback');
                    if (feedbackEl && feedbackEl.classList.contains('level2-feedback--error')) {
                        feedbackEl.textContent = 'Исправьте порядок элементов и нажмите «Проверить» снова.';
                    }
                }
            });
        });
        document.getElementById('checkL2').addEventListener('click', () => checkLevel2());
        document.getElementById('finishLevel2').addEventListener('click', () => endLevel(true));
    }

    function removeElementFromDraggables(componentId, draggablesRow) {
        const existingEl = draggablesRow.querySelector(`[data-id="${componentId}"]`);
        if (existingEl) {
            existingEl.remove();
        }
    }

    function returnElementToDraggables(componentId, draggablesRow) {
        // Проверяем, не существует ли уже этот элемент в списке доступных
        if (draggablesRow.querySelector(`[data-id="${componentId}"]`)) {
            return;
        }
        const comp = COMPONENTS.find(c => c.id === componentId);
        if (!comp) return;
        
        const el = document.createElement('div');
        el.className = 'draggable-component';
        el.draggable = true;
        el.dataset.id = comp.id;
        el.innerHTML = `<span class="icon">${comp.icon}</span><span class="label">${comp.name}</span>`;
        el.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', comp.id);
            el.classList.add('dragging');
        });
        el.addEventListener('dragend', () => el.classList.remove('dragging'));
        draggablesRow.appendChild(el);
    }

    function checkLevel2() {
        var feedbackEl = document.getElementById('level2Feedback');
        var slots = document.querySelectorAll('.drop-slot');
        slots.forEach(function(s) {
            s.classList.remove('slot-correct', 'slot-wrong');
        });
        var filledCount = Object.keys(state.level2Filled).length;
        if (filledCount < 3) {
            if (feedbackEl) {
                feedbackEl.className = 'level2-feedback level2-feedback--error';
                feedbackEl.textContent = 'Расставьте все три элемента в ячейки, затем нажмите «Проверить».';
            }
            return;
        }
        var ok = state.level2Slots.every(function(s, i) { return state.level2Filled[i] === s.id; });
        if (ok) {
            addScore(POINTS_CORRECT_L2);
            if (feedbackEl) {
                feedbackEl.className = 'level2-feedback level2-feedback--success';
                feedbackEl.textContent = 'Верно! +' + POINTS_CORRECT_L2 + ' очков.';
            }
            state.round++;
            if (state.round >= ROUNDS_PER_LEVEL) {
                if (feedbackEl) feedbackEl.textContent = 'Все три цепи собраны верно! Уровень пройден.';
                setTimeout(function() { endLevel(true); }, 1500);
            } else {
                if (feedbackEl) feedbackEl.textContent = 'Верно! +' + POINTS_CORRECT_L2 + ' очков. Следующая цепь (' + (state.round + 1) + ' из ' + ROUNDS_PER_LEVEL + ')…';
                setTimeout(function() { renderLevel2(document.getElementById('levelContainer')); }, 1200);
            }
        } else {
            addScore(-PENALTY_L2);
            slots.forEach(function(slot, i) {
                var expectedId = state.level2Slots[i].id;
                var actualId = state.level2Filled[i];
                if (actualId === expectedId) slot.classList.add('slot-correct');
                else if (actualId !== undefined) slot.classList.add('slot-wrong');
            });
            if (feedbackEl) {
                var cfg = getLevel2Config(state.round);
                feedbackEl.className = 'level2-feedback level2-feedback--error';
                feedbackEl.textContent = 'Неверный порядок. Должно быть: ' + cfg.orderHint + ' Исправьте и нажмите «Проверить» снова. (-' + PENALTY_L2 + ' очков)';
            }
        }
    }

    function renderLevel3(container) {
        if (!container) container = document.getElementById('levelContainer');
        state.level3Data = getLevel3Question(state.level3UsedQuestionIndices);
        state.level3StartTime = Date.now();
        var opts = state.level3Data.options;
        var keys = ['1', '2', '3'];
        container.innerHTML = `
          <h2>Уровень 3 — Быстрая реакция (вопрос ${state.round + 1} из ${ROUNDS_PER_LEVEL})</h2>
          <p class="question-text">Выбери правильный элемент: нажми клавишу 1, 2 или 3 (или кликни по элементу).</p>
          <p class="question-text">${state.level3Data.questionText}</p>
          <div class="key-hint">Клавиши: <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd></div>
          <div class="falling-zone" id="fallingZone"></div>
          <div class="game-actions">
            <button class="btn btn-success" id="finishLevel3">Завершить уровень</button>
          </div>
        `;
        const zone = document.getElementById('fallingZone');
        zone.style.position = 'relative';
        
        // Очистить предыдущие интервалы движения
        if (state.level3MovementIntervals) {
            state.level3MovementIntervals.forEach(interval => clearInterval(interval));
        }
        state.level3MovementIntervals = [];
        
        opts.forEach((comp, i) => {
            const el = document.createElement('div');
            el.className = 'falling-item';
            el.dataset.id = comp.id;
            el.dataset.index = String(i);
            
            // Начальная позиция - случайная
            const startLeft = Math.random() * 70 + 5; // от 5% до 75%
            const startTop = Math.random() * 50 + 10; // от 10% до 60%
            el.style.left = startLeft + '%';
            el.style.top = startTop + '%';
            
            el.innerHTML = '<span class="key-num">[' + keys[i] + ']</span> ' + comp.icon + ' <span class="f-name">' + comp.name + '</span>';
            el.addEventListener('click', () => answerLevel3(comp.id));
            zone.appendChild(el);
            
            // Плавное хаотичное движение
            let currentLeft = startLeft;
            let currentTop = startTop;
            let velocityX = (Math.random() - 0.5) * 0.3; // случайная скорость по X
            let velocityY = (Math.random() - 0.5) * 0.3; // случайная скорость по Y
            
            const moveInterval = setInterval(() => {
                // Обновляем позицию
                currentLeft += velocityX;
                currentTop += velocityY;
                
                // Отскок от границ
                if (currentLeft <= 5 || currentLeft >= 75) {
                    velocityX = -velocityX;
                    currentLeft = Math.max(5, Math.min(75, currentLeft));
                }
                if (currentTop <= 10 || currentTop >= 60) {
                    velocityY = -velocityY;
                    currentTop = Math.max(10, Math.min(60, currentTop));
                }
                
                // Иногда меняем направление случайно
                if (Math.random() < 0.02) {
                    velocityX += (Math.random() - 0.5) * 0.1;
                    velocityY += (Math.random() - 0.5) * 0.1;
                    // Ограничиваем максимальную скорость
                    velocityX = Math.max(-0.5, Math.min(0.5, velocityX));
                    velocityY = Math.max(-0.5, Math.min(0.5, velocityY));
                }
                
                el.style.left = currentLeft + '%';
                el.style.top = currentTop + '%';
            }, 50); // Обновление каждые 50мс для плавности
            
            state.level3MovementIntervals.push(moveInterval);
        });
        
        document.addEventListener('keydown', function keyL3(e) {
            if (e.key === '1' || e.key === '2' || e.key === '3') {
                const i = parseInt(e.key, 10) - 1;
                if (state.level3Data && state.level3Data.options[i]) {
                    // Остановить движение перед ответом
                    if (state.level3MovementIntervals) {
                        state.level3MovementIntervals.forEach(interval => clearInterval(interval));
                    }
                    answerLevel3(state.level3Data.options[i].id);
                    document.removeEventListener('keydown', keyL3);
                }
            }
        });
        document.getElementById('finishLevel3').addEventListener('click', () => {
            if (state.level3MovementIntervals) {
                state.level3MovementIntervals.forEach(interval => clearInterval(interval));
            }
            endLevel(true);
        });
    }

    function answerLevel3(chosenId) {
        if (!state.level3Data) return;
        
        // Остановить движение перед проверкой ответа
        if (state.level3MovementIntervals) {
            state.level3MovementIntervals.forEach(interval => clearInterval(interval));
            state.level3MovementIntervals = [];
        }
        
        if (chosenId === state.level3Data.correctId) {
            addScore(POINTS_CORRECT_L3);
            if (state.level3Data.questionIndex !== undefined) {
                state.level3UsedQuestionIndices.push(state.level3Data.questionIndex);
            }
            state.round++;
            if (state.round >= ROUNDS_PER_LEVEL) {
                endLevel(true);
            } else {
                setTimeout(() => {
                    renderLevel3(document.getElementById('levelContainer'));
                }, 500);
            }
        } else {
            addScore(-PENALTY_L3);
            // Показать визуальную обратную связь
            const items = document.querySelectorAll('.falling-item');
            items.forEach(item => {
                if (item.dataset.id === chosenId) {
                    item.classList.add('wrong-answer');
                } else if (item.dataset.id === state.level3Data.correctId) {
                    item.classList.add('correct-answer');
                }
            });
            // Продолжить движение через 2 секунды
            setTimeout(() => {
                items.forEach(item => {
                    item.classList.remove('wrong-answer', 'correct-answer');
                });
                // Перезапустить движение
                const zone = document.getElementById('fallingZone');
                if (zone) {
                    const opts = state.level3Data.options;
                    state.level3MovementIntervals = [];
                    opts.forEach((comp, i) => {
                        const el = zone.querySelector(`[data-id="${comp.id}"]`);
                        if (el) {
                            let currentLeft = parseFloat(el.style.left) || 30;
                            let currentTop = parseFloat(el.style.top) || 30;
                            let velocityX = (Math.random() - 0.5) * 0.3;
                            let velocityY = (Math.random() - 0.5) * 0.3;
                            
                            const moveInterval = setInterval(() => {
                                currentLeft += velocityX;
                                currentTop += velocityY;
                                
                                if (currentLeft <= 5 || currentLeft >= 75) {
                                    velocityX = -velocityX;
                                    currentLeft = Math.max(5, Math.min(75, currentLeft));
                                }
                                if (currentTop <= 10 || currentTop >= 60) {
                                    velocityY = -velocityY;
                                    currentTop = Math.max(10, Math.min(60, currentTop));
                                }
                                
                                if (Math.random() < 0.02) {
                                    velocityX += (Math.random() - 0.5) * 0.1;
                                    velocityY += (Math.random() - 0.5) * 0.1;
                                    velocityX = Math.max(-0.5, Math.min(0.5, velocityX));
                                    velocityY = Math.max(-0.5, Math.min(0.5, velocityY));
                                }
                                
                                el.style.left = currentLeft + '%';
                                el.style.top = currentTop + '%';
                            }, 50);
                            
                            state.level3MovementIntervals.push(moveInterval);
                        }
                    });
                }
            }, 2000);
        }
    }

    function saveResultLocal(name, score, level, time) {
        if (typeof window.saveResult === 'function') window.saveResult(name, score, level, time);
    }

    window.GameState = state;
    window.startGame = function (playerName, startLevel) {
        state.playerName = playerName;
        state.level = startLevel;
        state.score = 0;
        state.timeLeft = TIME_LIMIT_SEC;
        state.testMode = getParams().testMode;
        localStorage.setItem('Game_ElectricCircuits_name', playerName);
        startTimer();
        renderLevel();
    };
})();
