-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: boostme
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `target_students` tinyint(1) DEFAULT '1',
  `target_lecturers` tinyint(1) DEFAULT '1',
  `target_mentors` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `appointment_id` int NOT NULL AUTO_INCREMENT,
  `mentor_id` int NOT NULL,
  `student_id` int DEFAULT NULL,
  `appointment_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `status` enum('available','pending','confirmed','cancelled') DEFAULT 'available',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`appointment_id`),
  KEY `mentor_id` (`mentor_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`mentor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
INSERT INTO `appointments` VALUES (3,5,NULL,'2026-06-19','10:00:00','11:00:00','available','2026-06-17 15:38:44'),(4,5,NULL,'2026-06-19','14:00:00','15:00:00','available','2026-06-17 15:38:44'),(6,6,NULL,'2026-06-19','14:00:00','15:00:00','available','2026-06-17 15:38:44'),(7,7,NULL,'2026-06-19','10:00:00','11:00:00','available','2026-06-17 15:38:44'),(9,8,NULL,'2026-06-19','10:00:00','11:00:00','available','2026-06-17 15:38:44'),(10,8,NULL,'2026-06-19','14:00:00','15:00:00','available','2026-06-17 15:38:44'),(11,9,NULL,'2026-06-19','10:00:00','11:00:00','available','2026-06-17 15:38:44'),(12,9,NULL,'2026-06-19','14:00:00','15:00:00','available','2026-06-17 15:38:44'),(13,10,NULL,'2026-06-19','10:00:00','11:00:00','available','2026-06-17 15:38:44'),(14,10,NULL,'2026-06-19','14:00:00','15:00:00','available','2026-06-17 15:38:44'),(15,11,NULL,'2026-06-19','10:00:00','11:00:00','available','2026-06-17 15:38:44'),(16,11,NULL,'2026-06-19','14:00:00','15:00:00','available','2026-06-17 15:38:44'),(17,12,NULL,'2026-06-19','10:00:00','11:00:00','available','2026-06-17 15:38:44'),(18,12,NULL,'2026-06-19','14:00:00','15:00:00','available','2026-06-17 15:38:44'),(19,13,NULL,'2026-06-19','10:00:00','11:00:00','available','2026-06-17 15:38:44'),(20,13,NULL,'2026-06-19','14:00:00','15:00:00','available','2026-06-17 15:38:44'),(21,4,NULL,'2026-07-08','10:00:00','11:00:00','available','2026-07-06 05:37:25'),(22,4,NULL,'2026-07-09','14:00:00','15:00:00','available','2026-07-06 05:37:25'),(23,4,NULL,'2026-07-10','16:00:00','17:00:00','available','2026-07-06 05:37:25'),(24,5,NULL,'2026-07-08','10:00:00','11:00:00','available','2026-07-06 05:37:25'),(25,5,NULL,'2026-07-09','14:00:00','15:00:00','available','2026-07-06 05:37:25'),(26,5,NULL,'2026-07-10','16:00:00','17:00:00','available','2026-07-06 05:37:25'),(27,6,NULL,'2026-07-08','10:00:00','11:00:00','available','2026-07-06 05:37:25'),(28,6,NULL,'2026-07-09','14:00:00','15:00:00','available','2026-07-06 05:37:25'),(29,6,NULL,'2026-07-10','16:00:00','17:00:00','available','2026-07-06 05:37:25'),(30,7,NULL,'2026-07-08','10:00:00','11:00:00','available','2026-07-06 05:37:25'),(31,7,NULL,'2026-07-09','14:00:00','15:00:00','available','2026-07-06 05:37:25'),(32,7,NULL,'2026-07-10','16:00:00','17:00:00','available','2026-07-06 05:37:25'),(33,8,NULL,'2026-07-08','10:00:00','11:00:00','available','2026-07-06 05:37:25'),(34,8,NULL,'2026-07-09','14:00:00','15:00:00','available','2026-07-06 05:37:25'),(35,8,NULL,'2026-07-10','16:00:00','17:00:00','available','2026-07-06 05:37:25'),(36,9,NULL,'2026-07-08','10:00:00','11:00:00','available','2026-07-06 05:37:25'),(37,9,NULL,'2026-07-09','14:00:00','15:00:00','available','2026-07-06 05:37:25'),(38,9,NULL,'2026-07-10','16:00:00','17:00:00','available','2026-07-06 05:37:25'),(39,10,NULL,'2026-07-08','10:00:00','11:00:00','available','2026-07-06 05:37:25'),(40,10,NULL,'2026-07-09','14:00:00','15:00:00','available','2026-07-06 05:37:25'),(41,10,NULL,'2026-07-10','16:00:00','17:00:00','available','2026-07-06 05:37:25'),(42,11,NULL,'2026-07-08','10:00:00','11:00:00','available','2026-07-06 05:37:25'),(43,11,NULL,'2026-07-09','14:00:00','15:00:00','available','2026-07-06 05:37:25'),(44,11,NULL,'2026-07-10','16:00:00','17:00:00','available','2026-07-06 05:37:25'),(45,12,NULL,'2026-07-08','10:00:00','11:00:00','available','2026-07-06 05:37:25'),(46,12,NULL,'2026-07-09','14:00:00','15:00:00','available','2026-07-06 05:37:25'),(47,12,NULL,'2026-07-10','16:00:00','17:00:00','available','2026-07-06 05:37:25'),(48,13,NULL,'2026-07-08','10:00:00','11:00:00','available','2026-07-06 05:37:25'),(49,13,NULL,'2026-07-09','14:00:00','15:00:00','available','2026-07-06 05:37:25'),(50,13,NULL,'2026-07-10','16:00:00','17:00:00','available','2026-07-06 05:37:25');
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `role` enum('user','ai') NOT NULL,
  `message_text` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lecturer_courses`
