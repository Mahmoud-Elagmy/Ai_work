from flask import Flask,request, render_template,jsonify
from collections import deque
import time

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html",title="8 Puzzle")


def states(s):
    q=[]
    blank=s.index('0')
    steps=[]
    if blank % 3 > 0 : steps.append(-1) # move Left
    if blank % 3 < 2 : steps.append(1) # move Right
    if blank >=3 : steps.append(-3) # move Up
    if blank <=5 : steps.append(3) # move Down
    for step in steps :
        nextstep=blank+step
        if nextstep in range(len(s)):
            newstate=list(s)
            newstate[blank],newstate[nextstep]=newstate[nextstep],newstate[blank] # swap steps
            q.append(newstate)
    return q



def DLS(curr,goal,vis,limit,path=[]):
    if curr==goal:
        return path
    if limit<=0:
        return None
    vis.add(tuple(curr))
    for state in states(curr):
        if tuple(state) not in vis:
            res= DLS(state,goal,vis,limit-1,path+[state])
            if res:
                return res
    vis.remove(tuple(curr))
    return None


def bfs(curr, goal):
    vis = set()
    q = deque([(curr, [curr])]) # deque O(1) 
    vis.add(tuple(curr))
    while q:
        node, path = q.popleft()
        if node == goal:
            return path
        for state in states(node):
            if tuple(state) not in vis:
                vis.add(tuple(state))
                q.append((state, path + [state]))
    return None

@app.route("/solve",methods=['POST'])
def solve():
    start_time = time.time()
    data=request.get_json()
    puzzle=[str(x) for x in data["intial"]]
    goal=[str(x) for x in data["goal"]]
    choice=data["choice"]

    if choice == "BFS":
        ans=bfs(puzzle,goal)
    elif choice == "DLS":
        ans=DLS(puzzle,goal,set(),15)

    execution_time = round((time.time() - start_time)*1000,2) # in milliseconds

    if ans:
        return jsonify({
            "status":"success",
            "path":ans,
            "op":len(ans)-1,
            "time":execution_time
        })
    else:
        return jsonify({
            "status":"fail",
            "message":"NO SOL"
        })


if __name__ == "__main__":
    app.run(debug=True,port=8000)