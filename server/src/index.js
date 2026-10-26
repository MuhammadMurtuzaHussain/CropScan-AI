import { createApp } from './app.js';
import { ollamaStatus } from './ollama.js';

const PORT = Number(process.env.PORT) || 3001;
createApp().listen(PORT, async () => {
  const s = await ollamaStatus();
  console.log(`CropScan AI on http://localhost:${PORT}`);
  if (!s.reachable) console.log('Ollama not reachable: sample images will replay recorded results, uploads are disabled.');
  else if (!s.modelPresent) console.log(`Ollama is up but "${s.model}" is not pulled. Run: ollama pull ${s.model}`);
  else console.log(`Using ${s.model} via Ollama (live).`);
});
