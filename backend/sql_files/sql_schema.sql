CREATE DATABASE course_details
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE course_details;

USE course_details;

-- 1) Courses
-- 1) courses
INSERT INTO courses
  (section_name, seats, instructor, course_type, course_code, section_number) VALUES
  ('Intro to Computer Science – A','30','Dr. Alice Smith','CS','CS101','001'),
  ('Intro to Computer Science – B','25','Dr. Alice Smith','CS','CS101','002'),
  ('Data Structures & Algorithms','40','Prof. John Doe','CS','CS201','001'),
  ('Calculus I','35','Dr. Jane Williams','MATH','MATH101','001'),
  ('English Literature','20','Prof. Bob Brown','ENG','ENG200','001');

-- 2) course_dropdown
INSERT INTO course_dropdown
  (course_type, course_code, section_number) VALUES
  ('CS','CS101','001'),
  ('CS','CS101','002'),
  ('CS','CS201','001'),
  ('MATH','MATH101','001'),
  ('ENG','ENG200','001');

-- 3) scheduler_courseevent
INSERT INTO scheduler_courseevent
  (course_id, event_type, event_date, start_date, end_date, days, time, location, description, weightage) VALUES
  (1,'Lecture','2025-09-01','2025-09-01','2025-12-15','Mon,Wed,Fri','09:00–10:00','Room 101','Intro CS lecture','10%'),
  (1,'Lab','2025-09-02','2025-09-02','2025-12-15','Tue','14:00–16:00','Lab A','Weekly programming lab','5%'),
  (2,'Lecture','2025-09-01','2025-09-01','2025-12-15','Tue,Thu','11:00–12:30','Room 102','Intro CS lecture','10%'),
  (2,'Lab','2025-09-03','2025-09-03','2025-12-15','Wed','15:00–17:00','Lab B','Weekly programming lab','5%'),
  (3,'Lecture','2025-09-02','2025-09-02','2025-12-15','Mon,Wed','10:00–11:30','Room 201','Data Structures lecture','15%'),
  (3,'Discussion','2025-09-04','2025-09-04','2025-12-15','Thu','13:00–14:00','Room 202','Problem-solving session','5%'),
  (4,'Lecture','2025-09-01','2025-09-01','2025-12-15','Mon,Wed,Fri','08:00–09:00','Room 301','Calculus I lecture','10%'),
  (4,'Recitation','2025-09-03','2025-09-03','2025-12-15','Thu','12:00–13:00','Room 302','Problem recitation','5%'),
  (5,'Lecture','2025-09-02','2025-09-02','2025-12-15','Tue,Thu','14:00–15:30','Room 401','Literature overview','10%'),
  (5,'Discussion','2025-09-05','2025-09-05','2025-12-15','Fri','10:00–11:00','Room 402','Text analysis','5%');

-- 4) scheduler_suggestion
INSERT INTO scheduler_suggestion (text) VALUES
  ('Could we have an export to iCal option?'),
  ('Please add weekend course filtering'),
  ('Consider dark mode for the dashboard');

SELECT * from suggestions;
Show tables;
