import { useState } from "react";
import Papa from "papaparse";
import {
  testClassification,
  testRegression,
  saveHistory,
} from "../services/api";

const DemoPage = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Quản lý chế độ: 'manual' (nhập tay) hoặc 'upload' (tải file)
  const [inputMode, setInputMode] = useState("manual");

  // Dữ liệu nhập tay
  const [formData, setFormData] = useState({
    domain: "IT",
    jd_id: "",
    job_text: "",
    cv_list: [{ id: "", text: "" }],
  });

  // Dữ liệu Upload
  const [uploadData, setUploadData] = useState(null);

  // --- LOGIC XỬ LÝ NHẬP TAY ---
  const handleCvChange = (index, field, value) => {
    const newList = [...formData.cv_list];
    newList[index][field] = value;
    setFormData({ ...formData, cv_list: newList });
  };

  const addCvBox = () =>
    setFormData({
      ...formData,
      cv_list: [...formData.cv_list, { id: "", text: "" }],
    });

  // --- LOGIC XỬ LÝ FILE CSV ---
  const handleDownloadFormat = () => {
    // Thêm cột JD_ID và CV_ID vào định dạng mẫu
    const formatCSV =
      'JD_ID,Job_Text,CV_ID,CV_Text\n"JD_001","Yêu cầu Backend Java...","CV_991","5 năm kinh nghiệm Java..."\n"JD_001","Yêu cầu Backend Java...","CV_992","Nội dung CV ứng viên thứ 2..."';
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), formatCSV], {
      type: "text/csv;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "PJFCANN_Data_Format.csv";
    link.click();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: "\t",
      complete: function (results) {
        const data = results.data;

        // 1. Kiểm tra cấu trúc cột
        if (!data[0] || !data[0].Job_Text || !data[0].CV_Text) {
          alert(
            "Lỗi: File CSV không đúng cấu trúc (Thiếu cột Job_Text hoặc CV_Text)!",
          );
          return;
        }

        // 2. --- BỘ LỌC CHẶN 2 JD CÙNG LÚC (MỚI BỔ SUNG) ---
        const firstJdText = data[0].Job_Text.trim();
        const firstJdId = data[0].JD_ID?.trim() || "";

        // Quét từ dòng thứ 2 trở đi xem có dòng nào chứa JD khác dòng đầu không
        for (let i = 1; i < data.length; i++) {
          const currentJdText = data[i].Job_Text?.trim();
          const currentJdId = data[i].JD_ID?.trim() || "";

          // Nếu phát hiện nội dung JD hoặc ID của JD bị lệch so với dòng đầu
          if (
            currentJdText !== firstJdText ||
            (firstJdId && currentJdId !== firstJdId)
          ) {
            alert(
              `Xử lý thất bại! Phát hiện nhiều hơn 1 vị trí tuyển dụng (JD) trong file.\n\n` +
                `• Dòng 1 đang dùng mã: ${firstJdId || "Không có ID"}\n` +
                `• Dòng ${i + 1} lại xuất hiện mã: ${currentJdId || "Không có ID"}\n\n` +
                `Vui lòng tách mỗi file CSV chỉ chứa duy nhất 1 vị trí JD để AI chấm điểm chính xác nhất!`,
            );

            // Xóa sạch dữ liệu đã nạp sai, bắt user làm lại
            setUploadData(null);
            e.target.value = ""; // Reset nút upload file
            return;
          }
        }
        // --------------------------------------------------

        // Nếu vượt qua bài test gắt gao trên, hệ thống mới nhận dữ liệu
        setUploadData(data);
        alert(
          `✅ Đã nạp thành công ${data.length} ứng viên cho vị trí: ${firstJdId || "Manual_JD"}`,
        );
      },
    });
  };
  // --- LOGIC XUẤT KẾT QUẢ CSV ---
  const handleExportResults = () => {
    if (!results) return;

    const dataToExport = (results.results || results.ranked_results).map(
      (item, idx) => {
        // Dùng chung logic bốc tách ID y như lúc lưu vào SQLite
        let targetJdId = "JD_MANUAL";
        let targetCvId = `CV_MANUAL_${item.cv_index + 1}`;

        if (inputMode === "manual") {
          targetJdId = formData.jd_id.trim() || "JD_MANUAL";
          targetCvId =
            formData.cv_list[item.cv_index]?.id.trim() ||
            `CV_MANUAL_${item.cv_index + 1}`;
        } else if (
          inputMode === "upload" &&
          uploadData &&
          uploadData[item.cv_index]
        ) {
          targetJdId = uploadData[item.cv_index].JD_ID || "JD_UNKNOWN";
          targetCvId =
            uploadData[item.cv_index].CV_ID ||
            `CV_UNKNOWN_${item.cv_index + 1}`;
        }

        // Trả về đúng format 8 cột như trang HistoryPage
        return {
          STT: idx + 1,
          "Thời Gian": new Date().toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          "ID JD": targetJdId,
          "ID CV": targetCvId,
          "Mô Hình AI": results.model_used,
          "Đoạn CV Phân Tích": item.cv_snippet,
          "Điểm Số (Fit Score)": `${(item.score * 100).toFixed(2)}%`,
          "Dự đoán": item.recommendation,
        };
      },
    );

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], {
      type: "text/csv;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    // Đặt tên file có chữ Live_Report để phân biệt với file tải từ History
    link.download = `PJFCANN_Live_Report_${results.model_used}_${new Date().getTime()}.csv`;
    link.click();
  };

  // --- LOGIC CHẠY API ---
  const handleRunModel = async (modelType) => {
    setLoading(true);
    setResults(null);
    try {
      let payload = { domain: formData.domain };

      if (inputMode === "manual") {
        if (!formData.job_text.trim()) return alert("Vui lòng nhập JD!");
        payload.job_text = formData.job_text;
        payload.cv_texts = formData.cv_list
          .filter((cv) => cv.text.trim() !== "")
          .map((cv) => cv.text);
      } else {
        if (!uploadData || uploadData.length === 0)
          return alert("Vui lòng upload file CSV!");
        // Lấy JD từ dòng đầu tiên và danh sách CV
        payload.job_text = uploadData[0].Job_Text;
        payload.cv_texts = uploadData
          .map((row) => row.CV_Text)
          .filter((text) => text);
      }

      const res =
        modelType === "classification"
          ? await testClassification(payload)
          : await testRegression(payload);

      setResults(res);
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user.user_id) {
          const resultsArray = res.results || res.ranked_results;

          // SỬ DỤNG VÒNG LẶP FOR CHUẨN ĐỂ AWAIT CÓ TÁC DỤNG CHẶN LUỒNG
          for (let idx = 0; idx < resultsArray.length; idx++) {
            const item = resultsArray[idx];

            let targetJdId = formData.jd_id.trim() || "JD_MANUAL";
            let targetCvId =
              formData.cv_list[idx]?.id.trim() ||
              `CV_MANUAL_${item.cv_index + 1}`;

            if (inputMode === "upload" && uploadData && uploadData[idx]) {
              targetJdId = uploadData[idx].JD_ID || "JD_UNKNOWN";
              targetCvId = uploadData[idx].CV_ID || `CV_UNKNOWN_${idx + 1}`;
            }

            // Await ở đây sẽ bắt hệ thống đợi lưu xong CV 1 mới chuyển sang CV 2
            await saveHistory({
              user_id: user.user_id,
              jd_id: targetJdId,
              cv_id: targetCvId,
              model_used: res.model_used,
              job_text:
                inputMode === "manual"
                  ? formData.job_text.substring(0, 50) + "..."
                  : uploadData[0].Job_Text.substring(0, 50) + "...",
              cv_snippet: item.cv_snippet,
              score: item.score,
              recommendation: item.recommendation,
            });
          }
        }
      } catch (historyError) {
        console.error("Lỗi khi lưu lịch sử ngầm:", historyError);
      }
    } catch {
      alert("Đã có lỗi xảy ra khi kết nối đến Server AI!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 flex gap-8">
      {/* NỬA TRÁI: KHU VỰC NHẬP LIỆU */}
      <div className="w-1/2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-slate-800">
            Cấu Hình Đầu Vào
          </h2>

          {/* TAB CHUYỂN ĐỔI CHẾ ĐỘ */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setInputMode("manual")}
              className={`px-4 py-2 rounded-md font-medium text-sm transition ${inputMode === "manual" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              Nhập Thủ Công
            </button>
            <button
              onClick={() => setInputMode("upload")}
              className={`px-4 py-2 rounded-md font-medium text-sm transition ${inputMode === "upload" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              Tải File CSV
            </button>
          </div>
        </div>

        {/* --- CHẾ ĐỘ NHẬP TAY --- */}
        {inputMode === "manual" && (
          <div className="space-y-6 animate-fade-in">
            {/* KHU VỰC JD */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">
                Thông tin Job Description (JD)
              </h3>
              <div className="flex gap-4">
                <div className="w-1/3">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    JD ID
                  </label>
                  <input
                    className="w-full border-2 border-gray-200 focus:border-blue-500 p-2 rounded-lg outline-none font-semibold text-indigo-600"
                    placeholder="VD: JD_001"
                    value={formData.jd_id}
                    onChange={(e) =>
                      setFormData({ ...formData, jd_id: e.target.value })
                    }
                  />
                </div>
                <div className="w-2/3">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Nội dung JD
                  </label>
                  <textarea
                    className="w-full border-2 border-gray-200 focus:border-blue-500 p-2 rounded-lg h-24 outline-none resize-none"
                    placeholder="Nội dung JD..."
                    value={formData.job_text}
                    onChange={(e) =>
                      setFormData({ ...formData, job_text: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* KHU VỰC CV */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-800">
                  Danh sách CV ứng viên
                </h3>
                <button
                  onClick={addCvBox}
                  className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded font-bold transition flex items-center gap-1 shadow-sm"
                >
                  + Thêm ứng viên
                </button>
              </div>

              <div className="space-y-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                {formData.cv_list.map((cv, index) => (
                  <div
                    key={index}
                    className="flex gap-4 bg-white p-3 rounded-lg border shadow-sm relative group"
                  >
                    <div className="w-1/3">
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        ID CV #{index + 1}
                      </label>
                      <input
                        className="w-full border-2 border-gray-200 focus:border-blue-500 p-2 rounded-lg outline-none font-semibold text-amber-600"
                        placeholder={`VD: CV_99${index + 1}`}
                        value={cv.id}
                        onChange={(e) =>
                          handleCvChange(index, "id", e.target.value)
                        }
                      />
                    </div>
                    <div className="w-2/3">
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        Nội dung CV
                      </label>
                      <textarea
                        className="w-full border-2 border-gray-200 focus:border-blue-500 p-2 rounded-lg h-20 outline-none resize-none"
                        placeholder={`Nội dung CV #${index + 1}...`}
                        value={cv.text}
                        onChange={(e) =>
                          handleCvChange(index, "text", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- CHẾ ĐỘ UPLOAD FILE --- */}
        {inputMode === "upload" && (
          <div className="space-y-6 animate-fade-in text-center py-10 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <div className="text-gray-500 mb-4">
              <svg
                className="w-16 h-16 mx-auto mb-2 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                ></path>
              </svg>
              <p className="font-medium text-lg">
                Upload file CSV chứa hàng loạt dữ liệu
              </p>
              <p className="text-sm">Hệ thống sẽ tự động quét và phân tích.</p>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleDownloadFormat}
                className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-md font-bold hover:bg-emerald-200 transition"
              >
                1. Tải Format Mẫu
              </button>
              <label className="bg-blue-600 text-white px-6 py-2 rounded-md font-bold hover:bg-blue-700 transition cursor-pointer">
                2. Chọn File CSV
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            {uploadData && (
              <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-md inline-block font-semibold border border-blue-200">
                Data thêm thành công, sẵn sàng {uploadData.length} ứng viên!
              </div>
            )}
          </div>
        )}

        {/* NÚT THỰC THI MODEL */}
        <div className="mt-8 flex gap-4 pt-6 border-t">
          <button
            onClick={() => handleRunModel("classification")}
            className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-900 transition flex justify-center items-center gap-2 shadow-lg disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Đang phân tích..." : "Classification"}
          </button>
          <button
            onClick={() => handleRunModel("regression")}
            className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition flex justify-center items-center gap-2 shadow-lg disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Đang chấm điểm..." : "Regression"}
          </button>
        </div>
      </div>

      {/* NỬA PHẢI: KHU VỰC KẾT QUẢ */}
      <div className="w-1/2 bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col h-[85vh]">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-slate-800">
            Kết Quả Dự Đoán AI
          </h2>

          {/* NÚT EXPORT KẾT QUẢ (Chỉ hiện khi có kết quả) */}
          {results && (
            <button
              onClick={handleExportResults}
              className="bg-emerald-500 text-white px-4 py-2 rounded-md font-bold hover:bg-emerald-600 transition flex items-center gap-2 shadow"
            >
              ⬇️ Xuất CSV Kết Quả
            </button>
          )}
        </div>

        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
          {!results && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <svg
                className="w-24 h-24 mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              <p className="text-lg font-medium">
                Hệ thống đang chờ dữ liệu đầu vào...
              </p>
            </div>
          )}

          {loading && (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
              <p className="text-blue-600 font-bold animate-pulse">
                Lõi AI đang xử lý Tensor...
              </p>
            </div>
          )}

          {results && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">
                  Báo cáo thực thi
                </p>
                <div className="flex gap-6">
                  <p>
                    <span className="text-slate-600">Lõi xử lý:</span>{" "}
                    <span className="font-bold text-blue-600">
                      {results.model_used}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-600">Tổng ứng viên:</span>{" "}
                    <span className="font-bold text-indigo-600">
                      {results.total_cvs_processed}
                    </span>
                  </p>
                </div>
              </div>

              {(results.results || results.ranked_results).map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border-2 hover:border-blue-400 p-5 rounded-lg shadow-sm transition group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-slate-800 bg-slate-100 px-3 py-1 rounded-md">
                      Ứng Viên #{item.cv_index + 1}
                    </h3>
                    <div className="text-right">
                      <span
                        className={`inline-block px-4 py-1.5 rounded-full text-sm font-extrabold tracking-wide text-white shadow-md
                        ${
                          item.recommendation === "ĐẬU"
                            ? "bg-emerald-500"
                            : item.recommendation === "VÙNG XÁM"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                        }`}
                      >
                        {item.recommendation}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed bg-gray-50 p-3 rounded border italic">
                    "... {item.cv_snippet} ..."
                  </p>
                  <div className="flex items-center gap-3 pt-3 border-t">
                    <span className="font-bold text-slate-500 uppercase text-xs tracking-wider">
                      Độ phù hợp (Fit Score)
                    </span>
                    <div className="flex-grow bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${item.score > 0.6 ? "bg-emerald-500" : item.score > 0.4 ? "bg-amber-500" : "bg-rose-500"}`}
                        style={{ width: `${item.score * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xl font-black text-slate-800">
                      {(item.score * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
