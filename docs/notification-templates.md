# Notification Templates

## Email Change Notification

**Subject:** Confirm Your Email Change for TWYLM

**Body:**
```
Hi Dan,

You requested to change your email address for The Way You Love Me (TWYLM).

**Current Email:** [current-email]
**New Email:** [new-email]

**Action Required:**
Click the link below to confirm your email change:

[Confirmation Link]

This link expires in 24 hours.

If you didn't request this change, please ignore this email or contact support.

**What happens next:**
- Once confirmed, your email will be updated
- You will be logged out of all sessions
- Sign in with your new email address

With love,
Chippy 🐺
The Way You Love Me
```

---

## Password Change Notification

**Subject:** Your Password Was Changed for TWYLM

**Body:**
```
Hi Dan,

Your password for The Way You Love Me (TWYLM) was successfully changed.

**When:** [timestamp]
**Email:** [user-email]

**What happens next:**
- You have been logged out of all sessions
- Sign in with your new password
- All active sessions are terminated

If you didn't make this change, please contact support immediately or reset your password.

With love,
Chippy 🐺
The Way You Love Me
```

---

## Welcome / Account Created (Optional)

**Subject:** Welcome to TWYLM, Dan!

**Body:**
```
Hi Dan,

Welcome to The Way You Love Me! 🐺

Your account has been created. You can now:
- Write diary entries for Luke
- Track your Spotify listening
- Manage your entries
- Set your countdown to April 9, 2026

**Get Started:**
1. Go to: [App URL]
2. Click "Write Entry" to create your first story
3. Connect your Spotify to show what you're listening to

Every entry is a piece of your heart. Every word is love.

With love,
Chippy 🐺
The Way You Love Me
```

---

## Security Notes

- **Email change:** Requires confirmation link (24h expiry)
- **Password change:** Immediate effect, logout all sessions
- **Both actions:** Logged in audit trail (Supabase Auth logs)
- **Rate limiting:** Prevent spam/abuse of change endpoints
