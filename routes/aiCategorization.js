const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// Инициализация OpenAI клиента
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // ключ возьми из .env
});

router.post('/ai-categorize', async (req, res) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ message: 'Description is required' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `На основе описания транзакции: "${description}" — определи категорию расхода (например, Еда, Транспорт, Развлечения, Коммуналка, Прочее). Ответь только категорией.`,
        },
      ],
      temperature: 0.3,
    });

    const category = completion.choices[0].message.content.trim();

    if (!category) {
      return res
        .status(500)
        .json({ message: 'Не удалось получить категорию от OpenAI' });
    }

    res.json({ category });
  } catch (error) {
    console.error('AI categorization error:', error);
    // Подробный лог
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error(error);
    }
    res.status(500).json({ message: 'Ошибка при запросе к AI', error });
  }
});

module.exports = router;
