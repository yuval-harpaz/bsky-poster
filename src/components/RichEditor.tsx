import { useRef } from 'react'
import { Bold, Italic, Link as LinkIcon, AlertCircle, Image as ImageIcon, X, AlertTriangle } from 'lucide-react'

export interface ImageAttachment {
    file: File
    preview: string
    alt: string
}

interface RichEditorProps {
    value: string
    onChange: (value: string) => void
    onPost: () => void
    isPosting: boolean
    image: ImageAttachment | null
    onImageChange: (image: ImageAttachment | null) => void
}

export const RichEditor = ({ value, onChange, onPost, isPosting, image, onImageChange }: RichEditorProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Track cursor for toolbar button insertion
    const insertText = (before: string, after: string = '') => {
        const textarea = textareaRef.current
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = textarea.value
        const selectedText = text.substring(start, end)

        const newText = text.substring(0, start) + before + selectedText + after + text.substring(end)

        onChange(newText)

        // Restore focus and cursor (need timeout for React render)
        setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
        }, 0)
    }

    const handleLink = () => {
        const url = prompt('Enter URL:')
        if (url) {
            insertText('[', `](${url})`)
        }
    }

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate size (<1MB)
        if (file.size > 1024 * 1024) {
            alert('Image must be smaller than 1MB')
            return
        }

        // Validate type
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            alert('Only JPG and PNG images are allowed')
            return
        }

        // Validate dimensions
        const img = new Image()
        const objectUrl = URL.createObjectURL(file)

        img.onload = () => {
            if (img.width > 1000 || img.height > 1000) {
                alert('Image dimensions must be 1000x1000 pixels or smaller')
                URL.revokeObjectURL(objectUrl)
                return
            }

            onImageChange({
                file,
                preview: objectUrl,
                alt: ''
            })
        }

        img.onerror = () => {
            alert('Failed to load image')
            URL.revokeObjectURL(objectUrl)
        }

        img.src = objectUrl

        // Reset input so same file can be selected again if needed (triggered by user removing and re-adding)
        e.target.value = ''
    }

    const handleRemoveImage = () => {
        if (image) {
            URL.revokeObjectURL(image.preview)
            onImageChange(null)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault()
            handleLink()
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault()
            insertText('**', '**')
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault()
            insertText('*', '*')
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault()
            onPost()
        }
    }

    return (
        <div className="rich-editor-container">
            <div className="editor-toolbar">
                <ToolbarButton icon={<Bold size={18} />} onClick={() => insertText('**', '**')} label="Bold (Cmd+B)" />
                <ToolbarButton icon={<Italic size={18} />} onClick={() => insertText('*', '*')} label="Italic (Cmd+I)" />
                <div className="separator" />
                <ToolbarButton icon={<LinkIcon size={18} />} onClick={handleLink} label="Link (Cmd+K)" />
                <div className="separator" />
                <ToolbarButton icon={<ImageIcon size={18} />} onClick={() => fileInputRef.current?.click()} label="Add Image" />
                <div className="spacer" />
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/jpeg,image/png"
                style={{ display: 'none' }}
            />

            <div className="editor-area">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="What's up? (Use Markdown for formatting, Ctrl+K for links)"
                    className="editor-textarea"
                    spellCheck={false}
                />
            </div>

            {image && (
                <div className="image-preview-area">
                    <div className="image-preview-container">
                        <img src={image.preview} alt="Preview" className="image-preview" />
                        <button onClick={handleRemoveImage} className="remove-image-btn" title="Remove image">
                            <X size={16} />
                        </button>
                    </div>
                    <input
                        type="text"
                        placeholder="Add alt text (optional)"
                        value={image.alt}
                        onChange={(e) => onImageChange({ ...image, alt: e.target.value })}
                        className="alt-text-input"
                    />
                </div>
            )}

            <div className="editor-footer">
                <div className="footer-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="markdown-badge">
                        <AlertCircle size={12} /> Markdown supported
                    </div>
                </div>

                <div className="footer-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                        className="char-count"
                        style={{
                            fontSize: '0.85rem',
                            color: value.length > 300 ? '#ef4444' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}
                    >
                        {value.length > 300 && <AlertTriangle size={14} />}
                        {value.length}/300
                    </div>
                    <button
                        onClick={onPost}
                        disabled={isPosting || (!value.trim() && !image) || value.length > 300}
                        className="btn btn-primary"
                    >
                        {isPosting ? 'Posting...' : 'Post'}
                    </button>
                </div>
            </div>
        </div>
    )
}

const ToolbarButton = ({ icon, onClick, label }: { icon: React.ReactNode, onClick: () => void, label: string }) => (
    <button
        onClick={onClick}
        title={label}
        className="toolbar-btn"
    >
        {icon}
    </button>
)
