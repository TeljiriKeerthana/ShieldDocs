
import React, { useState } from "react";
import { scanDocument } from "../services/aiScanner"
function MaskEditor() {

  const [boxes, setBoxes] = useState([]);
async function handleAIScan() {

  const file = "/sample-id.jpg"

  const result = await scanDocument(file)

  console.log("Sensitive data detected:", result)

  const aiMasks = []

  if(result.aadhaar){
    aiMasks.push({
      id: Date.now(),
      top: 120,
      left: 120
    })
  }

  if(result.phones){
    aiMasks.push({
      id: Date.now()+1,
      top: 200,
      left: 150
    })
  }

  if(result.dob){
    aiMasks.push({
      id: Date.now()+2,
      top: 250,
      left: 180
    })
  }

  setBoxes([...boxes, ...aiMasks])

}
  const addMask = () => {
    const newBox = {
      id: Date.now(),
      top: 50,
      left: 50
    };

    setBoxes([...boxes, newBox]);
  };

  return (
    <div style={{marginTop:"40px"}}>

      <h2>Mask Sensitive Data</h2>

      <button onClick={addMask}>Add Mask</button>
<button onClick={handleAIScan}>AI Scan Document</button>
      <div
        style={{
          position: "relative",
          width: "500px",
          marginTop:"20px"
        }}
      >

        <img
          src="/sample-id.jpg"
          alt="document"
          style={{width:"100%"}}
        />

        {boxes.map((box) => (
          <div
            key={box.id}
            style={{
              position:"absolute",
              top: box.top,
              left: box.left,
              width:"120px",
              height:"40px",
              background:"black",
              opacity:"0.8"
            }}
          />
        ))}

      </div>

    </div>
  );
}

export default MaskEditor;