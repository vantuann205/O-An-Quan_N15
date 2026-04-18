"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TOP_PITS = [1, 2, 3, 4, 5];
const BOTTOM_PITS = [7, 8, 9, 10, 11];
const TOP_ROW_INDICES = [1, 2, 3, 4, 5];
const BOTTOM_ROW_INDICES = [11, 10, 9, 8, 7];
const INITIAL_PITS = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";
const PICKUP_DELAY_MS = 320;
const SOW_DELAY_MS = 420;
const CAPTURE_DELAY_MS = 260;
const PICKUP_FLIGHT_MS = 300;
const PICKUP_STAGGER_MS = 32;
const SOW_FLIGHT_MS = 620;
const CAPTURE_FLIGHT_MS = 900;
const CAPTURE_ARC_SPLIT = 0.42;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Board({ onScoresChange, onTurnChange, onGameEnd, getScoreTargetPoint, getPickupTargetPoint, mode = "pve" }) {
	const [selectedSquare, setSelectedSquare] = useState(null);
	const [gameState, setGameState] = useState(null);
	const [displayPits, setDisplayPits] = useState([...INITIAL_PITS]);
	const [isLoading, setIsLoading] = useState(true);
	const [isAnimating, setIsAnimating] = useState(false);
	const [isAiThinking, setIsAiThinking] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [flyingPieces, setFlyingPieces] = useState([]);
	const [heldStones, setHeldStones] = useState(null);
	const [recentPit, setRecentPit] = useState(null);
	const backendHint = `Backend không phản hồi tại ${API_BASE}. Hãy chạy Flask ở cổng 5000.`;

	const boardRef = useRef(null);
	const pitRefs = useRef({});
	const pieceIdRef = useRef(0);
	const aiLockRef = useRef(false);

	const pits = displayPits;
	const scores = gameState?.scores || { top: 0, bottom: 0 };
	const activePlayer = gameState?.current_player || "bottom";
	const isBusy = isLoading || isAnimating || isAiThinking;
	const turnTheme = activePlayer === "top"
		? {
			scoreActive: "bg-blue-500 text-white border-blue-400",
			scoreInactive: "bg-white text-zinc-900 border-zinc-300",
		}
		: {
			scoreActive: "bg-rose-500 text-white border-rose-400",
			scoreInactive: "bg-white text-zinc-900 border-zinc-300",
		};

	useEffect(() => {
		onScoresChange?.(scores);
	}, [scores, onScoresChange]);

	useEffect(() => {
		onTurnChange?.(activePlayer);
	}, [activePlayer, onTurnChange]);

	useEffect(() => {
		if (!gameState || gameState.status !== "finished") return;

		const topScore = gameState?.final_result?.top_score ?? gameState?.scores?.top ?? 0;
		const bottomScore = gameState?.final_result?.bottom_score ?? gameState?.scores?.bottom ?? 0;

		onGameEnd?.({
			winner: gameState.winner,
			topScore,
			bottomScore,
		});
	}, [gameState, onGameEnd]);

	useEffect(() => {
		const createGame = async () => {
			setIsLoading(true);
			setErrorMessage("");
			try {
				const response = await fetch(`${API_BASE}/api/new`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ first_player: "bottom" }),
				});
				const data = await response.json();
				if (!response.ok) {
					throw new Error(data?.error || "Không tạo được ván mới");
				}
				setGameState(data);
				setDisplayPits(data.board || INITIAL_PITS);
			} catch (error) {
				setErrorMessage(error.message || backendHint);
			} finally {
				setIsLoading(false);
			}
		};

		createGame();
	}, []);

	useEffect(() => {
		if (gameState?.board) {
			setDisplayPits([...gameState.board]);
		}
	}, [gameState]);

	useEffect(() => {
		const runAiMove = async () => {
			if (!gameState || mode !== "pve") return;
			if (gameState.status !== "playing" || gameState.current_player !== "top") return;
			if (isLoading || isAnimating) return;
			if (aiLockRef.current) return;

			aiLockRef.current = true;
			setIsAiThinking(true);
			setErrorMessage("");

			try {
				const response = await fetch(`${API_BASE}/api/ai-move`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						state: gameState,
						difficulty: 2,
					}),
				});

				const data = await response.json();
				if (!response.ok) {
					throw new Error(data?.error || "AI không thể đi");
				}

				if (typeof data?.pit === "number" && (data?.direction === 1 || data?.direction === -1)) {
					const actions = buildMoveActions(gameState, data.pit, data.direction);
					await animateMoveActions(actions, "top");
				}

				setGameState(data.state);
			} catch (error) {
				setErrorMessage(error.message || backendHint);
			} finally {
				setIsAiThinking(false);
				aiLockRef.current = false;
			}
		};

		runAiMove();
	}, [gameState, mode, isLoading, isAnimating]);

	const isQuanPit = (index) => index === 0 || index === 6;
	const isTopPit = (index) => TOP_PITS.includes(index);
	const isBottomPit = (index) => BOTTOM_PITS.includes(index);

	const getVisualStep = (index, direction) => {
		if (isBottomPit(index)) {
			return direction === "right" ? -1 : 1;
		}

		return direction === "right" ? 1 : -1;
	};

	const getNextIndex = (index, step) => {
		if (step > 0) return (index + 1) % 12;
		return (index + 11) % 12;
	};

	const setPitCount = (index, value) => {
		setDisplayPits((prev) => {
			const next = [...prev];
			next[index] = value;
			return next;
		});
	};

	const addPitCount = (index, delta) => {
		setDisplayPits((prev) => {
			const next = [...prev];
			next[index] += delta;
			return next;
		});
	};

	const markRecentPit = (index) => {
		setRecentPit(index);
		setTimeout(() => {
			setRecentPit((prev) => (prev === index ? null : prev));
		}, 220);
	};

	const getBoardCenter = () => {
		const boardRect = boardRef.current?.getBoundingClientRect();
		if (!boardRect) {
			return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
		}
		return {
			x: boardRect.left + boardRect.width / 2,
			y: boardRect.top + boardRect.height / 2,
		};
	};

	const getPitCenter = (index) => {
		const pitRect = pitRefs.current[index]?.getBoundingClientRect();

		if (!pitRect) {
			return getBoardCenter();
		}

		return {
			x: pitRect.left + pitRect.width / 2,
			y: pitRect.top + pitRect.height / 2,
		};
	};

	const getStorePoint = (owner) => {
		const externalTarget = getScoreTargetPoint?.(owner);

		if (externalTarget?.x != null && externalTarget?.y != null) {
			return externalTarget;
		}

		const boardRect = boardRef.current?.getBoundingClientRect();
		if (!boardRect) {
			return getBoardCenter();
		}

		if (owner === "top") {
			return { x: boardRect.left + boardRect.width / 2, y: boardRect.top + 16 };
		}
		return { x: boardRect.left + boardRect.width / 2, y: boardRect.bottom - 16 };
	};

	const getPickupPoint = (owner) => {
		const externalTarget = getPickupTargetPoint?.(owner);

		if (externalTarget?.x != null && externalTarget?.y != null) {
			return externalTarget;
		}

		const boardRect = boardRef.current?.getBoundingClientRect();
		if (!boardRect) {
			return getBoardCenter();
		}

		if (owner === "top") {
			return { x: boardRect.left + boardRect.width / 2, y: boardRect.top - 20 };
		}
		return { x: boardRect.left + boardRect.width / 2, y: boardRect.bottom + 20 };
	};

	const launchFlight = ({ fromIndex, toIndex, owner, type }) => {
		const id = ++pieceIdRef.current;
		const from = getPitCenter(fromIndex);
		const to = toIndex === "store"
			? getStorePoint(owner)
			: toIndex === "pickup"
				? getPickupPoint(owner)
				: getPitCenter(toIndex);
		const isCapture = type === "capture";
		const isPickup = type === "pickup";
		const duration = isCapture ? CAPTURE_FLIGHT_MS : isPickup ? PICKUP_FLIGHT_MS : SOW_FLIGHT_MS;
		const dx = to.x - from.x;
		const dy = to.y - from.y;
		const captureLift = Math.min(130, Math.max(70, Math.abs(dy) * 0.45 + 55));
		const mid = isCapture
			? {
				x: from.x + dx * 0.5,
				y: Math.min(from.y, to.y) - captureLift,
			}
			: null;

		const item = {
			id,
			x: from.x,
			y: from.y,
			midX: mid?.x,
			midY: mid?.y,
			toX: to.x,
			toY: to.y,
			owner,
			type,
			phase: "start",
		};

		setFlyingPieces((prev) => [...prev, item]);

		requestAnimationFrame(() => {
			setFlyingPieces((prev) =>
				prev.map((piece) => (piece.id === id ? { ...piece, phase: isCapture ? "mid" : "end" } : piece))
			);
		});

		if (isCapture) {
			setTimeout(() => {
				setFlyingPieces((prev) =>
					prev.map((piece) => (piece.id === id ? { ...piece, phase: "end" } : piece))
				);
			}, Math.round(duration * CAPTURE_ARC_SPLIT));
		}

		setTimeout(() => {
			setFlyingPieces((prev) => prev.filter((piece) => piece.id !== id));
		}, duration + 40);
	};

	const getFlightVisual = (piece) => {
		const isCapture = piece.type === "capture";
		const targetX = piece.phase === "end" ? piece.toX : piece.phase === "mid" ? piece.midX : piece.x;
		const targetY = piece.phase === "end" ? piece.toY : piece.phase === "mid" ? piece.midY : piece.y;
		const totalDuration = isCapture ? CAPTURE_FLIGHT_MS : SOW_FLIGHT_MS;
		const isPickup = piece.type === "pickup";
		const stageDuration = isCapture
			? piece.phase === "mid"
				? Math.round(totalDuration * CAPTURE_ARC_SPLIT)
				: Math.round(totalDuration * (1 - CAPTURE_ARC_SPLIT))
			: totalDuration;
		const scale = isCapture
			? piece.phase === "mid"
				? 1.22
				: piece.phase === "end"
					? 0.72
					: 1
			: 1;
		const opacity = isCapture ? (piece.phase === "end" ? 0.5 : 0.96) : isPickup ? 0.95 : 1;

		return {
			transform: `translate(${targetX}px, ${targetY}px) translate(-50%, -50%) scale(${scale})`,
			transitionDuration: `${stageDuration}ms`,
			opacity,
			transitionTimingFunction: isCapture
				? piece.phase === "end"
					? "cubic-bezier(0.16, 0.88, 0.24, 1)"
					: "cubic-bezier(0.28, 0.7, 0.25, 1)"
				: isPickup
					? "cubic-bezier(0.2, 0.78, 0.2, 1)"
					: "cubic-bezier(0.22, 0.61, 0.36, 1)",
		};
	};

	const buildMoveActions = (stateSnapshot, pit, direction) => {
		if (!stateSnapshot?.board) return [];

		const board = [...stateSnapshot.board];
		const actions = [];
		let pos = pit;
		let stones = board[pos] || 0;

		if (stones <= 0) return actions;

		actions.push({ type: "pickup", pit: pos, count: stones });
		board[pos] = 0;

		while (true) {
			while (stones > 0) {
				const from = pos;
				pos = (pos + direction + 12) % 12;
				board[pos] += 1;
				stones -= 1;
				actions.push({ type: "sow", from, to: pos });
			}

			let nextPos = (pos + direction + 12) % 12;
			let nextNext = (pos + 2 * direction + 24) % 12;

			if (board[nextPos] > 0 && nextPos !== 0 && nextPos !== 6) {
				stones = board[nextPos];
				actions.push({ type: "pickup", pit: nextPos, count: stones });
				board[nextPos] = 0;
				pos = nextPos;
				continue;
			}

			if (board[nextPos] === 0 && board[nextNext] > 0) {
				while (board[nextPos] === 0 && board[nextNext] > 0) {
					const captured = board[nextNext];
					board[nextNext] = 0;
					actions.push({ type: "capture", pit: nextNext, count: captured });
					pos = nextNext;
					nextPos = (pos + direction + 12) % 12;
					nextNext = (pos + 2 * direction + 24) % 12;
				}
			}

			break;
		}

		return actions;
	};

	const animateMoveActions = async (actions, owner) => {
		let carriedCount = 0;

		for (const action of actions) {
			if (action.type === "pickup") {
				const visualCount = Math.min(action.count || 0, 8);
				const pickupPoint = getPickupPoint(owner);
				carriedCount = action.count || 0;
				setHeldStones({ owner, count: carriedCount, x: pickupPoint.x, y: pickupPoint.y });
				setPitCount(action.pit, 0);
				for (let i = 0; i < visualCount; i += 1) {
					setTimeout(() => {
						launchFlight({ fromIndex: action.pit, toIndex: "pickup", owner, type: "pickup" });
					}, i * PICKUP_STAGGER_MS);
				}
				await sleep(Math.max(PICKUP_DELAY_MS, PICKUP_FLIGHT_MS + visualCount * PICKUP_STAGGER_MS));
				continue;
			}

			if (action.type === "sow") {
				if (carriedCount > 0) {
					carriedCount -= 1;
					setHeldStones((prev) => {
						if (!prev) return prev;
						if (carriedCount <= 0) return null;
						return { ...prev, count: carriedCount };
					});
				}

				launchFlight({ fromIndex: action.from, toIndex: action.to, owner, type: "sow" });
				await sleep(SOW_DELAY_MS);
				addPitCount(action.to, 1);
				markRecentPit(action.to);
				continue;
			}

			if (action.type === "capture") {
				setHeldStones(null);
				setPitCount(action.pit, 0);
				for (let i = 0; i < action.count; i += 1) {
					launchFlight({ fromIndex: action.pit, toIndex: "store", owner, type: "capture" });
					await sleep(CAPTURE_DELAY_MS);
				}
			}
		}

		setHeldStones(null);
	};

	const handleSquareClick = (index) => {
		if (isBusy || !gameState || gameState.status !== "playing" || isQuanPit(index)) return;
		if (mode === "pve" && activePlayer === "top") return;

		const canPick = activePlayer === "top" ? isTopPit(index) : isBottomPit(index);
		if (!canPick || pits[index] <= 0) return;

		setSelectedSquare((prev) => (prev === index ? null : index));
	};

	const executeMove = async (index, direction) => {
		if (!gameState || gameState.status !== "playing") return;

		const step = getVisualStep(index, direction);
		const owner = activePlayer;
		const stones = pits[index];
		if (stones <= 0) return;

		setIsAnimating(true);
		setErrorMessage("");
		setSelectedSquare(null);
		setHeldStones(null);

		const actions = buildMoveActions(gameState, index, step);
		await animateMoveActions(actions, owner);

		try {
			const response = await fetch(`${API_BASE}/api/move`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					state: gameState,
					pit: index,
					direction: step,
				}),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.error || "Nước đi không hợp lệ");
			}
			setGameState(data);
		} catch (error) {
			setErrorMessage(error.message || backendHint);
			setDisplayPits([...(gameState.board || INITIAL_PITS)]);
		} finally {
			setIsAnimating(false);
			setHeldStones(null);
		}
	};

	const handleDirectionSelect = async (e, index, direction) => {
		e.stopPropagation();
		if (isBusy) return;
		await executeMove(index, direction);
	};

	const getWinnerLabel = (winner) => {
		if (winner === "top") return "Người B / Máy";
		if (winner === "bottom") return "Người A";
		return "Hòa";
	};

	// Danh sách các border-radius tạo hình dáng nhấp nhô giống viên sỏi
	const pebbleShapes = [
		"50% 50% 40% 60% / 60% 40% 50% 50%",
		"40% 60% 50% 50% / 50% 50% 60% 40%",
		"50% 40% 60% 50% / 60% 50% 40% 60%",
		"60% 40% 50% 50% / 40% 60% 50% 50%",
		"45% 55% 45% 55% / 55% 45% 55% 45%",
	];

	// Bảng màu đơn sắc cho giao diện nền đen
	const richColors = [
		"radial-gradient(circle at 30% 30%, #4b5563, #020617)",
		"radial-gradient(circle at 30% 30%, #374151, #000000)",
		"radial-gradient(circle at 30% 30%, #52525b, #09090b)",
		"radial-gradient(circle at 30% 30%, #3f3f46, #030712)",
		"radial-gradient(circle at 30% 30%, #525252, #0a0a0a)",
		"radial-gradient(circle at 30% 30%, #27272a, #000000)",
	];

	const renderPieces = (count, isQuan, index) => {
		if (count <= 0) return null;

		if (isQuan) {
			const isEaten = gameState?.big_piece_eaten?.[index.toString()] ?? false;

			if (index === 0 || index === 6) {
				// Nếu chưa bị ăn, hiện 1 viên to + (count - 5) viên nhỏ
				// Nếu đã bị ăn, hiện tất cả là viên nhỏ
				if (!isEaten && count >= 5) {
					const smallCount = Math.max(0, count - 5);
					const displaySmallCount = Math.min(smallCount, 14);

					return (
						<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
							{/* Viên to ở giữa */}
							<div
								className="absolute w-[55%] h-[55%] max-w-[28px] max-h-[28px]"
								style={{
									background: richColors[index % richColors.length],
									borderRadius: pebbleShapes[index % pebbleShapes.length],
									boxShadow: "2px 4px 8px rgba(0,0,0,0.4), inset -1px -1px 2px rgba(0,0,0,0.2)",
								}}
							/>

							{/* Viên nhỏ xung quanh theo vòng tròn */}
							{Array.from({ length: displaySmallCount }).map((_, i) => {
								const angle = (i / displaySmallCount) * Math.PI * 2;
								const radius = 32;
								const x = Math.cos(angle) * radius;
								const y = Math.sin(angle) * radius;

								const shape = pebbleShapes[(i + index) % pebbleShapes.length];
								const colorGradient = richColors[(i + index * 2) % richColors.length];

								return (
									<div
										key={`${index}-small-${i}`}
										className="absolute w-[35%] h-[35%] max-w-[16px] max-h-[16px]"
										style={{
											left: `calc(50% + ${x}px)`,
											top: `calc(50% + ${y}px)`,
											transform: "translate(-50%, -50%)",
											background: colorGradient,
											borderRadius: shape,
											boxShadow: "1px 2px 4px rgba(0,0,0,0.35)",
										}}
									/>
								);
							})}
						</div>
					);
				}
				// Nếu đã bị ăn hoặc count < 5 (trường hợp hiếm), render toàn bộ là quân nhỏ (rơi vào đoạn code bên dưới)
			}
		}

		const columns = Math.max(2, Math.ceil(Math.sqrt(count * 1.2)));
		const rows = Math.ceil(count / columns);

		return (
			<div
				className="absolute inset-0 p-1 md:p-2 lg:p-3 pointer-events-none grid gap-[2px]"
				style={{
					gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
					gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
				}}
			>
				{Array.from({ length: count }).map((_, i) => {
					const shape = pebbleShapes[(i + index) % pebbleShapes.length];
					const rotate = (i * 87 + index * 15) % 360;
					const colorGradient = richColors[(i + index * 2) % richColors.length];

					return (
						<div
							key={`${index}-${i}`}
							className="justify-self-center self-center aspect-square w-[72%] max-w-[18px]"
							style={{
								background: colorGradient,
								borderRadius: shape,
								transform: `rotate(${rotate}deg)`,
								boxShadow: "1px 2px 4px rgba(0,0,0,0.35)",
							}}
						/>
					);
				})}
			</div>
		);
	};

	const renderSquare = (index, isQuan = false, additionalClasses = "") => {
		const isSelected = selectedSquare === index;
		const pieceCount = pits[index];
		const isRecentPit = recentPit === index;

		return (
			<div
				key={index}
				ref={(node) => {
					pitRefs.current[index] = node;
				}}
				className={`relative flex items-center justify-center cursor-pointer transition-colors ${additionalClasses} ${isSelected ? "bg-zinc-200" : "bg-white hover:bg-zinc-100"} ${isRecentPit ? "ring-2 ring-zinc-500 ring-inset" : ""} ${isBusy ? "pointer-events-none" : ""}`}
				onClick={() => handleSquareClick(index)}
			>
				{renderPieces(pieceCount, isQuan, index)}

				{isSelected && !isQuan && (
					<div className="absolute inset-0 flex items-center justify-between px-1 z-20 pointer-events-none">
						<button
							type="button"
							className="pointer-events-auto bg-black/90 text-white rounded-full p-1 border border-zinc-700 hover:bg-black hover:scale-110 active:scale-95 transition-all shadow-md"
							onClick={(e) => handleDirectionSelect(e, index, "left")}
						>
							<ChevronLeft size={24} strokeWidth={2.5} />
						</button>
						<button
							type="button"
							className="pointer-events-auto bg-black/90 text-white rounded-full p-1 border border-zinc-700 hover:bg-black hover:scale-110 active:scale-95 transition-all shadow-md"
							onClick={(e) => handleDirectionSelect(e, index, "right")}
						>
							<ChevronRight size={24} strokeWidth={2.5} />
						</button>
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="w-[95%] max-w-[900px]">
			{errorMessage && <div className="mb-2 text-center text-sm text-red-600">{errorMessage}</div>}

			<div ref={boardRef} className="relative h-48 sm:h-64 shadow-2xl rounded-[100px] border border-zinc-300 bg-white overflow-hidden flex">
				<div className={`absolute -top-11 left-1/2 -translate-x-1/2 z-10 text-xs sm:text-sm px-4 py-1 rounded-full border shadow-lg transition-colors ${activePlayer === "top" ? turnTheme.scoreActive : turnTheme.scoreInactive}`}>Kho B: {scores.top}</div>
				<div className={`absolute -bottom-11 left-1/2 -translate-x-1/2 z-10 text-xs sm:text-sm px-4 py-1 rounded-full border shadow-lg transition-colors ${activePlayer === "bottom" ? turnTheme.scoreActive : turnTheme.scoreInactive}`}>Kho A: {scores.bottom}</div>

				{flyingPieces.map((piece) => (
					<div
						key={piece.id}
						className={`fixed z-[70] pointer-events-none rounded-full ${piece.type === "capture" ? "w-4 h-4 sm:w-5 sm:h-5" : "w-3 h-3 sm:w-4 sm:h-4"}`}
						style={{
							background: piece.owner === "top" ? "radial-gradient(circle at 30% 30%, #4b5563, #030712)" : "radial-gradient(circle at 30% 30%, #3f3f46, #000000)",
							boxShadow: piece.type === "capture" ? "0 0 14px rgba(15,23,42,0.35)" : "0 0 5px rgba(0,0,0,0.2)",
							left: 0,
							top: 0,
							transitionProperty: "transform, opacity",
							...getFlightVisual(piece),
						}}
					/>
				))}

				{heldStones && heldStones.count > 0 && (
					<div
						className="fixed z-[75] pointer-events-none"
						style={{
							left: 0,
							top: 0,
							transform: `translate(${heldStones.x}px, ${heldStones.y}px) translate(-50%, -50%)`,
						}}
					>
						<div className={`relative rounded-full border shadow-md px-3 py-2 min-w-[54px] text-center ${heldStones.owner === "top" ? "bg-blue-500/95 border-blue-300 text-white" : "bg-rose-500/95 border-rose-300 text-white"}`}>
							<div className="absolute -top-2 -left-2 w-3 h-3 rounded-full bg-white/85" />
							<div className="absolute -top-1 right-0 w-2.5 h-2.5 rounded-full bg-white/70" />
							<span className="text-sm font-semibold leading-none">{heldStones.count}</span>
						</div>
					</div>
				)}

				{/* Left Quan */}
				<div className="w-[15%] min-w-[70px] h-full flex flex-col border-r border-zinc-300">
					{renderSquare(0, true, "h-full w-full border-0")}
				</div>

				{/* Middle Dan Grid (10 squares) */}
				<div className="flex-1 grid grid-cols-5 grid-rows-2 h-full">
					<div className="contents row-start-1">
						{TOP_ROW_INDICES.map((i, idx) =>
							renderSquare(i, false, `border-b border-zinc-300 ${idx !== 4 ? "border-r" : ""}`)
						)}
					</div>
					<div className="contents row-start-2">
						{BOTTOM_ROW_INDICES.map((i, idx) =>
							renderSquare(i, false, `${idx !== 4 ? "border-r border-zinc-300" : ""}`)
						)}
					</div>
				</div>

				{/* Right Quan */}
				<div className="w-[15%] min-w-[70px] h-full flex flex-col border-l border-zinc-300">
					{renderSquare(6, true, "h-full w-full border-0")}
				</div>
			</div>
		</div>
	);
}
