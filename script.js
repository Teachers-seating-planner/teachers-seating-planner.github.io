document.addEventListener("DOMContentLoaded", () => {
    const seatGrid = document.querySelector(".seat-grid");
    const gridWidthInput = document.getElementById("grid-width");
    const gridHeightInput = document.getElementById("grid-height");
    const horizontalGapInput = document.getElementById("horizontal-gap");
    const verticalGapInput = document.getElementById("vertical-gap");
    const horizontalGapValueLabel = document.getElementById("horizontal-gap-value");
    const verticalGapValueLabel = document.getElementById("vertical-gap-value");

    function createSeats() {
        const gridWidth = parseInt(gridWidthInput.value, 10) || 0;
        const gridHeight = parseInt(gridHeightInput.value, 10) || 0;
        const horizontalGap = parseInt(horizontalGapInput.value, 10) || 0;
        const verticalGap = parseInt(verticalGapInput.value, 10) || 0;
        const totalSeats = gridWidth * gridHeight;

        // Clear existing seats
        seatGrid.innerHTML = "";

        // Set grid layout dynamically
        seatGrid.style.gridTemplateColumns = `repeat(${gridWidth}, 1fr)`;
        seatGrid.style.columnGap = `${horizontalGap}px`; // Set horizontal gap
        seatGrid.style.rowGap = `${verticalGap}px`; // Set vertical gap

        for (let i = 1; i <= totalSeats; i++) {
            let seat = document.createElement("div");
            seat.classList.add("seat");
            seat.draggable = true;

            // Add event listeners for drag-and-drop
            seat.addEventListener("dragstart", dragStart);
            seat.addEventListener("dragover", dragOver);
            seat.addEventListener("drop", drop);

            // Add click event listener for rotating or deleting the seat
            let rotation = 0; // Track the current rotation angle
            seat.addEventListener("click", (event) => {
                if (event.shiftKey) {
                    deleteSeat(seat); // Delete the seat when Shift key is held
                } else {
                    // Rotate the seat
                    rotation = (rotation + 90) % 360; // Increment rotation by 90 degrees
                    seat.style.transform = `rotate(${rotation}deg)`; // Apply rotation
                }
            });

            seatGrid.appendChild(seat);
        }
    }

    // Update the gap labels dynamically
    function updateGapLabels() {
        horizontalGapValueLabel.textContent = `${horizontalGapInput.value}px`;
        verticalGapValueLabel.textContent = `${verticalGapInput.value}px`;
        createSeats(); // Recreate seats with the updated gaps
    }

    // Create seats initially
    createSeats();

    // Update seats when grid dimensions or gap sizes change
    gridWidthInput.addEventListener("input", createSeats);
    gridHeightInput.addEventListener("input", createSeats);
    horizontalGapInput.addEventListener("input", createSeats);
    verticalGapInput.addEventListener("input", createSeats);

    // Expose the updateGapLabels function globally
    window.updateGapLabels = updateGapLabels;
});

function uploadStudentFile() {
    const fileInput = document.getElementById("student-file");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a CSV file to upload.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const csvContent = event.target.result;
        const rows = csvContent.split("\n").map(row => row.trim()).filter(row => row);

        rows.forEach(row => {
            const [lastName, firstName, gender] = row.split(","); // Split by commas
            if (!lastName || !firstName || !gender) return; // Skip invalid rows

            // Format the name as "FirstName L."
            const formattedName = `${firstName.trim()} ${lastName.trim()[0]}.`;

            // Find an empty seat and assign the student
            const emptySeats = document.querySelectorAll(".seat:not(.occupied)");
            if (emptySeats.length === 0) {
                alert("No empty seats available for all students.");
                return;
            }

            const randomSeat = emptySeats[Math.floor(Math.random() * emptySeats.length)];
            randomSeat.textContent = `${formattedName} (${gender.trim()})`;
            randomSeat.classList.add("occupied");
        });
    };

    reader.onerror = function () {
        alert("Failed to read the file. Please try again.");
    };

    reader.readAsText(file);
}

// History stack to store previous states
let historyStack = [];

// Function to save the current state to the history stack
function saveStateToHistory() {
    const seats = [...document.querySelectorAll(".seat")];
    const currentState = seats.map(seat => ({
        text: seat.textContent,
        occupied: seat.classList.contains("occupied"),
        rotation: seat.style.transform || "rotate(0deg)"
    }));
    historyStack.push(currentState);
}

