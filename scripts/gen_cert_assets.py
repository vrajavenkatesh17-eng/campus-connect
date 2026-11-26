import base64

with open('public/fxec-logo.png', 'rb') as f:
    logo_b64 = base64.b64encode(f.read()).decode('utf-8')

with open('public/fonts/Fraunces-Regular.ttf', 'rb') as f:
    fraunces_b64 = base64.b64encode(f.read()).decode('utf-8')

with open('public/fonts/JetBrainsMono-Regular.ttf', 'rb') as f:
    jb_b64 = base64.b64encode(f.read()).decode('utf-8')

with open('src/assets/certificateAssets.js', 'w', encoding='utf-8') as f:
    f.write(f'export const FXEC_LOGO_BASE64 = "{logo_b64}";\n')
    f.write(f'export const FRAUNCES_REGULAR_TTF_BASE64 = "{fraunces_b64}";\n')
    f.write(f'export const JETBRAINS_MONO_TTF_BASE64 = "{jb_b64}";\n')

print('certificateAssets.js generated successfully!')
