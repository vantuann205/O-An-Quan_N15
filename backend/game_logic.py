# -*- coding: utf-8 -*-
"""
game_logic.py - Logic game O An Quan
Logic lay nguyen tu file goc, chi chuyen sang dang state-based (khong dung global).

Board layout (index 0-11):
  0      : o Quan trai  (player "top")
  1-5    : o dan player "top"
  6      : o Quan phai  (player "bottom")
  7-11   : o dan player "bottom"
"""

import copy

NUM_PITS    = 12
QUAN_PITS   = (0, 6)
TOP_PITS    = list(range(1, 6))
BOTTOM_PITS = list(range(7, 12))


# ─── Khoi tao ────────────────────────────────────────────────────────────────

def make_board():
    board = [0] * NUM_PITS
    board[0] = board[6] = 5
    for i in range(1, 6):
        board[i] = 5
    for i in range(7, 12):
        board[i] = 5
    return board


def make_state(first_player="bottom"):
    return {
        "board":          make_board(),
        "scores":         {"top": 0, "bottom": 0},
        "current_player": first_player,
        "status":         "playing",
        "winner":         None,
        "move_log":       [],
    }


# ─── Tien ich ────────────────────────────────────────────────────────────────

def get_player_pits(player):
    return TOP_PITS if player == "top" else BOTTOM_PITS


def opponent(player):
    return "bottom" if player == "top" else "top"


def is_game_over(board):
    return board[0] == 0 and board[6] == 0


def get_valid_moves(state):
    board  = state["board"]
    player = state["current_player"]
    moves  = []
    for i in get_player_pits(player):
        if board[i] > 0:
            moves.append((i, 1))
            moves.append((i, -1))
    return moves


# ─── Move logic (y het logic goc) ────────────────────────────────────────────

def _do_move(board, scores, pos, direction, player):
    """
    Thuc hien nuoc di tren board (in-place).
    Logic copy nguyen van tu ham move() trong file goc.
    """
    stones = board[pos]
    board[pos] = 0

    while True:
        # Rai het stones
        while stones > 0:
            pos = (pos + direction) % 12
            board[pos] += 1
            stones -= 1

        next_pos  = (pos + direction) % 12
        next_next = (pos + 2 * direction) % 12

        # Lien hoan rai: o ke tiep co quan va khong phai o Quan
        if board[next_pos] > 0 and next_pos not in (0, 6):
            stones = board[next_pos]
            board[next_pos] = 0
            pos = next_pos
            continue

        # An quan lien hoan
        if board[next_pos] == 0 and board[next_next] > 0:
            while board[next_pos] == 0 and board[next_next] > 0:
                eaten = board[next_next]
                scores[player] += eaten
                board[next_next] = 0
                pos       = next_next
                next_pos  = (pos + direction) % 12
                next_next = (pos + 2 * direction) % 12

        break


def _check_empty_side(board, player):
    return all(board[i] == 0 for i in get_player_pits(player))


def _refill(board, scores, player):
    """Rai lai khi het quan, tru 5 diem (y het logic goc)."""
    for i in get_player_pits(player):
        board[i] = 1
    scores[player] -= 5


def _final_score(board, scores):
    """Thu het quan dan con lai vao kho (y het logic goc)."""
    for i in range(1, 6):
        scores["top"] += board[i]
        board[i] = 0
    for i in range(7, 12):
        scores["bottom"] += board[i]
        board[i] = 0


# ─── Apply move (state-based wrapper) ────────────────────────────────────────

def apply_move(state, pit, direction):
    """
    Ap dung nuoc di, tra ve state moi.
    Thu tu:
      1. Thuc hien nuoc di (rai + an).
      2. Kiem tra ket thuc game.
      3. Xu ly het o dan cua doi thu (refill).
      4. Chuyen luot.
    """
    state    = copy.deepcopy(state)
    board    = state["board"]
    scores   = state["scores"]
    player   = state["current_player"]
    move_log = state["move_log"]

    # 1. Thuc hien nuoc di
    _do_move(board, scores, pit, direction, player)

    # Ghi log
    state["move_log"] = move_log + [{
        "turn":      len(move_log) + 1,
        "player":    player,
        "pit":       pit,
        "direction": direction,
        "board":     list(board),
        "scores":    dict(scores),
    }]

    # 2. Kiem tra ket thuc
    if is_game_over(board):
        _final_score(board, scores)
        return _finalize(state)

    # 3. Chuyen luot + xu ly het o dan
    next_player = opponent(player)

    if _check_empty_side(board, next_player):
        _refill(board, scores, next_player)

    # Neu van khong co nuoc di -> ket thuc
    state["current_player"] = next_player
    if not get_valid_moves(state):
        _final_score(board, scores)
        return _finalize(state)

    return state


# ─── Finalize ────────────────────────────────────────────────────────────────

def _finalize(state):
    scores = state["scores"]
    state["status"] = "finished"
    if scores["top"] > scores["bottom"]:
        state["winner"] = "top"
    elif scores["bottom"] > scores["top"]:
        state["winner"] = "bottom"
    else:
        state["winner"] = "draw"
    return state


# ─── Evaluate (cho AI) ───────────────────────────────────────────────────────

def evaluate(state, ai_player):
    """
    Ham danh gia tuong duong evaluate() goc:
      goc: return player2_score - player1_score  (player2 = AI = "bottom")
    O day: return scores[ai_player] - scores[opponent]
    """
    scores = state["scores"]
    opp    = opponent(ai_player)
    return scores[ai_player] - scores[opp]
