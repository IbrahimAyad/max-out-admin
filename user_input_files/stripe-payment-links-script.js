// Script to Create Stripe Payment Links for All Products
// Run this with Node.js after installing stripe package: npm install stripe

const stripe = require('stripe')('sk_live_YOUR_SECRET_KEY_HERE'); // Replace with your secret key

// All your products and their prices
const products = {
  // SUITS (14 products x 2 prices each)
  suits: [
    {
      name: 'Navy Suit',
      prices: {
        twoPiece: { id: 'price_1Rpv2tCHc12x7sCzVvLRto3m', name: 'Navy Suit - 2 Piece' },
        threePiece: { id: 'price_1Rpv31CHc12x7sCzlFtlUflr', name: 'Navy Suit - 3 Piece' }
      }
    },
    {
      name: 'Beige Suit',
      prices: {
        twoPiece: { id: 'price_1Rpv3FCHc12x7sCzg9nHaXkM', name: 'Beige Suit - 2 Piece' },
        threePiece: { id: 'price_1Rpv3QCHc12x7sCzMVTfaqEE', name: 'Beige Suit - 3 Piece' }
      }
    },
    {
      name: 'Black Suit',
      prices: {
        twoPiece: { id: 'price_1Rpv3cCHc12x7sCzLtiatn73', name: 'Black Suit - 2 Piece' },
        threePiece: { id: 'price_1Rpv3iCHc12x7sCzJYg14SL8', name: 'Black Suit - 3 Piece' }
      }
    },
    {
      name: 'Brown Suit',
      prices: {
        twoPiece: { id: 'price_1Rpv3zCHc12x7sCzKMSpA4hP', name: 'Brown Suit - 2 Piece' },
        threePiece: { id: 'price_1Rpv4ECHc12x7sCzhUuL9uCE', name: 'Brown Suit - 3 Piece' }
      }
    },
    {
      name: 'Burgundy Suit',
      prices: {
        twoPiece: { id: 'price_1Rpv4XCHc12x7sCzSC3Mbtey', name: 'Burgundy Suit - 2 Piece' },
        threePiece: { id: 'price_1Rpv4eCHc12x7sCzwbuknObE', name: 'Burgundy Suit - 3 Piece' }
      }
    },
    {
      name: 'Charcoal Grey Suit',
      prices: {
        twoPiece: { id: 'price_1Rpv4sCHc12x7sCzgMUu7hLq', name: 'Charcoal Grey Suit - 2 Piece' },
        threePiece: { id: 'price_1Rpv4zCHc12x7sCzerWp2R07', name: 'Charcoal Grey Suit - 3 Piece' }
      }
    },
    {
      name: 'Dark Brown Suit',
      prices: {
        twoPiece: { id: 'price_1Rpv5DCHc12x7sCzdWjcaCY4', name: 'Dark Brown Suit - 2 Piece' },
        threePiece: { id: 'price_1Rpv5JCHc12x7sCzPd619lQ8', name: 'Dark Brown Suit - 3 Piece' }
      }
    },
    {
      name: 'Emerald Suit',
      prices: {
        twoPiece: { id: 'price_1Rpv5XCHc12x7sCzzP57OQvP', name: 'Emerald Suit - 2 Piece' },
        threePiece: { id: 'price_1Rpv5eCHc12x7sCzIAVMbB7m', name: 'Emerald Suit - 3 Piece' }
      }
    },
    {
      name: 'Hunter Green Suit',
      prices: {
        twoPiece: { id: 'price_1Rpv5vCHc12x7sCzAlFuGQNL', name: 'Hunter Green Suit - 2 Piece' },
        threePiece: { id: 'price_1Rpv61CHc12x7sCzIboI1eC8', name: 'Hunter Green Suit - 3 Piece' }
      }
    },
    {
      name: 'Indigo Suit',
      prices: {
        twoPiece: { id: 'price_1Rpv6ECHc12x7sCz7JjWOP0p', name: 'Indigo Suit - 2 Piece' },
        threePiece: { id: 'price_1Rpv6KCHc12x7sCzzaFWFxef', name: 'Indigo Suit - 3 Piece' }
      }
    },
    {
      name: 'Light Grey Suit',
      prices: {
        twoPiece: { id: 'price_1Rpv6WCHc12x7sCzDJI7Ypav', name: 'Light Grey Suit - 2 Piece' },
        threePiece: { id: 'price_1Rpv6dCHc12x7sCz3JOmrvuA', name: 'Light Grey Suit - 3 Piece' }
      }
    },
    {
      name: 'Midnight Blue Suit',
      prices: {
        twoPiece: { id: 'price_1Rpv6sCHc12x7sCz6OZIkTR2', name: 'Midnight Blue Suit - 2 Piece' },
        threePiece: { id: 'price_1Rpv6yCHc12x7sCz1LFaN5gS', name: 'Midnight Blue Suit - 3 Piece' }
      }
    },
    {
      name: 'Sand Suit',
      prices: {
        twoPiece: { id: 'price_1Rpv7GCHc12x7sCzV9qUCc7I', name: 'Sand Suit - 2 Piece' },
        threePiece: { id: 'price_1Rpv7PCHc12x7sCzbXQ9a1MG', name: 'Sand Suit - 3 Piece' }
      }
    },
    {
      name: 'Tan Suit',
      prices: {
        twoPiece: { id: 'price_1Rpv7dCHc12x7sCzoWrXk2Ot', name: 'Tan Suit - 2 Piece' },
        threePiece: { id: 'price_1Rpv7mCHc12x7sCzixeUm5ep', name: 'Tan Suit - 3 Piece' }
      }
    }
  ],

  // TIES (4 products)
  ties: [
    { priceId: 'price_1RpvHlCHc12x7sCzp0TVNS92', name: 'Ultra Skinny Tie (2.25")' },
    { priceId: 'price_1RpvHyCHc12x7sCzjX1WV931', name: 'Skinny Tie (2.75")' },
    { priceId: 'price_1RpvI9CHc12x7sCzE8Q9emhw', name: 'Classic Width Tie (3.25")' },
    { priceId: 'price_1RpvIMCHc12x7sCzj6ZTx21q', name: 'Pre-tied Bow Tie' }
  ],

  // TIE BUNDLES (3 products)
  tieBundles: [
    { priceId: 'price_1RpvQqCHc12x7sCzfRrWStZb', name: '5-Tie Bundle (Buy 4 Get 1 Free)' },
    { priceId: 'price_1RpvRACHc12x7sCzVYFZh6Ia', name: '8-Tie Bundle (Buy 6 Get 2 Free)' },
    { priceId: 'price_1RpvRSCHc12x7sCzpo0fgH6A', name: '11-Tie Bundle (Buy 8 Get 3 Free)' }
  ],

  // DRESS SHIRTS (2 products)
  shirts: [
    { priceId: 'price_1RpvWnCHc12x7sCzzioA64qD', name: 'Slim Cut Dress Shirt' },
    { priceId: 'price_1RpvXACHc12x7sCz2Ngkmp64', name: 'Classic Fit Dress Shirt' }
  ],

  // OUTFIT BUNDLES (4 products)
  outfitBundles: [
    { priceId: 'price_1RpvZUCHc12x7sCzM4sp9DY5', name: 'Starter Bundle - Suit + Shirt + Tie' },
    { priceId: 'price_1RpvZtCHc12x7sCzny7VmEWD', name: 'Professional Bundle - Suit + Shirt + Tie' },
    { priceId: 'price_1RpvaBCHc12x7sCzRV6Hy0Im', name: 'Executive Bundle - Suit + Shirt + Tie' },
    { priceId: 'price_1RpvfvCHc12x7sCzq1jYfG9o', name: 'Premium Bundle - Suit + Shirt + Tie' }
  ]
};

