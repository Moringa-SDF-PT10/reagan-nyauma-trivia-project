document.addEventListener("DOMContentLoaded", () => {
  let questionsURL = "https://opentdb.com/api.php?amount=10";

  // Get form elements
  const submit = document.querySelector("#submit");
  const num = document.querySelector("#number");
  const cat = document.querySelector("#category");
  const diff = document.querySelector("#difficulty");
  const type = document.querySelector("#type");
  const setupDiv = document.querySelector("#setup");

  // declare/initialize global variables
  let queNo = 0;
  let score = 0;
  let restart = 0;
  let cumulativeTime = 0;
  let answered = 0;
  let time;
  let isQuizRunning = false;
  let questionsArray = [];
  let answersArray = [];
  let correctAnswer = [];
  let queAnswers = [];

  // Initiate the quiz
  submit.addEventListener("click", async (event) => {
    event.preventDefault();

    // protect against multiple simultaneous fetches
    submit.disabled = true;
    submit.value = "Loading...";

    clearInterval(time);
    time = null;

    // dynamically update variables for editing the API URL
    let numValue = `amount=${num.value}`;
    let catValue = cat.value === "any" ? "" : `category=${cat.value}`;
    let diffValue = diff.value === "any" ? "" : `difficulty=${diff.value}`;
    let typeValue = type.value === "any" ? "" : `type=${type.value}`;

    questionsURL = `https://opentdb.com/api.php?${numValue}&${catValue}&${diffValue}&${typeValue}`;

    // Reset arrays with each new quiz
    questionsArray = [];
    answersArray = [];
    correctAnswer = [];
    queAnswers = [];

    // Attempt to fetch the trivia questions & answers
    try {
      const triviaResponse = await fetch(questionsURL);
      if (!triviaResponse.ok) {
        throw new Error(`HTTP error! Status: ${triviaResponse.status}`);
      }
      const data = await triviaResponse.json();
      if (data.response_code !== 0) {
        throw new Error(
          `No questions found for the given criteria. Try making different selections.`
        );
      }
      prepareQuizData(data);

      setupDiv.style.zIndex = -50;
      displayQuestions();
    } catch (err) {
      alert(err);
    } finally {
      submit.disabled = false;
      submit.value = 'START QUIZ';
      isQuizRunning = false;
    }
  });

  // prepare the data for easy/convenient access and retrieval
  const prepareQuizData = (questions) => {
    questions.results.forEach((question) => {
      questionsArray.push(question.question);
      answersArray.push([
        ...question.incorrect_answers,
        question.correct_answer,
      ]);
      correctAnswer.push(question.correct_answer);
    });

    for (let i = 0; i < questionsArray.length; i++) {
      const currentQuestion = questionsArray[i];
      const currentAnswers = answersArray[i];
      queAnswers.push({ question: currentQuestion, answers: currentAnswers });
    }
  };

  // Enforce maximum number of questions
  num.addEventListener("input", () => {
    if (num.value > 50) {
      num.value = 50;
    } else if (isNaN(num.value) || num.value < 1) {
      num.value = 1;
    }
  });

  // create the retry button
  const main = document.querySelector("#start-restart");
  const restartBtn = document.createElement("input");
  restartBtn.type = "button";
  restartBtn.value = "TRY ANOTHER QUIZ";
  restartBtn.id = "start-btn";
  restartBtn.classList.add("main-btn");

  main.appendChild(restartBtn);

  // Make restart button interactive
  restartBtn.addEventListener("click", () => {
    if (restartBtn.value === "NEW QUIZ") {
      restartBtn.value = "TRY ANOTHER QUIZ";
      setupDiv.style.zIndex = 50;
    } else {
      restartBtn.value = "NEW QUIZ";
      restart = 1;
      displayQuestions();
    }
  });

  // Populate the page with correct question and answers
  function displayQuestions() {
    isQuizRunning = true;
    clearInterval(time);
    // Important divs to make the output work
    const aDiv = document.createElement("div");
    const ansDiv = document.querySelector("#answers");
    const queDiv = document.querySelector("#questions");
    const timer = document.querySelector("#timer");

    // Check if the questions have been exhausted or restart has been clicked
    if (queNo === questionsArray.length || restart === 1) {
      // clear the questions, timer and answers divs
      queDiv.innerHTML = "";
      ansDiv.innerHTML = "";
      timer.innerHTML = "";

      restartBtn.value = "NEW QUIZ";

      const resultP = document.createElement("p");
      const scores = document.createElement("p");

      let cumulativeText;
      if (cumulativeTime === 60) {
        cumulativeText = "1 minute";
      } else if (cumulativeTime > 60) {
        const mins = Math.floor(cumulativeTime / 60);
        const secs = cumulativeTime % 60;
        cumulativeText = `${mins} ${
          mins === 1 ? "minute" : "minutes"
        } and ${secs} seconds`;
      } else {
        cumulativeText = `${cumulativeTime} seconds`;
      }

      // only show results if at least one question has been attempted
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
      restart = 0;
      queNo = 0;
      score = 0;
      cumulativeTime = 0;
      isQuizRunning = false;
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

      // Prepare correct answer for answer checker and per-question timer
      aDiv.innerHTML = correctAnswer[queNo];
      let rightOne = aDiv.textContent;

      // Resets the timer
      const resetTimer = () => {
        clearInterval(time);
        timer.innerHTML = "";
        isQuizRunning = false;
        alert(`Time's up! The correct answer is ${rightOne}.`);
      };

      // Time tracking variables
      let timeTracker = 15;
      let allowedTime = timeTracker;

      // Per-question timer
      const countdown = document.createElement("p");
      countdown.textContent = `Time left: ${timeTracker}`;
      timer.appendChild(countdown);

      // Time display logic
      time = setInterval(() => {
        if (answered === 1) {
          clearInterval(time);
          return;
        }
        timeTracker--;
        countdown.textContent = `Time left: ${timeTracker}`;
        if (timeTracker < 0) {
          cumulativeTime += allowedTime;
          queNo++;
          resetTimer();
          displayQuestions();
        }
      }, 1000);

      // Display the answers for the current question
      queAnswers[queNo].answers.sort(() => Math.random() - 0.5);
      queAnswers[queNo].answers.forEach((answer) => {
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
          isQuizRunning = false;

          displayQuestions();
        });
      });
    }
  }
});
