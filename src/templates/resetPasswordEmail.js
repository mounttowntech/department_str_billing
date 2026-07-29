module.exports = (user) => `
<!DOCTYPE html>
<html>

<body style="background:#f4f7fb;font-family:Arial;padding:40px;">

<table width="650" align="center" style="background:#fff;border-radius:10px;">

<tr>

<td style="background:#2563eb;color:#fff;padding:25px;text-align:center;">

<h1>Password Reset Successful</h1>

</td>

</tr>

<tr>

<td style="padding:35px;">

<h2>Hello ${user.firstName}</h2>

<p>

Your password has been reset successfully.

</p>

<p>

If you didn't perform this action, please contact your administrator immediately.

</p>

</td>

</tr>

</table>

</body>

</html>
`;