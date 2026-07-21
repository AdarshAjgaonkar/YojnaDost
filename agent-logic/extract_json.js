const raw = $input.first().json.choices[0].message.content;

function extractJson(rawText) {
  const match = rawText.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch (e) {
    return null;
  }
}

const parsed = extractJson(raw);

if (!parsed) {
  return [{ 
    json: { 
      status: "collecting", 
      message: "Sorry, could you repeat that?", 
      chat_id: $('Code in JavaScript').first().json.chat_id 
    } 
  }];
}

return [{ json: { ...parsed, chat_id: $('Code in JavaScript').first().json.chat_id } }];
