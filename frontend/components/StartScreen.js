import Link from "next/link";
import CornerActions from "./CornerActions";

export default function StartScreen() {
	return (
		<main className="menu-screen">
			<CornerActions />

			<section className="menu-center-block start-center-block">
				<h1 className="start-title">Game Ô Ăn Quan</h1>

				<Link href="/mode" className="start-button" aria-label="Start">
					START
				</Link>
			</section>
		</main>
	);
}
