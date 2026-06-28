import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  // Đọc thông tin user từ LocalStorage
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('user'); // Xóa trí nhớ
    navigate('/login'); // Đẩy về trang đăng nhập
  };

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-xl">AI</div>
          <Link to="/" className="text-2xl font-bold tracking-wider">PJFCANN<span className="text-blue-400">.Pro</span></Link>
        </div>
        
        <nav className="flex gap-6 items-center font-medium">
          <Link to="/" className="hover:text-blue-400 transition">Workspace</Link>
          
          {user ? (
            // NẾU ĐÃ ĐĂNG NHẬP: Hiện nút Lịch sử và Tên User
            <>
              <Link to="/history" className="hover:text-blue-400 transition">Lịch sử Test</Link>
              <div className="w-px h-6 bg-slate-700 mx-2"></div>
              <span className="text-emerald-400 font-bold">Chào, {user.username}!</span>
              <button onClick={handleLogout} className="bg-rose-600 px-4 py-2 rounded-md hover:bg-rose-700 transition text-sm">
                Đăng xuất
              </button>
            </>
          ) : (
            // NẾU CHƯA ĐĂNG NHẬP: Hiện nút Login/Register
            <>
              <div className="w-px h-6 bg-slate-700 mx-2"></div>
              <Link to="/login" className="hover:text-blue-400 transition">Đăng nhập</Link>
              <Link to="/register" className="bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 transition">Đăng ký</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;