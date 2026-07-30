module.exports = (user, resetLink) => {
  return `
  <!DOCTYPE html>
  <html>

  <head>
      <meta charset="UTF-8" />
      <title>Reset Password</title>
  </head>

  <body style="
      margin:0;
      padding:0;
      background:#f4f6fb;
      font-family:Arial,sans-serif;
  ">

      <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
              <td align="center" style="padding:40px 0;">

                  <table width="600" cellpadding="0" cellspacing="0"
                      style="
                      background:#ffffff;
                      border-radius:12px;
                      overflow:hidden;
                      box-shadow:0 5px 20px rgba(0,0,0,.08);
                  ">

                      <tr>
                          <td
                              style="
                              background:#3559F5;
                              padding:25px;
                              text-align:center;
                              color:#fff;
                              font-size:28px;
                              font-weight:bold;
                          ">
                              WonderBill
                          </td>
                      </tr>

                      <tr>
                          <td style="padding:40px;">

                              <h2 style="margin-top:0;">
                                  Hello ${user.firstName},
                              </h2>

                              <p style="
                                  font-size:16px;
                                  color:#444;
                                  line-height:1.8;
                              ">
                                  We received a request to reset your password.
                              </p>

                              <p style="
                                  font-size:16px;
                                  color:#444;
                                  line-height:1.8;
                              ">
                                  Click the button below to create a new password.
                              </p>

                              <div style="text-align:center;margin:40px 0;">

                                  <a
                                      href="${resetLink}"
                                      style="
                                          background:#3559F5;
                                          color:#fff;
                                          text-decoration:none;
                                          padding:15px 35px;
                                          border-radius:8px;
                                          font-size:16px;
                                          display:inline-block;
                                      ">
                                      Reset Password
                                  </a>

                              </div>

                              <p
                                  style="
                                  color:#666;
                                  font-size:14px;
                              ">
                                  This link will expire in
                                  <b>15 minutes</b>.
                              </p>

                              <p
                                  style="
                                  color:#666;
                                  font-size:14px;
                              ">
                                  If you didn't request this,
                                  simply ignore this email.
                              </p>

                          </td>
                      </tr>

                      <tr>
                          <td
                              style="
                              background:#f5f5f5;
                              text-align:center;
                              padding:18px;
                              color:#888;
                              font-size:13px;
                          ">
                              © ${new Date().getFullYear()} WonderBill.
                              All rights reserved.
                          </td>
                      </tr>

                  </table>

              </td>
          </tr>
      </table>

  </body>

  </html>
  `;
};