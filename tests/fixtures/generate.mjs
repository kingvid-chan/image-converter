import { writeFileSync } from 'fs';

// Helper: minimal 1x1 red PNG (valid, smallest possible)
const RED_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
writeFileSync(new URL('./red-1x1.png', import.meta.url), Buffer.from(RED_PNG_BASE64, 'base64'));

// A slightly larger test PNG (10x10 blue)
const bluePngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mP8z8BQz0BKYWxgJh4PAIAtCQ8Qx4y1DQAAAABJRU5ErkJggg==', 'base64');
writeFileSync(new URL('./test-image.png', import.meta.url), bluePngData);

// Corrupted "image" — random bytes with .png extension
const corrupted = Buffer.alloc(100);
for (let i = 0; i < 100; i++) corrupted[i] = Math.floor(Math.random() * 256);
writeFileSync(new URL('./corrupted.png', import.meta.url), corrupted);

// Non-image file — plain text renamed as .pdf
writeFileSync(new URL('./not-image.pdf', import.meta.url), 'This is not an image file. It is a text file with .pdf extension.');

console.log('Test fixtures generated successfully.');
