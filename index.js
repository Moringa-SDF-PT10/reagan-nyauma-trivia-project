document.addEventListener("DOMContentLoaded", () => {
  let questionsURL = "https://opentdb.com/api.php?amount=10";

  // Get form elements
  const submit = document.querySelector("#submit");
  const num = document.querySelector("#number");
  const cat = document.querySelector("#category");
  const diff = document.querySelector("#difficulty");
  const type = document.querySelector("#type");

  // Get form container div
  const setupDiv = document.querySelector("#setup");

  // Initialize relevant arrays
  let questionsArray = [];
  let answersArray = [];
  let correctAnswer = [];
  let queAnswers = [];

  // Initiate the quiz
  submit.addEventListener("click", async (event) => {
    event.preventDefault();

    // Declare variables for dynamically editing the API URL
    let numValue = num.value === "any" ? "" : `amount=${num.value}`;
    let catValue = cat.value === "any" ? "" : `category=${cat.value}`;
    let diffValue = diff.value === "any" ? "" : `difficulty=${diff.value}`;
    let typeValue = type.value === "any" ? "" : `type=${type.value}`;

    questionsURL = `https://opentdb.com/api.php?${numValue}&${catValue}&${diffValue}&${typeValue}`;

    // Reset arrays with each new quiz
    questionsArray = [];
    answersArray = [];
    correctAnswer = [];
    queAnswers = [];

    const triviaResponse = await fetch(questionsURL);
    const data = await triviaResponse.json();
    prepareQuizData(data);

    for (let i = 0; i < questionsArray.length; i++) {
      const currentQuestion = questionsArray[i];
      const currentAnswers = answersArray[i];
      queAnswers.push({ question: currentQuestion, answers: currentAnswers });
    }

    setupDiv.style.zIndex = -50;
    displayQuestions();
  });

  const prepareQuizData = (questions) => {
    questions.results.forEach((question) => {
      questionsArray.push(question.question);
      answersArray.push([
        ...question.incorrect_answers,
        question.correct_answer,
      ]);
      correctAnswer.push(question.correct_answer);
    });
  };

  // Enforce maximum number of questions
  num.addEventListener("input", () => {
    if (num.value > 50) {
      num.value = 50;
    } else if (isNaN(num.value) || num.value < 1) {
      num.value = 1;
    }
  });

  const main = document.querySelector("#start-restart");

  const startBtn = document.createElement("input");
  startBtn.type = "button";
  startBtn.value = "TRY ANOTHER QUIZ";
  startBtn.id = "start-btn";
  startBtn.classList.add("main-btn");

  main.appendChild(startBtn);

  // Make START button interactive
  startBtn.addEventListener("click", () => {
    if (startBtn.value === "NEW QUIZ") {
      startBtn.value = "TRY ANOTHER QUIZ";
      setupDiv.style.zIndex = 50;
    } else {
      startBtn.value = "NEW QUIZ";
      giveUp = 1;
      displayQuestions();
    }
  });

  let queNo = 0;
  let score = 0;
  let giveUp = 0;
  let cumulativeTime = 0;
  let answered = 0;
  let time;

  // Populate the page with correct question and answers
  function displayQuestions() {
    // Important divs to make the output work
    const aDiv = document.createElement("div");
    const ansDiv = document.querySelector("#answers");
    const queDiv = document.querySelector("#questions");
    const timer = document.querySelector("#timer");

    // Check if the questions have been exhausted or giveUp has been clicked
    if (queNo === questionsArray.length || giveUp === 1) {
      queDiv.innerHTML = "";
      ansDiv.innerHTML = "";
      timer.innerHTML = "";
      clearInterval(time);
      startBtn.value = "NEW QUIZ";

      const resultP = document.createElement("p");
      const scores = document.createElement("p");

      let cumulativeText;
      if (cumulativeTime === 0) {
        cumulativeText = "1 minute";
      } else if (cumulativeTime > 60) {
        const mins = Math.floor(cumulativeTime / 60);
        const secs = cumulativeTime % 60;
        cumulativeText = `${mins} ${
          mins === 1 ? "minute" : "minutes"
        } and ${secs} seconds`;
      } else {
        const secs = cumulativeTime;
        cumulativeText = `${secs} seconds`;
      }

      if (queNo <= 0) {
        setupDiv.style.zIndex = 50;
      } else {
        resultP.textContent = `Great job! Here's your score:`;
        scores.textContent = `You got ${score} ${
          score === 1 ? "question" : "questions"
        } correct out of ${queNo} attempted questions. It only took you ${cumulativeText}!`;
      }

      queDiv.appendChild(resultP);
      ansDiv.appendChild(scores);

      // Reset tracking variables for a new attempt
      giveUp = 0;
      queNo = 0;
      score = 0;
      cumulativeTime = 0;
    } else {
      answered = 0;
      // Display a question
      const que = document.createElement("p");
      que.id = "question";
      aDiv.innerHTML = queAnswers[queNo].question;
      que.textContent = `${queNo + 1}. ${aDiv.textContent}`;

      queDiv.innerHTML = "";
      queDiv.appendChild(que);

      // Clear previous answers
      ansDiv.innerHTML = "";

      // Randomize the order of answers
      if (queAnswers.length > 0) {
        queAnswers[queNo].answers.sort(() => Math.random() - 0.5);
      } else {
        return alert(
          `Sorry, we're still working on that combination. Try changing your selections.`
        );
      }

      // Prepare correct answer for answer checker and per-question timer
      aDiv.innerHTML = correctAnswer[queNo];
      let rightOne = aDiv.textContent;

      // Resets the timer
      const resetTimer = () => {
        clearInterval(time);
        timer.innerHTML = "";
        alert(`Time's up! The correct answer is ${rightOne}.`);
      };

      // Time tracking variables
      let timeTracker = 15;
      let allowedTime = timeTracker;

      // Per-question timer
      const countdown = document.createElement("p");
      countdown.textContent = `Time left: ${timeTracker}`;
      timer.appendChild(countdown);

      time = setInterval(() => {
        if (answered === 1) {
          clearInterval(time);
          return;
        }
        timeTracker--;
        countdown.textContent = `Time left: ${timeTracker}`;
        if (timeTracker < 0) {
          cumulativeTime += allowedTime - timeTracker;
          queNo++;
          resetTimer();
          displayQuestions();
        }
      }, 1000);

      // Display the answers for the current question
      queAnswers[queNo].answers.forEach((answer, index) => {
        const ansBtn = document.createElement("input");
        ansBtn.type = "button";
        aDiv.innerHTML = answer;
        ansBtn.value = aDiv.textContent;
        ansBtn.classList.add("main-btn", "ans-btn");

        ansDiv.appendChild(ansBtn);

        // Check if the answer is correct
        ansBtn.addEventListener("click", () => {
          aDiv.innerHTML = correctAnswer[queNo];
          clearInterval(time);
          answered = 1;

          if (ansBtn.value === aDiv.textContent) {
            alert("Correct!");
            score++;
          } else {
            alert(`Incorrect! The correct answer is ${rightOne}.`);
          }

          queNo++;
          timer.innerHTML = "";
          cumulativeTime += allowedTime - timeTracker;

          displayQuestions();
        });
      });
    }
  }
});
