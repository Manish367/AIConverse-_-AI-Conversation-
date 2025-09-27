import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

// --- HELPER COMPONENTS ---

const AnimatedText = ({ text }) => {
  return (
    <h1 className="animated-text">
      {text.split("").map((char, index) => (
        <span key={index} style={{ animationDelay: `${index * 50}ms` }}>
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </h1>
  );
};

const TypingEffect = ({ text, charDelay = 15, startDelay = 0 }) => {
  return (
    <>
      {text.split("").map((char, index) => (
        <span
          key={index}
          style={{
            animationDelay: `${startDelay + index * charDelay}ms`,
          }}
        >
          {char}
        </span>
      ))}
    </>
  );
};


export default function AuthForm() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const noteHeading = "Important Note for the Client:";
  const noteBody = `Our platform currently uses free AI APIs. Because of this, image explanation and image modification features may not work reliably as the free API quota gets exhausted quickly. This is a temporary limitation, and we will be upgrading to paid APIs soon to ensure stable and reliable results. We appreciate your understanding.`;

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      setEmail("");
      setName("");
      setPassword("");
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* This <style> tag contains all the CSS. It's embedded directly! */}
      <style>{`
        /* --- Base & Container --- */
        .auth-container {
          background-color: #121212;
          font-family: 'Poppins', sans-serif;
          color: #e0e0e0;
          padding: 2rem 1rem;
        }

        /* --- Keyframe Animations --- */
        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
        @keyframes glow {
          0%, 100% {
            color: #e0e0e0;
            text-shadow: none;
          }
          50% {
            color: #ffffff;
            text-shadow: 0 0 8px #00bfff, 0 0 15px #00bfff, 0 0 25px #00bfff;
          }
        }

        /* --- Important Note Box --- */
        .info-note-container {
          background-color: rgba(30, 144, 255, 0.05);
          border: 1px solid rgba(30, 144, 255, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2.5rem;
          width: 100%;
          max-width: 700px;
          box-shadow: 0 0 15px rgba(0, 191, 255, 0.1);
        }
        .info-note-heading {
          font-weight: 600;
          font-size: 1.1rem;
          color: #a9d4fd;
          margin-bottom: 0.75rem;
        }
        .info-note-body {
          font-size: 0.9rem;
          line-height: 1.6;
          color: #b0c4de;
        }
        .info-note-container span {
          opacity: 0;
          animation: fadeIn 0.5s forwards;
        }

        /* --- Animated Welcome Header --- */
        .welcome-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .animated-text {
          font-size: 2rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .animated-text span {
          display: inline-block;
          opacity: 0;
          animation: fadeIn 0.5s forwards, glow 2.5s ease-in-out infinite;
        }
        .subtitle {
          color: #a0a0a0;
          font-size: 1rem;
        }

        /* --- Auth Card & Form Elements --- */
        .auth-card {
          background-color: #1e1e1e;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 191, 255, 0.2);
          width: 100%;
          max-width: 420px;
        }
        .form-label {
          color: #a0a0a0;
          font-weight: 500;
        }
        .form-control {
          background-color: #2a2a2a;
          border: 1px solid #444;
          color: #e0e0e0;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .form-control:focus {
          background-color: #2a2a2a;
          color: #e0e0e0;
          border-color: #00bfff;
          box-shadow: 0 0 0 3px rgba(0, 191, 255, 0.25);
          outline: none;
        }
        .btn-primary {
          background: linear-gradient(90deg, #00bfff, #1e90ff);
          border: none;
          border-radius: 8px;
          font-weight: 600;
          padding: 0.75rem;
          transition: transform 0.2s ease, box-shadow 0.3s ease;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(30, 144, 255, 0.4);
        }
        .btn-link {
          color: #00bfff;
          text-decoration: none;
        }
      `}</style>

      {/* This is the main JSX for the page layout */}
      <div className="container-fluid auth-container d-flex align-items-center justify-content-center min-vh-100">
        <div className="d-flex flex-column align-items-center">

          {/* --- Important Note Box --- */}
          <div className="info-note-container">
            <h5 className="info-note-heading">
              <TypingEffect text={noteHeading} charDelay={25} />
            </h5>
            <p className="info-note-body">
              <TypingEffect
                text={noteBody}
                charDelay={8}
                startDelay={noteHeading.length * 25 + 100}
              />
            </p>
          </div>

          {/* --- Animated Welcome Header --- */}
          <div className="welcome-header">
            <AnimatedText text="Welcome to the world of AI" />
            <AnimatedText text="Get started By" />
            {/* <p className="subtitle mt-2">
              Get started by {mode === "login" ? "logging in" : "signing up"}
            </p> */}
          </div>

          {/* --- The Auth Card --- */}
          <div className="auth-card">
            <div className="card-body p-4">
              <h4 className="mb-3 text-center">
                {mode === "login" ? "Sign in" : "Create account"}
              </h4>
              <form onSubmit={submit}>
                {mode === "register" && (
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                      className="form-control"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                {error && <div className="alert alert-danger py-2 my-3">{error}</div>}
                <button
                  className="btn btn-primary w-100 mt-3"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
                </button>
              </form>
              <div className="text-center mt-4">
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={() => {
                    setError("");
                    setMode(mode === "login" ? "register" : "login");
                  }}
                >
                  {mode === "login" ? "Need an account? Register" : "Have an account? Sign In"}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}