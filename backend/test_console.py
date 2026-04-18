# -*- coding: utf-8 -*-
"""
test_console.py - O An Quan Console UI
Chay: python test_console.py

Phim tat khi choi:
  <so>  - chon o (vd: 8)
  p/t   - chieu phai / trai
  h     - xem lich su nuoc di
  q     - thoat
"""
import sys, time, os

from game_logic import make_state, apply_move, get_valid_moves
from ai import get_ai_move

# --- ANSI colors --------------------------------------------------------------
try:
    import colorama; colorama.init()
    R   = "\033[91m"
    G   = "\033[92m"
    Y   = "\033[93m"
    B   = "\033[94m"
    M   = "\033[95m"
    C   = "\033[96m"
    W   = "\033[97m"
    DIM = "\033[2m"
    RST = "\033[0m"
    BOLD= "\033[1m"
except ImportError:
    R=G=Y=B=M=C=W=DIM=RST=BOLD=""

def clr():
    os.system("cls" if os.name == "nt" else "clear")


# --- Ve ban co ----------------------------------------------------------------

def stone_char(count, is_quan_pit):
    if count == 0:
        return DIM + "  .  " + RST
    if is_quan_pit:
        return Y + BOLD + " %3d " % count + RST
    if count >= 10:
        return G + " %3d " % count + RST
    return W + "  %2d " % count + RST

def pit_label(idx):
    return DIM + "[%2d]" % idx + RST

def render_board(state):
    board  = state["board"]
    scores = state["scores"]
    player = state["current_player"]
    status = state["status"]
    turn   = len(state.get("move_log", []))

    print()
    if status == "finished":
        print(M + BOLD + "  *** GAME KET THUC ***" + RST)
    else:
        turn_str = (B + "TOP (May)" + RST) if player == "top" else (G + "BOTTOM (Ban)" + RST)
        print("  Luot %d  |  Di: " % (turn + 1) + BOLD + turn_str)
    print()

    print("  " + B + BOLD + "  [ MAY / TOP ]" + RST +
          "   " + B + "Kho: " + BOLD + "%d diem" % scores["top"] + RST)
    print()

    top_indices = list(range(1, 6))
    print("        " + "  ".join(pit_label(i) for i in top_indices))
    print("        " + "  ".join(stone_char(board[i], False) for i in top_indices))

    ql, qr = board[0], board[6]
    sep = DIM + "-" * 34 + RST
    print()
    print("  " + pit_label(0) + " " + stone_char(ql, True) +
          "  " + sep + "  " +
          stone_char(qr, True) + " " + pit_label(6))
    print("  " + DIM + "  Quan" + RST +
          "              " + DIM + "O AN QUAN" + RST +
          "              " + DIM + "Quan  " + RST)
    print()

    bot_indices = list(range(11, 6, -1))
    print("        " + "  ".join(stone_char(board[i], False) for i in bot_indices))
    print("        " + "  ".join(pit_label(i) for i in bot_indices))
    print()

    print("  " + G + BOLD + "  [ BAN / BOTTOM ]" + RST +
          "   " + G + "Kho: " + BOLD + "%d diem" % scores["bottom"] + RST)
    print()
    print("  " + DIM + "Tong quan tren ban: %d  |  Lich su: %d nuoc  (nhap 'h' de xem)" % (sum(board), turn) + RST)

    if status == "finished":
        st, sb = scores["top"], scores["bottom"]
        winner = state["winner"]
        print()
        print("  " + "-" * 42)
        print("  Diem cuoi:  MAY=%d  |  BAN=%d" % (st, sb))
        if winner == "draw":
            print("  " + Y + BOLD + "  KET QUA: HOA!" + RST)
        elif winner == "top":
            print("  " + B + BOLD + "  NGUOI THANG: MAY (TOP)" + RST)
        else:
            print("  " + G + BOLD + "  NGUOI THANG: BAN (BOTTOM)" + RST)
        print("  " + "-" * 42)
    print()


