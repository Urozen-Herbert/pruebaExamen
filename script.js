let timerInterval;
let currentQuestionIndex = 0;
let questions = [];
let userAnswers = []; // To store user answers
let timerDisplay;

document.getElementById('startQuiz').addEventListener('click', function () {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) {
        alert('Por favor, suba un archivo Excel.');
        return;
    }
    readExcel(fileInput.files[0]);
    startTimer();
});

document.getElementById('submitQuiz').addEventListener('click', function () {
    if (currentQuestionIndex >= questions.length - 1) {
        calculateAndDisplayResult();
    } else {
        // Proceed to the next question
        currentQuestionIndex++;
        renderQuestion(currentQuestionIndex);
    }
});

function readExcel(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const allQuestions = json.slice(1); // Skip header row
        questions = getRandomQuestions(allQuestions, 10);
        userAnswers = Array(questions.length).fill(null); // Initialize user answers
        currentQuestionIndex = 0; // Reset question index
        renderQuestion(currentQuestionIndex);
    };
    reader.readAsArrayBuffer(file);
}

function getRandomQuestions(questions, num) {
    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
}

function renderQuestion(index) {
    const container = document.getElementById('quizContainer');
    container.innerHTML = '';

    if (index >= questions.length) {
        disableOptions();
        calculateAndDisplayResult();
        return;
    }

    const q = questions[index];
    const questionDiv = document.createElement('div');
    questionDiv.classList.add('question');
    questionDiv.dataset.correctAnswer = q[6];
    questionDiv.innerHTML = `
        <p>${index + 1}. ${q[0]}</p>
        ${q.slice(1, 6).map((opt, i) => `
            <label>
                <input type="radio" name="q${index}" value="${opt}" ${userAnswers[index] === opt ? 'checked' : ''} />
                ${opt}
            </label>
        `).join('<br/>')}
    `;
    container.appendChild(questionDiv);

    const navigationDiv = document.createElement('div');
    navigationDiv.id = 'navigation';
    navigationDiv.innerHTML = `
        <button id="prevQuestion" ${index === 0 ? 'disabled' : ''}>Anterior</button>
        <button id="nextQuestion">${index === questions.length - 1 ? 'Finalizar' : 'Siguiente'}</button>
    `;
    container.appendChild(navigationDiv);

    document.getElementById('prevQuestion').addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            saveAnswer(currentQuestionIndex);
            currentQuestionIndex--;
            renderQuestion(currentQuestionIndex);
        }
    });

    document.getElementById('nextQuestion').addEventListener('click', () => {
        saveAnswer(currentQuestionIndex);
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            renderQuestion(currentQuestionIndex);
        } else {
            calculateAndDisplayResult(); // Call this when "Finalizar" is clicked on the last question
        }
    });
}

function saveAnswer(index) {
    const selectedOption = document.querySelector(`input[name="q${index}"]:checked`);
    userAnswers[index] = selectedOption ? selectedOption.value : null;
}

function startTimer() {
    let timeLeft = 1 * 60; // 10 minutes in seconds
    timerDisplay = document.createElement('div');
    timerDisplay.id = 'timer';
    document.body.insertBefore(timerDisplay, document.getElementById('quizContainer'));

    timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            disableOptions();
            calculateAndDisplayResult();
        } else {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerDisplay.textContent = `Tiempo restante: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            timeLeft--;
        }
    }, 1000);
}

function disableOptions() {
    document.querySelectorAll('input[type="radio"]').forEach(input => {
        input.disabled = true;
    });
    document.getElementById('navigation').style.display = 'none'; // Hide the navigation buttons after time runs out
}

function calculateAndDisplayResult() {
    const score = questions.reduce((total, q, index) => {
        const userAnswer = userAnswers[index];
        const correctAnswer = q[6];
        if (userAnswer === correctAnswer) {
            return total + 2;
        }
        return total;
    }, 0);

    document.getElementById('result').textContent = `Tu puntuación es: ${score}`;
    document.getElementById('result').style.display = 'block';
}
