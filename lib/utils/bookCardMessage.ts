/**
 * Book Card Message Format
 * 
 * Messages can contain embedded book cards using a special prefix format:
 * [BOOK_CARD:{bookId}:{title}:{author}:{imageUrl}]
 * 
 * The ChatBubble component parses this and renders a rich book card
 * instead of plain text.
 */

const BOOK_CARD_PREFIX = "[BOOK_CARD:";
const BOOK_CARD_SUFFIX = "]";

export interface BookCardData {
    bookId: string;
    title: string;
    author: string;
    imageUrl: string;
}

/**
 * Encode book information into a special message format.
 * The message will contain the book card data followed by an optional text message.
 */
export function encodeBookCardMessage(book: BookCardData, additionalMessage?: string): string {
    // Use a pipe separator for fields within the card data
    const cardData = `${BOOK_CARD_PREFIX}${book.bookId}|${book.title}|${book.author}|${book.imageUrl}${BOOK_CARD_SUFFIX}`;

    if (additionalMessage?.trim()) {
        return `${cardData}\n${additionalMessage.trim()}`;
    }

    return `${cardData}\n¡Hola! Me interesa este libro, ¿está disponible para intercambio?`;
}

/**
 * Parse a message to check if it contains a book card.
 * Returns the book card data and any remaining text message.
 */
export function parseBookCardMessage(content: string): {
    hasBookCard: boolean;
    bookCard: BookCardData | null;
    textMessage: string;
} {
    if (!content.startsWith(BOOK_CARD_PREFIX)) {
        return { hasBookCard: false, bookCard: null, textMessage: content };
    }

    const suffixIdx = content.indexOf(BOOK_CARD_SUFFIX);
    if (suffixIdx === -1) {
        return { hasBookCard: false, bookCard: null, textMessage: content };
    }

    const cardContent = content.substring(BOOK_CARD_PREFIX.length, suffixIdx);
    const parts = cardContent.split("|");

    if (parts.length < 4) {
        return { hasBookCard: false, bookCard: null, textMessage: content };
    }

    const [bookId, title, author, ...imageUrlParts] = parts;
    const imageUrl = imageUrlParts.join("|"); // In case imageUrl contains |

    const remainingText = content.substring(suffixIdx + BOOK_CARD_SUFFIX.length).trim();

    return {
        hasBookCard: true,
        bookCard: { bookId, title, author, imageUrl },
        textMessage: remainingText,
    };
}
