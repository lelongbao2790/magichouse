-- Sticker catalog seed — 22 rows
-- ON CONFLICT (id) DO NOTHING makes this idempotent (safe to re-run)
INSERT INTO stickers (id, name, category, emoji, price) VALUES
  ('hat-crown',       'Vuong mien',    'hat',     '👑', 30),
  ('hat-wizard',      'Mu phu thuy',   'hat',     '🎩', 25),
  ('hat-party',       'Mu tiec',       'hat',     '🥳', 15),
  ('hat-cowboy',      'Mu cao boi',    'hat',     '🤠', 20),
  ('hat-cap',         'Mu luoi trai',  'hat',     '🧢', 10),
  ('hat-santa',       'Mu Noel',       'hat',     '🎅', 25),
  ('glasses-sun',     'Kinh mat',      'glasses', '🕶️', 15),
  ('glasses-nerd',    'Kinh can',      'glasses', '🤓', 10),
  ('glasses-star',    'Kinh ngoi sao', 'glasses', '⭐', 20),
  ('glasses-heart',   'Kinh trai tim', 'glasses', '💖', 20),
  ('glasses-3d',      'Kinh 3D',       'glasses', '👓', 15),
  ('bow-ribbon',      'No hong',       'bow',     '🎀', 15),
  ('bow-flower',      'Hoa cai dau',   'bow',     '🌸', 20),
  ('bow-butterfly',   'Buom',          'bow',     '🦋', 25),
  ('bow-star',        'Sao',           'bow',     '✨', 15),
  ('bow-rainbow',     'Cau vong',      'bow',     '🌈', 30),
  ('toy-balloon',     'Bong bay',      'toy',     '🎈', 10),
  ('toy-teddy',       'Gau bong',      'toy',     '🧸', 25),
  ('toy-rocket',      'Ten lua',       'toy',     '🚀', 30),
  ('toy-ball',        'Qua bong',      'toy',     '⚽', 15),
  ('toy-magic',       'Gay phep',      'toy',     '🪄', 35),
  ('toy-robot',       'Robot',         'toy',     '🤖', 40)
ON CONFLICT (id) DO NOTHING;
