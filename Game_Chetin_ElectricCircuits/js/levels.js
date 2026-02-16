/**
 * Уровни и генерация вопросов — "Электрические схемы"
 */
const COMPONENTS = [
    { id: 'battery', name: 'Батарея', icon: '🔋', type: 'source' },
    { id: 'lamp', name: 'Лампочка', icon: '💡', type: 'consumer' },
    { id: 'resistor', name: 'Резистор', icon: '⏳', type: 'consumer' },
    { id: 'switch', name: 'Выключатель', icon: '🔘', type: 'switch' },
    { id: 'wire', name: 'Провод', icon: '〰️', type: 'conductor' },
    { id: 'capacitor', name: 'Конденсатор', icon: '▭', type: 'consumer' }
];

const QUESTIONS_LEVEL1 = [
    { text: 'Выбери двойным кликом все источники тока.', correct: ['battery'] },
    { text: 'Выбери двойным кликом элементы, которые потребляют энергию.', correct: ['lamp', 'resistor', 'capacitor'] },
    { text: 'Выбери двойным кликом элемент, который замыкает и размыкает цепь.', correct: ['switch'] },
    { text: 'Выбери двойным кликом компонент, через который течёт ток без потребления энергии.', correct: ['wire'] },
    { text: 'Выбери двойным кликом источник питания.', correct: ['battery'] }
];

/** Возвращает вопрос, который ещё не задавали в этой сессии (usedQuestionIndices — массив индексов). */
function getRandomQuestionLevel1(usedQuestionIndices) {
    const used = usedQuestionIndices || [];
    const available = QUESTIONS_LEVEL1.map((_, i) => i).filter(i => !used.includes(i));
    const index = available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : Math.floor(Math.random() * QUESTIONS_LEVEL1.length);
    const q = QUESTIONS_LEVEL1[index];
    return { ...q, questionIndex: index, components: shuffle([...COMPONENTS]).slice(0, 6) };
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/** Три разные цепи: разный состав и порядок элементов (roundIndex 0, 1, 2). */
const LEVEL2_CONFIGS = [
    {
        title: 'Цепь с лампочкой',
        slotIds: ['battery', 'switch', 'lamp'],
        orderHint: '1) Батарея → 2) Выключатель → 3) Лампочка'
    },
    {
        title: 'Цепь с двумя потребителями',
        slotIds: ['battery', 'lamp', 'resistor'],
        orderHint: '1) Батарея → 2) Лампочка → 3) Резистор'
    },
    {
        title: 'Цепь с выключателем и резистором',
        slotIds: ['battery', 'switch', 'resistor'],
        orderHint: '1) Батарея → 2) Выключатель → 3) Резистор'
    }
];

function getLevel2Config(roundIndex) {
    return LEVEL2_CONFIGS[roundIndex % LEVEL2_CONFIGS.length];
}

function getLevel2Slots(roundIndex) {
    const config = getLevel2Config(roundIndex);
    return config.slotIds.map(id => ({ id, component: COMPONENTS.find(c => c.id === id) }));
}

function getLevel2Phrase(roundIndex) {
    return getLevel2Config(roundIndex);
}

function getLevel2Draggables(roundIndex) {
    const config = getLevel2Config(roundIndex);
    return shuffle([...COMPONENTS].filter(c => config.slotIds.includes(c.id)));
}

/** Разные вопросы для уровня 3 (без повторения в одной сессии). */
const QUESTIONS_LEVEL3 = [
    { text: 'Какой из этих элементов является источником тока?', correctId: 'battery' },
    { text: 'Какой элемент потребляет электрическую энергию?', correctId: 'lamp' },
    { text: 'Какой элемент замыкает и размыкает цепь?', correctId: 'switch' }
];

function getLevel3Question(usedQuestionIndices) {
    const used = usedQuestionIndices || [];
    const available = QUESTIONS_LEVEL3.map((_, i) => i).filter(i => !used.includes(i));
    const index = available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : Math.floor(Math.random() * QUESTIONS_LEVEL3.length);
    const q = QUESTIONS_LEVEL3[index];
    const correctComp = COMPONENTS.find(c => c.id === q.correctId);
    const wrong = shuffle(COMPONENTS.filter(c => c.id !== q.correctId)).slice(0, 2);
    const options = shuffle([correctComp, ...wrong]);
    return {
        questionIndex: index,
        questionText: q.text,
        options,
        correctId: q.correctId,
        correctIndex: options.findIndex(c => c.id === q.correctId)
    };
}

if (typeof window !== 'undefined') {
    window.COMPONENTS = COMPONENTS;
    window.getRandomQuestionLevel1 = getRandomQuestionLevel1;
    window.getLevel2Slots = getLevel2Slots;
    window.getLevel3Question = getLevel3Question;
    window.getLevel2Draggables = getLevel2Draggables;
    window.getLevel2Phrase = getLevel2Phrase;
    window.getLevel2Config = getLevel2Config;
}
