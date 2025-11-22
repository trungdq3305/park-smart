import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

// Import 2 trang bạn vừa tạo
import KioskPage from "./pages/KioskPage";
import BulkImportPage from "./pages/BulkImportPage";

// --- Trang chủ mặc định (Code cũ của bạn) ---
function HomePage() {
  const [count, setCount] = useState(0);
  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Hệ thống Bãi xe Thông minh</h1>

      {/* MENU ĐIỀU HƯỚNG */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          justifyContent: "center",
          margin: "20px 0",
        }}
      >
        <Link to="/kiosk">
          <button style={{ backgroundColor: "#1890ff", color: "white" }}>
            👮‍♂️ Vào trang Bảo Vệ (Kiosk)
          </button>
        </Link>
        <Link to="/bulk-import">
          <button style={{ backgroundColor: "#52c41a", color: "white" }}>
            📦 Vào trang Nhập Kho
          </button>
        </Link>
      </div>

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
    </>
  );
}

// --- App Chính: Cấu hình đường dẫn (Routing) ---
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Đường dẫn trang chủ: http://localhost:5173/ */}
        <Route path="/" element={<HomePage />} />

        {/* Đường dẫn Kiosk: http://localhost:5173/kiosk */}
        <Route path="/kiosk" element={<KioskPage />} />

        {/* Đường dẫn Nhập kho: http://localhost:5173/bulk-import */}
        <Route path="/bulk-import" element={<BulkImportPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