# --- Hien thi lich su nuoc di -------------------------------------------------

def render_history(state):
    log = state.get("move_log", [])
    if not log:
        print(DIM + "  Chua co nuoc di nao." + RST)
        return

    clr()
    print()
    print(Y + BOLD + "  LICH SU NUOC DI (%d nuoc)" % len(log) + RST)
    print("  " + "-" * 58)
    print("  %-5s %-10s %-6s %-6s %-14s %-14s" % ("Luot", "Nguoi", "O", "Chieu", "Kho TOP", "Kho BOT"))
    print("  " + "-" * 58)

    for entry in log:
        t       = entry["turn"]
        p       = entry["player"]
        pit     = entry["pit"]
        d       = entry["direction"]
        sc      = entry["scores"]
        arrow   = "->" if d == 1 else "<-"
        p_label = (B + "MAY  " + RST) if p == "top" else (G + "BAN  " + RST)
        print("  %-5d %s%-5s  %-6d %-6s %-14d %-14d" % (
            t, p_label, "", pit, arrow, sc["top"], sc["bottom"]
        ))

    print("  " + "-" * 58)
    print()
    input("  Nhan Enter de quay lai...")


# --- Hien thi o dan hop le ----------------------------------------------------

def print_moves(state):
    board  = state["board"]
    player = state["current_player"]
    pits   = list(range(7, 12)) if player == "bottom" else list(range(1, 6))
    valid_pits = [p for p in pits if board[p] > 0]

    print("  " + BOLD + "O dan cua ban:" + RST)
    for p in valid_pits:
        print("    " + Y + "[%d]" % p + RST + "  ->  %d quan" % board[p])
    print()
    print("  Chon o, roi nhan " + G + BOLD + "p" + RST + " (phai) hoac " +
          M + BOLD + "t" + RST + " (trai)  |  " +
          DIM + "h = lich su  |  q = thoat" + RST)
    print()
    return valid_pits


# --- Luot nguoi ---------------------------------------------------------------

def human_turn(state):
    board  = state["board"]
    player = state["current_player"]
    pits   = list(range(7, 12)) if player == "bottom" else list(range(1, 6))
    valid_pits = [p for p in pits if board[p] > 0]

    if not valid_pits:
        print(R + "  Khong co nuoc di!" + RST)
        return None

    print_moves(state)

    # Buoc 1: chon o
    pit = None
    while pit is None:
        try:
            raw = input("  " + BOLD + "Chon o: " + RST).strip().lower()
            if raw == "q":
                print("  Tam biet!")
                sys.exit(0)
            if raw == "h":
                render_history(state)
                clr()
                render_board(state)
                print_moves(state)
                continue
            idx = int(raw)
            if idx in valid_pits:
                pit = idx
            else:
                print(R + "  O khong hop le. Chon trong: %s" % valid_pits + RST)
        except ValueError:
            print(R + "  Nhap so index cua o." + RST)

    # Buoc 2: chon chieu
    while True:
        raw = input("  " + BOLD + "Chieu [p/t]: " + RST).strip().lower()
        if raw == "p":
            return (pit, 1)
        if raw == "t":
            return (pit, -1)
        if raw == "h":
            render_history(state)
            clr()
            render_board(state)
            print_moves(state)
            print("  " + Y + "Da chon o %d. Chieu [p/t]: " % pit + RST, end="")
        else:
            print(R + "  Nhan p hoac t." + RST)


# --- Luot AI ------------------------------------------------------------------

def ai_turn(state, difficulty=2):
    print("  " + B + "May dang suy nghi..." + RST, end="", flush=True)
    t0   = time.time()
    move = get_ai_move(state, difficulty=difficulty)
    dt   = time.time() - t0
    if move is None:
        print(R + " khong co nuoc di!" + RST)
        return None
    pit, d = move
    arrow = "->" if d == 1 else "<-"
    print(B + " O %d %s  (%.2fs)" % (pit, arrow, dt) + RST)
    time.sleep(0.7)
    return move