// Function to create a payment link
async function createPaymentLink(priceId, productName) {
  try {
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      // Custom fields for suits and shirts
      custom_fields: productName.toLowerCase().includes('suit') || productName.toLowerCase().includes('shirt') ? [
        {
          key: 'size',
          label: {
            type: 'custom',
            custom: 'Size'
          },
          type: 'dropdown',
          dropdown: {
            options: productName.toLowerCase().includes('suit') ? [
              // Size 34
              { label: '34S', value: '34S' },
              { label: '34R', value: '34R' },
              // Size 36
              { label: '36S', value: '36S' },
              { label: '36R', value: '36R' },
              // Size 38
              { label: '38S', value: '38S' },
              { label: '38R', value: '38R' },
              { label: '38L', value: '38L' },
              // Size 40
              { label: '40S', value: '40S' },
              { label: '40R', value: '40R' },
              { label: '40L', value: '40L' },
              // Size 42
              { label: '42S', value: '42S' },
              { label: '42R', value: '42R' },
              { label: '42L', value: '42L' },
              // Size 44
              { label: '44S', value: '44S' },
              { label: '44R', value: '44R' },
              { label: '44L', value: '44L' },
              // Size 46
              { label: '46S', value: '46S' },
              { label: '46R', value: '46R' },
              { label: '46L', value: '46L' },
              // Size 48
              { label: '48S', value: '48S' },
              { label: '48R', value: '48R' },
              { label: '48L', value: '48L' },
              // Size 50
              { label: '50S', value: '50S' },
              { label: '50R', value: '50R' },
              { label: '50L', value: '50L' },
              // Size 52
              { label: '52R', value: '52R' },
              { label: '52L', value: '52L' },
              // Size 54
              { label: '54R', value: '54R' },
              { label: '54L', value: '54L' }
            ] : [
              { label: '14.5', value: '14.5' },
              { label: '15', value: '15' },
              { label: '15.5', value: '15.5' },
              { label: '16', value: '16' },
              { label: '16.5', value: '16.5' },
              { label: '17', value: '17' },
              { label: '17.5', value: '17.5' },
              { label: '18', value: '18' }
            ]
          }
        }
      ] : productName.toLowerCase().includes('tie') && !productName.toLowerCase().includes('bundle') ? [
        {
          key: 'color',
          label: {
            type: 'custom',
            custom: 'Color'
          },
          type: 'text'
        }
      ] : productName.toLowerCase().includes('bundle') && productName.toLowerCase().includes('tie') && !productName.toLowerCase().includes('suit') ? [
        {
          key: 'selections',
          label: {
            type: 'custom',
            custom: 'Tie Selections (Width - Color)'
          },
          type: 'text'
        }
      ] : productName.toLowerCase().includes('bundle') && productName.toLowerCase().includes('suit') ? [
        {
          key: 'suit_selection',
          label: {
            type: 'custom',
            custom: 'Suit Color & Size'
          },
          type: 'text'
        },
        {
          key: 'shirt_selection',
          label: {
            type: 'custom',
            custom: 'Shirt Fit, Color & Size'
          },
          type: 'text'
        },
        {
          key: 'tie_selection',
          label: {
            type: 'custom',
            custom: 'Tie Width & Color'
          },
          type: 'text'
        }
      ] : [],
      after_completion: {
        type: 'message',
        message: 'Thank you for your purchase! We will process your order within 24 hours.'
      }
    });

    console.log(`✅ Created link for ${productName}: ${paymentLink.url}`);
    return { name: productName, url: paymentLink.url };
  } catch (error) {
    console.error(`❌ Error creating link for ${productName}:`, error.message);
    return null;
  }
}

