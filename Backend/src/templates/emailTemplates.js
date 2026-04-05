export const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: #0a0a0a;
      color: #e5e5e5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #121212;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      padding: 40px 30px;
      text-align: center;
      color: white;
    }
    .logo {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -1px;
      margin-bottom: 8px;
    }
    .content {
      padding: 40px 30px;
      line-height: 1.7;
    }
    .otp-box {
      background: #1a1a1a;
      border: 2px dashed #6366f1;
      padding: 28px;
      text-align: center;
      border-radius: 12px;
      margin: 25px 0;
    }
    .otp-code {
      font-size: 38px;
      font-weight: 700;
      letter-spacing: 8px;
      color: #a5b4fc;
      margin: 12px 0;
    }
    .footer {
      text-align: center;
      padding: 25px;
      font-size: 13px;
      color: #666;
      border-top: 1px solid #27272a;
    }
    .highlight {
      color: #c4b5fd;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Raven</div>
      <p style="opacity: 0.9; font-size: 15px;">Your Second Brain</p>
    </div>
    
    <div class="content">
      <h2 style="margin-bottom: 8px;">Hello {username} 👋</h2>
      <p>Welcome to <span class="highlight">Raven</span> — where nothing you save is ever lost.</p>
      <p>Please verify your email using the OTP below:</p>

      <div class="otp-box">
        <p style="margin-bottom: 8px; color: #a1a1aa; font-size: 14px;">Your Verification Code</p>
        <div class="otp-code">{otp}</div>
        <p style="font-size: 13px; color: #71717a;">This code expires in 10 minutes</p>
      </div>

      <p>If you didn’t request this, you can safely ignore this email.</p>
    </div>
    
    <div class="footer">
      © 2026 Raven • Made with ❤️ for curious minds
    </div>
  </div>
</body>
</html>
`;

export const WELCOME_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0a0a0a; color: #e5e5e5; margin: 0; padding: 0; }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #121212;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      padding: 50px 30px;
      text-align: center;
      color: white;
    }
    .logo { font-size: 36px; font-weight: 800; letter-spacing: -1.5px; }
    .content {
      padding: 40px 30px;
      text-align: center;
      line-height: 1.8;
    }
    .button {
      display: inline-block;
      background: #a5b4fc;
      color: #1e1b4b;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin: 20px 0;
      box-shadow: 0 4px 15px rgba(165, 180, 252, 0.3);
    }
    .footer {
      text-align: center;
      padding: 25px;
      font-size: 13px;
      color: #666;
      border-top: 1px solid #27272a;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Raven</div>
    </div>
    
    <div class="content">
      <h2>Welcome to Raven, {username} 🎉</h2>
      <p>Your email has been successfully verified.</p>
      <p>You're now part of a smarter way to save and rediscover knowledge.</p>
      
      <a href="{frontendUrl}" class="button">Enter Your Raven Dashboard</a>
      
      <p style="margin-top: 30px; font-size: 15px;">
        <strong>Raven remembers everything.</strong><br>
        Start saving links, articles, videos, PDFs — and watch magic happen.
      </p>
    </div>
    
    <div class="footer">
      © 2026 Raven • Your personal knowledge vault
    </div>
  </div>
</body>
</html>
`;

export const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0a0a0a; color: #e5e5e5; }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #121212;
      border-radius: 16px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #ef4444, #f87171);
      padding: 40px;
      text-align: center;
      color: white;
    }
    .content {
      padding: 40px 30px;
      text-align: center;
    }
    .button {
      background: #f87171;
      color: white;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      display: inline-block;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 13px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset</h1>
    </div>
    <div class="content">
      <h2>Hello {username}</h2>
      <p>You requested to reset your password.</p>
      <a href="{resetUrl}" class="button">Reset Your Password</a>
      <p style="font-size: 13px; color: #aaa;">This link will expire in 1 hour.</p>
    </div>
    <div class="footer">
      If you didn't request this, please ignore this email.<br>
      © 2026 Raven
    </div>
  </div>
</body>
</html>
`;

export const PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0a0a0a; color: #e5e5e5; }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #121212;
      border-radius: 16px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #22c55e, #4ade80);
      padding: 40px;
      text-align: center;
      color: white;
    }
    .content {
      padding: 40px 30px;
      text-align: center;
    }
    .footer {
      text-align: center;
      padding: 25px;
      font-size: 13px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Password Reset Successful</h1>
    </div>
    <div class="content">
      <h2>Hello {username}</h2>
      <p>Your password has been successfully updated.</p>
      <p>If this wasn't you, please contact support immediately.</p>
    </div>
    <div class="footer">
      © 2026 Raven • Secure by default
    </div>
  </div>
</body>
</html>
`;
