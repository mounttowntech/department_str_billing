module.exports = (user, otp) => `
<!DOCTYPE html>
<html>

<body style="background:#f4f7fb;font-family:Arial;padding:40px;">

<table width="650" align="center" style="background:#fff;border-radius:10px;">

<tr>

<td style="background:#dc2626;color:#fff;padding:25px;text-align:center;">

<h1>Password Reset</h1>

</td>

</tr>

<tr>

<td style="padding:35px;">

<h2>Hello ${user.firstName}</h2>

<p>Your OTP for resetting your password is</p>

<div style="font-size:38px;font-weight:bold;text-align:center;background:#f4f4f4;padding:25px;letter-spacing:8px;color:#2563eb;">

${otp}

</div>

<p style="margin-top:20px;">

This OTP will expire in <strong>10 minutes</strong>.

</p>

<p>

Never share this OTP with anyone.

</p>

</td>

</tr>

</table>

</body>

</html>
`;