"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

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
	const audioContextRef = useRef(null);
	const bgMusicTimerRef = useRef(null);
	const bgMusicTimeoutRefs = useRef([]);
	const bgMusicActiveRef = useRef(false);
	const musicArmedRef = useRef(false);

	const ensureAudioContext = async () => {
		if (typeof window === "undefined") return null;

		if (!audioContextRef.current) {
			const AudioContextClass = window.AudioContext || window.webkitAudioContext;
			if (!AudioContextClass) return null;
			audioContextRef.current = new AudioContextClass();
		}

		if (audioContextRef.current.state === "suspended") {
			await audioContextRef.current.resume().catch(() => {});
		}

		return audioContextRef.current;
	};

	const stopBackgroundMusic = () => {
		if (bgMusicTimerRef.current) {
			clearInterval(bgMusicTimerRef.current);
			bgMusicTimerRef.current = null;
		}

		bgMusicTimeoutRefs.current.forEach((timeoutId) => clearTimeout(timeoutId));
		bgMusicTimeoutRefs.current = [];
	};

	const scheduleTimeout = (callback, delay) => {
		const timeoutId = window.setTimeout(() => {
			bgMusicTimeoutRefs.current = bgMusicTimeoutRefs.current.filter((value) => value !== timeoutId);
			callback();
		}, delay);

		bgMusicTimeoutRefs.current.push(timeoutId);
	};

	const createMasterChain = (ctx) => {
		if (ctx.__soundMaster) return ctx.__soundMaster;

		const compressor = ctx.createDynamicsCompressor();
		compressor.threshold.setValueAtTime(-22, ctx.currentTime);
		compressor.knee.setValueAtTime(18, ctx.currentTime);
		compressor.ratio.setValueAtTime(5, ctx.currentTime);
		compressor.attack.setValueAtTime(0.003, ctx.currentTime);
		compressor.release.setValueAtTime(0.18, ctx.currentTime);

		const masterGain = ctx.createGain();
		masterGain.gain.setValueAtTime(1.45 * masterVolume, ctx.currentTime);

		const musicGain = ctx.createGain();
		musicGain.gain.setValueAtTime(1, ctx.currentTime);

		const effectsGain = ctx.createGain();
		effectsGain.gain.setValueAtTime(1, ctx.currentTime);

		musicGain.connect(masterGain);
		effectsGain.connect(masterGain);
		masterGain.connect(compressor);
		compressor.connect(ctx.destination);

		ctx.__soundMaster = { compressor, masterGain, musicGain, effectsGain };
		return ctx.__soundMaster;
	};

	const syncChannelGains = (ctx) => {
		if (!ctx?.__soundMaster) return;

		const { musicGain, effectsGain } = ctx.__soundMaster;
		const now = ctx.currentTime;

		musicGain.gain.cancelScheduledValues(now);
		effectsGain.gain.cancelScheduledValues(now);
		ctx.__soundMaster.masterGain.gain.cancelScheduledValues(now);
		ctx.__soundMaster.masterGain.gain.setTargetAtTime(1.45 * masterVolume, now, 0.015);
		musicGain.gain.setTargetAtTime(musicEnabled ? musicVolume : 0, now, 0.015);
		effectsGain.gain.setTargetAtTime(effectsEnabled ? effectsVolume : 0, now, 0.015);
	};

	const createVoice = (ctx, { channel = "effects", pan = 0, volume = 0.08 } = {}) => {
		const { musicGain, effectsGain } = createMasterChain(ctx);
		const channelGain = channel === "music" ? musicGain : effectsGain;
		const voiceGain = ctx.createGain();
		voiceGain.gain.value = volume;

		const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
		if (panner) {
			panner.pan.setValueAtTime(pan, ctx.currentTime);
			voiceGain.connect(panner);
			panner.connect(channelGain);
		} else {
			voiceGain.connect(channelGain);
		}

		return { voiceGain, output: panner || voiceGain };
	};

	const playTone = (
		ctx,
		{ frequency, type = "sine", duration = 0.12, volume = 0.08, attack = 0.01, release = 0.08, detune = 0, pan = 0, glideTo = null, filterType = null, filterCutoff = null, channel = "effects" }
	) => {
		if (!ctx) return;

		const oscillator = ctx.createOscillator();
		const filter = filterType ? ctx.createBiquadFilter() : null;
		const { voiceGain, output } = createVoice(ctx, { channel, pan, volume });
		oscillator.type = type;
		oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
		oscillator.detune.setValueAtTime(detune, ctx.currentTime);
		voiceGain.gain.setValueAtTime(0.0001, ctx.currentTime);
		voiceGain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + attack);
		voiceGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration + release);

		if (filter) {
			filter.type = filterType;
			filter.frequency.setValueAtTime(filterCutoff || 1200, ctx.currentTime);
			oscillator.connect(filter);
			filter.connect(voiceGain);
		} else {
			oscillator.connect(voiceGain);
		}

		if (glideTo != null) {
			oscillator.frequency.exponentialRampToValueAtTime(glideTo, ctx.currentTime + duration);
		}

		oscillator.start();
		oscillator.stop(ctx.currentTime + duration + release + 0.02);

		return output;
	};

	const playNoiseBurst = (ctx, { duration = 0.16, volume = 0.3, pan = 0, channel = "effects" } = {}) => {
		const { musicGain, effectsGain } = createMasterChain(ctx);
		const channelGain = channel === "music" ? musicGain : effectsGain;
		const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const channelData = buffer.getChannelData(0);

		for (let i = 0; i < bufferSize; i += 1) {
			channelData[i] = Math.random() * 2 - 1;
		}

		const source = ctx.createBufferSource();
		const bandpass = ctx.createBiquadFilter();
		const voiceGain = ctx.createGain();
		const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

		bandpass.type = "bandpass";
		bandpass.frequency.setValueAtTime(1600, ctx.currentTime);
		bandpass.Q.setValueAtTime(1.2, ctx.currentTime);

		voiceGain.gain.setValueAtTime(0.0001, ctx.currentTime);
		voiceGain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.01);
		voiceGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

		source.buffer = buffer;
		source.connect(bandpass);
		bandpass.connect(voiceGain);

		if (panner) {
			panner.pan.setValueAtTime(pan, ctx.currentTime);
			voiceGain.connect(panner);
			panner.connect(channelGain);
		} else {
			voiceGain.connect(channelGain);
		}

		source.start();
		source.stop(ctx.currentTime + duration + 0.02);
	};

	const playMusicLoop = async () => {
		const ctx = await ensureAudioContext();
		if (!ctx || !musicEnabled) return;

		createMasterChain(ctx);
		syncChannelGains(ctx);

		stopBackgroundMusic();
		bgMusicActiveRef.current = true;
		musicArmedRef.current = true;

		const chords = [
			{ bass: 146.83, chord: [293.66, 349.23, 440], lead: [659.25, 587.33], color: -0.4 },
			{ bass: 130.81, chord: [261.63, 329.63, 392], lead: [587.33, 523.25], color: -0.15 },
			{ bass: 174.61, chord: [349.23, 440, 523.25], lead: [698.46, 659.25], color: 0.15 },
			{ bass: 196, chord: [392, 493.88, 587.33], lead: [783.99, 698.46], color: 0.4 },
		];
		const bpm = 104;
		const beatMs = 60000 / bpm;
		const cycleMs = beatMs * 8;

		const scheduleCycle = () => {
			if (!musicEnabled || !bgMusicActiveRef.current) return;

			chords.forEach((bar, barIndex) => {
				const baseDelay = barIndex * beatMs * 2;

				scheduleTimeout(() => {
					playTone(ctx, {
						channel: "music",
						frequency: bar.bass,
						type: "triangle",
						duration: 0.36,
						volume: 0.14,
						attack: 0.02,
						release: 0.18,
						pan: -0.2,
						filterType: "lowpass",
						filterCutoff: 520,
					});
				}, baseDelay);

				bar.chord.forEach((note, noteIndex) => {
					scheduleTimeout(() => {
						playTone(ctx, {
							channel: "music",
							frequency: note,
							type: "sine",
							duration: 0.72,
							volume: noteIndex === 1 ? 0.095 : 0.07,
							attack: 0.03,
							release: 0.32,
							pan: bar.color + noteIndex * 0.12,
							detune: noteIndex === 0 ? -6 : noteIndex === 2 ? 7 : 0,
							filterType: "bandpass",
							filterCutoff: 950 + noteIndex * 180,
						});
					}, baseDelay + noteIndex * 55);
				});

				bar.lead.forEach((note, leadIndex) => {
					scheduleTimeout(() => {
						playTone(ctx, {
							channel: "music",
							frequency: note,
							type: "sine",
							duration: 0.18,
							volume: 0.085,
							attack: 0.01,
							release: 0.08,
							pan: bar.color * 0.65,
							glideTo: note + (leadIndex === 0 ? 14 : -10),
							filterType: "highpass",
							filterCutoff: 420,
						});
					}, baseDelay + beatMs * (1 + leadIndex * 0.5));
				});

				scheduleTimeout(() => {
					playNoiseBurst(ctx, { channel: "music", duration: 0.12, volume: 0.02, pan: bar.color * 0.8 });
					playNoiseBurst(ctx, { channel: "music", duration: 0.12, volume: 0.03, pan: bar.color * 0.8 });
				}, baseDelay + beatMs * 1.75);

				scheduleTimeout(() => {
					playNoiseBurst(ctx, { channel: "music", duration: 0.14, volume: 0.045, pan: -bar.color * 0.55 });
				}, baseDelay + beatMs * 0.95);
			});
		};

		scheduleCycle();
		bgMusicTimerRef.current = window.setInterval(scheduleCycle, cycleMs);
	};

	// Load sound preference from localStorage on mount
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
			bgMusicActiveRef.current = false;
			if (audioContextRef.current) {
				audioContextRef.current.close().catch(() => {});
				audioContextRef.current = null;
			}
		};
	}, []);

	// Handle background channel toggle
	useEffect(() => {
		if (!musicEnabled) {
			stopBackgroundMusic();
			return;
		}

		if (bgMusicActiveRef.current) {
			void playMusicLoop();
		}
	}, [musicEnabled]);

	useEffect(() => {
		const ctx = audioContextRef.current;
		if (!ctx) return;
		syncChannelGains(ctx);
	}, [musicEnabled, effectsEnabled, masterVolume, musicVolume, effectsVolume]);

	const toggleMute = () => {
		const next = !(!musicEnabled && !effectsEnabled);
		const nextEnabled = !next;
		setMusicEnabled(nextEnabled);
		setEffectsEnabled(nextEnabled);
		localStorage.setItem("game_muted", String(next));
		localStorage.setItem("game_music_enabled", String(nextEnabled));
		localStorage.setItem("game_effects_enabled", String(nextEnabled));
		if (!nextEnabled) {
			musicArmedRef.current = false;
		}
	};

	const toggleMusicEnabled = () => {
		setMusicEnabled((prev) => {
			const next = !prev;
			localStorage.setItem("game_music_enabled", String(next));
			localStorage.setItem("game_muted", String(!next && !effectsEnabled));
			if (!next) {
				musicArmedRef.current = false;
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
	};

	const setMasterVolumeLevel = (value) => {
		const next = clampVolume(value);
		setMasterVolume(next);
		localStorage.setItem("game_master_volume", String(next));
	};

	const playSyntheticSound = async (type) => {
		if (typeof window === "undefined" || !effectsEnabled) return;

		const ctx = await ensureAudioContext();
		if (!ctx) return;

		createMasterChain(ctx);
		syncChannelGains(ctx);

		const presets = {
			click: [
				{ frequency: 740, type: "square", duration: 0.035, volume: 0.24, pan: -0.15, filterType: "highpass", filterCutoff: 1800 },
				{ frequency: 980, type: "sine", duration: 0.065, volume: 0.2, pan: 0.2, detune: 8, glideTo: 880, filterType: "bandpass", filterCutoff: 2400 },
			],
			pickup: [
				{ frequency: 392, type: "triangle", duration: 0.11, volume: 0.26, pan: -0.25, filterType: "bandpass", filterCutoff: 1100 },
				{ frequency: 523.25, type: "triangle", duration: 0.1, volume: 0.22, delay: 55, pan: 0.2, glideTo: 659.25, filterType: "bandpass", filterCutoff: 1400 },
				{ frequency: 783.99, type: "sine", duration: 0.08, volume: 0.18, delay: 95, pan: 0.35, filterType: "highpass", filterCutoff: 2200 },
			],
			sow: [
				{ frequency: 220, type: "triangle", duration: 0.08, volume: 0.2, pan: -0.12, filterType: "lowpass", filterCutoff: 900 },
				{ frequency: 174.61, type: "sine", duration: 0.12, volume: 0.13, delay: 45, pan: 0.18, glideTo: 196, filterType: "lowpass", filterCutoff: 700 },
			],
			capture: [
				{ frequency: 523.25, type: "sine", duration: 0.1, volume: 0.26, pan: -0.15, filterType: "bandpass", filterCutoff: 1300 },
				{ frequency: 659.25, type: "triangle", duration: 0.12, volume: 0.22, delay: 65, pan: 0.1, glideTo: 783.99, filterType: "bandpass", filterCutoff: 1600 },
				{ frequency: 987.77, type: "sine", duration: 0.16, volume: 0.18, delay: 120, pan: 0.35, filterType: "highpass", filterCutoff: 2600 },
			],
			"bg-music": [
				{ frequency: 110, type: "triangle", duration: 0.85, volume: 0.12, pan: -0.2, filterType: "lowpass", filterCutoff: 900 },
				{ frequency: 164.81, type: "sine", duration: 0.7, volume: 0.09, delay: 110, pan: 0.2, filterType: "bandpass", filterCutoff: 1200 },
			],
		};

		const notes = presets[type] || [];
		notes.forEach((note) => {
			window.setTimeout(() => {
				playTone(ctx, note);
			}, note.delay || 0);
		});
	};

	const startMusic = () => {
		if (!musicEnabled) return;
		if (bgMusicActiveRef.current) return;
		void playMusicLoop().catch(() => {});
	};

	const playSound = (soundName) => {
		if (!effectsEnabled) return;

		void playSyntheticSound(soundName);
	};

	const isMuted = !musicEnabled && !effectsEnabled;

	useEffect(() => {
		const handleFirstInteraction = () => {
			if (musicEnabled && !bgMusicActiveRef.current) {
				startMusic();
			}
		};

		window.addEventListener("pointerdown", handleFirstInteraction, { once: true, passive: true });
		window.addEventListener("keydown", handleFirstInteraction, { once: true });

		return () => {
			window.removeEventListener("pointerdown", handleFirstInteraction);
			window.removeEventListener("keydown", handleFirstInteraction);
		};
	}, [musicEnabled]);

	return (
		<SoundContext.Provider
			value={{
				isMuted,
				toggleMute,
				playSound,
				startMusic,
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
