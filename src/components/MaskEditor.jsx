import React, { useState } from "react";

function MaskEditor() {

  const [boxes, setBoxes] = useState([]);

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