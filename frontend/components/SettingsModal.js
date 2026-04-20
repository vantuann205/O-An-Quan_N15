"use client";

import { useEffect, useState } from "react";
import InstructionModal from "./InstructionModal";
import { useSound } from "./SoundContext";

export default function SettingsModal({ isOpen, onClose }) {
	const {
		playSound,
		masterVolume,
		musicVolume,
		effectsVolume,
		setMasterVolumeLevel,
		setMusicVolumeLevel,
		setEffectsVolumeLevel,
	} = useSound();
	const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
	const [isSoundPanelOpen, setIsSoundPanelOpen] = useState(false);

	useEffect(() => {
		if (!isOpen) {
			setIsSoundPanelOpen(false);
		}
	}, [isOpen]);

	if (!isOpen) return null;

	const handleExit = () => {
		onClose();
	};

	const handleMusicVolumeChange = (event) => {
		setMusicVolumeLevel(Number(event.target.value) / 100);
	};

	const handleEffectsVolumeChange = (event) => {
		setEffectsVolumeLevel(Number(event.target.value) / 100);
	};

	const handleMasterVolumeChange = (event) => {
		setMasterVolumeLevel(Number(event.target.value) / 100);
	};

	const handleOpenSoundPanel = () => {
		setIsSoundPanelOpen(true);
		playSound("click");
	};

	const handleBackToMenu = () => {
		setIsSoundPanelOpen(false);
		playSound("click");
	};

	return (
		<div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/60 backdrop-blur-sm">
			<div className="bg-[#d8d9de] w-[90%] max-w-[800px] h-auto min-h-[450px] rounded-[2rem] flex flex-col items-center justify-center gap-7 py-10 px-6 shadow-2xl">
				{!isSoundPanelOpen ? (
					<>
						<button
							type="button"
							onClick={() => setIsInstructionsOpen(true)}
							className="w-full max-w-[420px] py-6 bg-[#4285f4] text-white text-3xl font-medium rounded-full shadow-lg hover:bg-blue-600 transition-colors"
						>
							Hướng Dẫn
						</button>
						<button
							type="button"
							onClick={handleOpenSoundPanel}
							className="w-full max-w-[420px] py-6 bg-[#4285f4] text-white text-3xl font-medium rounded-full shadow-lg hover:bg-blue-600 transition-colors"
						>
							Âm Thanh
						</button>
						<button
							type="button"
							onClick={handleExit}
							className="w-full max-w-[420px] py-6 bg-[#4285f4] text-white text-3xl font-medium rounded-full shadow-lg hover:bg-red-500 transition-colors"
						>
							Thoát
						</button>
					</>
				) : (
					<>
						<div className="w-full max-w-[620px] space-y-7 px-2 py-2">
							<div className="space-y-3">
								<div className="flex items-center justify-between gap-4">
									<div className="text-2xl font-semibold text-zinc-900">Âm lượng tổng</div>
									<div className="text-2xl font-semibold text-zinc-900">{Math.round(masterVolume * 100)}</div>
								</div>
								<input
									type="range"
									min="0"
									max="100"
									value={Math.round(masterVolume * 100)}
									onChange={handleMasterVolumeChange}
									className="sound-slider"
								/>
							</div>

							<div className="space-y-3">
								<div className="flex items-center justify-between gap-4">
									<div className="text-2xl font-semibold text-zinc-900">Âm lượng nhạc</div>
									<div className="text-2xl font-semibold text-zinc-900">{Math.round(musicVolume * 100)}</div>
								</div>
								<input
									type="range"
									min="0"
									max="100"
									value={Math.round(musicVolume * 100)}
									onChange={handleMusicVolumeChange}
									className="sound-slider"
								/>
							</div>

							<div className="space-y-3">
								<div className="flex items-center justify-between gap-4">
									<div className="text-2xl font-semibold text-zinc-900">Âm lượng hiệu ứng</div>
									<div className="text-2xl font-semibold text-zinc-900">{Math.round(effectsVolume * 100)}</div>
								</div>
								<input
									type="range"
									min="0"
									max="100"
									value={Math.round(effectsVolume * 100)}
									onChange={handleEffectsVolumeChange}
									className="sound-slider"
								/>
							</div>
						</div>

						<div className="w-full max-w-[520px] flex gap-4">
							<button
								type="button"
								onClick={handleBackToMenu}
								className="flex-1 py-5 bg-zinc-700 text-white text-2xl font-medium rounded-full shadow-lg hover:bg-zinc-800 transition-colors"
							>
								Quay Lại
							</button>
						</div>
					</>
				)}
			</div>

			<InstructionModal isOpen={isInstructionsOpen} onClose={() => setIsInstructionsOpen(false)} />
		</div>
	);
}
