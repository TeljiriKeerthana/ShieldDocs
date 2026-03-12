import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check local session
    if (localStorage.getItem("shielddocs_session")) {
      navigate("/");
    }
  }, [navigate]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    setError("");
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1000);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError("Please enter a valid OTP.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // Simulate verification delay
      await new Promise(r => setTimeout(r, 800));
      
      // HACKATHON BYPASS: Since Supabase Email Auth has rate limits and requirements,
      // we bypass it completely for the frontend demo by mocking a session locally.
      // We will pretend the user is authenticated with a dummy UUID.
      const hackathonUserId = "00000000-0000-0000-0000-000000000000"; // Fixed UUID for demo
      
      localStorage.setItem("shielddocs_session", JSON.stringify({
        user: { id: hackathonUserId, phone },
        access_token: "mock-token-for-demo"
      }));

      navigate("/");
    } catch (err) {
      setError("Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-500/10 text-brand-500 mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
            ShieldDocs
          </h2>
          <p className="text-gray-400">
            Secure Document Sharing Platform
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 select-none">
                  +91
                </span>
                <input
                  id="phone"
                  type="tel"
                  placeholder="Enter 10 digit number"
                  className="block w-full pl-12 pr-4 py-3 bg-gray-800 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="w-full py-3 px-4 flex justify-center text-sm font-semibold rounded-xl text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
            <p className="text-center text-sm text-gray-500">
              For testing, enter any 10-digit number.
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-400 mb-2">
                Enter OTP
              </label>
              <input
                id="otp"
                type="text"
                placeholder="e.g. 1234"
                className="block w-full px-4 py-3 bg-gray-800 border-gray-700 rounded-xl text-white text-center tracking-widest text-xl placeholder-gray-500 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
              <p className="text-xs text-center text-gray-500 mt-2">
                Sent to +91 {phone} · <button type="button" onClick={() => setStep(1)} className="text-emerald-500 hover:text-emerald-400">Edit</button>
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="w-full py-3 px-4 flex justify-center text-sm font-semibold rounded-xl text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>
            <p className="text-center text-sm text-gray-500">
              For testing, enter any OTP.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
