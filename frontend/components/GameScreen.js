"use client";

import { useState } from "react";
import { Settings, UserRound, Bot } from "lucide-react";
import Board from "./Board";

export default function GameScreen({ mode = "pve" }) {
	const topPlayerName = mode === "pvp" ? "Người B" : "Máy";
	const topPlayerIcon = mode === "pvp" ? <UserRound size={32} /> : <Bot size={32} />;
	const [scores, setScores] = useState({ top: 0, bottom: 0 });

	return (
		<main className="min-h-screen relative flex flex-col items-center justify-between pb-12 pt-8 bg-zinc-100 text-zinc-900">
			{/* Mảng UI Top Left - Settings */}
			<button type="button" aria-label="Cài đặt" className="absolute top-6 left-6 text-zinc-900 hover:text-black hover:opacity-80 transition-all">
				<Settings size={52} strokeWidth={2.2} />
			</button>

			{/* Mảng UI Top Right - Score */}
			<div className="absolute top-1/2 right-4 -translate-y-[150%] bg-white text-zinc-900 w-28 sm:w-36 h-20 sm:h-24 flex flex-col items-center justify-center border border-zinc-300 rounded-2xl shadow-xl">
				<span className="text-xs sm:text-sm uppercase tracking-wide text-zinc-400">Kho B</span>
				<span className="text-4xl sm:text-5xl font-light leading-none">{scores.top}</span>
			</div>

			{/* Top Player Nametag */}
			<div className="flex bg-white text-zinc-900 rounded-2xl px-8 py-3 items-center gap-4 shadow-sm border border-zinc-300 w-auto min-w-[240px] justify-center mt-2 z-10">
				{topPlayerIcon}
				<span className="text-3xl font-semibold">{topPlayerName}</span>
			</div>

			{/* Game Board */}
			<div className="flex-1 flex items-center justify-center w-full z-10">
				<Board onScoresChange={setScores} />
			</div>

			{/* Bottom Player Nametag */}
			<div className="flex bg-white text-zinc-900 rounded-2xl px-8 py-3 items-center gap-4 shadow-sm border border-zinc-300 w-auto min-w-[240px] justify-center mb-0 z-10">
				<UserRound size={32} />
				<span className="text-3xl font-semibold">Người A</span>
			</div>

			{/* Mảng UI Bottom Left - Score */}
			<div className="absolute top-1/2 left-4 translate-y-[50%] bg-white text-zinc-900 w-28 sm:w-36 h-20 sm:h-24 flex flex-col items-center justify-center border border-zinc-300 rounded-2xl shadow-xl">
				<span className="text-xs sm:text-sm uppercase tracking-wide text-zinc-400">Kho A</span>
				<span className="text-4xl sm:text-5xl font-light leading-none">{scores.bottom}</span>
			</div>
		</main>
	);
}
