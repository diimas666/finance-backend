const express = require('express');
const router = express.Router();

router.post('/receipt-ai', async (req, res) => {
  const { imageUrl } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!imageUrl || !apiKey) {
    return res
      .status(400)
      .json({ error: 'URL изображения или API ключ не передан' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Ты — помощник по финансам. Из этого чека вытяни сумму, дату, магазин и категорию покупки. Ответь в JSON.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        temperature: 0.2,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('Ошибка от OpenAI:', data.error);
      return res
        .status(500)
        .json({ error: 'Ошибка OpenAI: ' + data.error.message });
    }

    console.log('Ответ от OpenAI:', JSON.stringify(data, null, 2));

    const result = data.choices?.[0]?.message?.content;
    res.json({ result: result || 'Не удалось распознать чек.' });
  } catch (error) {
    console.error('Ошибка при запросе к OpenAI:', error);
    res.status(500).json({ error: 'Ошибка при распознавании чека' });
  }
});

module.exports = router;
