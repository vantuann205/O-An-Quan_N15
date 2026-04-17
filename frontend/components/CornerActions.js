"use client";

import { CircleX, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CornerActions() {
	const router = useRouter();

	const handleClose = () => {
		if (typeof window === "undefined") {
			router.push("/");
			return;
		}

		const canGoBack = window.history.length > 1;
		window.close();

		if (!window.closed) {
			if (canGoBack) {
				window.history.back();
				return;
			}

			router.push("/");
		}
	};

	return (
		<>
			<button type="button" aria-label="Cài đặt" className="menu-corner menu-corner-left">
				<Settings size={60} strokeWidth={2.2} />
			</button>

			<button
				type="button"
				aria-label="Đóng"
				className="menu-corner menu-corner-right"
				onClick={handleClose}
			>
				<CircleX size={60} strokeWidth={2.2} />
			</button>
		</>
	);
}
