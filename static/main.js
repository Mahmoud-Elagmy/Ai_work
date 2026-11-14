let startBtn = document.querySelector(".start");
startBtn.addEventListener("click", () => {
    window.scrollTo(0, 500);
});
let intialTiles = document.querySelectorAll(".left .tile-input");
let goalTiles = document.querySelectorAll(".right .tile-input");

let progress = document.querySelectorAll(".progress");

let icons = document.querySelectorAll(".check span i");

function updateProgressBar(el, cnt) {
    el.setAttribute("data-value", cnt);
    el.style.setProperty("--Pwidth", `${(cnt / 9) * 100}%`);
}

function checktiles(list) {
    if (!list || list.length !== 9) {
        return false;
    }
    // A valid 8-puzzle board contains each value from 0 through 99 exactly once.
    return list.every((value) => /^(?:0|[1-9]|[1-9][0-9])$/.test(value));
}


function checkelements(l1, l2) {
    if (l1.length !== 9 || l2.length !== 9) return false;
    let lis1 = [...l1].sort((a, b) => a - b);
    let lis2 = [...l2].sort((a, b) => a - b);
    return lis1.every((value, index) => value === lis2[index]);
}

function updateAllIcons() {
    let initialValid = checktiles(intailvals);
    let goalValid = checktiles(goalvals);
    let elementsMatch = checkelements(intailvals, goalvals);

    let isFullyValid = initialValid && goalValid && elementsMatch;

    icons[0].style.color = isFullyValid ? "green" : (initialValid ? "green" : "grey");
    icons[1].style.color = isFullyValid ? "green" : "grey";

    solve.disabled = !isFullyValid;
}


let intailvals = new Array(9).fill("");
let goalvals = new Array(9).fill("");

let clear = document.querySelectorAll(".clear");
clear.forEach((btn) => {
    btn.addEventListener("click", () => {
        if (btn.classList.contains("left")) {
            for (let i = 0; i < intialTiles.length; i++) {
                intialTiles[i].value = "";
                intailvals[i] = "";
            }
            localStorage.removeItem("intial");
            updateProgressBar(progress[0], 0);
        } else {
            for (let i = 0; i < goalTiles.length; i++) {
                goalTiles[i].value = "";
                goalvals[i] = "";
            }
            localStorage.removeItem("goal");
            updateProgressBar(progress[1], 0);
        }
        updateAllIcons();
    })
});

function inputTiles(list, state, valsArray) {
    let st = localStorage.getItem(state);
    if (st) {
        let arr = JSON.parse(st);
        list.forEach((tile, i) => {
            tile.value = arr[i] || "";
            valsArray[i] = arr[i] || "";
        });
        let cnt = valsArray.filter((val) => val !== null && val !== undefined && val !== "").length;
        updateProgressBar(state === "intial" ? progress[0] : progress[1], cnt);
    }

    list.forEach((tile, idx) => {
        tile.addEventListener("input", () => {
            valsArray[idx] = tile.value.trim();
            let cnt = valsArray.filter((val) => val !== undefined && val !== "" && val !== null).length;
            updateProgressBar(state === "intial" ? progress[0] : progress[1], cnt);

            if (cnt === 9 && valsArray.includes('0')) {
                localStorage.setItem(state, JSON.stringify(valsArray));
            }
            updateAllIcons();
        });

        tile.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                if (tile.nextElementSibling) {
                    tile.nextElementSibling.focus();
                } else {
                    tile.blur();
                }
            } else if (e.key === "Backspace") {
                if (tile.value === "") {
                    valsArray[idx] = "";
                    let cnt = valsArray.filter((val) => val !== undefined && val !== "" && val !== null).length;
                    updateProgressBar(state === "intial" ? progress[0] : progress[1], cnt);
                    if (tile.previousElementSibling) {
                        tile.previousElementSibling.focus();
                    }
                    updateAllIcons();
                }
            }
        });
    });
}

inputTiles(intialTiles, "intial", intailvals);
inputTiles(goalTiles, "goal", goalvals);

let solve = document.querySelector(".solve");

updateAllIcons();

let list = document.querySelectorAll(".search ul li");
list.forEach((li) => {
    li.addEventListener("click", () => {
        list.forEach((li) => {
            li.classList.remove("active");
        })
        li.classList.add("active");
    })
})

let limit = document.querySelector(".limit");
let plus = document.querySelector(".plus");
let minus = document.querySelector(".minus");
let limitIn = document.querySelector(".limit input");

plus.addEventListener("click", () => {
    if (limitIn.value < 25) {
        limitIn.value = parseInt(limitIn.value) + 1;
    }
})
minus.addEventListener("click", () => {
    if (limitIn.value > 0) {
        limitIn.value = parseInt(limitIn.value) - 1;
    }
})

let lis = document.querySelectorAll(".search ul li");

lis.forEach((li) => {
    li.addEventListener("click", () => {
        if (li.innerText === "DLS") {
            limit.classList.remove("hidden");
        }
        else {
            limit.classList.add("hidden");
        }
    })
})


let allSteps = undefined;
let allTimes = undefined;
let directions = undefined;

