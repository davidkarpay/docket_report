# Quick Start Guide

Get up and running with the Client Docket Manager Extractor in 5 minutes!

## Step 1: Create Icons (Required)

Before loading the extension, you need to create icon files. You have two options:

### Option A: Use Placeholder Icons (Fastest)

Create simple colored square icons using any image editor:

1. Open any image editor (Paint, GIMP, Photoshop, online tool like Photopea)
2. Create 3 images with these dimensions:
   - 16x16 pixels → Save as `icons/icon16.png`
   - 48x48 pixels → Save as `icons/icon48.png`
   - 128x128 pixels → Save as `icons/icon128.png`
3. Fill each with a solid color (suggestion: blue or purple)
4. Add a simple letter "D" or gavel symbol if desired
5. Save all three in the `icons/` directory

### Option B: Use Online Icon Generator

1. Visit a free icon generator like:
   - https://www.favicon-generator.org/
   - https://realfavicongenerator.net/
2. Upload any image or logo
3. Download all sizes
4. Rename and place in `icons/` directory

## Step 2: Load Extension in Chrome

1. Open Chrome/Chromium browser
2. Navigate to `chrome://extensions/`
3. **Enable "Developer mode"** (toggle in top-right corner)
4. Click **"Load unpacked"** button
5. Browse to and select the `/mnt/c/Showcase_Scraper` folder
6. Click "Select Folder"

✅ You should now see "Client Docket Manager Extractor" in your extensions list!

## Step 3: Pin the Extension (Optional but Recommended)

1. Click the puzzle piece icon in Chrome toolbar
2. Find "Client Docket Manager Extractor"
3. Click the pin icon to keep it visible

## Step 4: Try Your First Extraction

### Quick Test - Manual Extraction

1. Visit any court website or legal case page
2. Click the extension icon in your toolbar
3. In the popup, click on **"Docket Number"** button
4. Click the docket/case number element on the webpage
5. Repeat for other fields (Case Title, Filing Date, etc.)
6. Go to **"Data"** tab to see your extracted data
7. Click **"Export JSON"** to download

### Advanced - Auto Extraction

1. Create a rules file for your court website:
   - Copy `rules/example.com.json`
   - Rename to match the domain (e.g., `courtwebsite.gov.json`)
   - Edit the selectors to match the page structure
2. Visit that court website
3. Click extension icon
4. Click **"Auto Extract"**
5. Data is extracted automatically!

## Step 5: Configure LLM (Optional)

To enable AI-powered data parsing:

1. Install Ollama from https://ollama.ai
2. Open terminal and run:
   ```bash
   ollama serve
   ollama pull llama2
   ```
3. In extension, go to **Settings** tab
4. Check **"Enable LLM Processing"**
5. Default settings should work (localhost:11434)
6. Click **"Test Connection"** to verify
7. Click **"Save Configuration"**

Now you can use **"Process with LLM"** after extracting data!

## Common First-Time Issues

### "Failed to load extension"
- Make sure you created the icon files first
- Check that you selected the correct folder
- Verify all required files exist

### "Extension icon doesn't appear"
- Try refreshing the extensions page
- Click the puzzle piece icon and pin the extension
- Reload the extension

### "Auto Extract doesn't work"
- You need to create rules files first (see `rules/README.md`)
- Use manual selection for any website without rules
- Check browser console (F12) for errors

### "Can't export data"
- Make sure you've extracted some data first
- Check the Data tab to verify data exists
- Try "Copy to Clipboard" if export fails

## Next Steps

- Read the full `README.md` for detailed documentation
- Check `rules/README.md` to learn about creating extraction rules
- Review `schemas/docket-schema.json` to understand the data structure
- Explore the Settings tab for LLM configuration

## Tips for Success

1. **Start Simple**: Begin with 2-3 basic fields, then expand
2. **Use DevTools**: Press F12 to inspect elements and find selectors
3. **Test Selectors**: Use browser console to test CSS selectors
4. **Save Often**: Extension keeps history of your last 100 extractions
5. **Review Data**: Always check the Data preview before exporting

## Need Help?

- Check the Troubleshooting section in `README.md`
- Review the rules examples in `rules/` directory
- Check browser console (F12) for error messages

---

**That's it! You're ready to start extracting court data.** 🎉

Visit a court website and click the extension icon to begin!
