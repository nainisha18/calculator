// Cache the calculator elements so the functions can update the display.
const display = document.getElementById("display");
const expression = document.getElementById("expression");
const keypad = document.getElementById("keypad");

// State for the number currently being typed and the pending calculation.
let currentInput = "0";
let storedValue = null;
let pendingOperator = null;
let waitingForNextNumber = false;
let justCalculated = false;

// Keep the main display and smaller expression line in sync with calculator state.
function updateDisplay() {
    display.textContent = currentInput;
}

// Reset all calculator state and return the display to zero.
function clearCalculator() {
    currentInput = "0";
    storedValue = null;
    pendingOperator = null;
    waitingForNextNumber = false;
    justCalculated = false;
    expression.textContent = "Ready to calculate";
    updateDisplay();
}

// Add a digit to the current number, preventing unnecessary leading zeroes.
function inputDigit(digit) {
    if (currentInput === "Error" || waitingForNextNumber || justCalculated) {
        currentInput = digit;
        waitingForNextNumber = false;
        justCalculated = false;
    } else if (currentInput === "0") {
        currentInput = digit;
    } else if (currentInput.replace("-", "").length < 15) {
        currentInput += digit;
    }
    updateDisplay();
}

// Add a decimal point only if the current number doesn't already have one.
function inputDecimal() {
    if (currentInput === "Error" || waitingForNextNumber || justCalculated) {
        currentInput = "0.";
        waitingForNextNumber = false;
        justCalculated = false;
    } else if (!currentInput.includes(".")) {
        currentInput += ".";
    }
    updateDisplay();
}

// Remove the last character, returning to zero if the input becomes empty.
function deleteLastDigit() {
    if (currentInput === "Error" || waitingForNextNumber || justCalculated) {
        currentInput = "0";
        waitingForNextNumber = false;
        justCalculated = false;
    } else {
        currentInput = currentInput.slice(0, -1);
        if (currentInput === "" || currentInput === "-") currentInput = "0";
    }
    updateDisplay();
}

// Switch the sign of the current number between positive and negative.
function toggleSign() {
    if (currentInput === "Error") return;
    if (Number(currentInput) !== 0) {
        currentInput = currentInput.startsWith("-")
            ? currentInput.slice(1)
            : "-" + currentInput;
    }
    updateDisplay();
}

// Perform one arithmetic operation and guard against invalid results.
function calculate(first, second, operator) {
    switch (operator) {
        case "+": return first + second;
        case "-": return first - second;
        case "*": return first * second;
        case "/":
            if (second === 0) return null;
            return first / second;
        case "%":
            if (second === 0) return null;
            return first % second;
        default: return second;
    }
}

// Convert floating-point results into readable values and avoid Infinity/NaN.
function formatResult(value) {
    if (value === null || !Number.isFinite(value)) return null;
    // Round tiny floating-point leftovers, such as 0.1 + 0.2.
    const rounded = Number(value.toPrecision(12));
    return String(rounded);
}

// Save an operator, evaluating the previous operation first when needed.
function chooseOperator(operator) {
    if (currentInput === "Error") return;
    const inputValue = Number(currentInput);

    if (pendingOperator && !waitingForNextNumber) {
        const result = calculate(storedValue, inputValue, pendingOperator);
        const formatted = formatResult(result);
        if (formatted === null) {
            showCalculationError();
            return;
        }
        currentInput = formatted;
        storedValue = result;
        updateDisplay();
    } else {
        storedValue = inputValue;
    }

    pendingOperator = operator;
    waitingForNextNumber = true;
    justCalculated = false;
    expression.textContent = `${currentInput} ${operatorSymbol(operator)}`;
}

// Display a friendly error and reset the operation so the calculator can recover.
function showCalculationError() {
    currentInput = "Error";
    storedValue = null;
    pendingOperator = null;
    waitingForNextNumber = true;
    justCalculated = false;
    expression.textContent = "Cannot divide by zero";
    updateDisplay();
}

// Show a readable symbol for each operator in the expression line.
function operatorSymbol(operator) {
    return { "+": "+", "-": "−", "*": "×", "/": "÷", "%": "%" }[operator] || operator;
}

// Finish the pending calculation and show the complete expression and result.
function performCalculation() {
    if (!pendingOperator || storedValue === null || currentInput === "Error") return;

    const first = storedValue;
    const second = waitingForNextNumber ? storedValue : Number(currentInput);
    const operator = pendingOperator;
    const result = calculate(first, second, operator);
    const formatted = formatResult(result);

    if (formatted === null) {
        showCalculationError();
        return;
    }

    expression.textContent = `${first} ${operatorSymbol(operator)} ${second} =`;
    currentInput = formatted;
    storedValue = null;
    pendingOperator = null;
    waitingForNextNumber = false;
    justCalculated = true;
    updateDisplay();
}

// Use event delegation so all calculator buttons are handled in one place.
keypad.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.number !== undefined) {
        inputDigit(button.dataset.number);
    } else if (button.dataset.operator) {
        chooseOperator(button.dataset.operator);
    } else {
        switch (button.dataset.action) {
            case "clear": clearCalculator(); break;
            case "delete": deleteLastDigit(); break;
            case "decimal": inputDecimal(); break;
            case "sign": toggleSign(); break;
            case "equals": performCalculation(); break;
        }
    }
});

// Support keyboard input as well as mouse/touch, for a more usable calculator.
document.addEventListener("keydown", (event) => {
    if (/^[0-9]$/.test(event.key)) {
        inputDigit(event.key);
    } else if (event.key === ".") {
        inputDecimal();
    } else if (["+", "-", "*", "/", "%"].includes(event.key)) {
        chooseOperator(event.key);
    } else if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        performCalculation();
    } else if (event.key === "Backspace") {
        deleteLastDigit();
    } else if (event.key === "Escape" || event.key === "Delete") {
        clearCalculator();
    }
});

// Start with a clean display when the page loads.
clearCalculator();
