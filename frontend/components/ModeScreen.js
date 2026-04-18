import Link from "next/link";
import { Bot, UserRound } from "lucide-react";
import CornerActions from "./CornerActions";

function ModeButton({ leftIcon: LeftIcon, rightIcon: RightIcon, label, href }) {
	return (
		<Link href={href} className="mode-button" aria-label={label}>
			<LeftIcon size={36} strokeWidth={2.2} className="mode-icon" />
			<span className="mode-text">VS</span>
			<RightIcon size={36} strokeWidth={2.2} className="mode-icon" />
		</Link>
	);
}

export default function ModeScreen() {
	return (
		<main className="menu-screen">
			<CornerActions variant="mode" />

			<section className="menu-center-block mode-center-block">
				<h1 className="mode-title">Chọn chế độ chơi</h1>

				<div className="mode-row">
					<ModeButton leftIcon={UserRound} rightIcon={UserRound} label="VS Người" href="/game?mode=pvp" />
					<ModeButton leftIcon={UserRound} rightIcon={Bot} label="VS Máy" href="/game?mode=pve" />
				</div>
			</section>
		</main>
	);
}
