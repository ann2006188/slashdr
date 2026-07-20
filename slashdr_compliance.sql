-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: slashdr_compliance
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` varchar(100) NOT NULL,
  `user_role` varchar(50) NOT NULL,
  `action_type` varchar(100) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` bigint NOT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `meta_json` json DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES (1,'admin1','ROLE_CLINIC_ADMIN','CREATED','clinic_license',1,'2026-07-15 04:56:08','{\"licenseType\": \"Clinical Establishment License\", \"licenseNumber\": \"CEL-2026-001\"}'),(2,'admin1','ROLE_CLINIC_ADMIN','CREATED','clinic_license',2,'2026-07-15 04:56:08','{\"licenseType\": \"Fire Safety Certificate\", \"licenseNumber\": \"FSC-2026-014\"}'),(3,'admin1','ROLE_CLINIC_ADMIN','CREATED','clinic_license',3,'2026-07-15 04:56:08','{\"licenseType\": \"Biomedical Waste Authorization\", \"licenseNumber\": \"BMW-2026-003\"}'),(4,'admin1','ROLE_CLINIC_ADMIN','CREATED','clinic_license',4,'2026-07-15 04:56:08','{\"licenseType\": \"Pharmacy License\", \"licenseNumber\": \"PH-2025-114\"}'),(5,'admin1','ROLE_CLINIC_ADMIN','CAPTURED','consent_record',1,'2026-07-15 04:00:00','{\"visitId\": \"VIS-8801\", \"patientId\": \"PAT-IND-101\", \"procedure\": \"Laparoscopic Appendectomy\"}'),(6,'doctor1','ROLE_DOCTOR','CAPTURED','consent_record',2,'2026-07-15 04:05:00','{\"visitId\": \"VIS-8802\", \"patientId\": \"PAT-IND-102\", \"indication\": \"Severe Anemia\"}'),(7,'staff1','ROLE_STAFF','CAPTURED','consent_record',3,'2026-07-15 04:10:00','{\"visitId\": \"VIS-8803\", \"patientId\": \"PAT-IND-103\"}'),(8,'admin1','ROLE_CLINIC_ADMIN','CAPTURED','consent_record',4,'2026-07-15 04:15:00','{\"visitId\": \"VIS-8804\", \"patientId\": \"PAT-IND-104\"}'),(9,'admin1','ROLE_CLINIC_ADMIN','CAPTURED','consent_record',5,'2026-07-15 04:20:00','{\"visitId\": \"VIS-8805\", \"patientId\": \"PAT-IND-105\"}'),(10,'admin1','ROLE_CLINIC_ADMIN','VOIDED','consent_record',5,'2026-07-15 04:25:00','{\"reason\": \"Typo in patient age and surgery type entered.\"}'),(11,'admin1','ROLE_CLINIC_ADMIN','CAPTURED','consent_record',6,'2026-07-15 04:30:00','{\"visitId\": \"VIS-8805-REV\", \"patientId\": \"PAT-IND-105\"}'),(12,'staff1','ROLE_STAFF','DECLINED','consent_record',7,'2026-07-15 04:40:00','{\"reason\": \"Patient refused blood transfusion due to religious beliefs.\", \"visitId\": \"VIS-8806\", \"patientId\": \"PAT-IND-106\"}'),(13,'doctor1','ROLE_DOCTOR','CAPTURED','consent_record',8,'2026-07-15 04:45:00','{\"visitId\": \"VIS-8807\", \"patientId\": \"PAT-IND-107\"}'),(14,'staff1','ROLE_STAFF','CAPTURED','consent_record',9,'2026-07-15 04:50:00','{\"visitId\": \"VIS-8808\", \"patientId\": \"PAT-IND-108\"}'),(15,'SYSTEM','SYSTEM','EXPIRY_NOTIFICATION_0_DAYS','clinic_license',4,'2026-07-15 06:03:43',NULL),(16,'admin1','CLINIC_clinic-001','RENEWED','clinic_license',5,'2026-07-15 06:05:29',NULL),(17,'SYSTEM','SYSTEM','EXPIRY_NOTIFICATION_0_DAYS','clinic_license',5,'2026-07-15 18:09:05',NULL),(18,'SYSTEM','SYSTEM','EXPIRY_NOTIFICATION_15_DAYS','clinic_license',7,'2026-07-16 05:50:50',NULL),(19,'SYSTEM','SYSTEM','EXPIRY_NOTIFICATION_0_DAYS','clinic_license',8,'2026-07-16 05:50:50',NULL),(20,'SYSTEM','SYSTEM','EXPIRY_NOTIFICATION_7_DAYS','clinic_license',11,'2026-07-16 05:50:50',NULL),(21,'SYSTEM','SYSTEM','EXPIRY_NOTIFICATION_0_DAYS','clinic_license',13,'2026-07-16 05:50:50',NULL),(22,'SYSTEM','SYSTEM','EXPIRY_NOTIFICATION_15_DAYS','clinic_license',15,'2026-07-16 06:05:12',NULL),(23,'SYSTEM','SYSTEM','EXPIRY_NOTIFICATION_0_DAYS','clinic_license',16,'2026-07-16 06:05:12',NULL),(24,'SYSTEM','SYSTEM','EXPIRY_NOTIFICATION_7_DAYS','clinic_license',19,'2026-07-16 06:05:12',NULL),(25,'SYSTEM','SYSTEM','EXPIRY_NOTIFICATION_0_DAYS','clinic_license',21,'2026-07-16 06:05:12',NULL),(26,'staff1','CLINIC_clinic-001','CAPTURED','consent_record',10,'2026-07-16 06:09:42',NULL),(27,'staff1','CLINIC_clinic-001','CAPTURED','consent_record',11,'2026-07-16 06:42:11',NULL),(28,'staff1','CLINIC_clinic-001','DECLINED','consent_record',12,'2026-07-16 06:46:36',NULL),(29,'SYSTEM','SYSTEM','EXPIRY_NOTIFICATION_15_DAYS','clinic_license',39,'2026-07-16 07:06:26',NULL),(30,'SYSTEM','SYSTEM','EXPIRY_NOTIFICATION_0_DAYS','clinic_license',40,'2026-07-16 07:06:26',NULL),(31,'SYSTEM','SYSTEM','EXPIRY_NOTIFICATION_7_DAYS','clinic_license',43,'2026-07-16 07:06:26',NULL),(32,'SYSTEM','SYSTEM','EXPIRY_NOTIFICATION_0_DAYS','clinic_license',45,'2026-07-16 07:06:26',NULL),(33,'SYSTEM','SYSTEM','EXPIRY_NOTIFICATION_15_DAYS','clinic_license',47,'2026-07-16 07:14:16',NULL),(34,'SYSTEM','SYSTEM','EXPIRY_NOTIFICATION_0_DAYS','clinic_license',48,'2026-07-16 07:14:16',NULL),(35,'SYSTEM','SYSTEM','EXPIRY_NOTIFICATION_7_DAYS','clinic_license',51,'2026-07-16 07:14:16',NULL),(36,'SYSTEM','SYSTEM','EXPIRY_NOTIFICATION_0_DAYS','clinic_license',53,'2026-07-16 07:14:16',NULL),(37,'admin1','CLINIC_clinic-001','VIEWED','consent_record',11,'2026-07-17 06:48:04','{\"documentUrl\": \"/api/documents/90bd4673-5c4c-49a2-8391-3490d1d15c77.png\"}'),(38,'admin1','CLINIC_clinic-001','VIEWED','consent_record',11,'2026-07-17 06:48:04','{\"documentUrl\": \"/api/documents/04ef5632-8cbf-4131-b8b7-59eb6d1d026b.png\"}'),(39,'admin1','CLINIC_clinic-001','CAPTURED','consent_record',13,'2026-07-17 06:49:53','{\"visitId\": \"VIS-8890\", \"patientId\": \"PAT-IND-112\", \"templateId\": 1, \"witnessName\": \"ananya\"}'),(40,'admin1','CLINIC_clinic-001','VIEWED','consent_record',13,'2026-07-17 06:49:56','{\"documentUrl\": \"/api/documents/923271ca-1a2a-40a4-ac49-9b2676b20ad5.png\"}'),(41,'admin1','CLINIC_clinic-001','VIEWED','consent_record',13,'2026-07-17 06:49:57','{\"documentUrl\": \"/api/documents/f71a37af-d929-4f34-8a1d-4c87f9e88a08.png\"}'),(42,'admin1','CLINIC_clinic-001','VIEWED','consent_record',13,'2026-07-17 06:50:10','{\"documentUrl\": \"/api/documents/923271ca-1a2a-40a4-ac49-9b2676b20ad5.png\"}'),(43,'admin1','CLINIC_clinic-001','VIEWED','consent_record',13,'2026-07-17 06:50:10','{\"documentUrl\": \"/api/documents/f71a37af-d929-4f34-8a1d-4c87f9e88a08.png\"}'),(44,'admin1','CLINIC_clinic-001','VIEWED','consent_record',11,'2026-07-17 06:50:20','{\"documentUrl\": \"/api/documents/90bd4673-5c4c-49a2-8391-3490d1d15c77.png\"}'),(45,'admin1','CLINIC_clinic-001','VIEWED','consent_record',11,'2026-07-17 06:50:20','{\"documentUrl\": \"/api/documents/04ef5632-8cbf-4131-b8b7-59eb6d1d026b.png\"}'),(46,'admin1','CLINIC_clinic-001','VIEWED','consent_record',11,'2026-07-17 06:57:32','{\"documentUrl\": \"/api/documents/90bd4673-5c4c-49a2-8391-3490d1d15c77.png\"}'),(47,'admin1','CLINIC_clinic-001','VIEWED','consent_record',11,'2026-07-17 06:57:32','{\"documentUrl\": \"/api/documents/04ef5632-8cbf-4131-b8b7-59eb6d1d026b.png\"}'),(48,'admin1','CLINIC_clinic-001','VIEWED','consent_record',10,'2026-07-17 06:57:36','{\"documentUrl\": \"/api/documents/cb0a6b5d-3bad-4117-aad9-961eb451f10f.png\"}'),(49,'admin1','CLINIC_clinic-001','VIEWED','consent_record',6,'2026-07-17 06:57:44','{\"documentUrl\": \"/api/documents/sig-patient-6.png\"}'),(50,'admin1','CLINIC_clinic-001','VIEWED','consent_record',6,'2026-07-17 06:57:44','{\"documentUrl\": \"/api/documents/sig-witness-6.png\"}');
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clinic_licenses`
--

DROP TABLE IF EXISTS `clinic_licenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clinic_licenses` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `clinic_id` varchar(50) NOT NULL,
  `license_type` varchar(255) NOT NULL,
  `license_number` varchar(100) NOT NULL,
  `issuing_authority` varchar(255) NOT NULL,
  `issue_date` date NOT NULL,
  `expiry_date` date NOT NULL,
  `document_url` varchar(512) NOT NULL,
  `status` varchar(255) NOT NULL,
  `last_notified_threshold` int DEFAULT NULL,
  `renewed_from_id` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `renewed_from_id` (`renewed_from_id`),
  CONSTRAINT `clinic_licenses_ibfk_1` FOREIGN KEY (`renewed_from_id`) REFERENCES `clinic_licenses` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=134 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clinic_licenses`