// Undo function to revert to the previous state
function undo() {
    if (historyStack.length === 0) {
        alert("No actions to undo!");
        return;
    }

    const previousState = historyStack.pop();
    const seats = [...document.querySelectorAll(".seat")];

    if (previousState.length !== seats.length) {
        alert("Undo failed: grid dimensions have changed!");
        return;
    }

    seats.forEach((seat, index) => {
        const prevSeat = previousState[index];
        seat.textContent = prevSeat.text;
        seat.style.transform = prevSeat.rotation;
        if (prevSeat.occupied) {
            seat.classList.add("occupied");
        } else {
            seat.classList.remove("occupied");
        }
    });
}

// History stack to store deleted seats
let deletedSeatsHistory = [];

// Function to delete a seat and save its state
function deleteSeat(seat) {
    // Save the current state of the seat to the history stack
    const seatState = {
        index: [...document.querySelectorAll(".seat")].indexOf(seat), // Seat's position in the grid
        text: seat.textContent,
        occupied: seat.classList.contains("occupied"),
        rotation: seat.style.transform || "rotate(0deg)"
    };
    deletedSeatsHistory.push(seatState);

    // Clear the seat
    seat.textContent = "";
    seat.classList.remove("occupied");
    seat.style.backgroundColor = "transparent";
    seat.style.border = "none";
    seat.style.pointerEvents = "none"; // Disable interactions
}

// Undo function to restore the last deleted seat
function undo() {
    if (deletedSeatsHistory.length === 0) {
        alert("No actions to undo!");
        return;
    }

    // Get the last deleted seat's state
    const lastDeletedSeat = deletedSeatsHistory.pop();
    const seats = document.querySelectorAll(".seat");

    // Restore the seat's state
    const seatToRestore = seats[lastDeletedSeat.index];
    seatToRestore.textContent = lastDeletedSeat.text;
    seatToRestore.classList.add("occupied");
    seatToRestore.style.transform = lastDeletedSeat.rotation;
    seatToRestore.style.backgroundColor = ""; // Reset background color
    seatToRestore.style.border = ""; // Reset border
    seatToRestore.style.pointerEvents = ""; // Enable interactions
}

// Modify existing functions to save state before making changes
function addStudent() {
    saveStateToHistory(); // Save the current state

    let nameInput = document.getElementById("student-name").value.trim();
    let genderInput = document.getElementById("student-gender").value;

    if (nameInput === "") {
        alert("Please enter a name!");
        return;
    }

    // Extract first name and first letter of last name
    const nameParts = nameInput.split(" ");
    const firstName = nameParts[0];
    const lastNameInitial = nameParts.length > 1 ? nameParts[1][0] : "";
    const formattedName = `${firstName} ${lastNameInitial}.`;

    // Find an empty seat
    let emptySeats = document.querySelectorAll(".seat:not(.occupied)");
    if (emptySeats.length === 0) {
        alert("No empty seats left!");
        return;
    }

    // Assign the student to a random empty seat
    let randomSeat = emptySeats[Math.floor(Math.random() * emptySeats.length)];
    randomSeat.textContent = `${formattedName} (${genderInput})`;
    randomSeat.classList.add("occupied");
}

function randomizeSeats() {
    saveStateToHistory(); // Save the current state

    let seats = [...document.querySelectorAll(".seat")];
    let studentNames = seats.filter(seat => seat.classList.contains("occupied")).map(seat => seat.textContent);
    
    seats.forEach(seat => {
        seat.classList.remove("occupied");
        seat.textContent = "";
    });

    studentNames.sort(() => Math.random() - 0.5);
    
    seats.slice(0, studentNames.length).forEach((seat, index) => {
        seat.textContent = studentNames[index];
        seat.classList.add("occupied");
    });
}

function resetPlan() {
    saveStateToHistory(); // Save the current state

    let seats = document.querySelectorAll(".seat");
    seats.forEach(seat => {
        seat.classList.remove("occupied");
        seat.textContent = "";
        seat.style.transform = "rotate(0deg)";
    });
}

function dragStart(event) {
    event.dataTransfer.setData("text", event.target.textContent); // Store the dragged name
    event.target.classList.add("dragging"); // Add a visual indicator for the dragged seat
}

function dragOver(event) {
    event.preventDefault();
}

