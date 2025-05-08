document.addEventListener("DOMContentLoaded", () => {
    const seatGrid = document.querySelector(".seat-grid");
    const gridWidthInput = document.getElementById("grid-width");
    const gridHeightInput = document.getElementById("grid-height");

    function createSeats() {
        const gridWidth = parseInt(gridWidthInput.value, 10) || 0;
        const gridHeight = parseInt(gridHeightInput.value, 10) || 0;
        const totalSeats = gridWidth * gridHeight;

        // Clear existing seats
        seatGrid.innerHTML = "";

        // Set grid layout dynamically
        seatGrid.style.gridTemplateColumns = `repeat(${gridWidth}, 1fr)`;

        for (let i = 1; i <= totalSeats; i++) {
            let seat = document.createElement("div");
            seat.classList.add("seat");
            seat.draggable = true;

            // Add event listeners for drag-and-drop
            seat.addEventListener("dragstart", dragStart);
            seat.addEventListener("dragover", dragOver);
            seat.addEventListener("drop", drop);

            // Add click event listener for rotating the seat
            let rotation = 0; // Track the current rotation angle
            seat.addEventListener("click", (event) => {
                if (event.shiftKey && seat.classList.contains("occupied")) {
                    // Delete the name if Shift key is held
                    seat.textContent = "";
                    seat.classList.remove("occupied");
                } else {
                    // Rotate the seat
                    rotation = (rotation + 90) % 360; // Increment rotation by 90 degrees
                    seat.style.transform = `rotate(${rotation}deg)`; // Apply rotation
                }
            });

            seatGrid.appendChild(seat);
        }
    }

    // Create seats initially
    createSeats();

    // Update seats when grid dimensions change
    gridWidthInput.addEventListener("input", createSeats);
    gridHeightInput.addEventListener("input", createSeats);
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
            const [fullName, gender] = row.split(",");
            if (!fullName || !gender) return;

            // Extract first name and first letter of last name
            const nameParts = fullName.trim().split(" ");
            const firstName = nameParts[0];
            const lastNameInitial = nameParts.length > 1 ? nameParts[1][0] : "";
            const formattedName = `${firstName} ${lastNameInitial}.`;

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

    reader.readAsText(file);
}

function addStudent() {
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
    let seats = document.querySelectorAll(".seat");
    seats.forEach(seat => {
        seat.classList.remove("occupied");
        seat.textContent = "";
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


