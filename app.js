// DOM Elements
const assignmentForm = document.getElementById('assignment-form');
const assignmentsList = document.getElementById('assignments-list');
const noAssignmentsText = document.getElementById('no-assignments');
const sortByDateBtn = document.getElementById('sort-by-date');
const sortByPriorityBtn = document.getElementById('sort-by-priority');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const timerToggle = document.getElementById('timer-toggle');
const timerCard = document.getElementById('timer-card');
const viewListBtn = document.getElementById('view-list');
const viewCalendarBtn = document.getElementById('view-calendar');
const calendarView = document.getElementById('calendar-view');

// Timer elements
const timerMinutes = document.getElementById('timer-minutes');
const timerSeconds = document.getElementById('timer-seconds');
const startTimerBtn = document.getElementById('start-timer');
const pauseTimerBtn = document.getElementById('pause-timer');
const resetTimerBtn = document.getElementById('reset-timer');

// Calendar elements
const currentMonthEl = document.getElementById('current-month');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const calendarGrid = document.getElementById('calendar-grid');

// Store assignments and app state
let assignments = JSON.parse(localStorage.getItem('assignments')) || [];
let currentView = 'list';
let currentDate = new Date();
let timerInterval = null;
let timerTime = 25 * 60; // 25 minutes in seconds
let isTimerRunning = false;

// Initialize the app
function init() {
    loadTheme();
    renderAssignments();
    updateStats();
    renderCalendar();
    setupEventListeners();
}

// Set up event listeners
function setupEventListeners() {
    // Form submission
    assignmentForm.addEventListener('submit', handleFormSubmit);
    
    // Sorting buttons
    sortByDateBtn.addEventListener('click', () => sortAssignments('date'));
    sortByPriorityBtn.addEventListener('click', () => sortAssignments('priority'));
    
    // Dark mode toggle
    darkModeToggle.addEventListener('click', toggleDarkMode);
    
    // Timer functionality
    timerToggle.addEventListener('click', toggleTimer);
    startTimerBtn.addEventListener('click', startTimer);
    pauseTimerBtn.addEventListener('click', pauseTimer);
    resetTimerBtn.addEventListener('click', resetTimer);
    
    // View toggles
    viewListBtn.addEventListener('click', () => switchView('list'));
    viewCalendarBtn.addEventListener('click', () => switchView('calendar'));
    
    // Calendar navigation
    prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
    nextMonthBtn.addEventListener('click', () => navigateMonth(1));
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    const assignmentName = document.getElementById('assignment-name').value;
    const dueDate = document.getElementById('due-date').value;
    const subject = document.getElementById('subject').value;
    const priority = document.getElementById('priority').value;
    const description = document.getElementById('description').value;
    const grade = document.getElementById('grade').value;
    
    const newAssignment = {
        id: Date.now().toString(),
        name: assignmentName,
        dueDate,
        subject,
        priority,
        description,
        grade: grade ? parseInt(grade) : null,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    assignments.push(newAssignment);
    saveAssignments();
    renderAssignments();
    updateStats();
    renderCalendar();
    
    // Reset form
    assignmentForm.reset();
}

// Save assignments to local storage
function saveAssignments() {
    localStorage.setItem('assignments', JSON.stringify(assignments));
}

// Render assignments to the DOM
function renderAssignments() {
    if (assignments.length === 0) {
        assignmentsList.innerHTML = '<p class="text-muted text-center my-4" id="no-assignments">No assignments yet. Add one above!</p>';
        return;
    }
    
    const assignmentsHtml = assignments.map(assignment => `
        <div class="assignment-item ${assignment.priority} ${assignment.completed ? 'completed' : ''}" data-id="${assignment.id}">
            <div class="d-flex justify-content-between align-items-center">
                <div class="form-check">
                    <input class="form-check-input toggle-complete" type="checkbox" ${assignment.completed ? 'checked' : ''}>
                    <label class="form-check-label ${assignment.completed ? 'completed' : ''}">
                        <strong>${assignment.name}</strong>
                        ${assignment.description ? `<br><small class="text-muted">${assignment.description}</small>` : ''}
                    </label>
                </div>
                <div class="d-flex align-items-center">
                    ${assignment.grade ? `<span class="badge bg-info me-2">${assignment.grade}%</span>` : ''}
                    <span class="subject-badge me-2">${formatSubject(assignment.subject)}</span>
                    <button class="btn-delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
            <div class="due-date mt-2">
                <i class="bi bi-calendar-event me-1"></i>Due: ${formatDate(assignment.dueDate)}
                ${isOverdue(assignment.dueDate) && !assignment.completed ? 
                    '<span class="badge bg-danger ms-2">Overdue</span>' : ''}
                ${assignment.completed ? '<span class="badge bg-success ms-2">Completed</span>' : ''}
            </div>
        </div>
    `).join('');
    
    assignmentsList.innerHTML = assignmentsHtml;
    
    // Add event listeners to new elements
    document.querySelectorAll('.toggle-complete').forEach(checkbox => {
        checkbox.addEventListener('change', toggleComplete);
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', deleteAssignment);
    });
}

// Update dashboard statistics
function updateStats() {
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(a => a.completed).length;
    const pendingAssignments = totalAssignments - completedAssignments;
    const gradesWithValues = assignments.filter(a => a.grade !== null && a.grade !== undefined);
    const averageGrade = gradesWithValues.length > 0 ? 
        Math.round(gradesWithValues.reduce((sum, a) => sum + a.grade, 0) / gradesWithValues.length) : null;
    
    document.getElementById('total-assignments').textContent = totalAssignments;
    document.getElementById('completed-assignments').textContent = completedAssignments;
    document.getElementById('pending-assignments').textContent = pendingAssignments;
    document.getElementById('average-grade').textContent = averageGrade ? `${averageGrade}%` : '-';
}

// Dark mode functionality
function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const icon = darkModeToggle.querySelector('i');
    icon.className = newTheme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const icon = darkModeToggle.querySelector('i');
    icon.className = savedTheme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
}

