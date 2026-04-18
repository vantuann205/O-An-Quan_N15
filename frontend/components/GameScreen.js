"use client";

import { useCallback, useRef, useState } from "react";
import { Settings, UserRound, Bot } from "lucide-react";
import { Settings, UserRound, Bot, CircleX } from "lucide-react";
import { useRouter } from "next/navigation";
import Board from "./Board";

export default function GameScreen({ mode = "pve" }) {
	const router = useRouter();
	const topPlayerName = mode === "pvp" ? "Người B" : "BOT";
	const topPlayerIcon = mode === "pvp" ? <UserRound size={32} /> : <Bot size={32} />;
	const [scores, setScores] = useState({ top: 0, bottom: 0 });
	const [activePlayer, setActivePlayer] = useState("bottom");
	const [boardSeed, setBoardSeed] = useState(0);
	const [gameResult, setGameResult] = useState(null);
	const topScoreRef = useRef(null);
	const bottomScoreRef = useRef(null);
	const topPlayerRef = useRef(null);
	const bottomPlayerRef = useRef(null);

	const topIsActive = activePlayer === "top";
	const bottomIsActive = activePlayer === "bottom";
	const topBadgeClass = topIsActive
		? "bg-[#4285f4] text-white border-blue-400 shadow-blue-200/60"
		: "bg-white text-zinc-900 border-zinc-300";
	const bottomBadgeClass = bottomIsActive
		? "bg-[#ef5350] text-white border-rose-400 shadow-rose-200/60"
		: "bg-white text-zinc-900 border-zinc-300";

	const getScoreTargetPoint = useCallback((owner) => {
		const targetRef = owner === "top" ? topScoreRef.current : bottomScoreRef.current;
		if (!targetRef) return null;

		const rect = targetRef.getBoundingClientRect();
		return {
			x: rect.left + rect.width / 2,
			y: rect.top + rect.height / 2,
		};
	}, []);

	const getPlayerPickupPoint = useCallback((owner) => {
		const targetRef = owner === "top" ? topPlayerRef.current : bottomPlayerRef.current;
		if (!targetRef) return null;

		const rect = targetRef.getBoundingClientRect();
		return {
			x: rect.left + rect.width / 2,
			y: owner === "top" ? rect.bottom + 20 : rect.top - 20,
		};
	}, []);

	const handleGameEnd = useCallback((result) => {
		setGameResult(result);
	}, []);

	const handleContinue = () => {
		router.push("/mode");
	};

	const getResultLabel = (side) => {
		if (!gameResult) return "";
		if (gameResult.winner === "draw") return "DRAW";

		if (side === "bottom") {
			return gameResult.winner === "bottom" ? "WIN" : "LOSE";
		}

		return gameResult.winner === "top" ? "WIN" : "LOSE";
	};

	const getResultCardClass = (side) => {
		if (!gameResult) return "bg-zinc-900 text-white";
		if (gameResult.winner === "draw") return "bg-zinc-500 text-white";

		const isWinner = (side === "bottom" && gameResult.winner === "bottom") || (side === "top" && gameResult.winner === "top");
		return isWinner ? "bg-[#ef5350] text-white" : "bg-zinc-900 text-white";
	};

	const getOutcomeTitle = () => {
		if (!gameResult) return "";
		if (gameResult.winner === "draw") return "HÒA";
		return gameResult.winner === "bottom" ? "NGƯỜI A THẮNG" : `${topPlayerName} THẮNG`;
	};

	const getOutcomeSubtitle = () => {
		if (!gameResult) return "";
		if (gameResult.winner === "draw") return "Hai bên cân bằng, ván này chia điểm";
		return gameResult.winner === "bottom" ? "Bạn đã thắng ván này" : `${topPlayerName} đã thắng ván này`;
	};

	return (
		<main className="min-h-screen relative flex flex-col items-center justify-between pb-12 pt-8 bg-zinc-100 text-zinc-900">
			{/* Mảng UI Top Left - Settings */}
			<button type="button" aria-label="Cài đặt" className="absolute top-6 left-6 text-zinc-900 hover:text-black hover:opacity-80 transition-all">
				<Settings size={52} strokeWidth={2.2} />
			</button>

			{/* Mảng UI Top Right - Score */}
			<div ref={topScoreRef} className="absolute top-1/2 right-4 -translate-y-[150%] bg-white text-zinc-900 w-28 sm:w-36 h-20 sm:h-24 flex flex-col items-center justify-center border border-zinc-300 rounded-2xl shadow-xl">
				<span className="text-xs sm:text-sm uppercase tracking-wide text-zinc-400">Kho B</span>
				<span className="text-4xl sm:text-5xl font-light leading-none">{scores.top}</span>
			</div>

			{/* Top Player Nametag */}
			<div ref={topPlayerRef} className={`flex rounded-2xl px-8 py-3 items-center gap-4 shadow-sm border w-auto min-w-[240px] justify-center mt-2 z-10 transition-colors ${topBadgeClass}`}>
				{topPlayerIcon}
				<span className="text-3xl font-semibold">{topPlayerName}</span>
			</div>

			{/* Game Board */}
			<div className="flex-1 flex items-center justify-center w-full z-10">
				<Board
					key={boardSeed}
					mode={mode}
					onScoresChange={setScores}
					onTurnChange={setActivePlayer}
					onGameEnd={handleGameEnd}
					getScoreTargetPoint={getScoreTargetPoint}
					getPickupTargetPoint={getPlayerPickupPoint}
				/>
			</div>

			{/* Bottom Player Nametag */}
			<div ref={bottomPlayerRef} className={`flex rounded-2xl px-8 py-3 items-center gap-4 shadow-sm border w-auto min-w-[240px] justify-center mb-0 z-10 transition-colors ${bottomBadgeClass}`}>
				<UserRound size={32} />
				<span className="text-3xl font-semibold">Người A</span>
			</div>

			{/* Mảng UI Bottom Left - Score */}
			<div ref={bottomScoreRef} className="absolute top-1/2 left-4 translate-y-[50%] bg-white text-zinc-900 w-28 sm:w-36 h-20 sm:h-24 flex flex-col items-center justify-center border border-zinc-300 rounded-2xl shadow-xl">
				<span className="text-xs sm:text-sm uppercase tracking-wide text-zinc-400">Kho A</span>
				<span className="text-4xl sm:text-5xl font-light leading-none">{scores.bottom}</span>
			</div>

			{gameResult && (
				<div className="fixed inset-0 z-[120] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(217,219,224,0.96))] backdrop-blur-md px-6 py-5 sm:px-10 sm:py-8">
					<button type="button" aria-label="Cài đặt" className="absolute top-5 left-5 text-zinc-900 hover:scale-105 transition-transform">
						<Settings size={56} strokeWidth={2.2} />
					</button>
					<button type="button" aria-label="Đóng" className="absolute top-5 right-5 text-zinc-900 hover:scale-105 transition-transform" onClick={() => router.push("/")}>
						<CircleX size={56} strokeWidth={2.2} />
					</button>

					<div className="h-full w-full max-w-6xl mx-auto flex flex-col justify-center gap-8 pt-14 sm:pt-16 pb-6 sm:pb-10">
						<div className="text-center space-y-3">
							<div className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white/80 px-5 py-2 shadow-sm">
								<span className={`h-2.5 w-2.5 rounded-full ${gameResult.winner === "draw" ? "bg-zinc-500" : "bg-[#ef5350]"}`} />
								<span className="text-xs sm:text-sm font-semibold tracking-[0.35em] text-zinc-700">KẾT THÚC</span>
							</div>
							<h2 className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-900">{getOutcomeTitle()}</h2>
							<p className="text-base sm:text-xl text-zinc-600">{getOutcomeSubtitle()}</p>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-stretch gap-6 sm:gap-8 max-w-5xl mx-auto w-full">
							<div className="rounded-[2rem] bg-white/85 border border-white shadow-[0_18px_60px_rgba(0,0,0,0.10)] p-5 sm:p-7 flex flex-col items-center gap-5">
								<div className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900">{getResultLabel("bottom")}</div>
								<div className={`w-full max-w-[240px] h-44 sm:h-52 rounded-[1.75rem] flex items-center justify-center text-6xl sm:text-7xl font-light shadow-lg ${getResultCardClass("bottom")}`}>
									{gameResult.bottomScore}
								</div>
								<div className={`w-full max-w-[240px] rounded-[1.75rem] px-8 py-4 text-center text-3xl sm:text-4xl font-semibold shadow-md ${gameResult.winner === "bottom" ? "bg-[#ef5350] text-white" : "bg-zinc-900 text-white"}`}>
									Người A
								</div>
							</div>

							<div className="hidden lg:flex items-center justify-center">
								<div className="h-[70%] w-px bg-zinc-400/70" />
							</div>

							<div className="rounded-[2rem] bg-white/85 border border-white shadow-[0_18px_60px_rgba(0,0,0,0.10)] p-5 sm:p-7 flex flex-col items-center gap-5">
								<div className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900">{getResultLabel("top")}</div>
								<div className={`w-full max-w-[240px] h-44 sm:h-52 rounded-[1.75rem] flex items-center justify-center text-6xl sm:text-7xl font-light shadow-lg ${getResultCardClass("top")}`}>
									{gameResult.topScore}
								</div>
								<div className={`w-full max-w-[240px] rounded-[1.75rem] px-8 py-4 text-center text-3xl sm:text-4xl font-semibold shadow-md ${gameResult.winner === "top" ? "bg-[#ef5350] text-white" : "bg-zinc-900 text-white"}`}>
									{topPlayerName}
								</div>
							</div>
						</div>

						<div className="flex justify-center lg:justify-end pt-2">
							<button type="button" onClick={handleContinue} className="inline-flex items-center justify-center rounded-full bg-[#4285f4] px-10 sm:px-14 py-4 sm:py-5 text-2xl sm:text-3xl font-semibold text-white shadow-[0_18px_50px_rgba(66,133,244,0.35)] transition-transform hover:-translate-y-0.5 hover:bg-[#3272d8] active:translate-y-0">
								Tiếp Tục
							</button>
						</div>
					</div>
				</div>
			)}
		</main>
	);
}
