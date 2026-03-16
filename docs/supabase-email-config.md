# Supabase Email Configuration Guide

## Step-by-Step Setup

### 1. Go to Supabase Dashboard
**URL:** https://supabase.com/dashboard/project/rtvrfzfgudmqanhqkxir/auth/emails

### 2. Enable Email Settings

**Under "Email Auth" settings:**
- ✅ **Confirm email** = ENABLED
- ✅ **Secure email change** = ENABLED
- ✅ **Email rate limiting** = ENABLED (prevents spam)

### 3. Configure Email Templates

**Click:** "Email Templates" → Edit each template below

---

## Template 1: Confirm Signup

**Template Type:** `Confirmation Email`

**Subject:**
```
Welcome to TWYLM, {{ .Email }}! 🐺
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .button { background: #7e22ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
      .footer { color: #666; font-size: 12px; margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Welcome to TWYLM! 🐺</h1>
      
      <p>Hi there,</p>
      
      <p>Welcome to <strong>The Way You Love Me</strong>! Your account has been created.</p>
      
      <p>Click the button below to confirm your email and get started:</p>
      
      <p>
        <a href="{{ .ConfirmationURL }}" class="button">Confirm Email</a>
      </p>
      
      <p>Or copy this link: {{ .ConfirmationURL }}</p>
      
      <p>This link expires in 24 hours.</p>
      
      <hr style="border: 1px solid #eee; margin: 20px 0;">
      
      <div class="footer">
        <p>With love,<br><strong>Chippy</strong> 🐺<br>The Way You Love Me</p>
        <p>Built with agentic coding, fueled by love</p>
      </div>
    </div>
  </body>
</html>
```

---

## Template 2: Change Email

**Template Type:** `Email Change`

**Subject:**
```
Confirm Your Email Change for TWYLM 🐺
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .button { background: #7e22ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
      .footer { color: #666; font-size: 12px; margin-top: 20px; }
      .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Email Change Request 🐺</h1>
      
      <p>Hi,</p>
      
      <p>You requested to change your email address for <strong>The Way You Love Me (TWYLM)</strong>.</p>
      
      <div class="warning">
        <strong>Action Required:</strong> Click the button below to confirm your email change.
      </div>
      
      <p>
        <a href="{{ .ConfirmationURL }}" class="button">Confirm New Email</a>
      </p>
      
      <p>Or copy this link: {{ .ConfirmationURL }}</p>
      
      <p><strong>What happens next:</strong></p>
      <ul>
        <li>Once confirmed, your email will be updated</li>
        <li>You will be logged out of all sessions</li>
        <li>Sign in with your new email address</li>
      </ul>
      
      <p>This link expires in 24 hours.</p>
      
      <p>If you didn't request this change, please ignore this email.</p>
      
      <hr style="border: 1px solid #eee; margin: 20px 0;">
      
      <div class="footer">
        <p>With love,<br><strong>Chippy</strong> 🐺<br>The Way You Love Me</p>
      </div>
    </div>
  </body>
</html>
```

---

## Template 3: Magic Link (Login)

**Template Type:** `Magic Link`

**Subject:**
```
Your TWYLM Login Link 🐺
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .button { background: #7e22ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
      .footer { color: #666; font-size: 12px; margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1> TWYLM Login 🐺</h1>
      
      <p>Hi,</p>
      
      <p>Click the button below to log in to <strong>The Way You Love Me</strong>:</p>
      
      <p>
        <a href="{{ .ConfirmationURL }}" class="button">Log In</a>
      </p>
      
      <p>Or copy this link: {{ .ConfirmationURL }}</p>
      
      <p>This link expires in 24 hours.</p>
      
      <p>If you didn't request this login, please ignore this email.</p>
      
      <hr style="border: 1px solid #eee; margin: 20px 0;">
      
      <div class="footer">
        <p>With love,<br><strong>Chippy</strong> 🐺<br>The Way You Love Me</p>
      </div>
    </div>
  </body>
</html>
```

---

## Template 4: Password Reset

**Template Type:** `Recovery`

**Subject:**
```
Reset Your TWYLM Password 🐺
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .button { background: #7e22ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
      .footer { color: #666; font-size: 12px; margin-top: 20px; }
      .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Password Reset 🐺</h1>
      
      <p>Hi,</p>
      
      <p>You requested to reset your password for <strong>The Way You Love Me (TWYLM)</strong>.</p>
      
      <div class="warning">
        <strong>Action Required:</strong> Click the button below to reset your password.
      </div>
      
      <p>
        <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
      </p>
      
      <p>Or copy this link: {{ .ConfirmationURL }}</p>
      
      <p>This link expires in 24 hours.</p>
      
      <p>If you didn't request this reset, please ignore this email or contact support.</p>
      
      <hr style="border: 1px solid #eee; margin: 20px 0;">
      
      <div class="footer">
        <p>With love,<br><strong>Chippy</strong> 🐺<br>The Way You Love Me</p>
      </div>
    </div>
  </body>
</html>
```

---

## 4. Save & Test

**After editing each template:**
1. Click **"Save"**
2. Send test email to yourself
3. Verify branding looks correct
4. Check mobile rendering

---

## 5. SMTP Configuration (Optional - for custom domain)

**If you want custom email sending:**
- Go to: Project Settings → Auth → SMTP
- Configure your own SMTP server
- Otherwise, Supabase uses default (fine for now)

---

## Quick Summary

**What to do:**
1. Go to Supabase dashboard
2. Enable email confirmations
3. Copy-paste each template above
4. Save and test
5. Done! ✅

**Result:**
- Dan gets branded emails from Chippy
- All auth emails have TWYLM styling
- Consistent voice across notifications

---

## Variables Reference

Supabase provides these template variables:
- `{{ .Email }}` - User's email
- `{{ .ConfirmationURL }}` - Action link (confirm/reset/login)
- `{{ .Token }}` - Raw token (if needed)
- `{{ .SiteURL }}` - Your site URL

---

**Questions?** Ask Chippy! 🐺