--

LOCK TABLES `clinic_licenses` WRITE;
/*!40000 ALTER TABLE `clinic_licenses` DISABLE KEYS */;
INSERT INTO `clinic_licenses` VALUES (126,'clinic-001','Clinical Establishment License','CEL-2026-001','State Health Department','2025-07-17','2026-08-31','/api/documents/cel-c1.pdf','Valid',NULL,NULL,'2026-07-17 10:53:42','2026-07-17 10:53:42'),(127,'clinic-001','Fire Safety Certificate','FSC-2026-014','Fire and Rescue Services','2026-01-18','2026-08-01','/api/documents/fsc-c1.pdf','Renewal Due Soon',NULL,NULL,'2026-07-17 10:53:42','2026-07-17 10:53:42'),(128,'clinic-001','Biomedical Waste Authorization','BMW-2026-003','Pollution Control Board','2025-07-17','2026-07-07','/api/documents/bmw-c1.pdf','Expired',NULL,NULL,'2026-07-17 10:53:42','2026-07-17 10:53:42'),(129,'clinic-001','Pharmacy License','PH-2025-114','State Drug Control Department','2024-07-17','2025-07-17','/api/documents/ph-c1.pdf','Superseded',NULL,NULL,'2026-07-17 10:53:42','2026-07-17 10:53:42'),(130,'clinic-002','Clinical Establishment License','CEL-2026-002','State Health Department','2025-09-20','2026-08-21','/api/documents/cel-c2.pdf','Valid',NULL,NULL,'2026-07-17 10:53:42','2026-07-17 10:53:42'),(131,'clinic-002','Fire Safety Certificate','FSC-2026-022','Fire and Rescue Services','2026-04-18','2026-07-20','/api/documents/fsc-c2.pdf','Urgent',NULL,NULL,'2026-07-17 10:53:42','2026-07-17 10:53:42'),(132,'clinic-003','Clinical Establishment License','CEL-2026-003','State Health Department','2026-03-19','2026-09-05','/api/documents/cel-c3.pdf','Valid',NULL,NULL,'2026-07-17 10:53:42','2026-07-17 10:53:42'),(133,'clinic-003','Biomedical Waste Authorization','BMW-2026-009','Pollution Control Board','2025-07-17','2026-07-15','/api/documents/bmw-c3.pdf','Expired',NULL,NULL,'2026-07-17 10:53:42','2026-07-17 10:53:42');
/*!40000 ALTER TABLE `clinic_licenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consent_records`
--

DROP TABLE IF EXISTS `consent_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consent_records` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `template_id` bigint NOT NULL,
  `clinic_id` varchar(50) NOT NULL DEFAULT 'clinic-001',
  `patient_id` varchar(50) NOT NULL,
  `visit_id` varchar(50) NOT NULL,
  `filled_data_json` json NOT NULL,
  `frozen_form_text` text,
  `patient_signature_url` varchar(512) DEFAULT NULL,
  `witness_signature_url` varchar(512) DEFAULT NULL,
  `witness_name` varchar(255) DEFAULT NULL,
  `risks_explained` tinyint(1) NOT NULL DEFAULT '0',
  `captured_by` varchar(100) NOT NULL,
  `captured_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `valid_until` timestamp NULL DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `void_reason` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `template_id` (`template_id`),
  CONSTRAINT `consent_records_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `consent_templates` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consent_records`
--

LOCK TABLES `consent_records` WRITE;
/*!40000 ALTER TABLE `consent_records` DISABLE KEYS */;
INSERT INTO `consent_records` VALUES (1,1,'clinic-001','PAT-IND-101','VIS-8801','{\"Surgeon Name\": \"Dr. Rajesh Iyer\", \"Procedure Name\": \"Laparoscopic Appendectomy\"}','I acknowledge that the nature, purpose, benefits, risks, possible complications and alternatives of the proposed surgical procedure have been explained to me. I voluntarily provide my consent.','/api/documents/sig-patient-1.png','/api/documents/sig-witness-1.png','Sanjay Sharma',1,'admin1','2026-07-15 04:00:00','2026-12-31 18:29:59','active',NULL),(2,2,'clinic-001','PAT-IND-102','VIS-8802','{\"Doctor Name\": \"Dr. Sunita Rao\", \"Transfusion Indication\": \"Severe Anemia\"}','I understand the benefits, risks, possible reactions and available alternatives related to blood transfusion and voluntarily consent to receive blood products if medically necessary.','/api/documents/sig-patient-2.png','/api/documents/sig-witness-2.png','Dev Patel',1,'doctor1','2026-07-15 04:05:00','2026-10-15 18:29:59','active',NULL),(3,3,'clinic-001','PAT-IND-103','VIS-8803','{\"Anesthesiologist\": \"Dr. Vivek Mehta\"}','I understand the anaesthesia procedure, its benefits, associated risks and possible complications. All my questions have been answered.','/api/documents/sig-patient-3.png','/api/documents/sig-witness-3.png','Kiran Kumar',1,'staff1','2026-07-15 04:10:00','2026-09-01 18:29:59','active',NULL),(4,4,'clinic-001','PAT-IND-104','VIS-8804','{\"Indication\": \"Brain Scans\", \"Radiologist\": \"Dr. Aditi Joshi\"}','I understand that contrast dye will be administered during the MRI procedure and acknowledge the explained risks and precautions.','/api/documents/sig-patient-4.png',NULL,NULL,1,'admin1','2026-07-15 04:15:00',NULL,'active',NULL),(5,1,'clinic-001','PAT-IND-105','VIS-8805','{\"Surgeon Name\": \"Dr. Rajesh Iyer\", \"Procedure Name\": \"Hernia Repair\"}','I acknowledge that the nature, purpose, benefits, risks, possible complications and alternatives of the proposed surgical procedure have been explained to me. I voluntarily provide my consent.','/api/documents/sig-patient-5.png','/api/documents/sig-witness-5.png','Neha Malhotra',1,'admin1','2026-07-15 04:20:00','2026-11-20 18:29:59','void','Typo in patient age and surgery type entered.'),(6,1,'clinic-001','PAT-IND-105','VIS-8805-REV','{\"Surgeon Name\": \"Dr. Rajesh Iyer\", \"Procedure Name\": \"Inguinal Hernia Repair\"}','I acknowledge that the nature, purpose, benefits, risks, possible complications and alternatives of the proposed surgical procedure have been explained to me. I voluntarily provide my consent.','/api/documents/sig-patient-6.png','/api/documents/sig-witness-6.png','Neha Malhotra',1,'admin1','2026-07-15 04:30:00','2026-11-20 18:29:59','active',NULL),(7,2,'clinic-001','PAT-IND-106','VIS-8806','{\"Doctor Name\": \"Dr. Sunita Rao\", \"Transfusion Indication\": \"Postpartum Hemorrhage\"}','I understand the benefits, risks, possible reactions and available alternatives related to blood transfusion and voluntarily consent to receive blood products if medically necessary.',NULL,NULL,'Hari Nair',0,'staff1','2026-07-15 04:40:00','2026-08-01 18:29:59','declined','Patient refused blood transfusion due to religious beliefs.'),(8,3,'clinic-001','PAT-IND-107','VIS-8807','{\"Anesthesiologist\": \"Dr. Vivek Mehta\"}','I understand the anaesthesia procedure, its benefits, associated risks and possible complications. All my questions have been answered.','/api/documents/sig-patient-8.png','/api/documents/sig-witness-8.png','Jaspreet Singh',1,'doctor1','2026-07-15 04:45:00','2026-05-10 18:29:59','active',NULL),(9,4,'clinic-001','PAT-IND-108','VIS-8808','{\"Indication\": \"Spinal Contrast scan\", \"Radiologist\": \"Dr. Aditi Joshi\"}','I understand that contrast dye will be administered during the MRI procedure and acknowledge the explained risks and precautions.','/api/documents/sig-patient-9.png',NULL,NULL,1,'staff1','2026-07-15 04:50:00','2026-07-01 18:29:59','active',NULL),(10,4,'clinic-001','PAT-IND-008','VIS-8808','{}','I understand that contrast dye will be administered during the MRI procedure and acknowledge the explained risks and precautions.','/api/documents/cb0a6b5d-3bad-4117-aad9-961eb451f10f.png',NULL,NULL,1,'Support Staff','2026-07-16 06:09:42','2026-07-19 12:59:59','active',NULL),(11,1,'clinic-001','PAT-IND-078','VIS-8908','{\"Age\": \"45\", \"Gender\": \"Male\", \"Doctor Name\": \"Shreya K\", \"Patient Name\": \"Sanjeev Rao\", \"Procedure Name\": \"Angio\"}','I, Sanjeev Rao, aged 45, Gender Male, voluntarily consent to undergo Angio after the procedure, benefits, risks, and alternatives have been explained to me by Dr. Shreya K. I acknowledge that the risks have been explained to me and I voluntarily provide my consent.','/api/documents/90bd4673-5c4c-49a2-8391-3490d1d15c77.png','/api/documents/04ef5632-8cbf-4131-b8b7-59eb6d1d026b.png','Apparao',1,'Support Staff','2026-07-16 06:42:11',NULL,'active',NULL),(12,4,'clinic-001','PAT-IND-450','VIS-8810','{\"Age\": \"35\", \"Gender\": \"Male\", \"Doctor Name\": \"Dr. Aditi Joshi\", \"Patient Name\": \"Rohan Sharma\", \"Procedure Name\": \"Brain MRI Scan\"}','I, Rohan Sharma, aged 35, Gender Male, understand that contrast dye will be administered during the MRI procedure Brain MRI Scan and acknowledge the explained risks and precautions as explained by Dr. Dr. Aditi Joshi.',NULL,NULL,NULL,0,'Support Staff','2026-07-16 06:46:36',NULL,'declined','refused to sign'),(13,1,'clinic-001','PAT-IND-112','VIS-8890','{\"Age\": \"45\", \"Gender\": \"female\", \"Doctor Name\": \"Shreya K\", \"Patient Name\": \"Priya\", \"Procedure Name\": \"Kidney Transplant\"}','I, Priya, aged 45, Gender female, voluntarily consent to undergo Kidney Transplant after the procedure, benefits, risks, and alternatives have been explained to me by Dr. Shreya K. I acknowledge that the risks have been explained to me and I voluntarily provide my consent.','/api/documents/923271ca-1a2a-40a4-ac49-9b2676b20ad5.png','/api/documents/f71a37af-d929-4f34-8a1d-4c87f9e88a08.png','ananya',1,'Clinic Administrator','2026-07-17 06:49:53',NULL,'active',NULL);
/*!40000 ALTER TABLE `consent_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consent_templates`
--

DROP TABLE IF EXISTS `consent_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consent_templates` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `procedure_type` varchar(255) NOT NULL,
  `form_body` text NOT NULL,
  `requires_witness` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consent_templates`
--

LOCK TABLES `consent_templates` WRITE;
/*!40000 ALTER TABLE `consent_templates` DISABLE KEYS */;
INSERT INTO `consent_templates` VALUES (1,'General Surgical Consent','Surgical','I, [Patient Name], aged [Age], Gender [Gender], voluntarily consent to undergo [Procedure Name] after the procedure, benefits, risks, and alternatives have been explained to me by Dr. [Doctor Name]. I acknowledge that the risks have been explained to me and I voluntarily provide my consent.',1,1,'2026-07-15 04:55:56'),(2,'Blood Transfusion Consent','Blood Transfusion','I, [Patient Name], aged [Age], Gender [Gender], understand the benefits, risks, possible reactions and available alternatives related to blood transfusion of [Procedure Name] and voluntarily consent to receive blood products if medically necessary as prescribed by Dr. [Doctor Name].',1,1,'2026-07-15 04:55:56'),(3,'General Anaesthesia Consent','Anesthesia','I, [Patient Name], aged [Age], Gender [Gender], understand the anaesthesia procedure [Procedure Name], its benefits, associated risks and possible complications as explained by Dr. [Doctor Name]. All my questions have been answered.',1,1,'2026-07-15 04:55:56'),(4,'MRI Contrast Consent','Other','I, [Patient Name], aged [Age], Gender [Gender], understand that contrast dye will be administered during the MRI procedure [Procedure Name] and acknowledge the explained risks and precautions as explained by Dr. [Doctor Name].',0,1,'2026-07-15 04:55:56');
/*!40000 ALTER TABLE `consent_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) NOT NULL,
  `clinic_id` varchar(50) DEFAULT NULL,
  `full_name` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL,
  `username` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKr43af9ap4edm43mmtq01oddj6` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,_binary '','clinic-001','Support Staff','$2a$10$r4iAVmJEVN1HlRnOy8gMEuThpTZBysX.AZ3j58Ea/O1Pq2/kp/4Q2','ROLE_STAFF','staff1'),(2,_binary '','clinic-001','Dr. Alex Stone','$2a$10$LuFnFy./5PRrlx3QGES79Olk62m10WXK.8iP6hDP8N8SIqpJwYova','ROLE_DOCTOR','doctor1'),(3,_binary '','clinic-001','Clinic Administrator','$2a$10$ud9v3bwpoO3Cz6VBmG464eZXwjaoxNyOQdpiKpM4tgXJpxsoW/jhi','ROLE_CLINIC_ADMIN','admin1'),(4,_binary '','clinic-002','Second Clinic Admin','$2a$10$Rg/5oLoZDmJ5a0ULoNuaI.kSXPgF9h7mSD3oIp46Rw5NSmu1YWVCq','ROLE_CLINIC_ADMIN','admin2'),(5,_binary '',NULL,'SlashDR Super Admin','$2a$10$f4opHuvSz/019eelF6Oe0enHeeEbuAa2pEchq5LdGaacNfD5JgZLm','ROLE_SUPER_ADMIN','superadmin1');
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

-- Dump completed on 2026-07-20 16:39:54