async function sendData(choice, depthLimit) {
    try {
        const response = await fetch('/solve', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                intial: intailvals,
                goal: goalvals,
                choice: choice,
                limit: isNaN(depthLimit) ? 15 : depthLimit
            })
        });
        if (!response.ok) {
            throw new Error("Error")
        }
        let Data = await response.json();
        if (Data.status === "success") {
            numberOfoperations = Data.op;
            executionTime = Data.execution_time[choice] + " ms";
            directions = Data.dirs;
            allTimes = Data.execution_time;
            allSteps = Data.steps;
            return Data.path;
        }
        else {
            return null;
        }
    }
    catch (error) {
        console.log("error", error);
        return null;
    }
}

let ans = document.querySelector(".ans");
let loading = document.querySelector(".ans .loading");
let container = document.querySelector(".ans .container");
let solvable = document.querySelector(".options span");

let left = document.querySelector(".ans .left");
let steps = document.querySelector(".ans .left .data span:first-child");
let moves = document.querySelector(".ans .left .data span:last-child");
let right = document.querySelector(".ans .right");

let rows = document.querySelectorAll(".row");

solve.addEventListener("click", async (e) => {
    e.preventDefault();
    let choice = document.querySelector(".search ul li.active").innerText.trim();
    let depthLimit = parseInt(limitIn.value);
    solve.disabled = true;
    solve.innerText = "Solving...";
    solvable.classList.add("notsolved");
    left.style.display = "none";
    right.style.display = "none";
    if (loading) loading.style.display = "block";

    if (ans && ans.children[0]) {
        left.querySelectorAll(".step-item").forEach(el => el.remove());
    }

    let [arr] = await Promise.all([
        sendData(choice, depthLimit),
        new Promise((resolve) => setTimeout(resolve, 1000))
    ]);

    if (loading) loading.style.display = "none";

    if (!arr || arr.length === 0) {
        solve.disabled = false;
        solve.innerText = "Solve";
        solvable.classList.add("notsolved");
        left.style.display = "none";
        right.style.display = "none";
        return;
    }


    solvable.classList.remove("notsolved");
    left.style.display = "flex";
    right.style.display = "flex";

    steps.innerHTML = `Step 1 of ${arr.length}`;
    moves.innerHTML = directions.length > 0 ? `Move: ${directions[0]}` : "Goal State";

    for (let i of arr) {
        let idx = arr.indexOf(i);
        let div = document.createElement("div");
        div.classList.add("step-item");
        div.innerHTML = `
        <i class="fa-solid fa-arrow-left"></i>
        <div class="grid">
            <input type="text" class="tile-input" value="${i[0]}" disabled>
            <input type="text" class="tile-input" value="${i[1]}" disabled>
            <input type="text" class="tile-input" value="${i[2]}" disabled>
            <input type="text" class="tile-input" value="${i[3]}" disabled>
            <input type="text" class="tile-input" value="${i[4]}" disabled>
            <input type="text" class="tile-input" value="${i[5]}" disabled>
            <input type="text" class="tile-input" value="${i[6]}" disabled>
            <input type="text" class="tile-input" value="${i[7]}" disabled>
            <input type="text" class="tile-input" value="${i[8]}" disabled>
        </div>
        <i class="fa-solid fa-arrow-right"></i>
        `;

        let prev = div.querySelector(".fa-arrow-left");
        let next = div.querySelector(".fa-arrow-right");

        if (idx === 0) prev.style.visibility = "hidden";
        if (idx === arr.length - 1) next.style.visibility = "hidden";

        prev.addEventListener("click", () => {
            if (idx > 0) {
                div.style.display = "none";
                div.previousElementSibling.style.display = "flex";
                steps.innerHTML = `Step ${idx} of ${arr.length}`;
                moves.innerHTML = `Move: ${directions[idx - 1]}`;
            }
        });

        next.addEventListener("click", () => {
            if (idx < arr.length - 1) {
                div.style.display = "none";
                div.nextElementSibling.style.display = "flex";
                steps.innerHTML = `Step ${idx + 2} of ${arr.length}`;
                moves.innerHTML = idx + 1 < directions.length ? `Move: ${directions[idx + 1]}` : "Goal State";
            }
        });

        let tiles = div.querySelectorAll(".tile-input");
        tiles.forEach((tile, i) => {
            if (tile.value == 0) {
                tile.classList.add("tile-empty");
            }
            else if (tile.value == arr[arr.length - 1][i]) {
                tile.classList.add("tile-correct");
            }
        });
        left.appendChild(div);
    }

    for (let i = 2; i < left.children.length; ++i) {
        left.children[i].style.display = "none";
    }
    left.children[1].style.display = "flex";
    for (let i = 1; i < rows.length; i++) {
        let algoname = rows[i].children[0].innerText;
        rows[i].children[1].innerHTML = allSteps[algoname];
        if (allSteps[algoname] === "-") {
            rows[i].children[2].innerText = "-";
            continue;
        }
        rows[i].children[2].innerText = allTimes[algoname] + "ms";
    }

    let minTime = (Object.values(allTimes).reduce((a, b) => Math.min(a, b)));
    let bestAlgo = Object.keys(allTimes).find((key) => allTimes[key] === minTime);

    for (let r = 1; r < rows.length; r++) {
        let algoName = rows[r].children[0].innerText.trim();
        rows[r].children[0].style.color = (algoName === bestAlgo) ? "var(--accent-soft)" : "";
    }

    solve.disabled = false;
    solve.innerText = "Solve";
});