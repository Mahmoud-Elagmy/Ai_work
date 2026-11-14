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


def DLS(curr, goal, vis, limit=10, path=[], dirs=[]):
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
    data = request.get_json()
    puzzle = [str(x) for x in data["intial"]]
    goal = [str(x) for x in data["goal"]]
    choice = data["choice"]
    limit = int(data["limit"])

    t1 = time.perf_counter()
    res_astar = A_star(puzzle, goal)
    execution_time1 = round((time.perf_counter() - t1) * 1000, 3)

    t2 = time.perf_counter()
    res_greedy = Greedy(puzzle, goal)
    execution_time2 = round((time.perf_counter() - t2) * 1000, 3)

    t3 = time.perf_counter()
    res_dls = DLS(puzzle, goal, set(), limit, [puzzle], [])
    execution_time3 = round((time.perf_counter() - t3) * 1000, 3)

    t4 = time.perf_counter()
    res_bfs = bfs(puzzle, goal)
    execution_time4 = round((time.perf_counter() - t4) * 1000, 3)

    ans = {
        "BFS": res_bfs,
        "Greedy": res_greedy,
        "A*": res_astar,
        "DLS": res_dls,
    }

    if ans[choice] is not None:
        path, dirs = ans[choice]
        return jsonify(
            {
                "status": "success",
                "path": path,
                "dirs": dirs,
                "op": len(path) - 1,
                "steps": {
                    "BFS": len(res_bfs[0])  if res_bfs else "-",
                    "Greedy": len(res_greedy[0])  if res_greedy else "-",
                    "A*": len(res_astar[0])  if res_astar else "-",
                    "DLS": len(res_dls[0])  if res_dls else "-",
                },
                "execution_time": {
                    "BFS": execution_time4,
                    "Greedy": execution_time2,
                    "A*": execution_time1,
                    "DLS": execution_time3,
                },
            }
        )
    else:
        return jsonify({"status": "fail", "message": "NO SOL"})


if __name__ == "__main__":
    app.run(debug=True, port=8000)