function drop(event) {
    event.preventDefault();
    const draggedName = event.dataTransfer.getData("text"); // Get the dragged name
    const targetSeat = event.target;

    // Check if the target seat is occupied
    if (targetSeat.classList.contains("occupied")) {
        // Swap the names between the dragged seat and the target seat
        const draggedSeat = document.querySelector(".dragging");
        const targetName = targetSeat.textContent;

        // Swap the text content
        draggedSeat.textContent = targetName;
        targetSeat.textContent = draggedName;

        // Ensure both seats remain occupied
        draggedSeat.classList.add("occupied");
        targetSeat.classList.add("occupied");
    } else {
        // If the target seat is empty, move the name to the target seat
        const draggedSeat = document.querySelector(".dragging");
        targetSeat.textContent = draggedName;
        targetSeat.classList.add("occupied");

        // Clear the dragged seat
        draggedSeat.textContent = "";
        draggedSeat.classList.remove("occupied");
    }

    // Remove the dragging class from the dragged seat
    document.querySelector(".dragging").classList.remove("dragging");
}

function savePlan() {
    const saveSlot = document.getElementById("save-slot").value; // Get the selected save slot
    const seats = [...document.querySelectorAll(".seat")];
    const seatingPlan = seats.map(seat => ({
        text: seat.textContent,
        occupied: seat.classList.contains("occupied")
    }));
    localStorage.setItem(`seatingPlan_${saveSlot}`, JSON.stringify(seatingPlan));
    alert(`Seating plan saved to ${saveSlot}!`);
}

function loadPlan() {
    const saveSlot = document.getElementById("save-slot").value; // Get the selected save slot
    const savedPlan = localStorage.getItem(`seatingPlan_${saveSlot}`);
    if (!savedPlan) {
        alert(`No saved plan found for ${saveSlot}!`);
        return;
    }

    const seatingPlan = JSON.parse(savedPlan);
    const seats = [...document.querySelectorAll(".seat")];

    if (seatingPlan.length !== seats.length) {
        alert("Saved plan does not match the current grid dimensions!");
        return;
    }

    seats.forEach((seat, index) => {
        const savedSeat = seatingPlan[index];
        seat.textContent = savedSeat.text;
        if (savedSeat.occupied) {
            seat.classList.add("occupied");
        } else {
            seat.classList.remove("occupied");
        }
    });

    alert(`Seating plan loaded from ${saveSlot}!`);
}

function autoArrangeByGender() {
    const seats = [...document.querySelectorAll(".seat")];
    const studentNames = seats
        .filter(seat => seat.classList.contains("occupied"))
        .map(seat => seat.textContent);

    // Separate students by gender
    const boys = studentNames.filter(name => name.includes("(M)"));
    const girls = studentNames.filter(name => name.includes("(F)"));

    // Check if there are any students to arrange
    if (boys.length + girls.length === 0) {
        alert("No students to arrange by gender!");
        return;
    }

    // Clear all seats
    seats.forEach(seat => {
        seat.classList.remove("occupied");
        seat.textContent = "";
    });

    // Alternate boys and girls in the seating arrangement
    let i = 0, j = 0;
    seats.forEach((seat, index) => {
        if (index % 2 === 0 && i < boys.length) {
            seat.textContent = boys[i++];
            seat.classList.add("occupied");
        } else if (j < girls.length) {
            seat.textContent = girls[j++];
            seat.classList.add("occupied");
        }
    });

    alert("Students have been auto-arranged by gender!");
}

function arrangeAlphabetically() {
    const seats = [...document.querySelectorAll(".seat")];
    const studentNames = seats
        .filter(seat => seat.classList.contains("occupied"))
        .map(seat => seat.textContent);

    // Check if there are any students to arrange
    if (studentNames.length === 0) {
        alert("No students to arrange alphabetically!");
        return;
    }

    // Sort names alphabetically
    studentNames.sort();

    // Clear all seats
    seats.forEach(seat => {
        seat.classList.remove("occupied");
        seat.textContent = "";
    });

    // Reassign names to seats in alphabetical order
    seats.slice(0, studentNames.length).forEach((seat, index) => {
        seat.textContent = studentNames[index];
        seat.classList.add("occupied");
    });

    alert("Students have been arranged alphabetically!");
}

