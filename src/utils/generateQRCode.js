const QRCode = require("qrcode");
module.exports = (text) => QRCode.toDataURL(text);
