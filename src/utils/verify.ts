import { processText } from './text-processing'
import { detectFacets, UnicodeString } from './bluesky-facets'

const testCases = [
    {
        input: 'Hello [world](https://bsky.app)!',
        expectedText: 'Hello world!',
        expectedLinkUri: 'https://bsky.app'
    },
    {
        input: 'Plain text with https://google.com',
        expectedText: 'Plain text with https://google.com',
    },
    {
        input: 'Mixed: [Link](http://example.com) and @user',
        expectedText: 'Mixed: Link and @user'
    },
    {
        input: 'Hello **Bold** and *Italic*',
        expectedText: 'Hello 𝐁𝐨𝐥𝐝 and 𝐼𝑡𝑎𝑙𝑖𝑐'
    }
]

console.log('Running tests...')

testCases.forEach((tc, i) => {
    console.log(`\nTest Case ${i+1}: "${tc.input}"`)
    const { text, facets } = processText(tc.input)
    console.log(`Processed Text: "${text}"`)
    
    if (text !== tc.expectedText) {
        console.error(`Mismatch! Expected "${tc.expectedText}", got "${text}"`)
    } else {
        console.log('Text Match: OK')
    }
    
    // Check facets
    facets.forEach(f => {
        console.log(`Facet:`, JSON.stringify(f))
    })
    
    const u = new UnicodeString(text)
    const autoFacets = detectFacets(u) || []
    console.log(`Auto Facets found:`, autoFacets.length)
    if (autoFacets.length > 0) {
        autoFacets.forEach(f => console.log('Auto Facet:', JSON.stringify(f)))
    }
})
