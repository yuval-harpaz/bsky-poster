import { useState } from 'react'
import { Github } from 'lucide-react'
import { RichEditor, type ImageAttachment } from './components/RichEditor'
import { AuthDialog } from './components/AuthDialog'
import { processText } from './utils/text-processing'
import { detectFacets, UnicodeString } from './utils/bluesky-facets'
import { BskyAgent } from '@atproto/api'

function App() {
    const [text, setText] = useState('')
    const [image, setImage] = useState<ImageAttachment | null>(null)
    const [isAuthOpen, setIsAuthOpen] = useState(false)
    const [isPosting, setIsPosting] = useState(false)
    const [agent, setAgent] = useState<BskyAgent | null>(null)

    // Post preparation state
    const [pendingPost, setPendingPost] = useState(false)

    const handlePostRequest = () => {
        if (!text.trim() && !image) return

        if (!agent) {
            setIsAuthOpen(true)
            setPendingPost(true)
        } else {
            executePost(agent)
        }
    }

    const handleLogin = async (handle: string, appPassword: string) => {
        setIsPosting(true) // Re-use this loading state for login
        try {
            const cleanHandle = handle.trim().replace(/^@/, '')
            const newAgent = new BskyAgent({ service: 'https://bsky.social' })
            await newAgent.login({ identifier: cleanHandle, password: appPassword })
            setAgent(newAgent)
            setIsAuthOpen(false)

            if (pendingPost) {
                setPendingPost(false)
                await executePost(newAgent)
            }
        } catch (e) {
            console.error(e)
            alert('Login failed: ' + (e as Error).message)
        } finally {
            setIsPosting(false)
        }
    }

    const executePost = async (activeAgent: BskyAgent) => {
        setIsPosting(true)
        try {
            // 1. Process Markdown links
            const { text: cleanText, facets: manualFacets } = processText(text)

            // 2. Detect auto-facets (mentions, raw links) in the clean text
            const unicodeText = new UnicodeString(cleanText)
            const autoFacets = detectFacets(unicodeText) || []

            // 3. Merge facets
            // Filter overlaps: If an auto-facet overlaps with a manual facet, drop the auto-facet.
            const validAutoFacets = autoFacets.filter(af => {
                return !manualFacets.some(mf =>
                    (af.index.byteStart < mf.index.byteEnd && af.index.byteEnd > mf.index.byteStart)
                )
            })

            const finalFacets = [...manualFacets, ...validAutoFacets]

            const postRecord: any = {
                text: cleanText,
                facets: finalFacets,
                createdAt: new Date().toISOString()
            }

            // 4. Handle Image Upload
            if (image) {
                // Convert File to Blob (sometimes needed for uploadBlob depending on environment, but File usually works)
                // We'll trust the agent.uploadBlob accepts File directly in browser env.
                // But we need array buffer usually. 
                // Let's safe bet: read as ArrayBuffer
                const arrayBuffer = await image.file.arrayBuffer()
                const uint8Array = new Uint8Array(arrayBuffer)

                const uploaded = await activeAgent.uploadBlob(uint8Array, { encoding: image.file.type })

                postRecord.embed = {
                    $type: 'app.bsky.embed.images',
                    images: [{
                        alt: image.alt,
                        image: uploaded.data.blob
                    }]
                }
            }

            await activeAgent.post(postRecord)

            // Cleanup
            if (image) {
                URL.revokeObjectURL(image.preview)
            }
            setText('')
            setImage(null)
            alert('Posted successfully! (Check your profile)')
        } catch (e) {
            console.error(e)
            alert('Post failed: ' + (e as Error).message)
        } finally {
            setIsPosting(false)
        }
    }

    return (
        <div className="layout">
            <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{
                    fontSize: '3rem',
                    background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '0.5rem'
                }}>
                    Bluesky Poster
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Write richly, post seamlessly.</p>
            </header>

            <main>
                <RichEditor
                    value={text}
                    onChange={setText}
                    onPost={handlePostRequest}
                    isPosting={isPosting}
                    image={image}
                    onImageChange={setImage}
                />
            </main>

            <footer style={{
                marginTop: '2rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
                maxWidth: '640px',
                marginInline: 'auto'
            }}>
                <p style={{ margin: '0.5rem 0' }}>
                    Images should be jpg or png, less than 1MB and no longer than 1000 pixels.
                </p>
                <p style={{ margin: '0.5rem 0', textAlign: 'left' }}>
                    You will have to specify username and password for posting to your account.
                    This will not be kept, and will not be used for anything other than posting this once.
                </p>
                <div style={{ textAlign: 'left', marginTop: '0.5rem' }}>
                    <a
                        href="https://github.com/yuval-harpaz/bsky-poster/blob/main/README.md"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: 'inherit',
                            display: 'inline-flex',
                            alignItems: 'center',
                            textDecoration: 'none'
                        }}
                        title="View source on GitHub"
                    >
                        <Github size={20} />
                    </a>
                </div>
            </footer>

            <AuthDialog
                isOpen={isAuthOpen}
                onClose={() => { setIsAuthOpen(false); setPendingPost(false) }}
                onLogin={handleLogin}
                isLoading={isPosting}
            />
        </div>
    )
}

export default App
