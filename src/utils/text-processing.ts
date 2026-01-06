import { UnicodeString } from './bluesky-facets'
import { AppBskyRichtextFacet } from '@atproto/api'
import { applyUnicodeMarkdown } from './unicode-conversion'

type Facet = AppBskyRichtextFacet.Main

interface ProcessedText {
    text: string
    facets: Facet[]
}

export function processText(input: string): ProcessedText {
    const facets: Facet[] = []
    let resultText = ''
    let lastIndex = 0

    // Regex for [text](url)
    // We capture group 1: text, group 2: url
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g

    let match
    while ((match = regex.exec(input)) !== null) {
        // Append text before the match, applying unicode formatting
        const plainChunk = input.substring(lastIndex, match.index)
        resultText += applyUnicodeMarkdown(plainChunk)

        const rawLinkText = match[1]
        const url = match[2]
        
        // Also apply formatting to the link text itself (e.g. [**Bold**](url))
        const formattedLinkText = applyUnicodeMarkdown(rawLinkText)

        // Start of the link in the NEW results text
        const startCharIndex = resultText.length

        resultText += formattedLinkText

        const endCharIndex = resultText.length

        facets.push({
            index: {
                byteStart: startCharIndex, // Placeholder, will fix later
                byteEnd: endCharIndex,     // Placeholder
            },
            features: [{
                $type: 'app.bsky.richtext.facet#link',
                uri: url
            }]
        })

        lastIndex = regex.lastIndex
    }

    // Append remaining text
    const remaining = input.substring(lastIndex)
    resultText += applyUnicodeMarkdown(remaining)

    // Now convert all char indices to byte indices using the FINAL string
    const unicode = new UnicodeString(resultText)

    const finalFacets = facets.map(f => ({
        ...f,
        index: {
            byteStart: unicode.utf16IndexToUtf8Index(f.index.byteStart),
            byteEnd: unicode.utf16IndexToUtf8Index(f.index.byteEnd)
        }
    }))

    return {
        text: resultText,
        facets: finalFacets
    }
}