function renameSaveSlot() {
    const saveSlotSelect = document.getElementById("save-slot");
    const renameInput = document.getElementById("rename-slot");
    const newSlotName = renameInput.value.trim();

    if (!newSlotName) {
        alert("Please enter a valid name for the save slot.");
        return;
    }

    // Check if the new name already exists
    const existingSlots = Array.from(saveSlotSelect.options).map(option => option.textContent);
    if (existingSlots.includes(newSlotName)) {
        alert("A save slot with this name already exists.");
        return;
    }

    // Get the currently selected slot
    const selectedOption = saveSlotSelect.options[saveSlotSelect.selectedIndex];
    const oldSlotName = selectedOption.value;

    // Update the option's text and value
    selectedOption.textContent = newSlotName;
    selectedOption.value = newSlotName;

    // Update localStorage key for the saved plan
    const savedPlan = localStorage.getItem(`seatingPlan_${oldSlotName}`);
    if (savedPlan) {
        localStorage.setItem(`seatingPlan_${newSlotName}`, savedPlan);
        localStorage.removeItem(`seatingPlan_${oldSlotName}`);
    }

    alert(`Save slot renamed to "${newSlotName}".`);
    renameInput.value = ""; // Clear the input field
}

function exportSaveSlots() {
    const saveSlotSelect = document.getElementById("save-slot");
    const saveSlots = Array.from(saveSlotSelect.options).map(option => option.value);
    const savedPlans = {};

    saveSlots.forEach(slot => {
        const plan = localStorage.getItem(`seatingPlan_${slot}`);
        if (plan) {
            savedPlans[slot] = JSON.parse(plan);
        }
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedPlans));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "seating_plans.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);

    alert("Save slots exported successfully!");
}

function importSaveSlots(event) {
    const file = event.target.files[0];
    if (!file) {
        alert("Please select a file to import.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const importedData = JSON.parse(e.target.result);
        for (const [slot, plan] of Object.entries(importedData)) {
            localStorage.setItem(`seatingPlan_${slot}`, JSON.stringify(plan));
        }
        alert("Save slots imported successfully! Refresh the page to see the changes.");
    };
    reader.readAsText(file);
}

function applyPreset(presetName) {
    console.log(`Selected preset: ${presetName}`); // Debugging log

    if (presetName === "preset1") {
        gridWidthInput.value = 3;
        gridHeightInput.value = 3;
        createSeats();
    } else if (presetName === "preset2") {
        gridWidthInput.value = 5;
        gridHeightInput.value = 4;
        createSeats();
    } else if (presetName === "preset3") {
        gridWidthInput.value = 6;
        gridHeightInput.value = 6;
        createSeats();
    } else if (presetName === "uShape") {
        console.log("Applying U-Shape preset"); // Debugging log
        createUShape();
    }
}

function createUShape() {
    console.log("Creating U-Shape grid"); // Debugging log

    const gridWidth = 7; // Fixed width for U-shape
    const gridHeight = 5; // Fixed height for U-shape
    seatGrid.innerHTML = ""; // Clear existing seats

    seatGrid.style.gridTemplateColumns = `repeat(${gridWidth}, 1fr)`;
    seatGrid.style.columnGap = `${horizontalGapInput.value}px`;
    seatGrid.style.rowGap = `${verticalGapInput.value}px`;

    for (let row = 0; row < gridHeight; row++) {
        for (let col = 0; col < gridWidth; col++) {
            const seat = document.createElement("div");

            // Add seats only for the U-shape
            if (
                (row === 0) || // Top row
                (row === gridHeight - 1) || // Bottom row
                (col === 0 && row !== gridHeight - 1) || // Left column (excluding bottom-left corner)
                (col === gridWidth - 1 && row !== gridHeight - 1) // Right column (excluding bottom-right corner)
            ) {
                seat.classList.add("seat");
                seat.draggable = true;

                // Add event listeners for drag-and-drop
                seat.addEventListener("dragstart", dragStart);
                seat.addEventListener("dragover", dragOver);
                seat.addEventListener("drop", drop);

                // Add click event listener for rotating or deleting the seat
                let rotation = 0;
                seat.addEventListener("click", (event) => {
                    if (event.shiftKey) {
                        deleteSeat(seat); // Delete the seat when Shift key is held
                    } else {
                        rotation = (rotation + 90) % 360;
                        seat.style.transform = `rotate(${rotation}deg)`;
                    }
                });
            } else {
                // Empty space for the U-shape
                seat.style.backgroundColor = "transparent";
                seat.style.pointerEvents = "none";
            }

            seatGrid.appendChild(seat);
        }
    }
}

function clearSeatName(seat) {
    if (!seat.classList.contains("occupied")) {
        alert("This seat is already empty!");
        return;
    }

    seat.textContent = ""; // Clear the name
    seat.classList.remove("occupied"); // Remove the occupied class
    alert("Seat name cleared!");
}


