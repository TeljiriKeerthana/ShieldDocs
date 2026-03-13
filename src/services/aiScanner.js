import Tesseract from "tesseract.js"

export async function scanDocument(file){

  const result = await Tesseract.recognize(file,"eng")

  const text = result.data.text

  // Detect Aadhaar numbers
  const aadhaarRegex = /\d{4}\s\d{4}\s\d{4}/g

  // Detect phone numbers
  const phoneRegex = /\d{10}/g

  // Detect dates
  const dobRegex = /\d{2}\/\d{2}\/\d{4}/g

  return {
    aadhaar: text.match(aadhaarRegex),
    phones: text.match(phoneRegex),
    dob: text.match(dobRegex),
    rawText: text
  }

}