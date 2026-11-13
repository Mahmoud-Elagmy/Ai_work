import heapq
import time
from collections import deque

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html", title="8 Puzzle")


def states(s):
    q = []
    blank = s.index("0")
    possible_moves = []
    if blank % 3 > 0:
        possible_moves.append((-1, "Left"))  # move Left
    if blank % 3 < 2:
        possible_moves.append((1, "Right"))  # move Right
    if blank >= 3:
        possible_moves.append((-3, "Up"))  # move Up
    if blank <= 5:
        possible_moves.append((3, "Down"))  # move Down
    for step, dir in possible_moves:
        nextstep = blank + step
        if nextstep in range(len(s)):
            newstate = list(s)
            newstate[blank], newstate[nextstep] = (
                newstate[nextstep],
                newstate[blank],
            )  # swap steps
            q.append((newstate, dir))
    return q


def heuristic(s, goal):
    total = 0
    for i in range(len(s)):
        if s[i] != goal[i] and s[i] != "0":
            curr_row, curr_col = i // 3, i % 3
            goal_row, goal_col = goal.index(s[i]) // 3, goal.index(s[i]) % 3
            total += abs(curr_row - goal_row) + abs(curr_col - goal_col)
    return total


def A_star(curr, goal):
    h = heuristic(curr, goal)
    pq = [(h, curr, [curr], [])]  # store f,node,path,direction
    vis = set()
    while pq:
        f, node, path, dirs = heapq.heappop(pq)  # to order the node with least f
        if node == goal:
            return path, dirs
        if tuple(node) in vis:  # if two nodes have same state
            continue
        vis.add(tuple(node))
        for state, dir in states(node):
            if tuple(state) not in vis:
                g = len(path)
                h_new = heuristic(state, goal)
                heapq.heappush(pq, (g + h_new, state, path + [state], dirs + [dir]))
    return None


def Greedy(curr, goal):
    h = heuristic(curr, goal)
    pq = [(h, curr, [curr], [])]

    vis = set()

    while pq:
        h, node, path, dirs = heapq.heappop(pq)

        if node == goal:
            return path, dirs

        if tuple(node) in vis:
            continue

        vis.add(tuple(node))

        for state, dir in states(node):
            if tuple(state) not in vis:
                h_new = heuristic(state, goal)
                heapq.heappush(pq, (h_new, state, path + [state], dirs + [dir]))

    return None


def DLS(curr, goal, vis, limit, path=[], dirs=[]):
    if curr == goal:
        return path, dirs
    if limit <= 0:
        return None
    vis.add(tuple(curr))
    for state, dir in states(curr):
        if tuple(state) not in vis:
            res = DLS(state, goal, vis, limit - 1, path + [state], dirs + [dir])
            if res:
                return res
    vis.remove(tuple(curr))
    return None


def bfs(curr, goal):
    vis = set()
    q = deque([(curr, [curr], [])])  # deque O(1)
    vis.add(tuple(curr))
    while q:
        node, path, dirs = q.popleft()
        if node == goal:
            return path, dirs
        for state, dir in states(node):
            if tuple(state) not in vis:
                vis.add(tuple(state))
                q.append((state, path + [state], dirs + [dir]))
    return None


@app.route("/solve", methods=["POST"])
def solve():
    start_time = time.time()
    data = request.get_json()
    puzzle = [str(x) for x in data["intial"]]
    goal = [str(x) for x in data["goal"]]
    choice = data["choice"]
    limit = data["limit"]

    if choice == "BFS":
        ans = bfs(puzzle, goal)
    elif choice == "DLS":
        ans = DLS(puzzle, goal, set(), limit)
    elif choice == "A*":
        ans = A_star(puzzle, goal)
    elif choice == "Greedy":
        ans = Greedy(puzzle, goal)

    execution_time = round((time.time() - start_time) * 1000, 2)  # in milliseconds

    if ans:
        path, dirs = ans
        return jsonify(
            {
                "status": "success",
                "path": path,
                "dirs": dirs,
                "op": len(path) - 1,
                "time": execution_time,
            }
        )
    else:
        return jsonify({"status": "fail", "message": "NO SOL"})


if __name__ == "__main__":
    app.run(debug=True, port=8000)
