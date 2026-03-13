import React from "react";

function Dashboard() {
  return (
    <div style={{padding: "40px"}}>
      <h1>ShieldDocs Dashboard</h1>

      <div style={{display:"flex", gap:"20px", marginTop:"30px"}}>

        <div className="card">
          <h2>📂 My Documents</h2>
          <p>View and manage uploaded documents</p>
        </div>

        <div className="card">
          <h2>📤 Create Secure Share</h2>
          <p>Share documents securely</p>
        </div>

        <div className="card">
          <h2>📊 Trust Scores</h2>
          <p>Monitor receiver activity</p>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;