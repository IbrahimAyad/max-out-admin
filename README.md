# KCT Menswear - Sound Preview Page

A professional sound preview interface for selecting order notification sounds. This page allows users to preview and select from five high-quality notification sounds suitable for a luxury fashion brand.

## Features

- **Professional Design**: Clean, minimalist interface that reflects luxury branding
- **Accessibility**: Full keyboard navigation, screen reader support, and WCAG 2.1 AA compliance
- **Mobile Responsive**: Optimized for all device sizes
- **Single Audio Playback**: Only one sound plays at a time
- **Visual Feedback**: Clear play/pause states and selection indicators
- **Recommended Option**: "Luxury Bell" is pre-selected as the recommended choice

## Sound Options

The page includes five notification sound options:

1. **Elegant Chime** - Sophisticated, subtle notification
2. **Luxury Bell** - Premium, refined sound (Recommended)
3. **Modern Ping** - Clean, professional alert
4. **Boutique Alert** - High-end retail inspired
5. **Executive Notification** - Confident, important-sounding

## Setup Instructions

### Adding Sound Files

To make the page fully functional, add audio files to the `sounds/` directory:

```
sounds/
├── elegant-chime.mp3
├── luxury-bell.mp3
├── modern-ping.mp3
├── boutique-alert.mp3
└── executive-notification.mp3
```

### Audio File Requirements

- **Format**: MP3 (recommended for broad compatibility)
- **Quality**: 192kbps or higher
- **Duration**: 1-3 seconds for notification sounds
- **File Size**: Under 100KB per file for fast loading
- **Volume**: Consistent levels across all files

### Recommended Sound Characteristics

- **Elegant Chime**: Soft bell or chime sound, sophisticated tone
- **Luxury Bell**: Premium bell sound, refined and distinctive
- **Modern Ping**: Clean digital ping or beep, contemporary feel
- **Boutique Alert**: Warm notification sound, inviting tone
- **Executive Notification**: Confident alert sound, authoritative but not harsh

## File Structure

```
kct-sound-preview/
├── index.html          # Main HTML structure
├── styles.css          # Professional styling
├── script.js           # Audio playback functionality
├── sounds/             # Audio files directory
│   ├── elegant-chime.mp3
│   ├── luxury-bell.mp3
│   ├── modern-ping.mp3
│   ├── boutique-alert.mp3
│   └── executive-notification.mp3
└── README.md          # This file
```

## Usage

1. Open `index.html` in a web browser
2. Click the play buttons to preview each sound
3. Select your preferred option using the radio buttons
4. Click "Save Selection" to save your choice

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- Mobile browsers (iOS Safari 11+, Chrome Mobile 60+)

## Technical Details

### Design System

- **Primary Font**: Playfair Display (headings)
- **Secondary Font**: Inter (body text, UI)
- **Color Palette**: Monochromatic with muted gold accent
- **Layout**: 800px max-width, centered container
- **Spacing**: 8px base unit for consistent spacing

### Accessibility Features

- Semantic HTML structure
- ARIA labels and live regions
- Keyboard navigation support
- High contrast mode support
- Screen reader announcements
- Focus indicators

### Performance Optimizations

- Font preloading
- Audio preloading for recommended sound
- Efficient CSS animations
- Optimized asset loading

## Customization

### Adding New Sounds

1. Add the audio file to the `sounds/` directory
2. Add a new `.sound-item` section in `index.html`
3. Update the JavaScript if needed for special handling

### Styling Modifications

All visual styling is contained in `styles.css`. Key customization points:

- **Colors**: Modify the CSS custom properties at the top of the file
- **Typography**: Update font families and sizes
- **Spacing**: Adjust padding and margin values
- **Component Styling**: Modify individual component styles

## Integration

### API Integration

The save functionality currently uses localStorage for demo purposes. To integrate with a backend API:

1. Modify the `simulateSaveToAPI` method in `script.js`
2. Replace the setTimeout simulation with an actual fetch call
3. Handle real API responses and errors

Example API integration:

```javascript
async saveToAPI(selectedValue) {
    try {
        const response = await fetch('/api/admin/settings/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                notification_sound: selectedValue
            })
        });
        
        if (!response.ok) {
            throw new Error('Save failed');
        }
        
        return await response.json();
    } catch (error) {
        throw error;
    }
}
```

## Demo Limitations

This is a fully functional demo with the following limitations:

- Audio files are not included (need to be added)
- Save functionality uses localStorage instead of a real API
- No user authentication or session management

## License

© 2025 KCT Menswear. All rights reserved.