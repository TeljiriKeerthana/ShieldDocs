import QRCode from "qrcode"

export const generateQR = async (link) => {

 return await QRCode.toDataURL(link)

}