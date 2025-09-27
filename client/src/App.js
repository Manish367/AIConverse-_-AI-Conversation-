import React from "react";
import { useAuth } from "./context/AuthContext";
import AuthForm from "./components/AuthForm";
import HomePage from "./components/HomePage";

function App() {
  const { user } = useAuth();

  // If a user object exists, show the main application (HomePage).
  // Otherwise, show the login form (AuthForm).
  return user ? <HomePage /> : <AuthForm />;
}

export default App;