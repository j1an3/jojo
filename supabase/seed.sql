-- Seed data: 2 known Stands for dev/testing without running the scraper
-- Run AFTER migration 001

INSERT INTO stands (name, type, ability_description, stats, weakness) VALUES
(
  'Star Platinum',
  'Close-Range Stand',
  'Sức mạnh vật lý siêu việt, tốc độ cực cao, và có khả năng dừng thời gian. Đấm liên hoàn với tiếng kêu ORA ORA ORA.',
  '{"pow":"A","spd":"A","rng":"C","dur":"A","prc":"A","dev":"A"}',
  'Phạm vi giới hạn khoảng 2m; dừng thời gian chỉ hiệu quả trong vài giây'
),
(
  'The World',
  'Close-Range Stand',
  'Có thể dừng thời gian (Za Warudo). Sức mạnh và tốc độ tương đương Star Platinum. Đã dừng thời gian lâu hơn Star Platinum.',
  '{"pow":"A","spd":"A","rng":"C","dur":"A","prc":"A","dev":"A"}',
  'Điểm yếu chí mạng ở chân; DIO cần uống máu để duy trì sức mạnh tối đa'
)
ON CONFLICT (name) DO NOTHING;

INSERT INTO characters (name, stand_id, part, status)
SELECT 'Jotaro Kujo', id, 3, 'alive' FROM stands WHERE name = 'Star Platinum'
ON CONFLICT DO NOTHING;

INSERT INTO characters (name, stand_id, part, status)
SELECT 'DIO', id, 3, 'deceased' FROM stands WHERE name = 'The World'
ON CONFLICT DO NOTHING;
