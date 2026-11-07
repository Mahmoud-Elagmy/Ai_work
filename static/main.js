let start = document.querySelector(".start");
let arrow = document.querySelector(".arrow");
let goal = document.querySelector(".goal");

start.style.cursor = "pointer";

let times = [];

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            start.style.cursor = "context-menu";
            times.forEach((time) => {
                clearTimeout(time);
            })
            times = [];
            start.classList.add("active");
            Array.from(arrow.children).forEach((child, i) => {
                let time = setTimeout(() => {
                    child.classList.add("active");
                }, i * 250);
                times.push(time);
            })
            setTimeout(() => {
                goal.classList.add("active");
            }, 1800)
        }
    })
}, {
    threshold: 0.5
});

observer.observe(start);

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
    new Set(list).size === 9;
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


let numberOfoperations = undefined;
let executionTime = undefined;

async function sendData(choice) {
    try {
        const response = await fetch('/solve', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                intial: intailvals,
                goal: goalvals,
                choice: choice
            })
        });
        if (!response.ok) {
            throw new Error("Error")
        }
        let Data = await response.json();
        if (Data.status === "success") {
            numberOfoperations = Data.op;
            executionTime = Data.time;
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
let error = document.querySelector(".ans .error");
let container = document.querySelector(".ans .container");
let operations = document.querySelector(".ans .opeartions p span");
let time = document.querySelector(".ans .time p span");


solve.addEventListener("click", async (e) => {
    e.preventDefault();
    let choice = document.querySelector(".search ul li.active").innerText.trim();
    solve.disabled = true;
    solve.innerText = "Solving...";
    operations.parentElement.parentElement.style.display = "none";
    time.parentElement.parentElement.style.display = "none";
    if (loading) loading.style.display = "block";

    if (error) {
        error.classList.remove("active");
    }

    if (ans && ans.children[0]) {
        container.innerHTML = "";
    }

    let [arr] = await Promise.all([
        sendData(choice),
        new Promise((resolve) => setTimeout(resolve, 1000))
    ]);

    if (loading) loading.style.display = "none";

    if (!arr || arr.length === 0) {
        solve.disabled = false;
        solve.innerText = "Solve";
        error.classList.add("active");
        operations.parentElement.parentElement.style.display = "none";
        time.parentElement.parentElement.style.display = "none";
        return;
    }

    operations.parentElement.parentElement.style.display = "block";
    time.parentElement.parentElement.style.display = "block";

    time.innerText = executionTime;
    operations.innerText = numberOfoperations;

    for (let i of arr) {
        let div = document.createElement("div");
        div.innerHTML = `
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
        `;
        container.appendChild(div);
    }

    solve.disabled = false;
    solve.innerText = "Solve";
});