// Timer functionality
function toggleTimer() {
    const isVisible = timerCard.style.display !== 'none';
    timerCard.style.display = isVisible ? 'none' : 'block';
}

function startTimer() {
    if (!isTimerRunning) {
        isTimerRunning = true;
        timerInterval = setInterval(() => {
            timerTime--;
            updateTimerDisplay();
            
            if (timerTime <= 0) {
                pauseTimer();
                alert('Time\'s up! Take a break!');
                timerTime = 25 * 60; // Reset to 25 minutes
                updateTimerDisplay();
            }
        }, 1000);
        
        startTimerBtn.disabled = true;
        pauseTimerBtn.disabled = false;
    }
}

function pauseTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
    startTimerBtn.disabled = false;
    pauseTimerBtn.disabled = true;
}

function resetTimer() {
    pauseTimer();
    timerTime = 25 * 60;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timerTime / 60);
    const seconds = timerTime % 60;
    timerMinutes.textContent = minutes.toString().padStart(2, '0');
    timerSeconds.textContent = seconds.toString().padStart(2, '0');
}

// View switching
function switchView(view) {
    currentView = view;
    
    if (view === 'list') {
        assignmentsList.style.display = 'block';
        calendarView.style.display = 'none';
        viewListBtn.classList.add('active');
        viewCalendarBtn.classList.remove('active');
    } else {
        assignmentsList.style.display = 'none';
        calendarView.style.display = 'block';
        viewListBtn.classList.remove('active');
        viewCalendarBtn.classList.add('active');
        renderCalendar();
    }
}

// Calendar functionality
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    currentMonthEl.textContent = `${monthNames[month]} ${year}`;
    
    // Clear calendar
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.style.cssText = 'padding: 10px; font-weight: bold; text-align: center; background: var(--primary-color); color: white;';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        
        // Check if it's today
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayEl.classList.add('today');
        }
        
        // Add day number
        const dayNumber = document.createElement('div');
        dayNumber.textContent = day;
        dayNumber.style.fontWeight = 'bold';
        dayEl.appendChild(dayNumber);
        
        // Add assignments for this day
        const dayDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dayAssignments = assignments.filter(a => a.dueDate === dayDate);
        
        dayAssignments.forEach(assignment => {
            const assignmentEl = document.createElement('div');
            assignmentEl.className = 'calendar-assignment';
            assignmentEl.textContent = assignment.name;
            assignmentEl.title = `${assignment.name} - ${assignment.subject}`;
            dayEl.appendChild(assignmentEl);
        });
        
        calendarGrid.appendChild(dayEl);
    }
}

function navigateMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

// Toggle assignment completion status
function toggleComplete(e) {
    const assignmentItem = e.target.closest('.assignment-item');
    const assignmentId = assignmentItem.dataset.id;
    
    assignments = assignments.map(assignment => {
        if (assignment.id === assignmentId) {
            return { ...assignment, completed: !assignment.completed };
        }
        return assignment;
    });
    
    saveAssignments();
    renderAssignments();
}

// Delete an assignment
function deleteAssignment(e) {
    if (confirm('Are you sure you want to delete this assignment?')) {
        const assignmentItem = e.target.closest('.assignment-item');
        const assignmentId = assignmentItem.dataset.id;
        
        assignments = assignments.filter(assignment => assignment.id !== assignmentId);
        saveAssignments();
        renderAssignments();
    }
}

// Sort assignments by date or priority
function sortAssignments(sortBy) {
    if (sortBy === 'date') {
        assignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        sortByDateBtn.classList.add('active');
        sortByPriorityBtn.classList.remove('active');
    } else if (sortBy === 'priority') {
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        assignments.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || 
            new Date(a.dueDate) - new Date(b.dueDate));
        sortByPriorityBtn.classList.add('active');
        sortByDateBtn.classList.remove('active');
    }
    
    renderAssignments();
}

// Helper functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatSubject(subject) {
    return subject.charAt(0).toUpperCase() + subject.slice(1);
}

function isOverdue(dueDate) {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
