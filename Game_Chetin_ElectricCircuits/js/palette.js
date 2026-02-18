/**
 * Палитра цветов для игры
 */
(function() {
    const PALETTE_THEMES = [
        {
            name: 'Классическая',
            bg: '#1a1a2e',
            card: '#16213e',
            accent: '#e94560',
            success: '#0f3460',
            wire: '#ffc107'
        },
        {
            name: 'Океан',
            bg: '#0d1b2a',
            card: '#1b263b',
            accent: '#3a86ff',
            success: '#2d6a4f',
            wire: '#83c5be'
        },
        {
            name: 'Фиолетовая',
            bg: '#1e1e2e',
            card: '#2a2a3e',
            accent: '#bb86fc',
            success: '#03dac6',
            wire: '#ffd700'
        },
        {
            name: 'Розовая',
            bg: '#0f0f23',
            card: '#1a1a3a',
            accent: '#ff6b9d',
            success: '#c44569',
            wire: '#f8b500'
        },
        {
            name: 'Коралловая',
            bg: '#2d1b2e',
            card: '#3d2b3e',
            accent: '#ff6b6b',
            success: '#4ecdc4',
            wire: '#ffe66d'
        },
        {
            name: 'Неоновая',
            bg: '#1a2332',
            card: '#252f3f',
            accent: '#00d4ff',
            success: '#00ff88',
            wire: '#ffaa00'
        }
    ];

    function createPalettePicker() {
        const picker = document.createElement('div');
        picker.className = 'palette-picker';
        picker.id = 'palettePicker';
        
        picker.innerHTML = `
            <h3>Выберите тему</h3>
            <div class="palette-presets" id="palettePresets"></div>
        `;
        
        const presetsContainer = picker.querySelector('#palettePresets');
        
        PALETTE_THEMES.forEach((theme, index) => {
            const preset = document.createElement('div');
            preset.className = 'palette-preset';
            preset.dataset.theme = index + 1;
            preset.textContent = theme.name;
            preset.addEventListener('click', () => {
                applyTheme(index + 1);
                updateActivePreset(preset);
            });
            presetsContainer.appendChild(preset);
        });
        
        document.body.appendChild(picker);
        return picker;
    }

    function applyTheme(themeNumber) {
        // Удаляем все классы тем
        document.body.classList.remove('palette-theme-1', 'palette-theme-2', 'palette-theme-3', 
                                      'palette-theme-4', 'palette-theme-5', 'palette-theme-6', 'palette-alt');
        
        // Применяем выбранную тему
        if (themeNumber > 0 && themeNumber <= PALETTE_THEMES.length) {
            const theme = PALETTE_THEMES[themeNumber - 1];
            document.body.classList.add('palette-theme-' + themeNumber);
            
            // Также устанавливаем CSS переменные напрямую для надежности
            document.body.style.setProperty('--game-bg', theme.bg);
            document.body.style.setProperty('--game-card', theme.card);
            document.body.style.setProperty('--game-accent', theme.accent);
            document.body.style.setProperty('--game-success', theme.success);
            document.body.style.setProperty('--game-wire', theme.wire);
            
            localStorage.setItem('Game_ElectricCircuits_theme', themeNumber);
        }
    }

    function updateActivePreset(activePreset) {
        document.querySelectorAll('.palette-preset').forEach(p => {
            p.classList.remove('active');
        });
        if (activePreset) {
            activePreset.classList.add('active');
        }
    }

    function initPalette() {
        const toggle = document.getElementById('paletteToggle');
        if (!toggle) return;
        
        let picker = document.getElementById('palettePicker');
        if (!picker) {
            picker = createPalettePicker();
        }
        
        // Загружаем сохраненную тему
        const savedTheme = localStorage.getItem('Game_ElectricCircuits_theme');
        if (savedTheme) {
            applyTheme(parseInt(savedTheme, 10));
            const preset = picker.querySelector(`[data-theme="${savedTheme}"]`);
            if (preset) {
                updateActivePreset(preset);
            }
        } else {
            // По умолчанию первая тема
            applyTheme(1);
            const preset = picker.querySelector('[data-theme="1"]');
            if (preset) {
                updateActivePreset(preset);
            }
        }
        
        // Переключаем показ палитры
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            picker.classList.toggle('active');
        });
        
        // Закрываем при клике вне палитры
        document.addEventListener('click', function(e) {
            if (!picker.contains(e.target) && e.target !== toggle) {
                picker.classList.remove('active');
            }
        });
    }

    // Инициализация при загрузке DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPalette);
    } else {
        initPalette();
    }
})();
