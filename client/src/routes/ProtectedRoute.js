import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthForm from "./components/AuthForm";
import ChatPage from "./components/ChatPage";
import ImagesPage from "./components/Imagespage";
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AuthForm />} />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/images"
          element={
            <ProtectedRoute>
              <ImagesPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<AuthForm />} />
      </Routes>
    </Router>
  );
}

  
  