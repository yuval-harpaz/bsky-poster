export function toBold(str: string): string {
    return str.split('').map(char => getBoldChar(char)).join('')
}

export function toItalic(str: string): string {
    return str.split('').map(char => getItalicChar(char)).join('')
}

function getBoldChar(c: string): string {
    const code = c.codePointAt(0)
    if (!code) return c
    
    // A-Z
    if (code >= 0x41 && code <= 0x5A) return String.fromCodePoint(code - 0x41 + 0x1D400)
    // a-z
    if (code >= 0x61 && code <= 0x7A) return String.fromCodePoint(code - 0x61 + 0x1D41A)
    // 0-9
    if (code >= 0x30 && code <= 0x39) return String.fromCodePoint(code - 0x30 + 0x1D7CE)
    
    return c
}

function getItalicChar(c: string): string {
    const code = c.codePointAt(0)
    if (!code) return c
    
    // A-Z
    if (code >= 0x41 && code <= 0x5A) return String.fromCodePoint(code - 0x41 + 0x1D434)
    // a-z
    if (code >= 0x61 && code <= 0x7A) return String.fromCodePoint(code - 0x61 + 0x1D44E)
    
    return c
}

/**
 * Replaces **text** with Bold Unicode and *text* with Italic Unicode.
 * Processes Bold first, then Italic.
 */
export function applyUnicodeMarkdown(text: string): string {
    // Bold: **...**
    let v = text.replace(/\*\*([^*\n]+)\*\*/g, (_, content) => toBold(content))
    
    // Italic: *...* (simple check, assume no nested ** inside * since we handled ** already)
    v = v.replace(/\*([^*\n]+)\*/g, (_, content) => toItalic(content))
    
    return v
}