// Main function to create all payment links
async function createAllPaymentLinks() {
  console.log('Creating Stripe Payment Links...\n');
  const allLinks = [];

  // Create suit links
  console.log('=== SUITS ===');
  for (const suit of products.suits) {
    // 2-piece
    const link2p = await createPaymentLink(suit.prices.twoPiece.id, suit.prices.twoPiece.name);
    if (link2p) allLinks.push(link2p);
    await new Promise(resolve => setTimeout(resolve, 500));

    // 3-piece
    const link3p = await createPaymentLink(suit.prices.threePiece.id, suit.prices.threePiece.name);
    if (link3p) allLinks.push(link3p);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Create tie links
  console.log('\n=== TIES ===');
  for (const tie of products.ties) {
    const link = await createPaymentLink(tie.priceId, tie.name);
    if (link) allLinks.push(link);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Create tie bundle links
  console.log('\n=== TIE BUNDLES ===');
  for (const bundle of products.tieBundles) {
    const link = await createPaymentLink(bundle.priceId, bundle.name);
    if (link) allLinks.push(link);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Create shirt links
  console.log('\n=== DRESS SHIRTS ===');
  for (const shirt of products.shirts) {
    const link = await createPaymentLink(shirt.priceId, shirt.name);
    if (link) allLinks.push(link);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Create outfit bundle links
  console.log('\n=== OUTFIT BUNDLES ===');
  for (const bundle of products.outfitBundles) {
    const link = await createPaymentLink(bundle.priceId, bundle.name);
    if (link) allLinks.push(link);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Save all links to a file
  console.log('\n=== SAVING LINKS ===');
  const fs = require('fs');
  const output = {
    created: new Date().toISOString(),
    totalLinks: allLinks.length,
    links: allLinks
  };
  
  fs.writeFileSync('payment-links.json', JSON.stringify(output, null, 2));
  console.log(`\n✅ Created ${allLinks.length} payment links`);
  console.log('📄 Links saved to payment-links.json');
}

// Run the script
if (require.main === module) {
  createAllPaymentLinks();
}

module.exports = { createPaymentLink, createAllPaymentLinks };