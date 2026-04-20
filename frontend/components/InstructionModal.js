"use client";

import { CircleX } from "lucide-react";

export default function InstructionModal({ isOpen, onClose }) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-md px-4 py-8">
			<div className="bg-white w-full max-w-[900px] max-h-full rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
				{/* Header */}
				<div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100 bg-white sticky top-0 z-10">
					<h2 className="text-4xl font-bold text-zinc-900">Hướng Dẫn Chơi</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-zinc-400 hover:text-zinc-900 transition-colors"
						aria-label="Đóng"
					>
						<CircleX size={44} strokeWidth={2} />
					</button>
				</div>

				{/* Scrollable Content */}
				<div className="flex-1 overflow-y-auto px-8 py-10 space-y-10 custom-scrollbar">
					<section className="space-y-4">
						<h3 className="text-2xl font-bold text-[#4285f4] flex items-center gap-3">
							<span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#4285f4] text-white text-base">1</span>
							Mục tiêu trò chơi
						</h3>
						<p className="text-xl text-zinc-600 leading-relaxed">
							Hai người chơi cố gắng thu thập được nhiều quân (sỏi, đá nhỏ, hạt) hơn đối thủ. Người có tổng số quân ăn được nhiều hơn khi trò chơi kết thúc sẽ là người chiến thắng.
						</p>
					</section>

					<section className="space-y-4">
						<h3 className="text-2xl font-bold text-[#4285f4] flex items-center gap-3">
							<span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#4285f4] text-white text-base">2</span>
							Cách tính điểm
						</h3>
						<div className="bg-zinc-50 rounded-2xl p-6 space-y-3">
							<div className="flex items-center justify-between text-xl">
								<span className="text-zinc-600">Mỗi quân dân</span>
								<span className="font-bold text-zinc-900 underline decoration-[#4285f4]">1 điểm</span>
							</div>
							<div className="flex items-center justify-between text-xl">
								<span className="text-zinc-600">Mỗi quân quan</span>
								<span className="font-bold text-zinc-900 underline decoration-[#4285f4]">5 điểm</span>
							</div>
							<p className="text-sm text-zinc-400 pt-2 italic">* Quân quan là quân to ở 2 đầu bàn cờ.</p>
						</div>
					</section>

					<section className="space-y-4">
						<h3 className="text-2xl font-bold text-[#4285f4] flex items-center gap-3">
							<span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#4285f4] text-white text-base">3</span>
							Trạng thái bắt đầu
						</h3>
						<ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xl text-zinc-600 list-disc pl-5">
							<li>Bàn gồm 10 ô dân (mỗi bên 5 ô) và 2 ô quan ở hai đầu.</li>
							<li>Mỗi ô dân có 5 quân dân.</li>
							<li>Mỗi ô quan có 1 quân quan.</li>
							<li>Hai người chơi ngồi đối diện, mỗi người quản lý 5 ô dân phía mình.</li>
						</ul>
					</section>

					<section className="space-y-4">
						<h3 className="text-2xl font-bold text-[#4285f4] flex items-center gap-3">
							<span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#4285f4] text-white text-base">4</span>
							Cách chơi
						</h3>
						<div className="space-y-4 text-xl text-zinc-600">
							<p>Người chơi chọn 1 ô dân bên mình, bốc toàn bộ quân trong ô đó và rải từng quân một vào các ô tiếp theo theo một chiều đã chọn (thuận hoặc ngược chiều kim đồng hồ tùy ý).</p>
							<div className="bg-[#4285f4]/5 border-l-4 border-[#4285f4] p-5 space-y-4">
								<p><strong>Sau khi rải xong:</strong></p>
								<ul className="space-y-3">
									<li className="flex gap-3"><span className="text-[#4285f4] font-bold">•</span> <span><strong>Ô kế tiếp có quân:</strong> bốc lên và tiếp tục rải từng quân một tiếp theo chiều đã chọn ban đầu.</span></li>
									<li className="flex gap-3"><span className="text-[#4285f4] font-bold">•</span> <span><strong>Ô kế tiếp trống, ô sau có quân:</strong> ăn toàn bộ quân ở ô sau đó, rồi chuyển lượt.</span></li>
									<li className="flex gap-3"><span className="text-[#4285f4] font-bold">•</span> <span><strong>Ô kế tiếp trống và ô sau cũng trống (hoặc là ô quan):</strong> mất lượt.</span></li>
								</ul>
								<p className="text-sm italic text-zinc-500">Lưu ý: Người chơi có thể ăn liên tiếp nhiều ô nếu điều kiện lặp lại.</p>
							</div>
						</div>
					</section>

					<section className="space-y-4">
						<h3 className="text-2xl font-bold text-[#4285f4] flex items-center gap-3">
							<span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#4285f4] text-white text-base">5</span>
							Trường hợp đặc biệt
						</h3>
						<div className="space-y-6 text-xl text-zinc-600">
							<div className="space-y-2">
								<h4 className="font-bold text-zinc-900 text-lg">Ăn liên tiếp nhiều ô (Ăn liên hoàn)</h4>
								<p>Nếu sau khi ăn quân mà tiếp tục gặp một ô trống và sau đó là một ô có quân thì người chơi được ăn tiếp ô đó. Việc này có thể lặp lại nhiều lần.</p>
							</div>
							<div className="space-y-2">
								<h4 className="font-bold text-zinc-900 text-lg">Hết quân ở 5 ô dân (Mượn quân)</h4>
								<p>Nếu đến lượt mà 5 ô dân bên mình không còn quân, người chơi dùng 5 quân dân đã ăn được để rải đều vào 5 ô bên mình. Nếu không đủ, phải vay quân đối phương hoặc bị xử thua.</p>
							</div>
							<div className="space-y-2 text-rose-600">
								<h4 className="font-bold text-lg italic">Trường hợp "Quan non"</h4>
								<p>Nếu ô quan có ít hơn 5 quân dân, người chơi không được ăn ô quan đó để tránh kết thúc trò chơi quá sớm.</p>
							</div>
						</div>
					</section>

					<section className="space-y-4">
						<h3 className="text-2xl font-bold text-[#4285f4] flex items-center gap-3">
							<span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#4285f4] text-white text-base">6</span>
							Kết thúc trò chơi
						</h3>
						<p className="text-xl text-zinc-600 leading-relaxed">
							Trò chơi kết thúc khi hai ô quan đều hết quân. Khi đó, toàn bộ quân còn lại trong các ô dân được thu về cho người quản lý bên đó để tính điểm xác định người thắng.
						</p>
					</section>
				</div>

				{/* Footer */}
				<div className="px-8 py-6 bg-zinc-50 flex justify-center">
					<button
						type="button"
						onClick={onClose}
						className="px-12 py-4 bg-[#4285f4] text-white text-2xl font-bold rounded-full shadow-lg hover:bg-blue-600 active:scale-95 transition-all"
					>
						Đã Hiểu
					</button>
				</div>
			</div>

			<style jsx>{`
				.custom-scrollbar::-webkit-scrollbar {
					width: 8px;
				}
				.custom-scrollbar::-webkit-scrollbar-track {
					background: #f4f4f5;
					border-radius: 4px;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb {
					background: #d4d4d8;
					border-radius: 4px;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb:hover {
					background: #a1a1aa;
				}
			`}</style>
		</div>
	);
}
