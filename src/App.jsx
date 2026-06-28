import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import DemoPage from './pages/DemoPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HistoryPage from './pages/HistoryPage';

// --- HÀM KIỂM TRA ĐĂNG NHẬP ---
const isAuthenticated = () => {
  const user = localStorage.getItem('user');
  return user ? true : false;
};

// --- COMPONENT GÁC CỔNG VÙNG NHẠY CẢM (WORKSPACE/HISTORY) ---
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    // Nếu chưa đăng nhập, bắt quay xe về trang Login
    return <Navigate to="/login" replace />;
  }
  return children;
};

// --- COMPONENT GÁC CỔNG VÙNG CÔNG CỘNG (LOGIN/REGISTER) ---
const PublicRoute = ({ children }) => {
  if (isAuthenticated()) {
    // Nếu đã có thẻ (đã login) thì không cho vào trang Login nữa, đẩy thẳng vào Home
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            {/* Vùng cần bảo vệ: Muốn vào Workspace phải qua ProtectedRoute */}
            <Route path="/" element={
              <ProtectedRoute>
                <DemoPage />
              </ProtectedRoute>
            } />
            
            <Route path="/history" element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            } />

            {/* Vùng công cộng: Đã login rồi thì cấm quay lại đây */}
            <Route path="/login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            
            <Route path="/register" element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } />

            {/* Nếu user nhập bậy bạ đường dẫn, đẩy về trang chủ */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;