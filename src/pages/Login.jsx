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

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: '+91' + phone,
      });

      if (error) throw error;
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
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
      const { data, error } = await supabase.auth.verifyOtp({
        phone: '+91' + phone,
        token: otp,
        type: 'sms'
      });
      
      if (error) throw error;
      
      // Maintain backwards compatibility with the app's custom local storage session
      if (data.session) {
        localStorage.setItem("shielddocs_session", JSON.stringify({
          user: { id: data.user.id, phone: data.user.phone },
          access_token: data.session.access_token,
          supabase_session: data.session
        }));
      }

      navigate("/");
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a192f] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-[#112240] border border-[#233554] rounded-2xl shadow-xl overflow-hidden p-8 relative">
        {/* Background glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl"></div>
        
        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 mb-4 shadow-lg shadow-brand-500/10">
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
          <div className="mb-4 p-4 text-sm bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl relative z-10">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-6 relative z-10">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
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
                  className="block w-full pl-12 pr-4 py-3 bg-[#0a192f] border border-[#233554] rounded-xl text-white placeholder-gray-500 focus:ring-brand-500 focus:border-brand-500 transition-colors shadow-inner"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="w-full py-3.5 px-4 flex justify-center text-sm font-bold rounded-xl text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a192f] focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/20"
            >
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
            <p className="text-center text-sm text-gray-500">
              Make sure you enter a valid mobile number for verification.
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6 relative z-10">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-300 mb-2">
                Enter OTP
              </label>
              <input
                id="otp"
                type="text"
                placeholder="e.g. 1234"
                className="block w-full px-4 py-3 bg-[#0a192f] border border-[#233554] rounded-xl text-white text-center tracking-widest text-xl placeholder-gray-600 focus:ring-brand-500 focus:border-brand-500 transition-colors shadow-inner font-mono"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
              <p className="text-xs text-center text-gray-400 mt-3">
                Sent to +91 {phone} · <button type="button" onClick={() => setStep(1)} className="text-brand-400 hover:text-brand-300 font-medium transition-colors">Edit Number</button>
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="w-full py-3.5 px-4 flex justify-center text-sm font-bold rounded-xl text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a192f] focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/20"
            >
              {loading ? "Verifying..." : "Verify & Secure Login"}
            </button>
            <p className="text-center text-sm text-gray-500">
              Check your mobile device for the OTP.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
