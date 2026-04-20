"use client";

import { useCallback, useState } from "react";
import { ArrowLeft, CircleX, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import SettingsModal from "./SettingsModal";

export default function CornerActions({ variant = "mode" }) {
	const router = useRouter();
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);

	const attemptExit = () => {
		if (typeof window === "undefined") {
			router.push("/");
			return;
		}

		// Try to close the current tab/window first.
		window.open("", "_self");
		window.close();

		// If browser blocks close(), fall back to a blank page.
		setTimeout(() => {
			if (!window.closed) {
				window.location.replace("about:blank");
			}
		}, 80);
	};

	const handleClose = () => {
		if (variant === "start") {
			attemptExit();
			return;
		}

		if (typeof window === "undefined") {
			router.push("/");
			return;
		}

		router.push("/");
	};

	const PrimaryIcon = variant === "start" ? CircleX : ArrowLeft;
	const primaryLabel = variant === "start" ? "Đóng game" : "Quay lại";

	return (
		<>
			<button
				type="button"
				aria-label="Cài đặt"
				className="menu-corner menu-corner-left"
				onClick={() => setIsSettingsOpen(true)}
			>
				<Settings size={60} strokeWidth={2.2} />
			</button>

			<button
				type="button"
				aria-label={primaryLabel}
				className="menu-corner menu-corner-right"
				onClick={handleClose}
			>
				<PrimaryIcon size={60} strokeWidth={2.2} />
			</button>

			<SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
		</>
	);
}
