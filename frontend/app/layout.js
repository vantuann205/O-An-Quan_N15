import { SoundProvider } from "../components/SoundContext";
import "./globals.css";

export const metadata = {
  title: "O An Quan",
  description: "Frontend cho game O An Quan"
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <SoundProvider>
          {children}
        </SoundProvider>
      </body>
    </html>
  );
}
