import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "./components/Toast";

import VendorLogin from "./pages/portal/VendorLogin";
import VendorPortal from "./pages/portal/VendorPortal";
import DecoratorLogin from "./pages/portal/DecoratorLogin";
import DecoratorPortal from "./pages/portal/DecoratorPortal";
import DecoratorInvitation from "./pages/decor/Invitation";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* 首頁 → 廠商登入頁 */}
        <Route path="/" element={<Navigate to="/portal/vendor-login" replace />} />

        {/* 公開：邀請連結（裝潢商接受廠商邀請） */}
        <Route path="/decor-invite/:token" element={<DecoratorInvitation />} />

        {/* 廠商登入 + 後台 */}
        <Route path="/portal/vendor-login" element={<VendorLogin />} />
        <Route path="/portal/vendor/:vendorId/*" element={<VendorPortal />} />

        {/* 裝潢商登入 + 後台 */}
        <Route path="/portal/decorator-login" element={<DecoratorLogin />} />
        <Route path="/portal/decorator/:decoratorId/*" element={<DecoratorPortal />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </HashRouter>
  );
}
