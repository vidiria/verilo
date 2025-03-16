const { OpenAI } = require('openai');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { text } = req.body;
    
    // Validações básicas
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Texto não fornecido' });
    }
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
,
    });
    
    // Gerar áudio
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text
    });
    
    // Converter para buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    // Definir headers para áudio
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    
    // Enviar resposta
    res.status(200).send(buffer);
    
  } catch (error) {
    console.error('Erro ao gerar áudio:', error);
    res.status(500).json({ error: error.message });
  }
};