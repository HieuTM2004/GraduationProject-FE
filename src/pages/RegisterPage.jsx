import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';
import { Eye, EyeOff } from 'lucide-react'; // Nhập vũ khí Icon

const RegisterPage = () => {
  const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Trạng thái bật/tắt con mắt
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();

  // Hàm Validate độ khó cao
  const validateForm = () => {
    if (formData.username.trim().length < 3) return "Tên tài khoản phải có ít nhất 3 ký tự!";
    if (formData.username.includes(' ')) return "Tên tài khoản không được chứa khoảng trắng!";
    if (formData.password.length < 6) return "Mật khẩu quá ngắn! Phải có ít nhất 6 ký tự.";
    if (formData.password !== formData.confirmPassword) return "Mật khẩu xác nhận không khớp!";
    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    // Gọi chốt chặn Validate trước khi gọi API
    const validationError = validateForm();
    if (validationError) {
      return setError(validationError);
    }

    setLoading(true);
    try {
      const res = await registerUser({ username: formData.username, password: formData.password });
      localStorage.setItem('user', JSON.stringify({ user_id: res.user_id, username: res.username }));
      alert("Khởi tạo tài khoản thành công! Mời bạn đăng nhập lại.");
      navigate('/login');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100 animate-fade-in">
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-8">Tạo Tài Khoản</h2>
        
        {error && <div className="bg-rose-100 text-rose-700 p-3 rounded mb-4 text-sm font-bold text-center border border-rose-300">{error}</div>}
        
        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Tên tài khoản (Username)</label>
            <input 
              type="text" required
              placeholder="VD: hieutran123"
              className="w-full border-2 border-gray-200 focus:border-blue-500 p-3 rounded-lg outline-none transition"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} required
                placeholder="Tối thiểu 6 ký tự..."
                className="w-full border-2 border-gray-200 focus:border-blue-500 p-3 pr-12 rounded-lg outline-none transition"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              {/* Nút bấm con mắt */}
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Xác nhận Mật khẩu</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"} required
                placeholder="Nhập lại mật khẩu..."
                className="w-full border-2 border-gray-200 focus:border-blue-500 p-3 pr-12 rounded-lg outline-none transition"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-900 transition shadow-md disabled:opacity-50"
          >
            {loading ? 'Đang kiểm tra bảo mật...' : 'ĐĂNG KÝ TÀI KHOẢN'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600">
          Đã có tài khoản? <Link to="/login" className="text-blue-600 font-bold hover:underline">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;