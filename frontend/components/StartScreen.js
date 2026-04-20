"use client";

import Link from "next/link";
import CornerActions from "./CornerActions";
import { useSound } from "./SoundContext";

export default function StartScreen() {
	const { startMusic } = useSound();

	return (
		<main className="menu-screen">
			<CornerActions variant="start" />

			<section className="menu-center-block start-center-block">
				<h1 className="start-title">Game Ô Ăn Quan</h1>

				<Link href="/mode" onClick={startMusic} className="start-button" aria-label="Start">
					START
				</Link>
			</section>
		</main>
	);
}
