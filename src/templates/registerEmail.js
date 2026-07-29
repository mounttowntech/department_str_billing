module.exports = (user) => `
<!DOCTYPE html>
<html>

<head>
<meta charset="UTF-8">
<title>Welcome</title>
</head>

<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 0;">

<tr>
<td align="center">

<table width="650" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;">

<tr>
<td style="background:#2563eb;padding:25px;text-align:center;color:#fff;">

<h1 style="margin:0;">WonderBill</h1>

<p style="margin:8px 0 0;">
Billing & Inventory Management Software
</p>

</td>
</tr>

<tr>
<td style="padding:35px;">

<h2>Hello ${user.firstName}, 👋</h2>

<p>
Welcome to WonderBill.
Your account has been created successfully.
</p>

<table width="100%" cellpadding="8" style="margin-top:20px;background:#f8f8f8;border-radius:6px;">

<tr>
<td><strong>Name</strong></td>
<td>${user.firstName} ${user.lastName || ""}</td>
</tr>

<tr>
<td><strong>Email</strong></td>
<td>${user.email}</td>
</tr>

<tr>
<td><strong>Phone</strong></td>
<td>${user.phone}</td>
</tr>

</table>

<p style="margin-top:25px;">
Thank you for choosing WonderBill.
</p>

</td>
</tr>

<tr>
<td style="background:#f1f5f9;padding:18px;text-align:center;color:#666;">
© ${new Date().getFullYear()} WonderBill. All Rights Reserved.
</td>
</tr>

</table>

</td>
</tr>

</table>

</body>
</html>
`;
