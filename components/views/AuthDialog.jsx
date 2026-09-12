'use client'
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Lock, Phone, ArrowRight, User } from 'lucide-react'
import { toast } from 'sonner'
import { LOGO } from '@/lib/client/constants'
import {
  loginWithFirebaseGoogle,
  sendFirebasePhoneOtp,
  confirmFirebasePhoneOtp,
  loginWithFirebaseEmail,
  signupWithFirebaseEmail,
} from '@/lib/client/firebaseAuth'

export default function AuthDialog({ open, onOpenChange, onAuthSuccess }) {
  const [tab, setTab] = useState('phone') // 'google' | 'phone' | 'email-login' | 'email-signup'
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Phone state
  const [rawPhone, setRawPhone] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [authStep, setAuthStep] = useState(1) // 1 = Phone input, 2 = OTP input
  const [confirmationResult, setConfirmationResult] = useState(null)
  const [otpDigits, setOtpDigits] = useState(['', '', '', ''])
  const [resendTimer, setResendTimer] = useState(0)
  const otpInputsRef = useRef([])

  // Email state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')

  // Focus state for floating labels
  const [focusedField, setFocusedField] = useState('')

  // Form error shake state (trigger keyframe animation on validation error)
  const [shakeField, setShakeField] = useState('')

  // OTP Countdown
  useEffect(() => {
    let timer
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((t) => t - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [resendTimer])

  // Clear state on close
  useEffect(() => {
    if (!open) {
      setLoading(false)
      setErrorMsg('')
      setRawPhone('')
      setPhoneNumber('')
      setAuthStep(1)
      setConfirmationResult(null)
      setOtpDigits(['', '', '', ''])
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setFullName('')
      setFocusedField('')
      setShakeField('')
    }
  }, [open])

  // Shake helper
  const triggerShake = (fieldName) => {
    setShakeField(fieldName)
    setTimeout(() => setShakeField(''), 500)
  }

  // Google Login
  const handleGoogleLogin = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const data = await loginWithFirebaseGoogle()
      toast.success('Welcome back!')
      onAuthSuccess?.(data)
      onOpenChange(false)
    } catch (e) {
      console.error('[AuthDialog] Google error:', e)
      setErrorMsg(e.message || 'Google sign-in failed. Please try again.')
      toast.error('Google login failed')
    } finally {
      setLoading(false)
    }
  }

  // Send Phone OTP
  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 13) {
      triggerShake('phone')
      toast.error('Please enter a valid 10-digit phone number')
      return
    }
    setLoading(true)
    setErrorMsg('')
    try {
      const result = await sendFirebasePhoneOtp(phoneNumber.trim())
      setConfirmationResult(result)
      setAuthStep(2)
      setResendTimer(30)
      toast.success('Verification code sent!')
    } catch (e) {
      console.error('[AuthDialog] OTP Send error:', e)
      setErrorMsg(e.message || 'Failed to send OTP')
      toast.error('Failed to send verification code')
    } finally {
      setLoading(false)
    }
  }

  // Verify Phone OTP
  const handleVerifyOtp = async () => {
    const code = otpDigits.join('')
    if (code.length !== 4) {
      triggerShake('otp')
      toast.error('Enter the complete 4-digit code')
      return
    }
    setLoading(true)
    setErrorMsg('')
    try {
      const data = await confirmFirebasePhoneOtp(confirmationResult, code)
      toast.success('Welcome back!')
      onAuthSuccess?.(data)
      onOpenChange(false)
    } catch (e) {
      console.error('[AuthDialog] OTP Verify error:', e)
      triggerShake('otp')
      setErrorMsg(e.message || 'Invalid or expired OTP')
      toast.error('OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendTimer > 0) return
    setOtpDigits(['', '', '', ''])
    await handleSendOtp()
  }

  // OTP Digit inputs onChange
  const handleOtpChange = (val, idx) => {
    const sanitized = val.replace(/\D/g, '').slice(-1)
    const newDigits = [...otpDigits]
    newDigits[idx] = sanitized
    setOtpDigits(newDigits)

    // Trigger scale-pulse animation
    const element = otpInputsRef.current[idx]
    if (element) {
      element.style.transform = 'scale(1.15)'
      setTimeout(() => {
        if (element) element.style.transform = 'scale(1)'
      }, 150)
    }

    if (sanitized && idx < 3) {
      otpInputsRef.current[idx + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      otpInputsRef.current[idx - 1]?.focus()
    }
  }

  // Email login/signup
  const handleEmailAuthSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      triggerShake('email')
      return
    }
    if (!password) {
      triggerShake('password')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      if (tab === 'email-login') {
        const data = await loginWithFirebaseEmail(email, password)
        toast.success('Welcome back!')
        onAuthSuccess?.(data)
        onOpenChange(false)
      } else {
        if (password !== confirmPassword) {
          triggerShake('confirmPassword')
          toast.error('Passwords do not match')
          setLoading(false)
          return
        }
        if (!fullName.trim()) {
          triggerShake('fullName')
          toast.error('Please enter your name')
          setLoading(false)
          return
        }
        const data = await signupWithFirebaseEmail(email, password, fullName.trim())
        toast.success('Welcome to Trainr!')
        onAuthSuccess?.(data)
        onOpenChange(false)
      }
    } catch (e) {
      console.error('[AuthDialog] Email error:', e)
      setErrorMsg(e.message || 'Authentication failed')
      toast.error('Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  // Form transition animation variants
  const formVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' } }
  }

  // Floating label float variants
  const labelVariants = {
    idle: { y: 12, scale: 1, color: '#64748B' },
    active: { y: -2, scale: 0.82, color: '#0EA5E9' }
  }

  const shakeVariants = {
    shake: {
      x: [-6, 6, -4, 4, -2, 2, 0],
      transition: { duration: 0.35 }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border border-slate-200/80 max-w-sm rounded-3xl p-0 overflow-hidden shadow-xl">
        
        {/* Header Section */}
        <div className="relative bg-slate-50 border-b border-slate-100 p-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 shadow-sm mb-3">
              <img src={LOGO} alt="Trainr" className="w-full h-full object-cover" />
            </div>
            <motion.h3
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.3 }}
              className="text-2xl font-black text-slate-800 tracking-tight"
            >
              Trainr
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.3 }}
              className="text-xs font-semibold text-slate-500 mt-1"
            >
              Find your perfect workout partner
            </motion.p>
          </motion.div>
        </div>

        <div className="p-6 space-y-5">
          {/* Tab Selector */}
          <div className="bg-slate-100/85 p-1 rounded-2xl flex items-center relative z-0">
            {[
              { id: 'phone', label: 'Phone OTP' },
              { id: 'google', label: 'Google' },
              { id: 'email-login', label: 'Email' }
            ].map((t) => {
              const active = tab === t.id || (t.id === 'email-login' && tab === 'email-signup')
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id)
                    setErrorMsg('')
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors relative z-10 ${
                    active ? 'text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="auth-sliding-pill"
                      className="absolute inset-0 bg-sky-500 rounded-xl -z-10 shadow-sm"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* Form cross-fading container */}
          <div className="min-h-[220px] relative">
            <AnimatePresence mode="wait">
              {tab === 'google' && (
                <motion.div
                  key="google"
                  variants={formVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-4 pt-2"
                >
                  <p className="text-center text-xs font-semibold text-slate-550 leading-relaxed max-w-[280px] mx-auto">
                    Sign in securely with your Google account to discover and match with fitness partners.
                  </p>
                  <div className="flex flex-col items-center pt-2">
                    <Button
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl h-11 flex items-center justify-center gap-2.5 shadow-sm transition active:scale-[0.98]"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
                      ) : (
                        <span className="w-4.5 h-4.5 flex items-center justify-center text-red-500">
                          G
                        </span>
                      )}
                      Continue with Google
                    </Button>
                  </div>
                </motion.div>
              )}

              {tab === 'phone' && (
                <motion.div
                  key="phone"
                  variants={formVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-4"
                >
                  {authStep === 1 ? (
                    <div className="space-y-4">
                      <p className="text-xs font-semibold text-slate-550 leading-relaxed">
                        Enter your 10-digit mobile number to verify your account via OTP.
                      </p>
                      
                      <motion.div
                        variants={shakeVariants}
                        animate={shakeField === 'phone' ? 'shake' : 'idle'}
                        className="space-y-1.5"
                      >
                        <Label className="text-xs font-bold text-slate-700">Phone Number</Label>
                        <div className="flex rounded-xl border border-slate-200/80 focus-within:ring-2 focus-within:ring-sky-500 overflow-hidden bg-slate-50">
                          <span className="bg-slate-100 flex items-center justify-center px-3.5 text-sm font-black text-slate-600 border-r border-slate-200/80 select-none">
                            +91
                          </span>
                          <Input
                            type="tel"
                            placeholder="XXXXXXXXXX"
                            value={rawPhone}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '')
                              if (val.startsWith('91') && val.length > 10) {
                                val = val.slice(2)
                              }
                              val = val.slice(0, 10)
                              setRawPhone(val)
                              setPhoneNumber(val ? '+91' + val : '')
                            }}
                            className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-800 text-sm font-semibold flex-1 h-11 shadow-none"
                          />
                        </div>
                      </motion.div>

                      <Button
                        onClick={handleSendOtp}
                        disabled={loading || rawPhone.length < 10}
                        className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl h-11 transition active:scale-[0.98]"
                      >
                        {loading ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP…</>
                        ) : (
                          'Send OTP'
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs font-semibold text-slate-550 leading-relaxed">
                        We sent a verification code to <strong className="text-slate-800">{phoneNumber}</strong>.
                      </p>
                      
                      <motion.div
                        variants={shakeVariants}
                        animate={shakeField === 'otp' ? 'shake' : 'idle'}
                        className="space-y-2.5"
                      >
                        <Label className="text-xs font-bold text-slate-700">4-Digit Verification Code</Label>
                        <div className="flex items-center justify-center gap-3">
                          {otpDigits.map((digit, idx) => (
                            <input
                              key={idx}
                              ref={(el) => (otpInputsRef.current[idx] = el)}
                              type="text"
                              maxLength={1}
                              pattern="\d*"
                              keyboardType="numeric"
                              value={digit}
                              onChange={(e) => handleOtpChange(e.target.value, idx)}
                              onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                              className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/80 text-center text-xl font-black text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                            />
                          ))}
                        </div>
                      </motion.div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => setAuthStep(1)}
                          variant="outline"
                          className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl h-11"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={handleVerifyOtp}
                          disabled={loading || otpDigits.join('').length < 4}
                          className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl h-11 transition active:scale-[0.98]"
                        >
                          {loading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying…</>
                          ) : (
                            'Verify'
                          )}
                        </Button>
                      </div>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={resendTimer > 0}
                          className={`text-xs font-bold transition ${
                            resendTimer > 0 ? 'text-slate-400' : 'text-sky-500 hover:text-sky-600'
                          }`}
                        >
                          {resendTimer > 0 ? (
                            <span>Resend OTP in 0:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}</span>
                          ) : (
                            'Resend Verification Code'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {tab.startsWith('email') && (
                <motion.div
                  key={tab}
                  variants={formVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-4"
                >
                  <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5">
                    {tab === 'email-signup' && (
                      <motion.div
                        variants={shakeVariants}
                        animate={shakeField === 'fullName' ? 'shake' : 'idle'}
                        className="relative rounded-xl border border-slate-200/80 bg-slate-50/60 p-1.5 focus-within:ring-2 focus-within:ring-sky-500"
                      >
                        <motion.label
                          variants={labelVariants}
                          animate={focusedField === 'fullName' || fullName ? 'active' : 'idle'}
                          transition={{ duration: 0.15 }}
                          className="absolute left-9 font-bold text-xs pointer-events-none"
                        >
                          Full Name
                        </motion.label>
                        <div className="flex items-center gap-2 px-1">
                          <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <Input
                            type="text"
                            value={fullName}
                            onFocus={() => setFocusedField('fullName')}
                            onBlur={() => setFocusedField('')}
                            onChange={(e) => setFullName(e.target.value)}
                            className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-800 text-sm font-semibold h-9 shadow-none pt-4"
                          />
                        </div>
                      </motion.div>
                    )}

                    <motion.div
                      variants={shakeVariants}
                      animate={shakeField === 'email' ? 'shake' : 'idle'}
                      className="relative rounded-xl border border-slate-200/80 bg-slate-50/60 p-1.5 focus-within:ring-2 focus-within:ring-sky-500"
                    >
                      <motion.label
                        variants={labelVariants}
                        animate={focusedField === 'email' || email ? 'active' : 'idle'}
                        transition={{ duration: 0.15 }}
                        className="absolute left-9 font-bold text-xs pointer-events-none"
                      >
                        Email Address
                      </motion.label>
                      <div className="flex items-center gap-2 px-1">
                        <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <Input
                          type="email"
                          value={email}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField('')}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-800 text-sm font-semibold h-9 shadow-none pt-4"
                        />
                      </div>
                    </motion.div>

                    <motion.div
                      variants={shakeVariants}
                      animate={shakeField === 'password' ? 'shake' : 'idle'}
                      className="relative rounded-xl border border-slate-200/80 bg-slate-50/60 p-1.5 focus-within:ring-2 focus-within:ring-sky-500"
                    >
                      <motion.label
                        variants={labelVariants}
                        animate={focusedField === 'password' || password ? 'active' : 'idle'}
                        transition={{ duration: 0.15 }}
                        className="absolute left-9 font-bold text-xs pointer-events-none"
                      >
                        Password
                      </motion.label>
                      <div className="flex items-center gap-2 px-1">
                        <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <Input
                          type="password"
                          value={password}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField('')}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-800 text-sm font-semibold h-9 shadow-none pt-4"
                        />
                      </div>
                    </motion.div>

                    {tab === 'email-signup' && (
                      <motion.div
                        variants={shakeVariants}
                        animate={shakeField === 'confirmPassword' ? 'shake' : 'idle'}
                        className="relative rounded-xl border border-slate-200/80 bg-slate-50/60 p-1.5 focus-within:ring-2 focus-within:ring-sky-500"
                      >
                        <motion.label
                          variants={labelVariants}
                          animate={focusedField === 'confirmPassword' || confirmPassword ? 'active' : 'idle'}
                          transition={{ duration: 0.15 }}
                          className="absolute left-9 font-bold text-xs pointer-events-none"
                        >
                          Confirm Password
                        </motion.label>
                        <div className="flex items-center gap-2 px-1">
                          <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <Input
                            type="password"
                            value={confirmPassword}
                            onFocus={() => setFocusedField('confirmPassword')}
                            onBlur={() => setFocusedField('')}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-800 text-sm font-semibold h-9 shadow-none pt-4"
                          />
                        </div>
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl h-11 transition active:scale-[0.98] mt-1"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      {loading ? 'Processing…' : tab === 'email-login' ? 'Login' : 'Sign Up'}
                    </Button>
                  </form>

                  <div className="text-center pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setTab(tab === 'email-login' ? 'email-signup' : 'email-login')}
                      className="text-xs font-bold text-slate-500 hover:text-sky-500 transition"
                    >
                      {tab === 'email-login' ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Inline Error Message */}
          {errorMsg && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-xs font-bold text-red-500 mt-2"
            >
              ⚠️ {errorMsg}
            </motion.p>
          )}
        </div>

      </DialogContent>
    </Dialog>
  )
}
