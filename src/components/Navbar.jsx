import { Link } from "react-router-dom";

function Navbar() {
return (
<div
style={{
display: "flex",
gap: "20px",
padding: "15px",
background: "#111",
color: "white"
}}
>
<h3 style={{ marginRight: "20px" }}>ShieldDocs</h3>

  <Link style={{ color: "white" }} to="/dashboard">Dashboard</Link>

  <Link style={{ color: "white" }} to="/vault">Vault</Link>

  <Link style={{ color: "white" }} to="/create-share">Create Share</Link>

  <Link style={{ color: "white" }} to="/trust-scores">Trust Scores</Link>
</div>

);
}

export default Navbar;