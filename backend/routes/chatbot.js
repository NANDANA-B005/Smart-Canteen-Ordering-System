const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Custom Levenshtein Distance for fuzzy matching without external npm payload
function levenshtein(a, b) {
    if (!a || !b) return (a || b || '').length;
    const matrix = Array.from({length: b.length + 1}, (_, i) => [i]);
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // insertion
                    Math.min(matrix[i][j - 1] + 1, // deletion
                    matrix[i - 1][j] + 1) // substitution
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

// Helper to extract budget context
const extractBudget = (text) => {
    const match = text.match(/under\s*(\d+)/i) || text.match(/max\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
};

// Advanced AI Engine Endpoint
router.post('/ask', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });

        const lowerMsg = message.toLowerCase().trim();
        
        // Fetch LIVE Data to ensure we capture all products and their newly added tags
        const allProducts = await Product.find({ status: 'Available', quantity: { $gt: 0 } });
        
        // -------------------------------------------------------------
        // Step 1: Normalization Layer & Synonym Mapping
        // -------------------------------------------------------------
        const intentSynonyms = {
            'kids': ['kid', 'child', 'children', 'baby', 'son', 'daughter', 'family'],
            'farewell': ['bye', 'goodbye', 'byee', 'byr', 'cya', 'see', 'later'],
            'greeting': ['hi', 'hello', 'helo', 'hey', 'greetings', 'morning', 'afternoon'],
            'juice': ['juice'],
            'tea': ['tea', 'chai'],
            'coffee': ['coffee', 'coffe', 'cofee'],
            'drink': ['drink', 'beverage', 'liquid'],
            'biryani': ['biryani', 'biriyani', 'briyani'],
            'snack': ['snack', 'snacks', 'snak'],
            'meal': ['meal', 'lunch', 'dinner', 'breakfast', 'thali']
        };

        // Extract live tags and categories from the database dynamically safely
        let liveTags = new Set();
        let liveCategories = new Set();
        allProducts.forEach(p => {
            if (p.tags) {
                p.tags.forEach(t => liveTags.add(t.toLowerCase().trim()));
            }
            if (p.counter) {
                liveCategories.add(p.counter.toLowerCase().trim());
            }
        });
        
        const possibleTags = Array.from(liveTags);
        const dynamicCategories = Array.from(liveCategories);

        // Tokenize user message into words
        const words = lowerMsg.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 0);
        
        // Dynamic fuzzy match helper
        const isFuzzyMatch = (w1, w2) => {
            const dist = levenshtein(w1, w2);
            const tolerance = Math.min(2, Math.floor(Math.max(w1.length, w2.length) / 3)); 
            return dist <= tolerance;
        };

        // Normalize user words mapping synonyms -> standard base concepts using fuzzy match
        let normalizedWords = new Set();
        words.forEach(word => {
            let mapped = false;
            // 1. Check strict synonym dictionaries
            for (const [baseConcept, synList] of Object.entries(intentSynonyms)) {
                if (isFuzzyMatch(word, baseConcept) || synList.some(syn => isFuzzyMatch(word, syn))) {
                    normalizedWords.add(baseConcept);
                    mapped = true;
                    break;
                }
            }
            if (!mapped) {
                // 2. Check dynamic live tags from database
                let matchedTag = possibleTags.find(tag => isFuzzyMatch(word, tag));
                if (matchedTag) {
                    normalizedWords.add(matchedTag);
                    mapped = true;
                }
            }
            // 3. Fallback: keep original token
            if (!mapped) normalizedWords.add(word); 
        });
        
        const normArray = Array.from(normalizedWords);
        const hasIntent = (intent) => normArray.includes(intent);
        const budget = extractBudget(lowerMsg);

        // -------------------------------------------------------------
        // Priority 1: Greeting & Farewell Classification
        // -------------------------------------------------------------
        if (hasIntent('farewell')) {
            return res.json({ reply: "Bye! Have a great day.", recommendations: [] });
        }
        if (hasIntent('greeting')) {
            return res.json({ reply: "Hello! What can I recommend for you today?", recommendations: [] });
        }

        // -------------------------------------------------------------
        // Priority 2: Exact Item Match & Availability Query
        // -------------------------------------------------------------
        const isAvailabilityQuery = lowerMsg.includes('do you have') || lowerMsg.includes('is there') || lowerMsg.includes('is available');
        const potentialItemStr = lowerMsg.replace(/before|do you have|is there|is available|\?+/g, '').trim();

        // Exact match
        let exactMatch = allProducts.find(p => p.name.toLowerCase() === potentialItemStr || lowerMsg.includes(p.name.toLowerCase()));
        
        if (exactMatch) {
            if (!budget || exactMatch.price <= budget) {
                const reply = isAvailabilityQuery 
                    ? `Yes, ${exactMatch.name} is available for ₹${exactMatch.price}!`
                    : `Yes, we have ${exactMatch.name} for ₹${exactMatch.price}!`;
                return res.json({ reply, recommendations: [exactMatch] });
            }
        }

        // Intercept: Exact match on sold out items
        const soldOutProducts = await Product.find({ $or: [{status: 'Sold Out'}, {quantity: 0}] });
        let soldOutExact = soldOutProducts.find(p => p.name.toLowerCase() === potentialItemStr || lowerMsg.includes(p.name.toLowerCase()));
        if (soldOutExact) {
            return res.json({ reply: `No, ${soldOutExact.name} is currently not available.`, recommendations: [] });
        }

        // -------------------------------------------------------------
        // Priority 3: Fuzzy Item Match
        // -------------------------------------------------------------
        let bestMatch = null;
        let bestDist = Infinity;
        
        const coreCategories = ['juice', 'tea', 'coffee', 'drink', 'snack', 'meal', 'kids'];
        const requestedModifiers = normArray.filter(nw => possibleTags.includes(nw) && !coreCategories.includes(nw));
        const skipFuzzy = [...coreCategories, ...possibleTags, 'meals', 'snacks', 'drinks', 'juices'];
        
        const significantWords = words.filter(w => w.length >= 4 && !skipFuzzy.includes(w)); 
        
        for (let product of allProducts) {
            const prodWords = product.name.toLowerCase().split(/\s+/);
            for (let pw of prodWords) {
                for (let w of significantWords) {
                    const dist = levenshtein(pw, w);
                    if (dist <= 2 && dist <= bestDist) {
                        bestMatch = product;
                        bestDist = dist;
                    }
                }
            }
        }

        if (bestMatch && bestDist <= 2) {
             if (!budget || bestMatch.price <= budget) {
                return res.json({
                    reply: `Did you mean ${bestMatch.name}? Yes, we have it for ₹${bestMatch.price}!`,
                    recommendations: [bestMatch]
                });
             }
        }

        // -------------------------------------------------------------
        // Priority 4 & 5: Strict Semantic Category & Tag Match
        // -------------------------------------------------------------
        let availableOptions = budget ? allProducts.filter(p => p.price <= budget) : allProducts;
        
        let filteredOptions = availableOptions;
        
        // 1. Strict Modifier Filter (e.g. "sweet")
        if (requestedModifiers.length > 0) {
            filteredOptions = filteredOptions.filter(p => {
                let tags = (p.tags || []).map(t => t.toLowerCase().trim());
                let name = p.name.toLowerCase();
                // MUST contain ALL requested modifiers
                return requestedModifiers.every(modifier => tags.includes(modifier) || name.includes(modifier));
            });
            
            if (filteredOptions.length === 0) {
                return res.json({ 
                    reply: `Sorry, we don't have ${requestedModifiers.join(' and ')} items available right now.`,
                    recommendations: []
                });
            }
        }

        // 2. Strict Category Filter (e.g. "meal", "drink")
        const requestedCategories = coreCategories.filter(cat => normArray.includes(cat));
        if (requestedCategories.length > 0) {
            filteredOptions = filteredOptions.filter(p => {
                let tags = (p.tags || []).map(t => t.toLowerCase().trim());
                let counter = (p.counter || "").toLowerCase().trim();
                
                // Must belong to at least one of the requested categories
                return requestedCategories.some(cat => {
                    if (cat === 'juice') return tags.includes('juice');
                    if (cat === 'tea') return tags.includes('tea') || tags.includes('chai') || counter === 'tea';
                    if (cat === 'coffee') return tags.includes('coffee') || counter === 'tea';
                    if (cat === 'drink') return tags.includes('drink') || tags.includes('juice') || tags.includes('tea') || counter === 'tea';
                    if (cat === 'snack') return tags.includes('snack') || counter === 'snacks';
                    if (cat === 'meal') return tags.includes('meal') || counter === 'meals';
                    if (cat === 'kids') return tags.includes('kids');
                    return false;
                });
            });

            if (filteredOptions.length === 0) {
                let tagStr = requestedModifiers.length > 0 ? requestedModifiers.join(' ') + ' ' : '';
                return res.json({ 
                    reply: `Sorry, we couldn't find any ${tagStr}${requestedCategories.join(' and ')} right now.`,
                    recommendations: []
                });
            }
        }

        // Semantic tag scoring loop for sorting relevance
        let scoredItems = filteredOptions.map(p => {
            let score = 0;
            let itemTags = (p.tags || []).map(t => t.toLowerCase().trim());
            
            normArray.forEach(nw => {
                if (itemTags.includes(nw)) score += 2; 
                if (p.name.toLowerCase().includes(nw)) score += 1; 
            });
            return { product: p, score };
        }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);

        // If items passed strict filters but scored 0 natively here, keep them with a base score
        // Only do this if a strict filter was actually requested!
        const wasStrictlyFiltered = requestedModifiers.length > 0 || requestedCategories.length > 0;
        
        if (wasStrictlyFiltered) {
            if (scoredItems.length === 0 && filteredOptions.length > 0) {
                 scoredItems = filteredOptions.map(p => ({ product: p, score: 1 }));
            } else if (filteredOptions.length > 0) {
                 // Add unscored but valid filtered items to the end
                 let scoredIds = scoredItems.map(i => i.product._id.toString());
                 filteredOptions.forEach(p => {
                     if (!scoredIds.includes(p._id.toString())) {
                         scoredItems.push({ product: p, score: 1 });
                     }
                 });
            }
        }

        // Combo logic accuracy fix
        const wantsJuice = hasIntent('juice');
        const wantsTea = hasIntent('tea');
        const wantsCoffee = hasIntent('coffee');
        const wantsGenericDrink = hasIntent('drink');
        const wantsAnyDrink = wantsJuice || wantsTea || wantsCoffee || wantsGenericDrink;
        
        const wantsSnack = hasIntent('snack');
        const wantsMeal = hasIntent('meal');

        const contextParts = [];
        if (requestedModifiers.length > 0) contextParts.push(...requestedModifiers);
        const contextStr = contextParts.length > 0 ? contextParts.join(' ') + ' ' : '';

        if ((wantsAnyDrink && wantsSnack) || (wantsMeal && wantsAnyDrink)) {
            const getBest = (category) => {
                return scoredItems.find(item => {
                    let tags = item.product.tags.map(t=>t.toLowerCase().trim());
                    let counter = item.product.counter.toLowerCase().trim();
                    if (category === 'juice') return tags.includes('juice');
                    if (category === 'tea') return tags.includes('tea') || tags.includes('chai') || counter === 'tea';
                    if (category === 'coffee') return tags.includes('coffee') || counter === 'tea';
                    if (category === 'drink') return tags.includes('drink') || tags.includes('juice') || tags.includes('tea') || counter === 'tea';
                    if (category === 'snack') return tags.includes('snack') || counter === 'snacks';
                    if (category === 'meal') return tags.includes('meal') || counter === 'meals';
                    return false;
                });
            };
            
            let requestedDrinkCat = wantsJuice ? 'juice' : wantsTea ? 'tea' : wantsCoffee ? 'coffee' : 'drink';
            let d = getBest(requestedDrinkCat)?.product;
            let s = wantsSnack ? getBest('snack')?.product : null;
            let m = wantsMeal ? getBest('meal')?.product : null;

            if (wantsAnyDrink && wantsSnack) {
                if (d && s) return res.json({ reply: `Here is a perfect ${contextStr}${requestedDrinkCat} and snack combo!`, recommendations: [d, s] });
                if (!d && s) return res.json({ reply: `We have ${contextStr}snacks, but unfortunately no matching ${requestedDrinkCat} right now.`, recommendations: [s] });
                if (d && !s) return res.json({ reply: `We have ${contextStr}${requestedDrinkCat}, but no matching snacks available.`, recommendations: [d] });
            }
            if (m && wantsAnyDrink) {
                if (m && d) return res.json({ reply: `Here is a great ${contextStr}meal and ${requestedDrinkCat} combo!`, recommendations: [m, d] });
                if (m && !d) return res.json({ reply: `We have ${contextStr}meals, but are currently out of matching ${requestedDrinkCat}.`, recommendations: [m] });
                if (!m && d) return res.json({ reply: `We have ${contextStr}${requestedDrinkCat}, but no matching meals available right now.`, recommendations: [d] });
            }
        }

        // Return Top Strictly Filtered matches natively 
        if (scoredItems.length > 0) {
            let recommended = scoredItems.slice(0, 4).map(i => i.product);
            
            let extractedTags = normArray.filter(nw => possibleTags.includes(nw) || coreCategories.includes(nw));
            let context = extractedTags.length > 0 ? extractedTags.join(' and ') : 'these';
            let replyText = `Here are some ${context} options${budget ? ` under ₹${budget}` : ''}!`;
            replyText = replyText.charAt(0).toUpperCase() + replyText.slice(1);

            return res.json({ reply: replyText, recommendations: recommended });
        }

        // -------------------------------------------------------------
        // Priority 7: Clarification Fallback (Dynamic)
        // -------------------------------------------------------------
        let catText = dynamicCategories.length > 0 
            ? dynamicCategories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ') 
            : 'snacks, drinks, or meals';
        
        return res.json({ 
            reply: `I didn't quite get that. Did you want ${catText}? Feel free to search by item or tags!`,
            recommendations: []
        });

    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ error: 'AI processing failed' });
    }
});

module.exports = router;