# --- Vong lap game ------------------------------------------------------------

def run_pve(difficulty=2):
    state = make_state(first_player="bottom")
    diff_label = {1: "De", 2: "Trung", 3: "Kho"}.get(difficulty, "Kho")
    print(G + BOLD + "\n  === NGUOI (bottom) vs AI (top) [%s] ===" % diff_label + RST)
    time.sleep(0.8)

    while state["status"] == "playing":
        clr()
        render_board(state)

        if state["current_player"] == "bottom":
            move = human_turn(state)
            if move is None:
                break
        else:
            move = ai_turn(state, difficulty=difficulty)
            if move is None:
                break

        state = apply_move(state, move[0], move[1])

    clr()
    render_board(state)
    raw = input("  Nhan Enter de thoat, hoac 'h' xem lich su: ").strip().lower()
    if raw == "h":
        render_history(state)


def run_pvp():
    state = make_state(first_player="bottom")
    print(Y + BOLD + "\n  === NGUOI vs NGUOI ===" + RST)
    time.sleep(0.8)

    while state["status"] == "playing":
        clr()
        render_board(state)
        move = human_turn(state)
        if move is None:
            break
        state = apply_move(state, move[0], move[1])

    clr()
    render_board(state)
    raw = input("  Nhan Enter de thoat, hoac 'h' xem lich su: ").strip().lower()
    if raw == "h":
        render_history(state)


def run_ai_vs_ai(difficulty=2):
    state = make_state(first_player="bottom")
    print(M + BOLD + "\n  === AI vs AI (demo) ===" + RST)
    turn = 0

    while state["status"] == "playing":
        clr()
        render_board(state)
        label = "AI-%s" % state["current_player"].upper()
        print("  " + B + "%s dang suy nghi..." % label + RST, end="", flush=True)
        t0   = time.time()
        move = get_ai_move(state, difficulty=difficulty)
        dt   = time.time() - t0
        if move is None:
            break
        pit, d = move
        print(B + " O %d %s  (%.2fs)" % (pit, "->" if d==1 else "<-", dt) + RST)
        state = apply_move(state, move[0], move[1])
        turn += 1
        time.sleep(0.4)

    clr()
    render_board(state)
    print("  Tong so luot: %d" % turn)
    raw = input("  Nhan Enter de thoat, hoac 'h' xem lich su: ").strip().lower()
    if raw == "h":
        render_history(state)


# --- Menu chinh ---------------------------------------------------------------

def main():
    clr()
    print()
    print(Y + BOLD)
    print("  +==========================================+")
    print("  |                                          |")
    print("  |          O  A N  Q U A N                |")
    print("  |                                          |")
    print("  +==========================================+" + RST)
    print()
    print("  " + W + "1." + RST + "  Nguoi vs AI   (ban choi bottom)")
    print("  " + W + "2." + RST + "  Nguoi vs Nguoi")
    print("  " + W + "3." + RST + "  AI vs AI      (demo)")
    print()

    while True:
        choice = input("  " + BOLD + "Chon che do (1/2/3): " + RST).strip()
        if choice in ("1", "2", "3"):
            break
        print(R + "  Nhap 1, 2 hoac 3." + RST)

    if choice == "1":
        print()
        print("  " + W + "Do kho AI:" + RST)
        print("  " + W + "  1." + RST + " De  (random)")
        print("  " + W + "  2." + RST + " Kho (minimax + alpha-beta, depth=4)")
        while True:
            d = input("  " + BOLD + "Chon do kho (1/2, mac dinh=2): " + RST).strip()
            if d in ("1", "2", ""):
                break
            print(R + "  Nhap 1 hoac 2." + RST)
        difficulty = int(d) if d else 2
        run_pve(difficulty=difficulty)
    elif choice == "2":
        run_pvp()
    else:
        run_ai_vs_ai(difficulty=2)


if __name__ == "__main__":
    main()
