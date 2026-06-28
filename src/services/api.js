import axios from "axios";

// Cấu hình trỏ thẳng vào FastAPI của cậu
const apiClient = axios.create({
  baseURL: "http://127.0.0.1:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Hàm gọi API Classification (Phân loại Đậu/Trượt)
export const testClassification = async (payload) => {
  try {
    const response = await apiClient.post(
      "/predict/classification/batch",
      payload,
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi API Classification:", error);
    throw error;
  }
};

// Hàm gọi API Regression (Chấm điểm GNN)
export const testRegression = async (payload) => {
  try {
    const response = await apiClient.post("/predict/regression/batch", payload);
    return response.data;
  } catch (error) {
    console.error("Lỗi API Regression:", error);
    throw error;
  }
};

export const registerUser = async (payload) => {
  try {
    const response = await apiClient.post("/register", payload);
    return response.data;
  } catch (error) {
    // Trả về lỗi rõ ràng từ FastAPI
    throw error.response?.data?.detail || "Lỗi kết nối máy chủ!";
  }
};

export const loginUser = async (payload) => {
  try {
    const response = await apiClient.post("/login", payload);
    return response.data;
  } catch (error) {
    throw error.response?.data?.detail || "Lỗi kết nối máy chủ!";
  }
};

export const saveHistory = async (payload) => {
  try {
    const response = await apiClient.post("/history", payload);
    return response.data;
  } catch (error) {
    throw error.response?.data?.detail || "Lỗi lưu lịch sử!";
  }
};

export const getHistory = async (userId) => {
  try {
    const response = await apiClient.get(`/history/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.detail || "Lỗi tải lịch sử!";
  }
};
