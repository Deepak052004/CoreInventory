# Postman Testing – OTP Password Reset

Base URL: `http://localhost:5000/api`

---

## 1. Create a user (or use existing)

**POST** `/auth/signup`

Headers: `Content-Type: application/json`

Body (raw JSON):

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

Expected: `201` with `token` and `user`.

---

## 2. Request OTP (forgot password)

**POST** `/auth/forgot-password`

Headers: `Content-Type: application/json`

Body (raw JSON):

```json
{
  "email": "test@example.com"
}
```

Expected:

- **200**: `{ "success": true, "message": "OTP sent to your email. It expires in 5 minutes." }`
- If email is not configured: `otpForDev` is returned – use this 6-digit OTP in the next steps.
- **404**: `{ "success": false, "message": "No account found with this email" }` – invalid email.
- **400**: Validation error (e.g. invalid email format).

---

## 3. Verify OTP

**POST** `/auth/verify-otp`

Headers: `Content-Type: application/json`

Body (raw JSON) – use the OTP from email or `otpForDev`:

```json
{
  "email": "test@example.com",
  "otp": "123456"
}
```

Expected:

- **200**: `{ "success": true, "message": "OTP verified. You can now reset your password." }`
- **400** wrong OTP: `{ "success": false, "message": "Invalid OTP." }`
- **400** expired: `{ "success": false, "message": "OTP has expired. Please request a new one." }`
- **400** no OTP requested: `{ "success": false, "message": "No OTP requested for this email. Request a new one." }`
- **404**: `{ "success": false, "message": "No account found with this email" }`

---

## 4. Reset password (after verify-otp)

**POST** `/auth/reset-password`

Headers: `Content-Type: application/json`

Body (raw JSON):

```json
{
  "email": "test@example.com",
  "newPassword": "newpassword123"
}
```

Expected:

- **200**: `{ "success": true, "token": "...", "user": {...}, "message": "Password reset successfully." }`
- **400** if verify-otp was not called: `{ "success": false, "message": "OTP not verified. Please verify your OTP first before resetting password." }`
- **404**: No account with this email.

---

## 5. Login with new password

**POST** `/auth/login`

Body:

```json
{
  "email": "test@example.com",
  "password": "newpassword123"
}
```

Expected: `200` with `token` and `user`.

---

## Error summary

| Case              | Endpoint         | Status | Message |
|-------------------|------------------|--------|---------|
| Invalid email     | forgot-password  | 404    | No account found with this email |
| Wrong OTP         | verify-otp        | 400    | Invalid OTP. |
| Expired OTP       | verify-otp        | 400    | OTP has expired. Please request a new one. |
| Reset without verify | reset-password | 400    | OTP not verified. Please verify your OTP first... |

---

## Flow order

1. **POST** `/auth/forgot-password` with `email`
2. Get OTP from email (or `otpForDev` in response)
3. **POST** `/auth/verify-otp` with `email` and `otp`
4. **POST** `/auth/reset-password` with `email` and `newPassword`
5. Use returned `token` or **POST** `/auth/login` with new password
