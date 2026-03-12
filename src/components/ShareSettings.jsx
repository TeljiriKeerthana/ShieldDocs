import React, { useState } from "react";

function ShareSettings() {

  const [accessType, setAccessType] = useState("one-time");

  return (
    <div style={{marginTop:"40px"}}>

      <h2>Access Control</h2>

      <label>
        <input
          type="radio"
          value="one-time"
          checked={accessType === "one-time"}
          onChange={(e)=>setAccessType(e.target.value)}
        />
        One-time view
      </label>

      <br/>

      <label>
        <input
          type="radio"
          value="24hr"
          checked={accessType === "24hr"}
          onChange={(e)=>setAccessType(e.target.value)}
        />
        24 hour access
      </label>

      <br/>

      <label>
        <input
          type="radio"
          value="unlimited"
          checked={accessType === "unlimited"}
          onChange={(e)=>setAccessType(e.target.value)}
        />
        Unlimited
      </label>

      <br/><br/>

      <label>
        <input type="checkbox"/>
        Disable download
      </label>

      <br/>

      <label>
        <input type="checkbox"/>
        Disable copy
      </label>

    </div>
  );
}

export default ShareSettings;