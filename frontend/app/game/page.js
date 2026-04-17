export const metadata = {
  title: "Chơi - Ô Ăn Quan",
};

import GameScreen from "../../components/GameScreen";

export default function GamePage({ searchParams }) {
	// Mặc định là chơi với máy (pve) nếu không có mode từ params (chưa handle params ở link)
	const mode = searchParams?.mode === "pvp" ? "pvp" : "pve";
	return <GameScreen mode={mode} />;
}
