"""
app.py — Flask API cho Ô Ăn Quan
=================================
Endpoints:
  GET  /                        health check
  POST /api/new                 tạo game mới
  POST /api/move                thực hiện nước đi
  POST /api/ai-move             lấy nước đi của AI
  GET  /api/valid-moves         lấy danh sách nước đi hợp lệ
"""

from flask import Flask, jsonify, request, render_template_string, send_from_directory
from flask_cors import CORS
import os

from game_logic import make_state, apply_move, get_valid_moves
from ai import get_ai_move

app = Flask(__name__)
CORS(app)


# ─── Health check ────────────────────────────────────────────────────────────

@app.get("/")
def health_check():
    return jsonify({"message": "Backend Flask dang chay tren cong 5000"})


# ─── Game UI (test page) ─────────────────────────────────────────────────────

@app.get("/play")
def play():
    html_path = os.path.join(os.path.dirname(__file__), "static", "index.html")
    with open(html_path, encoding="utf-8") as f:
        return f.read()


# ─── Tạo game mới ────────────────────────────────────────────────────────────

@app.post("/api/new")
def new_game():
    """
    Body (optional): { "first_player": "bottom" | "top" }
    """
    data         = request.get_json(silent=True) or {}
    first_player = data.get("first_player", "bottom")
    if first_player not in ("top", "bottom"):
        return jsonify({"error": "first_player phải là 'top' hoặc 'bottom'"}), 400

    state = make_state(first_player)
    return jsonify(state)


# ─── Thực hiện nước đi ───────────────────────────────────────────────────────

@app.post("/api/move")
def make_move():
    """
    Body: {
      "state": <game_state>,
      "pit": <int 0-11>,
      "direction": <1 | -1>
    }
    """
    data = request.get_json(silent=True) or {}
    state     = data.get("state")
    pit       = data.get("pit")
    direction = data.get("direction")

    if state is None or pit is None or direction is None:
        return jsonify({"error": "Thiếu state, pit hoặc direction"}), 400

    if direction not in (1, -1):
        return jsonify({"error": "direction phải là 1 hoặc -1"}), 400

    valid = get_valid_moves(state)
    if (pit, direction) not in valid:
        return jsonify({"error": "Nước đi không hợp lệ"}), 400

    new_state = apply_move(state, pit, direction)
    return jsonify(new_state)


# ─── Lấy nước đi AI ──────────────────────────────────────────────────────────

@app.post("/api/ai-move")
def ai_move():
    """
    Body: {
      "state": <game_state>,
      "difficulty": <1|2|3, optional, default=3>,
      "depth": <int, optional, ghi de depth mac dinh>
    }
    Tra ve: { "pit": int, "direction": int, "state": <new_state> }
    """
    data       = request.get_json(silent=True) or {}
    state      = data.get("state")
    difficulty = data.get("difficulty", 3)
    depth      = data.get("depth", None)

    if state is None:
        return jsonify({"error": "Thieu state"}), 400

    if state.get("status") == "finished":
        return jsonify({"error": "Game da ket thuc"}), 400

    move = get_ai_move(state, difficulty=difficulty, depth=depth)
    if move is None:
        return jsonify({"error": "Khong co nuoc di hop le"}), 400

    pit, direction = move
    new_state = apply_move(state, pit, direction)
    return jsonify({"pit": pit, "direction": direction, "state": new_state})


# ─── Lấy danh sách nước đi hợp lệ ───────────────────────────────────────────

@app.get("/api/valid-moves")
def valid_moves():
    """
    Query param: state (JSON string) — hoặc dùng POST body
    Dùng POST cho tiện:
    """
    data  = request.get_json(silent=True) or {}
    state = data.get("state")
    if state is None:
        return jsonify({"error": "Thiếu state"}), 400

    moves = get_valid_moves(state)
    return jsonify({"moves": [{"pit": p, "direction": d} for p, d in moves]})


# ─── Run ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
