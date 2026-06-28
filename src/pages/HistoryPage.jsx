import { useState, useEffect } from 'react';
import { getHistory } from '../services/api';
import Papa from 'papaparse'; // Nạp vũ khí xuất CSV

const HistoryPage = () => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State quản lý bộ lọc
  const [timeFilter, setTimeFilter] = useState('all');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;
        
        const res = await getHistory(user.user_id);
        setHistoryData(res.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // --- LOGIC LỌC DỮ LIỆU BẰNG JAVASCRIPT TỐC ĐỘ CAO ---
  const getFilteredData = () => {
    if (timeFilter === 'all') return historyData;

    const now = new Date();
    return historyData.filter(item => {
      const itemDate = new Date(item.created_at);
      const diffTime = Math.abs(now - itemDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Chuyển đổi mili-giây sang số ngày

      if (timeFilter === '24h') return diffDays <= 1;
      if (timeFilter === '1w') return diffDays <= 7;
      if (timeFilter === '1m') return diffDays <= 30;
      return true;
    });
  };

  // Lấy danh sách đã được lọc để render ra bảng
  const filteredData = getFilteredData();

  // --- LOGIC XUẤT FILE CSV ---
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      return alert("Không có dữ liệu để xuất!");
    }

    // Chuyển đổi format dữ liệu để in ra cột cho đẹp
    const dataToExport = filteredData.map((item, index) => ({
      "STT": index + 1,
      "Thời Gian": formatDate(item.created_at),
      "ID JD": item.jd_id, 
      "ID CV": item.cv_id,
      "Mô Hình AI": item.model_used,
      "Đoạn CV Phân Tích": item.cv_snippet,
      "Điểm Số (Fit Score)": `${(item.score * 100).toFixed(2)}%`,
      "Dự Đoán": item.recommendation
    }));

    // Parse thành CSV (kèm mã hóa UTF-8 BOM để Excel không bị lỗi font tiếng Việt)
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    
    // Tên file thay đổi linh hoạt theo bộ lọc
    const fileName = `PJFCANN_Report_${timeFilter}_${new Date().getTime()}.csv`;
    link.download = fileName;
    link.click();
  };

  // Hàm format ngày tháng
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-6 animate-fade-in">
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        
        {/* --- KHU VỰC HEADER VÀ TOOLBAR BỘ LỌC --- */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-slate-800">Lịch Sử Phân Tích Của Bạn</h2>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md border">
              <span className="text-sm font-bold text-gray-600">Lọc theo:</span>
              <select 
                value={timeFilter} 
                onChange={(e) => setTimeFilter(e.target.value)}
                className="bg-transparent text-sm font-semibold text-blue-600 outline-none cursor-pointer"
              >
                <option value="all">Toàn bộ thời gian</option>
                <option value="24h">24 giờ qua</option>
                <option value="1w">1 tuần qua</option>
                <option value="1m">1 tháng qua</option>
              </select>
            </div>

            <button 
              onClick={handleExportCSV}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-emerald-700 transition flex items-center gap-2 shadow"
            >
              ⬇️ Xuất Báo Cáo CSV
            </button>
          </div>
        </div>

        {/* --- KHU VỰC BẢNG DỮ LIỆU --- */}
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-rose-100 text-rose-700 p-4 rounded text-center font-bold">{error}</div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <p className="text-gray-500 font-medium text-lg">Không tìm thấy dữ liệu nào phù hợp với bộ lọc hiện tại.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Thời gian</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Mô hình AI</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider w-1/3">Trích đoạn CV</th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Điểm số</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Dự Đoán</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded">
                        {item.model_used.includes('Classification') ? 'Classification' : 'Regression'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 truncate italic max-w-xs">
                      {item.cv_snippet}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-lg font-black text-slate-800">
                        {(item.score * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold text-white shadow-sm
                        ${item.recommendation === 'ĐẬU' ? 'bg-emerald-500' : 
                          item.recommendation === 'VÙNG XÁM' ? 'bg-amber-500' : 'bg-rose-500'}`}>
                        {item.recommendation}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Thanh hiển thị tổng quan */}
            <div className="bg-gray-50 px-6 py-3 border-t text-sm font-bold text-gray-600 flex justify-between">
              <span>Đang hiển thị: <span className="text-blue-600">{filteredData.length}</span> kết quả</span>
              <span>Bộ lọc: <span className="text-blue-600">{timeFilter.toUpperCase()}</span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;