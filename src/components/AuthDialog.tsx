import { useState } from 'react'
import { X } from 'lucide-react'

interface AuthDialogProps {
    isOpen: boolean
    onClose: () => void
    onLogin: (handle: string, appPassword: string) => void
    isLoading: boolean
    error?: string
}

export const AuthDialog = ({ isOpen, onClose, onLogin, isLoading, error }: AuthDialogProps) => {
    const [handle, setHandle] = useState('')
    const [appPassword, setAppPassword] = useState('')

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onLogin(handle, appPassword)
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Sign in to Bluesky</h2>
                    <button onClick={onClose} className="icon-button">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="handle">Handle</label>
                        <input
                            id="handle"
                            type="text"
                            placeholder="alice.bsky.social"
                            value={handle}
                            onChange={(e) => setHandle(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">App Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="xxxx-xxxx-xxxx-xxxx"
                            value={appPassword}
                            onChange={(e) => setAppPassword(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                        <p className="helper-text">
                            Please use an App Password (Settings → App Passwords), not your main password.
                        </p>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isLoading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
