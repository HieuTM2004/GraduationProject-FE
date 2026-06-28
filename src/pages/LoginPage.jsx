import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/api";
import { Eye, EyeOff } from "lucide-react"; // Nhập vũ khí Icon

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Trạng thái con mắt
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Validate cơ bản
    if (!formData.username || !formData.password) {
      return setError("Vui lòng điền đầy đủ thông tin!");
    }

    setLoading(true);
    try {
      const res = await loginUser(formData);
      localStorage.setItem(
        "user",
        JSON.stringify({ user_id: res.user_id, username: res.username }),
      );
      navigate("/");
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100 animate-fade-in">
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-8">
          Đăng Nhập Hệ Thống
        </h2>

        {error && (
          <div className="bg-rose-100 text-rose-700 p-3 rounded mb-4 text-sm font-bold text-center border border-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Tài khoản
            </label>
            <input
              type="text"
              required
              placeholder="Tên đăng nhập..."
              className="w-full border-2 border-gray-200 focus:border-blue-500 p-3 rounded-lg outline-none transition"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Nhập mật khẩu..."
                className="w-full border-2 border-gray-200 focus:border-blue-500 p-3 pr-12 rounded-lg outline-none transition"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-md disabled:opacity-50"
          >
            {loading ? "Đang xác thực..." : "ĐĂNG NHẬP"}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="text-blue-600 font-bold hover:underline"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
