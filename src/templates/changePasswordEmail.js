module.exports = (user) => `
<!DOCTYPE html>
<html>

<body style="background:#f4f7fb;font-family:Arial;padding:40px;">

<table width="650" align="center" style="background:#fff;border-radius:10px;">

<tr>

<td style="background:#f59e0b;color:#fff;padding:25px;text-align:center;">

<h1>Password Changed</h1>

</td>

</tr>

<tr>

<td style="padding:35px;">

<h2>Hello ${user.firstName}</h2>

<p>

Your account password has been changed successfully.

</p>

<p>

If you didn't make this change, please contact support immediately.

</p>

<p>

Time: <strong>${new Date().toLocaleString()}</strong>

</p>

</td>

</tr>

</table>

</body>

</html>
`;