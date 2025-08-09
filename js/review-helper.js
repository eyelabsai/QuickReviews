/**
 * Google Reviews Helper with Auto-5-Star Selection
 * 
 * This file contains functions to help generate and handle Google Reviews links
 * that can pre-select 5 stars for better user experience.
 */

/**
 * Generate a Google Reviews link with 5-star pre-selection
 * @param {string} placeId - Google Place ID (preferred)
 * @param {string} businessName - Business name
 * @param {string} address - Business address
 * @returns {string} Google Reviews URL with 5-star pre-selection
 */
function generateGoogleReviewsLink(placeId = null, businessName = null, address = null) {
    const baseUrl = 'https://search.google.com/local/writereview';
    const params = new URLSearchParams();
    
    if (placeId) {
        // Method 1: Using Place ID (most reliable)
        params.append('placeid', placeId);
        params.append('rating', '5');
    } else if (businessName && address) {
        // Method 2: Using business name and address
        const searchQuery = `${businessName} ${address}`;
        params.append('q', searchQuery);
        params.append('rating', '5');
    } else {
        // Method 3: Generic approach
        params.append('rating', '5');
    }
    
    // Add parameters to streamline the experience
    params.append('hl', 'en'); // Set language to English
    params.append('gl', 'US'); // Set country to US
    
    return `${baseUrl}?${params.toString()}`;
}

/**
 * Extract Place ID from existing Google URL
 * @param {string} url - Existing Google URL
 * @returns {string|null} Place ID if found
 */
function extractPlaceIdFromUrl(url) {
    const patterns = [
        /place_id=([^&]+)/,
        /0x[0-9a-f]+:0x[0-9a-f]+/,
        /ChI[^/]+/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1] || match[0];
        }
    }
    
    return null;
}

/**
 * Create a review link with 5-star pre-selection from existing URL
 * @param {string} existingUrl - Existing Google Reviews URL
 * @param {string} businessName - Business name (fallback)
 * @param {string} address - Business address (fallback)
 * @returns {string} New Google Reviews URL with 5-star pre-selection
 */
function createReviewLinkWith5Stars(existingUrl = null, businessName = null, address = null) {
    if (existingUrl) {
        const placeId = extractPlaceIdFromUrl(existingUrl);
        if (placeId) {
            return generateGoogleReviewsLink(placeId);
        }
    }
    
    if (businessName && address) {
        return generateGoogleReviewsLink(null, businessName, address);
    }
    
    return generateGoogleReviewsLink();
}

/**
 * Convert any Google Reviews link to include 5-star pre-selection
 * @param {string} reviewLink - Original review link
 * @returns {string} Review link with 5-star pre-selection
 */
function add5StarToReviewLink(reviewLink) {
    if (!reviewLink) return reviewLink;
    
    // If it already has a rating parameter, update it to 5
    if (reviewLink.includes('rating=')) {
        return reviewLink.replace(/rating=\d+/, 'rating=5');
    }
    
    // If it's a Google Reviews URL, add rating parameter
    if (reviewLink.includes('search.google.com/local/writereview')) {
        const separator = reviewLink.includes('?') ? '&' : '?';
        return `${reviewLink}${separator}rating=5`;
    }
    
    // For other URLs, try to convert to Google Reviews format
    return createReviewLinkWith5Stars(reviewLink);
}

/**
 * Create a review button component with 5-star pre-selection
 * @param {string} reviewLink - Provider's review link
 * @param {string} businessName - Business name
 * @param {string} address - Business address
 * @returns {HTMLElement} Review button element
 */
function createReviewButton(reviewLink, businessName = null, address = null) {
    const button = document.createElement('button');
    button.className = 'btn btn-primary review-btn';
    button.innerHTML = '⭐ Leave a 5-Star Review';
    button.style.cssText = `
        background: linear-gradient(135deg, #1e3a8a, #1e40af);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 12px 24px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
    `;
    
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 6px 16px rgba(30, 58, 138, 0.4)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 4px 12px rgba(30, 58, 138, 0.3)';
    });
    
    button.addEventListener('click', () => {
        const fiveStarLink = add5StarToReviewLink(reviewLink);
        window.open(fiveStarLink, '_blank', 'noopener,noreferrer');
    });
    
    return button;
}

/**
 * Initialize review functionality for a patient app
 * @param {string} providerEmail - Provider's email to load review link
 * @param {string} containerId - Container ID to add review button
 * @param {string} businessName - Business name (optional)
 * @param {string} address - Business address (optional)
 */
async function initializeReviewSystem(providerEmail, containerId, businessName = null, address = null) {
    try {
        // Load provider's review link from Firestore
        const qs = await db.collection("users").where("email", "==", providerEmail).limit(1).get();
        
        if (!qs.empty) {
            const data = qs.docs[0].data();
            const reviewLink = data.reviewLink;
            
            if (reviewLink) {
                const container = document.getElementById(containerId);
                if (container) {
                    const reviewButton = createReviewButton(
                        reviewLink, 
                        businessName || data.practiceName || data.fullName, 
                        address
                    );
                    container.appendChild(reviewButton);
                }
            } else {
                console.warn('No review link found for provider:', providerEmail);
            }
        } else {
            console.warn('Provider not found:', providerEmail);
        }
    } catch (error) {
        console.error('Error initializing review system:', error);
    }
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateGoogleReviewsLink,
        extractPlaceIdFromUrl,
        createReviewLinkWith5Stars,
        add5StarToReviewLink,
        createReviewButton,
        initializeReviewSystem
    };
}
