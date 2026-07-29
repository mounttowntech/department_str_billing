module.exports = (user) => `
<!DOCTYPE html>
<html>

<body style="background:#f4f7fb;font-family:Arial;padding:40px;">

<table width="650" align="center" style="background:#fff;border-radius:10px;">

<tr>

<td style="background:#16a34a;color:#fff;padding:25px;text-align:center;">

<h1>Successful Login</h1>

</td>

</tr>

<tr>

<td style="padding:35px;">

<h2>Hello ${user.firstName}</h2>

<p>Your account was logged in successfully.</p>

<table cellpadding="8">

<tr>

<td><strong>Date</strong></td>

<td>${new Date().toLocaleString()}</td>

</tr>

<tr>

<td><strong>Email</strong></td>

<td>${user.email}</td>

</tr>

</table>

<p>

If this wasn't you, please change your password immediately.

</p>

</td>

</tr>

</table>

</body>

</html>
`;