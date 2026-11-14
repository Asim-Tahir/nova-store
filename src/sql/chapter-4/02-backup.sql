-- 4.2 Backup
-- After completing your project, type the T-SQL command that backs up the NovaStoreDB database to the C:\Backup\ folder.
-- Topic: BACKUP DATABASE.
DECLARE @BackupFile AS NVARCHAR(36) = N'C:\Backup\NovaStoreDB_' + CONVERT (CHAR(8), GETDATE(), 112) + N'.bak';

BACKUP DATABASE NovaStoreDB
  TO DISK = @BackupFile;