--

DROP TABLE IF EXISTS `lecturer_courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lecturer_courses` (
  `lecturer_id` int NOT NULL,
  `course_name` varchar(255) NOT NULL,
  PRIMARY KEY (`lecturer_id`,`course_name`),
  CONSTRAINT `lecturer_courses_ibfk_1` FOREIGN KEY (`lecturer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lecturer_courses`
--

LOCK TABLES `lecturer_courses` WRITE;
/*!40000 ALTER TABLE `lecturer_courses` DISABLE KEYS */;
INSERT INTO `lecturer_courses` VALUES (2,'ENGLISH FOR INFORMATION TECHNOLOGY'),(2,'OBJECT ORIENTED SYSTEMS ANALYSIS AND DESIGN'),(2,'PHILOSOPHY AND CURRENT ISSUES (FOR INTERNATIONAL STUDENTS)'),(2,'PROBABILITY AND STATISTICS FOR COMPUTING'),(2,'PROGRAMMING CONCEPTS AND PRACTICES'),(2,'SUN ZI\'S ART OF WAR AND BUSINESS STRATEGIES');
/*!40000 ALTER TABLE `lecturer_courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mentor_slots`
--

DROP TABLE IF EXISTS `mentor_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mentor_slots` (
  `slot_id` int NOT NULL AUTO_INCREMENT,
  `mentor_id` int NOT NULL,
  `slot_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_booked` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`slot_id`),
  KEY `mentor_id` (`mentor_id`),
  CONSTRAINT `mentor_slots_ibfk_1` FOREIGN KEY (`mentor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mentor_slots`
--

LOCK TABLES `mentor_slots` WRITE;
/*!40000 ALTER TABLE `mentor_slots` DISABLE KEYS */;
/*!40000 ALTER TABLE `mentor_slots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otps`
--

DROP TABLE IF EXISTS `otps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `otp_code` varchar(10) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otps`
--

LOCK TABLES `otps` WRITE;
/*!40000 ALTER TABLE `otps` DISABLE KEYS */;
INSERT INTO `otps` VALUES (5,'singsoo@1utar.my','389273','2026-08-03 12:37:10','2026-08-03 04:27:10'),(6,'singoon@1utar.my','113005','2026-08-03 12:39:57','2026-08-03 04:29:56');
/*!40000 ALTER TABLE `otps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prediction_history`
--

DROP TABLE IF EXISTS `prediction_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prediction_history` (
  `prediction_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `course_name` varchar(255) NOT NULL,
  `attendance_rate` float DEFAULT NULL,
  `midterm_score` float DEFAULT NULL,
  `assignments_avg` float DEFAULT NULL,
  `quizzes_avg` float DEFAULT NULL,
  `study_hours` float DEFAULT NULL,
  `stress_level` int DEFAULT NULL,
  `predicted_grade` enum('A','B','C','D','F') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`prediction_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `prediction_history_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prediction_history`
--

LOCK TABLES `prediction_history` WRITE;
/*!40000 ALTER TABLE `prediction_history` DISABLE KEYS */;
INSERT INTO `prediction_history` VALUES (41,18,'ENGLISH FOR INFORMATION TECHNOLOGY',85,75,90,80,12,5,'B','2026-08-04 04:00:52'),(42,18,'ENGLISH FOR INFORMATION TECHNOLOGY',85,75,90,80,50,5,'A','2026-08-04 04:01:48'),(43,18,'ENGLISH FOR INFORMATION TECHNOLOGY',85,75,90,80,50,5,'A','2026-08-04 04:02:13'),(44,18,'ENGLISH FOR INFORMATION TECHNOLOGY',85,75,90,80,12,5,'B','2026-08-04 04:02:25'),(45,18,'ENGLISH FOR INFORMATION TECHNOLOGY',85,75,90,80,14,2,'B','2026-08-04 04:02:32'),(46,18,'ENGLISH FOR INFORMATION TECHNOLOGY',85,75,90,80,14,2,'B','2026-08-04 04:02:50'),(47,18,'ENGLISH FOR INFORMATION TECHNOLOGY',85,75,90,80,14,2,'B','2026-08-04 04:05:25'),(48,18,'ENGLISH FOR INFORMATION TECHNOLOGY',85,75,90,80,0,2,'B','2026-08-04 04:07:59'),(49,18,'ENGLISH FOR INFORMATION TECHNOLOGY',85,75,90,80,1,5,'B','2026-08-04 04:07:59'),(50,18,'ENGLISH FOR INFORMATION TECHNOLOGY',85,75,90,80,12,5,'B','2026-08-04 04:07:59'),(51,18,'ENGLISH FOR INFORMATION TECHNOLOGY',85,75,90,80,12,5,'B','2026-08-04 04:08:22'),(52,18,'ENGLISH FOR INFORMATION TECHNOLOGY',85,75,90,80,12,5,'B','2026-08-04 04:08:23'),(53,18,'ENGLISH FOR INFORMATION TECHNOLOGY',85,75,90,80,0,5,'B','2026-08-04 04:08:27'),(54,18,'ENGLISH FOR INFORMATION TECHNOLOGY',85,75,90,80,12,5,'B','2026-08-04 04:08:36'),(55,18,'ENGLISH FOR INFORMATION TECHNOLOGY',85,75,90,80,34,5,'A','2026-08-04 04:08:55'),(56,18,'ENGLISH FOR INFORMATION TECHNOLOGY',85,75,90,80,34,5,'A','2026-08-04 04:11:20'),(57,18,'ENGLISH FOR INFORMATION TECHNOLOGY',85,75,90,80,34,3,'A','2026-08-04 04:11:26'),(58,18,'ENGLISH FOR INFORMATION TECHNOLOGY',85,75,90,80,34,6,'A','2026-08-04 04:11:28');
/*!40000 ALTER TABLE `prediction_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registration_requests`
--

DROP TABLE IF EXISTS `registration_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registration_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` enum('student','lecturer','mentor') NOT NULL,
  `request_type` enum('register','reset_password') DEFAULT 'register',
  `id_number` varchar(50) NOT NULL,
  `message` text,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registration_requests`
--

LOCK TABLES `registration_requests` WRITE;
/*!40000 ALTER TABLE `registration_requests` DISABLE KEYS */;
INSERT INTO `registration_requests` VALUES (1,'TING SING SOON','singsoonting@1utar.my','student','register','2305674',NULL,'approved','2026-08-03 04:50:34'),(2,'TING SING SOON','singsoonting@1utar.my','student','register','2305674','OTP NOT NOT RECEIVE','approved','2026-08-03 05:04:02'),(3,'TING SING SOON','singsoonting@1utar.my','student','reset_password','2305674','cannot receive otp','approved','2026-08-03 05:11:48');
/*!40000 ALTER TABLE `registration_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_course_marks`
--

DROP TABLE IF EXISTS `student_course_marks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_course_marks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id_number` varchar(100) NOT NULL,
  `course_name` varchar(255) NOT NULL,
  `lecturer_id` int NOT NULL,
  `attendance_rate` float DEFAULT NULL,
  `midterm_score` float DEFAULT NULL,
  `assignments_avg` float DEFAULT NULL,
  `quizzes_avg` float DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_course` (`student_id_number`,`course_name`),
  KEY `lecturer_id` (`lecturer_id`),
  CONSTRAINT `student_course_marks_ibfk_1` FOREIGN KEY (`lecturer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_course_marks`
--

LOCK TABLES `student_course_marks` WRITE;
/*!40000 ALTER TABLE `student_course_marks` DISABLE KEYS */;
INSERT INTO `student_course_marks` VALUES (1,'1234567','ENGLISH FOR INFORMATION TECHNOLOGY',2,85,75,90,80,'2026-06-14 12:42:27','2026-06-14 12:42:27'),(3,'2305674','ENGLISH FOR INFORMATION TECHNOLOGY',2,85,75,90,80,'2026-07-06 05:25:39','2026-07-06 05:25:39'),(4,'2305674','PROBABILITY AND STATISTICS FOR COMPUTING',2,85,75,90,80,'2026-07-06 05:25:49','2026-07-06 05:25:49'),(5,'2305674','PROGRAMMING CONCEPTS AND PRACTICES',2,85,75,90,80,'2026-07-06 05:26:07','2026-07-06 05:26:07'),(6,'2305674','SUN ZI\'S ART OF WAR AND BUSINESS STRATEGIES',2,85,75,90,80,'2026-07-06 05:26:18','2026-07-06 05:26:18'),(7,'2305674','OBJECT ORIENTED SYSTEMS ANALYSIS AND DESIGN',2,20,25,91,20,'2026-07-25 07:24:56','2026-07-25 07:24:56');
/*!40000 ALTER TABLE `student_course_marks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `setting_key` varchar(255) NOT NULL,
  `setting_value` varchar(255) NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES ('maintenance_mode','false','2026-07-21 13:21:38');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uploaded_files_history`
--

DROP TABLE IF EXISTS `uploaded_files_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uploaded_files_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lecturer_id` int NOT NULL,
  `course_name` varchar(255) NOT NULL,
  `original_file_name` varchar(255) NOT NULL,
  `stored_file_name` varchar(255) NOT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `lecturer_id` (`lecturer_id`),
  CONSTRAINT `uploaded_files_history_ibfk_1` FOREIGN KEY (`lecturer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uploaded_files_history`
--

LOCK TABLES `uploaded_files_history` WRITE;
/*!40000 ALTER TABLE `uploaded_files_history` DISABLE KEYS */;
INSERT INTO `uploaded_files_history` VALUES (1,2,'ENGLISH FOR INFORMATION TECHNOLOGY','marks_template.csv','file-1781444071463-154011314.csv','2026-06-14 13:34:31'),(2,2,'ENGLISH FOR INFORMATION TECHNOLOGY','marks_template (1).csv','file-1783315539183-210432905.csv','2026-07-06 05:25:39'),(3,2,'PROBABILITY AND STATISTICS FOR COMPUTING','marks_template (1).csv','file-1783315549869-871322712.csv','2026-07-06 05:25:49'),(4,2,'PROGRAMMING CONCEPTS AND PRACTICES','marks_template (1).csv','file-1783315567725-770333908.csv','2026-07-06 05:26:07'),(5,2,'SUN ZI\'S ART OF WAR AND BUSINESS STRATEGIES','marks_template (1).csv','file-1783315578433-255988164.csv','2026-07-06 05:26:18'),(6,2,'OBJECT ORIENTED SYSTEMS ANALYSIS AND DESIGN','marks_template (2).csv','file-1784964296858-968443078.csv','2026-07-25 07:24:56');
/*!40000 ALTER TABLE `uploaded_files_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role` enum('student','lecturer','mentor','admin') NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `student_id_number` varchar(100) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `semester` varchar(100) DEFAULT NULL,
  `age` int DEFAULT NULL,
  `gender` varchar(50) DEFAULT NULL,
  `family_income_level` varchar(50) DEFAULT NULL,
  `specialty_description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,'lecturer','singsoon@1utar.my','$2b$10$U1BKJd902WRz381ilPKLQuB0kCfkODOBl/M8jL138IONSqiES2WFO','AAA','https://api.dicebear.com/7.x/avataaars/svg?seed=Jocelyn',NULL,'CS',NULL,NULL,NULL,NULL,NULL,'2026-06-14 12:25:30',1),(3,'student','singsoont@gmail.com','$2b$10$/c5lnUeb5YVTPGiZ6YV77.v6XKPC4cL//s5s7oaqk6Rn.v7ndCLGi','Aiden','https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka','1234567','Business','Y2S1',12,'Male','Low',NULL,'2026-06-14 12:44:17',1),(4,'mentor','ting@utar.my','$2b$10$6f1oSG12QZT4RnHB7MIt0OoEK0m2hwKRsNp9sg.45vvTSMcIacGLG','Alice Smith',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Expert in Frontend React, Tailwind, and UI/UX Design.','2026-06-17 15:38:44',1),(5,'mentor','bob@mentor.com','$2b$10$6f1oSG12QZT4RnHB7MIt0OoEK0m2hwKRsNp9sg.45vvTSMcIacGLG','Bob Johnson',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Backend Specialist. Node.js, Express, and Database Optimization.','2026-06-17 15:38:44',1),(6,'mentor','charlie@mentor.com','$2b$10$6f1oSG12QZT4RnHB7MIt0OoEK0m2hwKRsNp9sg.45vvTSMcIacGLG','Charlie Lee',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Mobile App Developer. React Native and Flutter expert.','2026-06-17 15:38:44',1),(7,'mentor','diana@mentor.com','$2b$10$6f1oSG12QZT4RnHB7MIt0OoEK0m2hwKRsNp9sg.45vvTSMcIacGLG','Diana Prince',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Data Scientist. Python, Machine Learning, and Data Analysis.','2026-06-17 15:38:44',1),(8,'mentor','ethan@mentor.com','$2b$10$6f1oSG12QZT4RnHB7MIt0OoEK0m2hwKRsNp9sg.45vvTSMcIacGLG','Ethan Hunt',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Cybersecurity Analyst. Penetration testing and Network Security.','2026-06-17 15:38:44',1),(9,'mentor','fiona@mentor.com','$2b$10$6f1oSG12QZT4RnHB7MIt0OoEK0m2hwKRsNp9sg.45vvTSMcIacGLG','Fiona Gallagher',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Project Management and Agile Methodologies.','2026-06-17 15:38:44',1),(10,'mentor','george@mentor.com','$2b$10$6f1oSG12QZT4RnHB7MIt0OoEK0m2hwKRsNp9sg.45vvTSMcIacGLG','George Miller',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Cloud Architect. AWS, Docker, and Kubernetes deployment.','2026-06-17 15:38:44',1),(11,'mentor','hannah@mentor.com','$2b$10$6f1oSG12QZT4RnHB7MIt0OoEK0m2hwKRsNp9sg.45vvTSMcIacGLG','Hannah Abbott',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Game Development. Unity, C#, and 3D Modeling.','2026-06-17 15:38:44',1),(12,'mentor','ian@mentor.com','$2b$10$6f1oSG12QZT4RnHB7MIt0OoEK0m2hwKRsNp9sg.45vvTSMcIacGLG','Ian Wright',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Algorithms and Data Structures. Competitive Programming.','2026-06-17 15:38:44',1),(13,'mentor','julia@mentor.com','$2b$10$6f1oSG12QZT4RnHB7MIt0OoEK0m2hwKRsNp9sg.45vvTSMcIacGLG','Julia Roberts',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Mental Health Counselor. Stress Management and Academic Guidance.','2026-06-17 15:38:44',1),(14,'admin','admin@boostme.com','$2b$10$JGzTtRECfoGpXVjWOgnLS.f2bABJsJ.gKEQBZFIw4KwKq2cW30Eja','Super Admin',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-21 12:01:16',1),(15,'student','oldstudent@boostme.com','$2b$10$CqSc4U92MmJ97mijX8SzK.WANIqpjQ74giTM9.WbKK1k8ipNlTKpi','Test Old Student',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2020-07-21 12:16:19',1),(18,'student','singsoonting@1utar.my','$2b$10$p9XCZcO3YQnQtv.tAtS62OjhoUYfDAwqHL.rOpKeuZ7vKOaV68Cpe','TING SING SOON','https://api.dicebear.com/7.x/avataaars/svg?seed=Felix','2305674','CS','Y3S3',22,'Male','Medium',NULL,'2026-08-04 04:00:40',1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-06 22:14:35
