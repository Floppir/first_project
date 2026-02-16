/**
 * Хранение данных игры (localStorage, JSON) для модуля "Электрические схемы"
 */
const STORAGE_KEY = 'Game_ElectricCircuits_rating';

function loadRating() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveResult(playerName, score, levelReached, timeSpent) {
    const list = loadRating();
    list.push({
        name: playerName,
        score: Number(score),
        level: levelReached,
        time: timeSpent,
        date: new Date().toISOString()
    });
    list.sort((a, b) => b.score - a.score);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return list;
}

function getLastResult() {
    const list = loadRating();
    return list.length ? list[list.length - 1] : null;
}

function getRatingList(limit = 20) {
    return loadRating().slice(0, limit);
}

if (typeof window !== 'undefined') {
    window.saveResult = saveResult;
    window.loadRating = loadRating;
    window.getRatingList = getRatingList;
    window.getLastResult = getLastResult;
}
