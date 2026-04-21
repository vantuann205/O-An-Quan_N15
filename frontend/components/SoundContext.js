"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Howl, Howler } from "howler";

const SoundContext = createContext();

export const useSound = () => useContext(SoundContext);

export const SoundProvider = ({ children }) => {
	const clampVolume = (value) => {
		const numeric = typeof value === "number" ? value : Number(value);
		if (!Number.isFinite(numeric)) return 0.7;
		return Math.min(1, Math.max(0, numeric));
	};

	const [musicEnabled, setMusicEnabled] = useState(true);
	const [effectsEnabled, setEffectsEnabled] = useState(true);
	const [masterVolume, setMasterVolume] = useState(0.85);
	const [musicVolume, setMusicVolume] = useState(0.7);
	const [effectsVolume, setEffectsVolume] = useState(0.75);
	
	const masterVolumeRef = useRef(masterVolume);
	const musicVolumeRef = useRef(musicVolume);
	const effectsVolumeRef = useRef(effectsVolume);
	const effectsEnabledRef = useRef(effectsEnabled);
	const musicEnabledRef = useRef(musicEnabled);

	useEffect(() => { masterVolumeRef.current = masterVolume; }, [masterVolume]);
	useEffect(() => { musicVolumeRef.current = musicVolume; }, [musicVolume]);
	useEffect(() => { effectsVolumeRef.current = effectsVolume; }, [effectsVolume]);
	useEffect(() => { effectsEnabledRef.current = effectsEnabled; }, [effectsEnabled]);
	useEffect(() => { musicEnabledRef.current = musicEnabled; }, [musicEnabled]);

	const bgMusicTimerRef = useRef(null);
	const musicActiveRef = useRef(false);
	const bgMusicRef = useRef(null);
	const effectSoundsRef = useRef({});

	const stopBackgroundMusic = () => {
		if (bgMusicTimerRef.current) {
			clearInterval(bgMusicTimerRef.current);
			bgMusicTimerRef.current = null;
		}
		if (bgMusicRef.current) {
			bgMusicRef.current.fade(0.3, 0, 500);
			setTimeout(() => {
				if (bgMusicRef.current) {
					bgMusicRef.current.stop();
					bgMusicRef.current = null;
				}
			}, 550);
		}
		musicActiveRef.current = false;
	};

	const stopAllEffects = () => {
		Object.values(effectSoundsRef.current).forEach((sound) => {
			if (sound && sound.playing()) {
				sound.fade(0.1, 0, 100);
			}
		});
	};

	const stopAllSounds = () => {
		stopBackgroundMusic();
		stopAllEffects();
		Howler.stop();
	};

	const createSyntheticSound = (type) => {
		const presets = {
			click: { freq: 740, type: "square", duration: 0.035 },
			pickup: { freq: 392, type: "triangle", duration: 0.11 },
			sow: { freq: 220, type: "triangle", duration: 0.08 },
			capture: { freq: 523.25, type: "sine", duration: 0.1 },
			"bg-music": { freq: 110, type: "triangle", duration: 0.85 },
		};

		const preset = presets[type] || presets.click;
		const AudioContext = window.AudioContext || window.webkitAudioContext;
		if (!AudioContext) return null;

		const vol = clampVolume(effectsVolumeRef.current * masterVolumeRef.current);
		if (vol === 0) return null;

		const audioCtx = new AudioContext();
		const oscillator = audioCtx.createOscillator();
		const gainNode = audioCtx.createGain();

		oscillator.type = preset.type;
		oscillator.frequency.setValueAtTime(preset.freq, audioCtx.currentTime);
		
		gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(0.3 * vol, audioCtx.currentTime + 0.01);
		gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + preset.duration);

		oscillator.connect(gainNode);
		gainNode.connect(audioCtx.destination);

		oscillator.start();
		oscillator.stop(audioCtx.currentTime + preset.duration + 0.02);

		return { stop: () => {} };
	};

	const playSyntheticSound = (type) => {
		if (!effectsEnabledRef.current || effectsVolumeRef.current === 0 || masterVolumeRef.current === 0) return;
		createSyntheticSound(type);
	};

	const startMusic = () => {
		if (!musicEnabled || musicActiveRef.current) return;

		musicActiveRef.current = true;

		const AudioContext = window.AudioContext || window.webkitAudioContext;
		if (!AudioContext) return;

		const audioCtx = new AudioContext();
		
		const chords = [
			{ bass: 146.83, chord: [293.66, 349.23, 440], lead: [659.25, 587.33] },
			{ bass: 130.81, chord: [261.63, 329.63, 392], lead: [587.33, 523.25] },
			{ bass: 174.61, chord: [349.23, 440, 523.25], lead: [698.46, 659.25] },
			{ bass: 196, chord: [392, 493.88, 587.33], lead: [783.99, 698.46] },
		];
		const bpm = 104;
		const beatMs = 60000 / bpm;
		let cycleCount = 0;

		const playChord = (chordData, delay) => {
			setTimeout(() => {
				if (!musicActiveRef.current) return;

				const now = audioCtx.currentTime;
				const vol = clampVolume(musicVolumeRef.current * masterVolumeRef.current);
				if (vol === 0) return;
				
				const bass = audioCtx.createOscillator();
				const bassGain = audioCtx.createGain();
				bass.type = "triangle";
				bass.frequency.setValueAtTime(chordData.bass, now);
				bassGain.gain.setValueAtTime(0.001, now);
				bassGain.gain.linearRampToValueAtTime(0.15 * vol, now + 0.02);
				bassGain.gain.linearRampToValueAtTime(0.001, now + 0.36);
				bass.connect(bassGain);
				bassGain.connect(audioCtx.destination);
				bass.start(now);
				bass.stop(now + 0.4);

				chordData.chord.forEach((freq, i) => {
					const osc = audioCtx.createOscillator();
					const gain = audioCtx.createGain();
					osc.type = "sine";
					osc.frequency.setValueAtTime(freq, now);
					gain.gain.setValueAtTime(0.001, now);
					gain.gain.linearRampToValueAtTime(0.08 * vol, now + 0.03);
					gain.gain.linearRampToValueAtTime(0.001, now + 0.72);
					osc.connect(gain);
					gain.connect(audioCtx.destination);
					osc.start(now + i * 0.055);
					osc.stop(now + 0.75);
				});

				chordData.lead.forEach((freq, i) => {
					const osc = audioCtx.createOscillator();
					const gain = audioCtx.createGain();
					osc.type = "sine";
					osc.frequency.setValueAtTime(freq, now);
					osc.frequency.linearRampToValueAtTime(freq + (i === 0 ? 14 : -10), now + 0.18);
					gain.gain.setValueAtTime(0.001, now);
					gain.gain.linearRampToValueAtTime(0.09 * vol, now + 0.01);
					gain.gain.linearRampToValueAtTime(0.001, now + 0.18);
					osc.connect(gain);
					gain.connect(audioCtx.destination);
					osc.start(now + beatMs * 0.001 * (1 + i * 0.5));
					osc.stop(now + 0.2);
				});
			}, delay);
		};

		const playCycle = () => {
			if (!musicActiveRef.current || !musicEnabled) return;
			
			chords.forEach((bar, barIndex) => {
				const delay = barIndex * beatMs * 2;
				playChord(bar, delay);
			});

			cycleCount++;
		};

		playCycle();
		bgMusicTimerRef.current = setInterval(playCycle, beatMs * 8);
	};

	const playSound = (soundName) => {
		if (!effectsEnabledRef.current || effectsVolumeRef.current === 0 || masterVolumeRef.current === 0) return;
		playSyntheticSound(soundName);
	};

	const isMuted = !musicEnabled && !effectsEnabled;

	useEffect(() => {
		const savedMute = localStorage.getItem("game_muted");
		const savedMusicEnabled = localStorage.getItem("game_music_enabled");
		const savedEffectsEnabled = localStorage.getItem("game_effects_enabled");
		const savedMasterVolume = localStorage.getItem("game_master_volume");
		const savedMusicVolume = localStorage.getItem("game_music_volume");
		const savedEffectsVolume = localStorage.getItem("game_effects_volume");

		if (savedMusicEnabled !== null) {
			setMusicEnabled(savedMusicEnabled === "true");
		} else if (savedMute !== null) {
			setMusicEnabled(savedMute !== "true");
		}

		if (savedEffectsEnabled !== null) {
			setEffectsEnabled(savedEffectsEnabled === "true");
		} else if (savedMute !== null) {
			setEffectsEnabled(savedMute !== "true");
		}

		if (savedMasterVolume !== null) {
			setMasterVolume(clampVolume(savedMasterVolume));
		}

		if (savedMusicVolume !== null) {
			setMusicVolume(clampVolume(savedMusicVolume));
		}

		if (savedEffectsVolume !== null) {
			setEffectsVolume(clampVolume(savedEffectsVolume));
		}

		return () => {
			stopBackgroundMusic();
			stopAllEffects();
		};
	}, []);

	useEffect(() => {
		Howler.mute(!effectsEnabled);
		Howler.volume(masterVolume);
	}, [masterVolume, effectsEnabled]);

	useEffect(() => {
		if (!musicEnabled) {
			stopBackgroundMusic();
			return;
		}

		if (musicActiveRef.current) {
			startMusic();
		}
	}, [musicEnabled]);

	const toggleMute = () => {
		const next = !(!musicEnabled && !effectsEnabled);
		const nextEnabled = !next;
		setMusicEnabled(nextEnabled);
		setEffectsEnabled(nextEnabled);
		localStorage.setItem("game_muted", String(next));
		localStorage.setItem("game_music_enabled", String(nextEnabled));
		localStorage.setItem("game_effects_enabled", String(nextEnabled));
		if (!nextEnabled) {
			musicActiveRef.current = false;
		}
	};

	const toggleMusicEnabled = () => {
		setMusicEnabled((prev) => {
			const next = !prev;
			localStorage.setItem("game_music_enabled", String(next));
			localStorage.setItem("game_muted", String(!next && !effectsEnabled));
			if (!next) {
				musicActiveRef.current = false;
			}
			return next;
		});
	};

	const toggleEffectsEnabled = () => {
		setEffectsEnabled((prev) => {
			const next = !prev;
			localStorage.setItem("game_effects_enabled", String(next));
			localStorage.setItem("game_muted", String(!musicEnabled && !next));
			return next;
		});
	};

	const setMusicVolumeLevel = (value) => {
		const next = clampVolume(value);
		setMusicVolume(next);
		localStorage.setItem("game_music_volume", String(next));
		if (next > 0) {
			setMusicEnabled(true);
			localStorage.setItem("game_music_enabled", "true");
			localStorage.setItem("game_muted", String(!effectsEnabled));
		} else {
			setMusicEnabled(false);
			stopBackgroundMusic();
			localStorage.setItem("game_music_enabled", "false");
		}
	};

	const setEffectsVolumeLevel = (value) => {
		const next = clampVolume(value);
		setEffectsVolume(next);
		localStorage.setItem("game_effects_volume", String(next));
		if (next > 0) {
			setEffectsEnabled(true);
			localStorage.setItem("game_effects_enabled", "true");
			localStorage.setItem("game_muted", String(!musicEnabled));
		}
		if (next === 0) {
			setEffectsEnabled(false);
			stopAllEffects();
		}
	};

	const setMasterVolumeLevel = (value) => {
		const next = clampVolume(value);
		setMasterVolume(next);
		localStorage.setItem("game_master_volume", String(next));
		if (next === 0) {
			stopAllSounds();
		}
	};

	useEffect(() => {
		const handleFirstInteraction = () => {
			if (musicEnabled && !musicActiveRef.current) {
				startMusic();
			}
		};

		const handleButtonClick = (event) => {
			if (!effectsEnabled) return;
			if (typeof event.target?.closest !== "function") return;

			const interactiveElement = event.target.closest("button, .start-button, .mode-button, [role='button']");
			if (!interactiveElement) return;

			playSound("click");
		};

		window.addEventListener("pointerdown", handleFirstInteraction, { once: true, passive: true });
		window.addEventListener("keydown", handleFirstInteraction, { once: true });
		window.addEventListener("click", handleButtonClick, true);

		return () => {
			window.removeEventListener("pointerdown", handleFirstInteraction);
			window.removeEventListener("keydown", handleFirstInteraction);
			window.removeEventListener("click", handleButtonClick, true);
		};
	}, [musicEnabled]);

	return (
		<SoundContext.Provider
			value={{
				isMuted,
				toggleMute,
				playSound,
				startMusic,
				stopMusic: stopBackgroundMusic,
				stopEffects: stopAllEffects,
				stopAllSounds,
				musicEnabled,
				effectsEnabled,
				musicVolume,
				effectsVolume,
				masterVolume,
				toggleMusicEnabled,
				toggleEffectsEnabled,
				setMusicVolumeLevel,
				setEffectsVolumeLevel,
				setMasterVolumeLevel,
			}}
		>
			{children}
		</SoundContext.Provider>
	);
};