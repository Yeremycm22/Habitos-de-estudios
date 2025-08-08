// ------------------------------------
// Lógica de navegación entre secciones
// ------------------------------------
function showPage(pageId) {
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[onclick="showPage('${pageId}')"]`).classList.add('active');

    // Reiniciar el cronómetro al cambiar de página
    if (pageId !== 'cronometro') {
        resetTimer();
    }
}

// ------------------------------------
// Lógica del Cronómetro de Estudio
// ------------------------------------
const timerState = {
    mode: 'pomodoro',
    timeLeft: 25 * 60,
    isRunning: false,
    timerId: null,
    pomodorosCompleted: parseInt(localStorage.getItem('pomodorosCompleted') || '0')
};

const timerModes = {
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
};

// Crear un sonido de alarma usando Web Audio API
let audioContext;
let alarmBuffer;

async function initializeAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        // Crear un tono de alarma simple
        const sampleRate = audioContext.sampleRate;
        const duration = 1;
        const frameCount = sampleRate * duration;
        
        alarmBuffer = audioContext.createBuffer(1, frameCount, sampleRate);
        const channelData = alarmBuffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = Math.sin(2 * Math.PI * 800 * i / sampleRate) * 0.3;
        }
    } catch (error) {
        console.log('Audio context not available');
    }
}

function playAlarm() {
    if (audioContext && alarmBuffer) {
        const source = audioContext.createBufferSource();
        source.buffer = alarmBuffer;
        source.connect(audioContext.destination);
        source.start();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeAudio();
    updateTimerDisplay();
    updateProgressRing();
    updateControls();
    updateStats();
});

function setTimerMode(mode, button) {
    if (timerState.isRunning) {
        pauseTimer();
    }
    
    timerState.mode = mode;
    
    const customTimeInputs = document.getElementById('customTimeInputs');
    if (mode === 'custom') {
        customTimeInputs.style.display = 'block';
        const customMinutes = parseInt(document.getElementById('customMinutes').value, 10);
        timerState.timeLeft = customMinutes * 60;
    } else {
        customTimeInputs.style.display = 'none';
        timerState.timeLeft = timerModes[mode];
    }
    
    updateTimerDisplay();
    updateProgressRing();
    updateControls();

    document.querySelectorAll('.timer-mode').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    let label = '';
    if (mode === 'pomodoro') {
        label = 'Sesión de Estudio Pomodoro';
    } else if (mode === 'shortBreak') {
        label = 'Descanso Corto';
    } else if (mode === 'longBreak') {
        label = 'Descanso Largo';
    } else {
        label = 'Temporizador Personalizado';
    }
    document.getElementById('timerLabel').textContent = label;
}

function startTimer() {
    if (timerState.isRunning) {
        return;
    }

    // Inicializar contexto de audio en interacción del usuario
    if (!audioContext) {
        initializeAudio();
    }

    timerState.isRunning = true;
    updateControls();

    if (timerState.mode === 'custom') {
        const customMinutes = parseInt(document.getElementById('customMinutes').value, 10);
        if (isNaN(customMinutes) || customMinutes <= 0) {
            alert('Por favor, introduce un número válido de minutos.');
            timerState.isRunning = false;
            updateControls();
            return;
        }
        timerState.timeLeft = customMinutes * 60;
    }

    timerState.timerId = setInterval(() => {
        timerState.timeLeft--;
        if (timerState.timeLeft < 0) {
            handleTimerCompletion();
        } else {
            updateTimerDisplay();
            updateProgressRing();
        }
    }, 1000);
}

function pauseTimer() {
    if (!timerState.isRunning) {
        return;
    }
    clearInterval(timerState.timerId);
    timerState.isRunning = false;
    updateControls();
}

function resetTimer() {
    pauseTimer();
    if (timerState.mode === 'custom') {
        const customMinutes = parseInt(document.getElementById('customMinutes').value, 10);
        timerState.timeLeft = isNaN(customMinutes) || customMinutes <= 0 ? 25 * 60 : customMinutes * 60;
    } else {
        timerState.timeLeft = timerModes[timerState.mode];
    }
    updateTimerDisplay();
    updateProgressRing();
    updateControls();
}

function handleTimerCompletion() {
    pauseTimer();
    playAlarm();

    if (timerState.mode === 'pomodoro') {
        timerState.pomodorosCompleted++;
        localStorage.setItem('pomodorosCompleted', timerState.pomodorosCompleted.toString());
        updateStats();

        const pomodoros = timerState.pomodorosCompleted;
        if (pomodoros > 0 && pomodoros % 4 === 0) {
            setTimerMode('longBreak', document.getElementById('longBreakBtn'));
        } else {
            setTimerMode('shortBreak', document.getElementById('shortBreakBtn'));
        }
    } else {
        setTimerMode('pomodoro', document.getElementById('pomodoroBtn'));
    }

    // Mostrar notificación si está disponible
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification("¡Tiempo terminado!", {
            body: "Tu sesión de " + timerState.mode + " ha finalizado.",
            icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMmMxIDAgMiAuNSAyIDEuNXYxYzMuNiAxLjIgNiAzLjggNiA3LjUgMCAyLTEuNSA1LjUtNCA3aC0yYzAgMS4xLS45IDItMiAycy0yLS45LTItMmgtMmMtMi41LTEuNS00LTUtNC03IDAtMy43IDIuNC02LjMgNi03LjV2LTFjMC0xIDEtMS41IDItMS41eiIvPjwvc3ZnPg=="
        });
    }

    alert(`¡Tiempo terminado! Tu sesión de ${timerState.mode} ha finalizado.`);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timerState.timeLeft / 60);
    const seconds = timerState.timeLeft % 60;
    const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('timerDisplay').textContent = formattedTime;
}

function updateProgressRing() {
    const progressCircle = document.getElementById('progressCircle');
    if (!progressCircle) return;
    
    const radius = progressCircle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;

    let initialTime;
    if (timerState.mode === 'custom') {
        const customMinutes = parseInt(document.getElementById('customMinutes').value, 10);
        initialTime = isNaN(customMinutes) || customMinutes <= 0 ? 25 * 60 : customMinutes * 60;
    } else {
        initialTime = timerModes[timerState.mode];
    }
    
    const progress = timerState.timeLeft / initialTime;
    const offset = circumference - progress * circumference;
    progressCircle.style.strokeDashoffset = offset;
}

function updateControls() {
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    
    if (startBtn && pauseBtn) {
        startBtn.disabled = timerState.isRunning;
        pauseBtn.disabled = !timerState.isRunning;
    }
}

function updateStats() {
    const pomodorosElement = document.getElementById('pomodorosCompleted');
    const totalTimeElement = document.getElementById('totalStudyTime');
    
    if (pomodorosElement) {
        pomodorosElement.textContent = timerState.pomodorosCompleted;
    }
    if (totalTimeElement) {
        totalTimeElement.textContent = timerState.pomodorosCompleted * 25;
    }
}

// Event listener para el input personalizado
document.addEventListener('DOMContentLoaded', () => {
    const customMinutesInput = document.getElementById('customMinutes');
    if (customMinutesInput) {
        customMinutesInput.addEventListener('input', (e) => {
            const minutes = parseInt(e.target.value, 10);
            if (!isNaN(minutes) && minutes > 0) {
                if (!timerState.isRunning && timerState.mode === 'custom') {
                    timerState.timeLeft = minutes * 60;
                    updateTimerDisplay();
                    updateProgressRing();
                }
            }
        });
    }
});

// Solicitar permiso para notificaciones
if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission();
}

// ------------------------------------
// Lógica del Gestor de Tareas
// ------------------------------------
let tasks = JSON.parse(localStorage.getItem('studyTasks') || '[]');
let currentFilter = 'all';

function addTask() {
    const titleInput = document.getElementById('taskTitle');
    const subjectInput = document.getElementById('taskSubject');
    const dateInput = document.getElementById('taskDate');

    if (!titleInput || !subjectInput || !dateInput) return;

    const title = titleInput.value.trim();
    const subject = subjectInput.value;
    const date = dateInput.value;

    if (title && subject && date) {
        const newTask = {
            id: Date.now(),
            title,
            subject,
            date,
            completed: false,
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
        saveTasks();
        renderTasks();
        
        titleInput.value = '';
        subjectInput.value = '';
        dateInput.value = '';
    } else {
        alert('Por favor, completa todos los campos de la tarea.');
    }
}

function renderTasks() {
    const tasksList = document.getElementById('tasksList');
    if (!tasksList) return;
    
    tasksList.innerHTML = '';
    
    const now = new Date();
    now.setHours(23, 59, 59, 999); // Final del día actual
    
    const filteredTasks = tasks.filter(task => {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'pending') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        if (currentFilter === 'overdue') return !task.completed && new Date(task.date) < now;
        return true;
    });

    // Ordenar tareas: pendientes primero, luego por fecha
    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed - b.completed; // Pendientes primero
        }
        return new Date(a.date) - new Date(b.date); // Por fecha ascendente
    });

    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '<p class="empty-tasks">No hay tareas para mostrar.</p>';
        return;
    }

    filteredTasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        if (task.completed) {
            taskItem.classList.add('completed');
        }
        
        const taskDate = new Date(task.date);
        const isOverdue = !task.completed && taskDate < now;
        if (isOverdue) {
            taskItem.classList.add('overdue');
        }
        
        const dateString = taskDate.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        taskItem.innerHTML = `
            <div class="task-info">
                <div class="task-title ${task.completed ? 'completed' : ''}">${escapeHtml(task.title)}</div>
                <div class="task-details">
                    <span class="task-subject">${escapeHtml(task.subject)}</span>
                    <span class="task-date ${isOverdue ? 'overdue' : ''}">${dateString}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn" onclick="toggleComplete(${task.id})" ${task.completed ? 'disabled' : ''}>${task.completed ? '✓ Completado' : '✅ Completar'}</button>
                <button class="task-btn delete" onclick="deleteTask(${task.id})">🗑️ Eliminar</button>
            </div>
        `;
        tasksList.appendChild(taskItem);
    });
}

function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        saveTasks();
        renderTasks();
    }
}

function deleteTask(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }
}

function filterTasks(filter, button) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    renderTasks();
}

function saveTasks() {
    localStorage.setItem('studyTasks', JSON.stringify(tasks));
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ------------------------------------
// Lógica de Flashcards
// ------------------------------------
const flashcardData = [
    {
        question: '¿Qué es la Técnica Pomodoro?',
        answer: 'Un método de gestión del tiempo que divide el trabajo en intervalos de 25 minutos, seguidos de un breve descanso de 5 minutos.'
    },
    {
        question: '¿Qué es la "Repetición Espaciada"?',
        answer: 'Una técnica de memorización que consiste en repasar la información en intervalos de tiempo crecientes para retenerla a largo plazo.'
    },
    {
        question: '¿Qué es el "Aprendizaje Activo"?',
        answer: 'Un enfoque de estudio que requiere la participación del estudiante (resumir, enseñar, hacer preguntas) en lugar de solo leer o escuchar pasivamente.'
    },
    {
        question: '¿Qué es la "Técnica Feynman"?',
        answer: 'Consiste en aprender un tema como si tuvieras que enseñárselo a un niño, lo que te obliga a simplificar conceptos y encontrar las lagunas en tu propio conocimiento.'
    },
    {
        question: '¿Qué es el "Método SQ3R"?',
        answer: 'Un método de lectura comprensiva que consta de 5 pasos: Survey (Explorar), Question (Preguntar), Read (Leer), Recite (Recitar) y Review (Revisar).'
    },
    {
        question: '¿Qué es la "Curva del Olvido"?',
        answer: 'Una teoría que describe cómo perdemos información con el tiempo si no la repasamos. Muestra que olvidamos el 50% de la información nueva en una hora.'
    },
    {
        question: '¿Qué es el "Efecto de Espaciado"?',
        answer: 'El fenómeno por el cual aprendemos mejor cuando el estudio se distribuye en el tiempo en lugar de concentrarlo en una sola sesión.'
    },
    {
        question: '¿Qué es la "Técnica de Cornell"?',
        answer: 'Un sistema de toma de notas que divide la página en tres secciones: notas, palabras clave y resumen, facilitando la revisión y el estudio.'
    }
];

let currentFlashcardIndex = parseInt(localStorage.getItem('currentFlashcardIndex') || '0');

function loadFlashcard() {
    const flashcardQuestion = document.getElementById('flashcardQuestion');
    const flashcardAnswer = document.getElementById('flashcardAnswer');
    const prevFlashcardBtn = document.getElementById('prevFlashcard');
    const nextFlashcardBtn = document.getElementById('nextFlashcard');
    
    if (!flashcardQuestion || !flashcardAnswer || !prevFlashcardBtn || !nextFlashcardBtn) return;
    
    // Asegurar que el índice esté en rango válido
    if (currentFlashcardIndex >= flashcardData.length) {
        currentFlashcardIndex = 0;
    }
    if (currentFlashcardIndex < 0) {
        currentFlashcardIndex = flashcardData.length - 1;
    }
    
    const card = flashcardData[currentFlashcardIndex];
    flashcardQuestion.textContent = card.question;
    flashcardAnswer.textContent = card.answer;
    
    // Actualizar estado de los botones
    prevFlashcardBtn.disabled = currentFlashcardIndex === 0;
    nextFlashcardBtn.disabled = currentFlashcardIndex === flashcardData.length - 1;
    
    // Guardar el índice actual
    localStorage.setItem('currentFlashcardIndex', currentFlashcardIndex.toString());
}

function flipFlashcard() {
    const flashcard = document.querySelector('.flashcard');
    if (flashcard) {
        flashcard.classList.toggle('flipped');
    }
}

function changeFlashcard(direction) {
    const newIndex = currentFlashcardIndex + direction;
    if (newIndex >= 0 && newIndex < flashcardData.length) {
        currentFlashcardIndex = newIndex;
        const flashcard = document.querySelector('.flashcard');
        if (flashcard) {
            flashcard.classList.remove('flipped');
            setTimeout(() => {
                loadFlashcard();
            }, 300);
        }
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    // Cargar tareas y renderizar
    renderTasks();
    
    // Cargar flashcard actual
    loadFlashcard();
    
    // Establecer fecha mínima para el campo de fecha (hoy)
    const taskDateInput = document.getElementById('taskDate');
    if (taskDateInput) {
        const today = new Date().toISOString().split('T')[0];
        taskDateInput.min = today;
    }
    
    // Agregar event listener para Enter en el formulario de tareas
    const taskForm = document.querySelector('.task-form');
    if (taskForm) {
        taskForm.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
                e.preventDefault();
                addTask();
            }
        });
    }
});