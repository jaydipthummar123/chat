-- Seed data for default rooms
-- This file creates default rooms that all users can chat in

-- Insert default rooms (only if they don't exist)
INSERT IGNORE INTO rooms (id, name, created_by) VALUES 
(1, 'General Chat', NULL),
(2, 'Welcome', NULL),
(3, 'Random', NULL);

-- Add all existing users to default rooms
INSERT IGNORE INTO room_members (room_id, user_id, role) 
SELECT 1, id, 'member' FROM users;
INSERT IGNORE INTO room_members (room_id, user_id, role) 
SELECT 2, id, 'member' FROM users;
INSERT IGNORE INTO room_members (room_id, user_id, role) 
SELECT 3, id, 'member' FROM users;

-- Note: These rooms will be created with created_by = NULL since they are system rooms
-- All users (existing and new) will be automatically added to these rooms
