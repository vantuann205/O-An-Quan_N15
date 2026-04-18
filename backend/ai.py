# -*- coding: utf-8 -*-
"""
ai.py - AI cho O An Quan
=========================
Logic goc: Minimax depth=2 (khong co alpha-beta).
Cai tien: them Alpha-Beta Pruning, depth co the chinh.

Do kho:
  1 (De) : Random  (y het logic goc difficulty=1)
  2 (Kho): Minimax + Alpha-Beta  (nang cap tu logic goc difficulty=2)
"""

import random
import math
from game_logic import (
    apply_move, get_valid_moves, evaluate, opponent
)

DEFAULT_DEPTH = 4   # depth mac dinh (logic goc dung 2, tang len cho manh hon)


# ─── Minimax + Alpha-Beta Pruning ────────────────────────────────────────────

def minimax(state, depth, alpha, beta, maximizing, ai_player):
    """
    Minimax voi Alpha-Beta Pruning.
    Logic goc dung minimax depth=2 khong co alpha-beta.
    O day giu nguyen y tuong, chi them alpha-beta cat tinh.
    """
    if depth == 0 or state["status"] == "finished":
        return evaluate(state, ai_player), None

    moves = get_valid_moves(state)
    if not moves:
        return evaluate(state, ai_player), None

    best_move = None

    if maximizing:
        best_score = -math.inf
        for pit, direction in moves:
            child = apply_move(state, pit, direction)
            score, _ = minimax(child, depth - 1, alpha, beta, False, ai_player)
            if score > best_score:
                best_score = score
                best_move  = (pit, direction)
            alpha = max(alpha, best_score)
            if alpha >= beta:
                break   # Beta cut-off
        return best_score, best_move
    else:
        best_score = math.inf
        for pit, direction in moves:
            child = apply_move(state, pit, direction)
            score, _ = minimax(child, depth - 1, alpha, beta, True, ai_player)
            if score < best_score:
                best_score = score
                best_move  = (pit, direction)
            beta = min(beta, best_score)
            if alpha >= beta:
                break   # Alpha cut-off
        return best_score, best_move


# ─── Entry point ─────────────────────────────────────────────────────────────

def get_ai_move(state, difficulty=2, depth=None):
    """
    Tra ve (pit, direction) tot nhat cho AI.

    difficulty=1 : Random (y het logic goc)
    difficulty=2 : Minimax + Alpha-Beta (nang cap tu logic goc)
    depth        : ghi de depth mac dinh neu truyen vao
    """
    moves = get_valid_moves(state)
    if not moves:
        return None

    # Do kho 1: Random (y het logic goc)
    if difficulty == 1:
        return random.choice(moves)

    # Do kho 2: Minimax + Alpha-Beta
    d         = depth if depth is not None else DEFAULT_DEPTH
    ai_player = state["current_player"]
    _, best   = minimax(state, d, -math.inf, math.inf, True, ai_player)

    return best if best else random.choice(moves)
