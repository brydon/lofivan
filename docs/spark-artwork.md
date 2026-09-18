# DGX Spark artwork correction

Edited `dist/assets/computer.png` with the built-in imagegen tool, using the existing asset as the edit target and the user's DGX Spark photo as the orientation reference.

Only the generated front-panel region (x=202, y=440, width=132, height=438) was composited back into the original PNG, with a soft edge. The original alpha channel was retained. Pixel verification confirmed zero changed pixels outside that region and zero changed alpha values; the CRT, keyboard, and terminal alignment remain unchanged.

## Imagegen prompt

Use case: precise-object-edit.
Asset type: existing transparent PNG layer for the lofivan website.
Input image 1 (computer.png) is the EDIT TARGET. Input image 2 is a photographic REFERENCE ONLY for correct DGX Spark front-panel orientation.
Correct the upside-down front-panel design on the small gold NVIDIA DGX Spark standing vertically at the left of the CRT in image 1. Match the reference: the upper gold inset has an unbranded empty gold badge BELOW its dark horizontal vent slot, and the lower gold inset has the green NVIDIA eye logo and readable upright text "NVIDIA" ABOVE its dark horizontal vent slot. Keep the unit standing vertically with exactly the same dimensions, silhouette, position, warm illustrated texture, perspective, and lighting as image 1. The lettering must read upright left-to-right.
Change only the small Spark's front panel (roughly x 200–337, y 440–880 in the 1536x1024 target). Preserve the rest of image 1 exactly: CRT glass, monitor case and geometry, keyboard with numpad on the RIGHT, object positions, shadows, gold side panel, and the 1536x1024 canvas. Maintain the genuinely transparent alpha background. Do not add the reference's power brick, cables, desk, room, or anything else. No cropping, repositioning, mirroring, relighting or restyling. Return the complete corrected transparent image 1.

