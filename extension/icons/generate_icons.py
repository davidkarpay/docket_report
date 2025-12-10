#!/usr/bin/env python3
"""Generate placeholder icons for the Chrome extension"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    """Create a simple icon with gradient background and text"""
    # Create image with gradient background
    img = Image.new('RGB', (size, size), color='#667eea')
    draw = ImageDraw.Draw(img)

    # Draw a simple colored rectangle
    draw.rectangle([0, 0, size, size], fill='#667eea')

    # Try to add text 'D' in the center
    try:
        # Try to use a default font, fallback to basic if not available
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size // 2)
        except:
            font = ImageFont.load_default()

        text = "D"
        # Get text bounding box
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        # Center the text
        x = (size - text_width) // 2
        y = (size - text_height) // 2 - bbox[1]

        draw.text((x, y), text, fill='white', font=font)
    except Exception as e:
        print(f"Warning: Could not add text to icon: {e}")
        # Just use solid color if text fails
        pass

    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Create icons in three sizes
    sizes = [16, 48, 128]

    for size in sizes:
        filename = os.path.join(script_dir, f'icon{size}.png')
        create_icon(size, filename)

    print("\nAll icons created successfully!")
    print("Extension is now ready to load in Chrome.")

if __name__ == '__main__':
    main()
