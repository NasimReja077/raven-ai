export const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #0f0f0f;
      color: #e5e5e5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #181818;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 0 30px rgba(0,0,0,0.6);
    }
    .header {
      background: linear-gradient(135deg, #1f1f1f, #2c2c2c);
      padding: 30px;
      text-align: center;
      font-size: 24px;
      font-weight: bold;
    }
    .content {
      padding: 30px;
    }
    .otp-box {
      background: #0f0f0f;
      border: 1px dashed #444;
      padding: 20px;
      text-align: center;
      border-radius: 10px;
      margin: 20px 0;
    }
    .otp-code {
      font-size: 34px;
      font-weight: bold;
      letter-spacing: 6px;
      color: #7c5cff;
    }
    .footer {
      text-align: center;
      padding: 15px;
      font-size: 12px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">🐦‍⬛ Raven 🖤</div>
    <div class="content">
      <h2>Hello {username} 👋</h2>
      <p>Welcome to Raven — your personal knowledge vault.</p>
      <p>Verify your email using the OTP below:</p>

      <div class="otp-box">
        <p>Your OTP Code</p>
        <div class="otp-code">{otp}</div>
        <p style="font-size:12px;">Valid for 10 minutes</p>
      </div>

      <p>If you didn’t request this, ignore this email.</p>
      <p><strong>Raven remembers everything.</strong></p>
    </div>
    <div class="footer">© 2026 Raven 🖤🐦</div>
  </div>
</body>
</html>
`;

export const WELCOME_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #0f0f0f;
      color: #e5e5e5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #181818;
      border-radius: 12px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1f1f1f, #2c2c2c);
      padding: 30px;
      text-align: center;
      font-size: 24px;
    }
    .content {
      padding: 30px;
    }
    .button {
      display: inline-block;
      padding: 12px 25px;
      background: #7c5cff;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 20px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #777;
      padding: 15px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">🐦‍⬛ Welcome to Raven 🖤</div>
    <div class="content">
      <h2>Hello {username} 👋</h2>
      <p>Your email is verified 🎉</p>
      <p>Start saving knowledge — articles, videos, PDFs, tweets — Raven will organize and connect everything for you.</p>

      <a href="{frontendUrl}" class="button">Enter Raven</a>

      <p style="margin-top:20px;"><strong>Nothing you save is ever lost.</strong></p>
    </div>
    <div class="footer">© 2026 Raven 🖤🐦</div>
  </div>
</body>
</html>
`;

export const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #0f0f0f;
      color: #e5e5e5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #181818;
      border-radius: 12px;
    }
    .header {
      padding: 30px;
      text-align: center;
      font-size: 22px;
    }
    .content {
      padding: 30px;
    }
    .button {
      background: #ff4d4d;
      padding: 12px 25px;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      display: inline-block;
      margin-top: 20px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #777;
      padding: 15px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">🔐 Password Reset</div>
    <div class="content">
      <h2>Hello {username}</h2>
      <p>You requested a password reset.</p>
      <a href="{resetUrl}" class="button">Reset Password</a>
      <p style="font-size:12px;">This link expires in 1 hour.</p>
    </div>
    <div class="footer">© 2026 Raven 🖤🐦</div>
  </div>
</body>
</html>
`;

export const PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #0f0f0f;
      color: #e5e5e5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #181818;
      border-radius: 12px;
    }
    .header {
      padding: 30px;
      text-align: center;
      font-size: 22px;
    }
    .content {
      padding: 30px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #777;
      padding: 15px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">✅ Password Updated</div>
    <div class="content">
      <h2>Hello {username}</h2>
      <p>Your password has been successfully changed.</p>
      <p>If this wasn’t you, contact support immediately.</p>
    </div>
    <div class="footer">© 2026 Raven 🖤🐦</div>
  </div>
</body>
</html>
`;