"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TOP_PITS = [1, 2, 3, 4, 5];
const BOTTOM_PITS = [7, 8, 9, 10, 11];
const TOP_ROW_INDICES = [1, 2, 3, 4, 5];
const BOTTOM_ROW_INDICES = [11, 10, 9, 8, 7];
const INITIAL_PITS = [1, 5, 5, 5, 5, 5, 1, 5, 5, 5, 5, 5];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Board({ onScoresChange }) {
	const [selectedSquare, setSelectedSquare] = useState(null);
	const [activePlayer, setActivePlayer] = useState("bottom");
	const [scores, setScores] = useState({ top: 0, bottom: 0 });
	const [isAnimating, setIsAnimating] = useState(false);
	const [pits, setPits] = useState([...INITIAL_PITS]);
	const [flyingPieces, setFlyingPieces] = useState([]);
	const [recentPit, setRecentPit] = useState(null);

	const boardRef = useRef(null);
	const pitRefs = useRef({});
	const pieceIdRef = useRef(0);

	useEffect(() => {
		onScoresChange?.(scores);
	}, [scores, onScoresChange]);

	const isQuanPit = (index) => index === 0 || index === 6;
	const isTopPit = (index) => TOP_PITS.includes(index);
	const isBottomPit = (index) => BOTTOM_PITS.includes(index);

	const getVisualStep = (index, direction) => {
		// Hàng dưới hiển thị theo thứ tự 11 -> 7, nên chiều trái/phải phải đảo để đúng hướng nhìn.
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
		setPits((prev) => {
			const next = [...prev];
			next[index] = value;
			return next;
		});
	};

	const addPitCount = (index, delta) => {
		setPits((prev) => {
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
			return { width: 0, height: 0 };
		}
		return { width: boardRect.width, height: boardRect.height };
	};

	const getPitCenter = (index) => {
		const boardRect = boardRef.current?.getBoundingClientRect();
		const pitRect = pitRefs.current[index]?.getBoundingClientRect();

		if (!boardRect || !pitRect) {
			const { width, height } = getBoardCenter();
			return { x: width / 2, y: height / 2 };
		}

		return {
			x: pitRect.left - boardRect.left + pitRect.width / 2,
			y: pitRect.top - boardRect.top + pitRect.height / 2,
		};
	};

	const getStorePoint = (owner) => {
		const { width, height } = getBoardCenter();
		if (owner === "top") {
			return { x: width / 2, y: 16 };
		}
		return { x: width / 2, y: height - 16 };
	};

	const launchFlight = ({ fromIndex, toIndex, owner, type }) => {
		const id = ++pieceIdRef.current;
		const from = getPitCenter(fromIndex);
		const to = toIndex === "store" ? getStorePoint(owner) : getPitCenter(toIndex);

		const item = {
			id,
			x: from.x,
			y: from.y,
			toX: to.x,
			toY: to.y,
			owner,
			type,
			phase: "start",
		};

		setFlyingPieces((prev) => [...prev, item]);

		requestAnimationFrame(() => {
			setFlyingPieces((prev) =>
				prev.map((piece) => (piece.id === id ? { ...piece, phase: "end" } : piece))
			);
		});

		const duration = type === "capture" ? 430 : 260;
		setTimeout(() => {
			setFlyingPieces((prev) => prev.filter((piece) => piece.id !== id));
		}, duration + 40);
	};

	const handleSquareClick = (index) => {
		if (isAnimating || isQuanPit(index)) return;

		const canPick = activePlayer === "top" ? isTopPit(index) : isBottomPit(index);
		if (!canPick || pits[index] <= 0) return;

		setSelectedSquare((prev) => (prev === index ? null : index));
	};

	const tryCapture = async (landingIndex, step, owner) => {
		const gapIndex = getNextIndex(landingIndex, step);
		const captureIndex = getNextIndex(gapIndex, step);

		if (isQuanPit(captureIndex)) return;
		if (pits[gapIndex] !== 0 || pits[captureIndex] <= 0) return;

		const captured = pits[captureIndex];
		setPitCount(captureIndex, 0);

		for (let i = 0; i < captured; i += 1) {
			launchFlight({ fromIndex: captureIndex, toIndex: "store", owner, type: "capture" });
			await sleep(95);
		}

		setScores((prev) => ({ ...prev, [owner]: prev[owner] + captured }));
	};

	const executeMove = async (index, direction) => {
		const step = getVisualStep(index, direction);
		const owner = activePlayer;
		const stones = pits[index];
		if (stones <= 0) return;

		setIsAnimating(true);
		setSelectedSquare(null);
		setPitCount(index, 0);

		let current = index;
		for (let i = 0; i < stones; i += 1) {
			const nextIndex = getNextIndex(current, step);
			launchFlight({ fromIndex: current, toIndex: nextIndex, owner, type: "sow" });
			await sleep(170);
			addPitCount(nextIndex, 1);
			markRecentPit(nextIndex);
			current = nextIndex;
		}

		await sleep(120);
		await tryCapture(current, step, owner);

		await sleep(150);
		setActivePlayer((prev) => (prev === "top" ? "bottom" : "top"));
		setIsAnimating(false);
	};

	const handleDirectionSelect = async (e, index, direction) => {
		e.stopPropagation();
		if (isAnimating) return;
		await executeMove(index, direction);
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
			// index === 0 là ô Quan của Người A (bottom)
			// index === 6 là ô Quan của Người B (top)
			if (index === 0 || index === 6) {
				// Ô Quan: bố trí đẹp - viên to ở giữa + viên nhỏ xung quanh
				const smallCount = Math.max(0, count - 1);
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
				className={`relative flex items-center justify-center cursor-pointer transition-colors ${additionalClasses} ${isSelected ? "bg-zinc-200" : "bg-white hover:bg-zinc-100"} ${isRecentPit ? "ring-2 ring-zinc-500 ring-inset" : ""} ${isAnimating ? "pointer-events-none" : ""}`}
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
			<div className="flex justify-center mb-3 text-sm sm:text-base text-zinc-800 px-2">
				<div className="bg-white rounded-full px-4 py-1 border border-zinc-300">Lượt: {activePlayer === "top" ? "Người B / Máy" : "Người A"}</div>
			</div>

			<div ref={boardRef} className="relative h-48 sm:h-64 shadow-2xl rounded-[100px] border border-zinc-300 bg-white overflow-hidden flex">
				<div className="absolute -top-11 left-1/2 -translate-x-1/2 z-10 text-xs sm:text-sm bg-white text-zinc-900 px-4 py-1 rounded-full border border-zinc-300 shadow-lg">Kho B: {scores.top}</div>
				<div className="absolute -bottom-11 left-1/2 -translate-x-1/2 z-10 text-xs sm:text-sm bg-white text-zinc-900 px-4 py-1 rounded-full border border-zinc-300 shadow-lg">Kho A: {scores.bottom}</div>

				{flyingPieces.map((piece) => (
					<div
						key={piece.id}
						className={`absolute z-30 rounded-full ${piece.type === "capture" ? "w-4 h-4 sm:w-5 sm:h-5" : "w-3 h-3 sm:w-4 sm:h-4"}`}
						style={{
							background: piece.owner === "top" ? "radial-gradient(circle at 30% 30%, #4b5563, #030712)" : "radial-gradient(circle at 30% 30%, #3f3f46, #000000)",
							boxShadow: "0 0 8px rgba(0,0,0,0.25)",
							left: 0,
							top: 0,
							transform: piece.phase === "end" ? `translate(${piece.toX}px, ${piece.toY}px)` : `translate(${piece.x}px, ${piece.y}px)`,
							transitionProperty: "transform, opacity",
							transitionDuration: piece.type === "capture" ? "430ms" : "260ms",
							transitionTimingFunction: piece.type === "capture" ? "cubic-bezier(0.2, 0.8, 0.2, 1)" : "linear",
							opacity: piece.phase === "end" ? 0.75 : 1,
						}}
					/>
				))}

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
